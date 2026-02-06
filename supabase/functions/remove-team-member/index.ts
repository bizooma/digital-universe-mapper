import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RemoveRequest {
  memberId: string;
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REMOVE-TEAM-MEMBER] ${step}${detailsStr}`);
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Parse request
    const { memberId }: RemoveRequest = await req.json();
    if (!memberId) throw new Error("Missing memberId");
    logStep("Request parsed", { memberId });

    // Get the member record
    const { data: member, error: memberError } = await supabaseClient
      .from("team_members")
      .select("*, teams(*)")
      .eq("id", memberId)
      .single();

    if (memberError || !member) {
      throw new Error("Member not found");
    }

    const team = member.teams as { owner_id: string };

    // Verify user is team owner
    if (team.owner_id !== user.id) {
      throw new Error("Only the team owner can remove members");
    }

    // Can't remove the owner
    if (member.role === "owner") {
      throw new Error("Cannot remove the team owner");
    }

    // Remove the member
    const { error: deleteError } = await supabaseClient
      .from("team_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) throw new Error(`Failed to remove member: ${deleteError.message}`);
    logStep("Member removed", { memberId, userId: member.user_id });

    return new Response(JSON.stringify({ 
      success: true,
      message: "Team member removed successfully"
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
