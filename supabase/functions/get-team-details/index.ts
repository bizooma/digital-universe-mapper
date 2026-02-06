import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-TEAM-DETAILS] ${step}${detailsStr}`);
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

    // Get team owned by user (or create one if admin)
    let { data: team, error: teamError } = await supabaseClient
      .from("teams")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    // If no team exists and user is admin, create one
    if (!team) {
      // Check if user is admin
      const { data: isAdmin } = await supabaseClient.rpc("has_role", {
        _user_id: user.id,
        _role: "admin"
      });

      if (isAdmin) {
        logStep("Admin user has no team, creating one");
        const { data: newTeam, error: createError } = await supabaseClient
          .from("teams")
          .insert({
            name: "Mapprr Team",
            owner_id: user.id,
            max_members: 5,
          })
          .select()
          .single();

        if (createError) throw new Error(`Failed to create team: ${createError.message}`);
        
        // Add owner as team member
        await supabaseClient
          .from("team_members")
          .insert({
            team_id: newTeam.id,
            user_id: user.id,
            role: "owner",
          });

        team = newTeam;
        logStep("Team created", { teamId: team.id });
      } else {
        throw new Error("No team found");
      }
    }

    // Get team members with user details
    const { data: members, error: membersError } = await supabaseClient
      .from("team_members")
      .select("*")
      .eq("team_id", team.id);

    if (membersError) throw new Error(`Failed to get members: ${membersError.message}`);

    // Get user details for each member
    const memberDetails = await Promise.all(
      (members || []).map(async (member) => {
        const { data: authUser } = await supabaseClient.auth.admin.getUserById(member.user_id);
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("user_id", member.user_id)
          .single();

        return {
          id: member.id,
          userId: member.user_id,
          role: member.role,
          joinedAt: member.joined_at,
          email: authUser?.user?.email || "Unknown",
          displayName: profile?.display_name || authUser?.user?.email || "Unknown",
          avatarUrl: profile?.avatar_url,
        };
      })
    );

    // Get pending invitations
    const { data: invitations, error: invitesError } = await supabaseClient
      .from("team_invitations")
      .select("*")
      .eq("team_id", team.id)
      .eq("status", "pending")
      .gt("expires_at", new Date().toISOString());

    if (invitesError) throw new Error(`Failed to get invitations: ${invitesError.message}`);

    logStep("Team details retrieved", { 
      teamId: team.id, 
      memberCount: memberDetails.length,
      pendingInvites: invitations?.length || 0 
    });

    return new Response(JSON.stringify({ 
      team: {
        id: team.id,
        name: team.name,
        maxMembers: team.max_members,
        createdAt: team.created_at,
      },
      members: memberDetails,
      invitations: invitations || [],
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
