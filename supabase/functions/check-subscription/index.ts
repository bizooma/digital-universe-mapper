import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product IDs for LinkScape plans
const PRODUCT_IDS = {
  pro: "prod_Tv1XmbuF1Eq9mD",
  pro_yearly: "prod_Tv1Xpev3vVpb63",
  proplus: "prod_TvHvzw0LtqJdTG",
  proplus_yearly: "prod_TvHvO0TaHthQYE",
  team: "prod_Tv1YL0NqFMF2J6",
  team_yearly: "prod_Tv1Y02rLWusFXX",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

// Check if user has admin role
async function checkAdminRole(supabaseClient: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });
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
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    logStep("Authorization header found");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check for lifetime purchase first
    const { data: lifetimePurchase, error: lifetimeError } = await supabaseClient
      .from("lifetime_purchases")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    if (lifetimePurchase && !lifetimeError) {
      logStep("User has lifetime purchase", { plan: lifetimePurchase.plan });
      return new Response(JSON.stringify({
        subscribed: true,
        plan: lifetimePurchase.plan,
        subscription_end: null,
        is_admin: false,
        is_lifetime: true,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Check if user is admin - admins get team tier automatically
    const isAdmin = await checkAdminRole(supabaseClient, user.id);
    if (isAdmin) {
      logStep("User is admin, granting team access");
      return new Response(JSON.stringify({
        subscribed: true,
        plan: "team",
        subscription_end: null,
        is_admin: true,
        is_lifetime: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No customer found, returning free tier");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        subscription_end: null,
        is_admin: false,
        is_lifetime: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      logStep("No active subscription found");
      return new Response(JSON.stringify({ 
        subscribed: false, 
        plan: "free",
        subscription_end: null,
        is_admin: false,
        is_lifetime: false,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const subscription = subscriptions.data[0];
    const subscriptionItem = subscription.items.data[0];
    const productId = subscriptionItem.price.product as string;
    
    logStep("Raw subscription data", { 
      subscriptionId: subscription.id,
      subCurrentPeriodEnd: subscription.current_period_end,
      itemCurrentPeriodEnd: (subscriptionItem as any).current_period_end,
    });
    
    // Get period end from subscription or fall back to item
    let subscriptionEnd: string | null = null;
    try {
      // Try subscription level first, then item level
      const periodEnd = subscription.current_period_end || (subscriptionItem as any).current_period_end;
      if (periodEnd && typeof periodEnd === 'number') {
        subscriptionEnd = new Date(periodEnd * 1000).toISOString();
      }
    } catch (e) {
      logStep("Warning: Could not parse subscription end date", { error: String(e) });
    }
    
    logStep("Active subscription found", { subscriptionId: subscription.id, productId, endDate: subscriptionEnd });

    // Determine plan from product ID
    let plan = "free";
    if (productId === PRODUCT_IDS.pro || productId === PRODUCT_IDS.pro_yearly) {
      plan = "pro";
    } else if (productId === PRODUCT_IDS.proplus || productId === PRODUCT_IDS.proplus_yearly) {
      plan = "proplus";
    } else if (productId === PRODUCT_IDS.team || productId === PRODUCT_IDS.team_yearly) {
      plan = "team";
    }

    logStep("Determined plan", { plan });

    return new Response(JSON.stringify({
      subscribed: true,
      plan,
      subscription_end: subscriptionEnd,
      product_id: productId,
      is_admin: false,
      is_lifetime: false,
    }), {
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
