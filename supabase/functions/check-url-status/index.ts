const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json() as { urls: string[] };

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(
        JSON.stringify({ error: 'urls array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to 50 URLs per request
    const urlsToCheck = urls.slice(0, 50);

    const results: Record<string, { status: 'live' | 'redirect' | 'broken'; code: number }> = {};

    await Promise.allSettled(
      urlsToCheck.map(async (url) => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);

          const response = await fetch(url, {
            method: 'HEAD',
            redirect: 'manual',
            signal: controller.signal,
            headers: { 'User-Agent': 'Mapprr-LinkChecker/1.0' },
          });

          clearTimeout(timeout);

          const code = response.status;
          if (code >= 200 && code < 300) {
            results[url] = { status: 'live', code };
          } else if (code >= 300 && code < 400) {
            results[url] = { status: 'redirect', code };
          } else {
            results[url] = { status: 'broken', code };
          }
        } catch {
          results[url] = { status: 'broken', code: 0 };
        }
      })
    );

    return new Response(
      JSON.stringify({ results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
