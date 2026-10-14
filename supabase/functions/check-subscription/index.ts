import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { ENTITLED_STATUSES, tierForProduct } from "../_shared/plans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Returns true when the entitlement row was written. Failures are logged at error level.
async function upsertEntitlement(supabaseClient: ReturnType<typeof createClient>, userId: string, tier: string): Promise<boolean> {
  try {
    const { error } = await supabaseClient.from("user_entitlements").upsert(
      { user_id: userId, tier, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    if (error) {
      console.error(`[CHECK-SUBSCRIPTION] ENTITLEMENT WRITE FAILED - ${JSON.stringify({ userId, tier, error: error.message })}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[CHECK-SUBSCRIPTION] ENTITLEMENT WRITE FAILED - ${JSON.stringify({ userId, tier, error: String(err) })}`);
    return false;
  }
}

async function checkAdminRole(supabaseClient: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (error) {
      logStep("Admin role check error", { error: error.message });
      return false;
    }
    return data === true;
  } catch (err) {
    logStep("Admin role check exception", { error: String(err) });
    return false;
  }
}

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id });

    const isAdmin = await checkAdminRole(supabaseClient, user.id);

    // Lifetime purchase first
    const { data: lifetimePurchase, error: lifetimeError } = await supabaseClient
      .from("lifetime_purchases")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lifetimePurchase && !lifetimeError) {
      logStep("User has lifetime purchase", { plan: lifetimePurchase.plan });
      const synced = await upsertEntitlement(supabaseClient, user.id, lifetimePurchase.plan as string);
      return json({
        subscribed: true,
        plan: lifetimePurchase.plan,
        subscription_end: null,
        is_admin: isAdmin,
        is_lifetime: true,
        entitlement_synced: synced,
      });
    }

    if (isAdmin) {
      logStep("User is admin, granting team access");
      const synced = await upsertEntitlement(supabaseClient, user.id, "team");
      return json({
        subscribed: true,
        plan: "team",
        subscription_end: null,
        is_admin: true,
        is_lifetime: false,
        entitlement_synced: synced,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    const freeResponse = async () => {
      const synced = await upsertEntitlement(supabaseClient, user.id, "free");
      return json({
        subscribed: false,
        plan: "free",
        subscription_end: null,
        is_admin: false,
        is_lifetime: false,
        entitlement_synced: synced,
      });
    };

    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      return await freeResponse();
    }

    const customerId = customers.data[0].id;
    const subscriptions = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    const subscription = subscriptions.data.find((s) => ENTITLED_STATUSES.has(s.status));

    if (!subscription) {
      logStep("No entitled subscription found");
      return await freeResponse();
    }

    const subscriptionItem = subscription.items.data[0];
    const productId = subscriptionItem.price.product as string;

    let subscriptionEnd: string | null = null;
    // deno-lint-ignore no-explicit-any
    const periodEnd = (subscription as any).current_period_end || (subscriptionItem as any).current_period_end;
    if (periodEnd && typeof periodEnd === "number") {
      subscriptionEnd = new Date(periodEnd * 1000).toISOString();
    }

    const plan = tierForProduct(productId);
    logStep("Determined plan", { plan, status: subscription.status, productId });
    const synced = await upsertEntitlement(supabaseClient, user.id, plan);

    return json({
      subscribed: plan !== "free",
      plan,
      subscription_end: subscriptionEnd,
      product_id: productId,
      is_admin: false,
      is_lifetime: false,
      entitlement_synced: synced,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return json({ error: errorMessage }, 500);
  }
});
