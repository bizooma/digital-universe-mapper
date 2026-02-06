import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TicketRequest {
  subject: string;
  description: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, description }: TicketRequest = await req.json();

    // Validate input
    if (!subject?.trim() || !description?.trim()) {
      return new Response(
        JSON.stringify({ error: "Subject and description are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (subject.length > 200) {
      return new Response(
        JSON.stringify({ error: "Subject must be less than 200 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (description.length > 2000) {
      return new Response(
        JSON.stringify({ error: "Description must be less than 2000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert ticket into database
    const { data: ticket, error: insertError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        user_email: user.email,
        subject: subject.trim(),
        description: description.trim(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting ticket:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create ticket" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send email notification if Resend is configured
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const submittedAt = new Date().toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        });

        await resend.emails.send({
          from: "Mapprr Support <noreply@bizooma.com>",
          to: ["support@bizooma.com"],
          subject: `New Support Ticket: ${subject.trim()}`,
          html: `
            <h2>New Support Ticket</h2>
            <p><strong>From:</strong> ${user.email}</p>
            <p><strong>Submitted:</strong> ${submittedAt}</p>
            <hr />
            <p><strong>Subject:</strong> ${subject.trim()}</p>
            <h3>Issue Description:</h3>
            <p>${description.trim().replace(/\n/g, "<br />")}</p>
            <hr />
            <p><a href="https://digital-universe-mapper.lovable.app/admin">View in Admin Dashboard</a></p>
          `,
        });
      } catch (emailError) {
        console.error("Error sending email notification:", emailError);
        // Don't fail the request if email fails - ticket is already created
      }
    }

    return new Response(JSON.stringify({ success: true, ticket }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in submit-ticket:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
