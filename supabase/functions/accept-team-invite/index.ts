import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AcceptRequest {
  token: string;
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[ACCEPT-TEAM-INVITE] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request
    const { token: inviteToken }: AcceptRequest = await req.json();
    if (!inviteToken) throw new Error("Missing invitation token");
    logStep("Request parsed", { inviteToken });

    // Find the invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("team_invitations")
      .select("*, teams(*)")
      .eq("token", inviteToken)
      .eq("status", "pending")
      .single();

    if (inviteError || !invitation) {
      throw new Error("Invitation not found or already used");
    }
    logStep("Invitation found", { invitationId: invitation.id, teamId: invitation.team_id });

    // Check if invitation is expired
    if (new Date(invitation.expires_at) < new Date()) {
      // Mark as expired
      await supabaseClient
        .from("team_invitations")
        .update({ status: "expired" })
        .eq("id", invitation.id);
      throw new Error("This invitation has expired");
    }

    // Check if invitation email matches user email
    if (invitation.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new Error("This invitation was sent to a different email address");
    }

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("team_id", invitation.team_id)
      .eq("user_id", user.id)
      .single();

    if (existingMember) {
      // Mark invitation as accepted anyway
      await supabaseClient
        .from("team_invitations")
        .update({ status: "accepted" })
        .eq("id", invitation.id);
      throw new Error("You're already a member of this team");
    }

    // Check team member limit
    const { count: memberCount } = await supabaseClient
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", invitation.team_id);

    const team = invitation.teams as { max_members: number; name: string };
    if ((memberCount || 0) >= team.max_members) {
      throw new Error("This team has reached its maximum member limit");
    }

    // Add user as team member
    const { error: memberError } = await supabaseClient
      .from("team_members")
      .insert({
        team_id: invitation.team_id,
        user_id: user.id,
        role: "member",
      });

    if (memberError) throw new Error(`Failed to add team member: ${memberError.message}`);
    logStep("Team member added", { userId: user.id, teamId: invitation.team_id });

    // Mark invitation as accepted
    await supabaseClient
      .from("team_invitations")
      .update({ status: "accepted" })
      .eq("id", invitation.id);
    logStep("Invitation marked as accepted");

    return new Response(JSON.stringify({ 
      success: true, 
      teamName: team.name,
      message: `You've joined ${team.name}!`
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
