import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { tierForSubscription } from "../_shared/plans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const LIFETIME_PRICE_ID = "price_1SxtZOEV6sbsDlR83lUxpX0j";

type Admin = ReturnType<typeof createClient>;

const SUBSCRIPTION_EVENTS = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
]);
const INVOICE_EVENTS = new Set(["invoice.payment_succeeded", "invoice.payment_failed"]);

async function findUserIdByEmail(supabase: Admin, email: string): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`User lookup failed: ${error.message}`);
    const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === target);
    if (hit) return hit.id;
    if (data.users.length < 1000) break;
  }
  return null;
}

async function resolveUserId(
  stripe: Stripe,
  supabase: Admin,
  subscription: Stripe.Subscription,
  sessionUserId?: string | null,
): Promise<string | null> {
  if (subscription.metadata?.user_id) return subscription.metadata.user_id;
  if (sessionUserId) return sessionUserId;
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const customer = await stripe.customers.retrieve(customerId);
  if (!customer.deleted && customer.email) {
    return await findUserIdByEmail(supabase, customer.email);
  }
  return null;
}

// Writes subscriptions + user_entitlements. Throws on entitlement failure so Stripe retries.
async function syncSubscription(
  stripe: Stripe,
  supabase: Admin,
  subscription: Stripe.Subscription,
  eventType: string,
  sessionUserId?: string | null,
) {
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const userId = await resolveUserId(stripe, supabase, subscription, sessionUserId);
  if (!userId) {
    console.error(`[STRIPE-WEBHOOK] UNMAPPABLE SUBSCRIPTION EVENT - ${JSON.stringify({ eventType, customerId, subscriptionId: subscription.id })}`);
    return;
  }

  const item = subscription.items.data[0];
  const productId = (typeof item?.price.product === "string" ? item.price.product : item?.price.product?.id) ?? null;
  const priceId = item?.price.id ?? null;
  // deno-lint-ignore no-explicit-any
  const periodEnd = (subscription as any).current_period_end || (item as any)?.current_period_end;
  const currentPeriodEnd = typeof periodEnd === "number" ? new Date(periodEnd * 1000).toISOString() : null;
  const status = eventType === "customer.subscription.deleted" ? "canceled" : subscription.status;
  const tier = tierForSubscription(status, productId);

  // Durable subscription record (keyed by stripe_subscription_id)
  const record = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    status,
    price_id: priceId,
    current_period_end: currentPeriodEnd,
  };
  const { data: existing, error: selErr } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();
  if (selErr) console.error(`[STRIPE-WEBHOOK] SUBSCRIPTION READ FAILED - ${JSON.stringify({ userId, error: selErr.message })}`);
  const { error: subErr } = existing
    ? await supabase.from("subscriptions").update(record).eq("id", existing.id)
    : await supabase.from("subscriptions").insert(record);
  if (subErr) console.error(`[STRIPE-WEBHOOK] SUBSCRIPTION WRITE FAILED - ${JSON.stringify({ userId, subscriptionId: subscription.id, error: subErr.message })}`);

  // Don't downgrade a lifetime buyer if their (separate) subscription ends.
  let finalTier: string = tier;
  if (tier === "free") {
    const { data: lifetime } = await supabase.from("lifetime_purchases").select("plan").eq("user_id", userId).maybeSingle();
    if (lifetime?.plan) finalTier = lifetime.plan as string;
  }

  const { error: entErr } = await supabase.from("user_entitlements").upsert(
    { user_id: userId, tier: finalTier, updated_at: new Date().toISOString() },
    { onConflict: "user_id" },
  );
  if (entErr) {
    console.error(`[STRIPE-WEBHOOK] ENTITLEMENT WRITE FAILED - ${JSON.stringify({ userId, tier: finalTier, error: entErr.message })}`);
    throw new Error(`Entitlement write failed for ${userId}: ${entErr.message}`);
  }
  logStep("Subscription synced", { eventType, userId, status, tier: finalTier });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!stripeKey || !webhookSecret) {
    logStep("Missing config", { hasStripeKey: !!stripeKey, hasWebhookSecret: !!webhookSecret });
    return new Response(JSON.stringify({ error: "Server not configured" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    logStep("Signature verification failed", { error: String(err) });
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  logStep("Event received", { type: event.type, id: event.id });

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.mode === "subscription" && session.subscription) {
        const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
        const subscription = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(stripe, supabase, subscription, event.type, session.metadata?.user_id ?? null);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Only handle lifetime purchases here
      if (session.metadata?.purchase_type !== "lifetime") {
        logStep("Ignoring non-lifetime session", { sessionId: session.id });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      if (session.payment_status !== "paid") {
        logStep("Session not paid, skipping", { sessionId: session.id, status: session.payment_status });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const userId = session.metadata?.user_id;
      if (!userId) {
        logStep("Missing user_id in metadata", { sessionId: session.id });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Fetch line items to confirm the exact price ID
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        limit: 10,
        expand: ["data.price"],
      });
      const matched = lineItems.data.find(
        (li) => (li.price?.id ?? "") === LIFETIME_PRICE_ID && (li.quantity ?? 0) >= 1
      );
      if (!matched) {
        logStep("Price ID mismatch, ignoring", {
          expected: LIFETIME_PRICE_ID,
          got: lineItems.data.map((li) => li.price?.id),
        });
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const plan = session.metadata?.plan || "proplus";

      // Idempotent insert: rely on unique user_id
      const { data: existing } = await supabase
        .from("lifetime_purchases")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase.from("lifetime_purchases").insert({
          user_id: userId,
          stripe_payment_id: session.id,
          plan,
        });
        if (insertError && !insertError.message.includes("duplicate key")) {
          logStep("Insert failed", { error: insertError.message });
          throw new Error(insertError.message);
        }
        logStep("Lifetime purchase recorded", { userId, sessionId: session.id });
      } else {
        logStep("Lifetime purchase already recorded", { userId });
      }

      // Sync entitlements
      const { error: entErr } = await supabase.from("user_entitlements").upsert(
        { user_id: userId, tier: plan, updated_at: new Date().toISOString() },
        { onConflict: "user_id" }
      );
      if (entErr) {
        console.error(`[STRIPE-WEBHOOK] ENTITLEMENT WRITE FAILED - ${JSON.stringify({ userId, tier: plan, error: entErr.message })}`);
        throw new Error(`Entitlement write failed for ${userId}: ${entErr.message}`);
      }
    } else if (SUBSCRIPTION_EVENTS.has(event.type)) {
      const subscription = event.data.object as Stripe.Subscription;
      await syncSubscription(stripe, supabase, subscription, event.type);
    } else if (INVOICE_EVENTS.has(event.type)) {
      const invoice = event.data.object as Stripe.Invoice;
      // deno-lint-ignore no-explicit-any
      const inv = invoice as any;
      const subRef = inv.subscription ?? inv.parent?.subscription_details?.subscription ?? null;
      const subId = typeof subRef === "string" ? subRef : subRef?.id;
      if (subId) {
        const subscription = await stripe.subscriptions.retrieve(subId);
        await syncSubscription(stripe, supabase, subscription, event.type);
      } else {
        logStep("Invoice without subscription, ignoring", { invoiceId: invoice.id });
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
