import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface InviteRequest {
  email: string;
  teamId: string;
}

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[INVITE-TEAM-MEMBER] ${step}${detailsStr}`);
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
    const { email, teamId }: InviteRequest = await req.json();
    if (!email || !teamId) throw new Error("Missing email or teamId");
    logStep("Request parsed", { email, teamId });

    // Verify user is team owner
    const { data: team, error: teamError } = await supabaseClient
      .from("teams")
      .select("*")
      .eq("id", teamId)
      .eq("owner_id", user.id)
      .single();

    if (teamError || !team) {
      throw new Error("Team not found or you're not the owner");
    }
    logStep("Team verified", { teamName: team.name });

    // Check team member limit
    const { count: memberCount } = await supabaseClient
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    if ((memberCount || 0) >= team.max_members) {
      throw new Error(`Team has reached maximum of ${team.max_members} members`);
    }
    logStep("Member limit checked", { current: memberCount, max: team.max_members });

    // Check if user is already a member
    const { data: existingMember } = await supabaseClient
      .from("team_members")
      .select("id")
      .eq("team_id", teamId)
      .eq("user_id", (
        await supabaseClient.auth.admin.listUsers()
      ).data.users.find(u => u.email === email)?.id || "")
      .single();

    if (existingMember) {
      throw new Error("User is already a team member");
    }

    // Check for existing pending invitation
    const { data: existingInvite } = await supabaseClient
      .from("team_invitations")
      .select("id")
      .eq("team_id", teamId)
      .eq("email", email)
      .eq("status", "pending")
      .single();

    if (existingInvite) {
      throw new Error("An invitation is already pending for this email");
    }

    // Create invitation
    const { data: invitation, error: inviteError } = await supabaseClient
      .from("team_invitations")
      .insert({
        team_id: teamId,
        email,
        invited_by: user.id,
      })
      .select()
      .single();

    if (inviteError) throw new Error(`Failed to create invitation: ${inviteError.message}`);
    logStep("Invitation created", { invitationId: invitation.id, token: invitation.token });

    // Send invitation email
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendKey);
    const origin = req.headers.get("origin") || "https://mapprr.com";
    const acceptUrl = `${origin}/accept-invite?token=${invitation.token}`;

    const emailResponse = await resend.emails.send({
      from: "Mapprr <noreply@mapprr.com>",
      to: [email],
      subject: `You've been invited to join ${team.name} on Mapprr`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #6366f1; margin: 0;">Mapprr</h1>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 30px; margin-bottom: 20px;">
            <h2 style="margin-top: 0;">You're invited to join a team!</h2>
            <p>You've been invited to join <strong>${team.name}</strong> on Mapprr.</p>
            <p>As a team member, you'll be able to collaborate on visual site maps and share work with your team.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${acceptUrl}" 
                 style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600;">
                Accept Invitation
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px;">This invitation expires in 7 days.</p>
          </div>
          
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
        </body>
        </html>
      `,
    });

    logStep("Email sent", { emailId: emailResponse.id });

    return new Response(JSON.stringify({ 
      success: true, 
      invitation: { id: invitation.id, email, status: "pending" }
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
