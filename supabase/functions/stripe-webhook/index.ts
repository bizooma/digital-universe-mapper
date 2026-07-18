import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

const LIFETIME_PRICE_ID = "price_1SxtZOEV6sbsDlR83lUxpX0j";

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
      if (entErr) logStep("Entitlement upsert failed", { error: entErr.message });
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
