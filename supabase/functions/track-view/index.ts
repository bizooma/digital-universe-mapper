import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mapId, userAgent, referrer } = await req.json();

    if (!mapId) {
      return new Response(
        JSON.stringify({ error: "mapId is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Create Supabase client with service role for inserting views
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First verify the map exists and is public
    const { data: map, error: mapError } = await supabaseAdmin
      .from("maps")
      .select("id, is_public")
      .eq("id", mapId)
      .single();

    if (mapError || !map) {
      return new Response(
        JSON.stringify({ error: "Map not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    if (!map.is_public) {
      return new Response(
        JSON.stringify({ error: "Map is not public" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 }
      );
    }

    // Record the view
    const { error: insertError } = await supabaseAdmin
      .from("map_views")
      .insert({
        map_id: mapId,
        user_agent: userAgent || null,
        referrer: referrer || null,
      });

    if (insertError) {
      console.error("Error recording view:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to record view" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: unknown) {
    console.error("Track view error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
