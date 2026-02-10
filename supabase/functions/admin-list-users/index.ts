import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Product IDs for Mapprr plans
const PRODUCT_IDS: Record<string, string> = {
  "prod_Tv1XmbuF1Eq9mD": "pro",
  "prod_Tv1Xpev3vVpb63": "pro",
  "prod_TvHvzw0LtqJdTG": "proplus",
  "prod_TvHvO0TaHthQYE": "proplus",
  "prod_Tv1YL0NqFMF2J6": "team",
  "prod_Tv1Y02rLWusFXX": "team",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-LIST-USERS] ${step}${detailsStr}`);
};

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

    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (roleError) throw new Error(`Role check error: ${roleError.message}`);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required");
    logStep("Admin access verified");

    // Fetch all users from auth.users
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers();
    if (authError) throw new Error(`Failed to fetch users: ${authError.message}`);
    logStep("Fetched auth users", { count: authUsers.users.length });

    // Initialize Stripe
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const stripe = stripeKey ? new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" }) : null;

    // Build user list with subscription data
    const users = await Promise.all(
      authUsers.users.map(async (authUser) => {
        let plan = "free";
        let subscriptionStart: string | null = null;
        let stripeCustomerId: string | null = null;

        // Check Stripe for subscription if we have a key
        if (stripe && authUser.email) {
          try {
            const customers = await stripe.customers.list({ email: authUser.email, limit: 1 });
            if (customers.data.length > 0) {
              stripeCustomerId = customers.data[0].id;
              const subscriptions = await stripe.subscriptions.list({
                customer: stripeCustomerId,
                status: "active",
                limit: 1,
              });

              if (subscriptions.data.length > 0) {
                const subscription = subscriptions.data[0];
                const productId = subscription.items.data[0]?.price.product as string;
                plan = PRODUCT_IDS[productId] || "pro";
                subscriptionStart = new Date(subscription.start_date * 1000).toISOString();
              }
            }
          } catch (err) {
            logStep("Stripe lookup failed for user", { email: authUser.email, error: String(err) });
          }
        }

        // Check if user is admin (override to proplus)
        const { data: userIsAdmin } = await supabaseClient.rpc("has_role", {
          _user_id: authUser.id,
          _role: "admin"
        });

        if (userIsAdmin) {
          plan = "proplus";
        }

        return {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          plan,
          subscription_start: subscriptionStart,
          is_banned: authUser.banned_until ? new Date(authUser.banned_until) > new Date() : false,
          banned_until: authUser.banned_until,
          is_admin: userIsAdmin || false,
        };
      })
    );

    logStep("User list compiled", { totalUsers: users.length });

    return new Response(JSON.stringify({ users }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500,
    });
  }
});
