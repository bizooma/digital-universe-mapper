import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-LIFETIME-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Use service role key to insert purchase records
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const { session_id } = await req.json();
    if (!session_id) throw new Error("No session_id provided");
    logStep("Session ID received", { session_id });

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.id) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Verify the checkout session with Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const session = await stripe.checkout.sessions.retrieve(session_id);
    logStep("Retrieved checkout session", { 
      status: session.payment_status,
      mode: session.mode,
      metadata: session.metadata 
    });

    // Verify payment was successful
    if (session.payment_status !== "paid") {
      throw new Error("Payment not completed");
    }

    // Verify this is a lifetime purchase
    if (session.metadata?.purchase_type !== "lifetime") {
      throw new Error("Invalid purchase type");
    }

    // Verify the user ID matches
    if (session.metadata?.user_id !== user.id) {
      throw new Error("User mismatch");
    }

    // Check if already recorded
    const { data: existing } = await supabaseClient
      .from("lifetime_purchases")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      logStep("Lifetime purchase already recorded", { purchaseId: existing.id });
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Lifetime purchase already recorded" 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Record the lifetime purchase
    const { data: purchase, error: insertError } = await supabaseClient
      .from("lifetime_purchases")
      .insert({
        user_id: user.id,
        stripe_payment_id: session_id,
        plan: session.metadata?.plan || "proplus",
      })
      .select()
      .single();

    if (insertError) {
      if (insertError.message.includes("duplicate key")) {
        logStep("Duplicate insert detected, treating as success");
        return new Response(JSON.stringify({ 
          success: true, 
          message: "Lifetime purchase already recorded" 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      throw new Error(`Failed to record purchase: ${insertError.message}`);
    }

    logStep("Lifetime purchase recorded", { purchaseId: purchase.id });

    return new Response(JSON.stringify({ 
      success: true, 
      purchase_id: purchase.id,
      plan: purchase.plan 
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
