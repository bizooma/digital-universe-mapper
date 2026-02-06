import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ADMIN-MANAGE-USER] ${step}${detailsStr}`);
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
    const adminUser = userData.user;
    if (!adminUser) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: adminUser.id });

    // Check if user is admin
    const { data: isAdmin, error: roleError } = await supabaseClient.rpc("has_role", {
      _user_id: adminUser.id,
      _role: "admin"
    });

    if (roleError) throw new Error(`Role check error: ${roleError.message}`);
    if (!isAdmin) throw new Error("Unauthorized: Admin access required");
    logStep("Admin access verified");

    // Parse request body
    const { action, targetUserId }: { action: string; targetUserId: string } = await req.json();
    
    if (!action || !targetUserId) {
      throw new Error("Missing required fields: action and targetUserId");
    }

    // Prevent admin from modifying themselves
    if (targetUserId === adminUser.id) {
      throw new Error("Cannot modify your own account");
    }

    // Check if target is also an admin (protect admins from each other)
    const { data: targetIsAdmin } = await supabaseClient.rpc("has_role", {
      _user_id: targetUserId,
      _role: "admin"
    });

    if (targetIsAdmin) {
      throw new Error("Cannot modify another admin account");
    }

    logStep("Processing action", { action, targetUserId });

    switch (action) {
      case "pause": {
        // Ban user for 100 years (effectively permanent until unpaused)
        const banUntil = new Date();
        banUntil.setFullYear(banUntil.getFullYear() + 100);
        
        const { error } = await supabaseClient.auth.admin.updateUserById(targetUserId, {
          ban_duration: "876000h" // ~100 years in hours
        });
        
        if (error) throw new Error(`Failed to pause user: ${error.message}`);
        logStep("User paused", { targetUserId });
        
        return new Response(JSON.stringify({ success: true, message: "User paused successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "unpause": {
        // Remove ban
        const { error } = await supabaseClient.auth.admin.updateUserById(targetUserId, {
          ban_duration: "none"
        });
        
        if (error) throw new Error(`Failed to unpause user: ${error.message}`);
        logStep("User unpaused", { targetUserId });
        
        return new Response(JSON.stringify({ success: true, message: "User unpaused successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      case "delete": {
        // Delete user - this will cascade to delete their data
        const { error } = await supabaseClient.auth.admin.deleteUser(targetUserId);
        
        if (error) throw new Error(`Failed to delete user: ${error.message}`);
        logStep("User deleted", { targetUserId });
        
        return new Response(JSON.stringify({ success: true, message: "User deleted successfully" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error instanceof Error && error.message.includes("Unauthorized") ? 403 : 500,
    });
  }
});
