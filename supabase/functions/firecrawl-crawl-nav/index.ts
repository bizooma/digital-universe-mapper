import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const PROPLUS_TIERS = new Set(['proplus', 'team']);
const MAP_MAX_LIMIT = 200;


interface NavItem {
  label: string;
  url: string;
  children: NavItem[];
}

const JUNK_PATTERNS = [
  /\/elementor\//i, /\/wp-content\//i, /\/wp-admin\//i, /\/wp-json\//i, /\/wp-includes\//i,
  /\/category\//i, /\/tag\//i, /\/author\//i, /\/feed\//i, /\/comments\//i,
  /\/cart\/?$/i, /\/checkout\/?$/i, /\/my-account\//i, /\/wp-login/i,
  /\.(pdf|jpg|jpeg|png|gif|svg|xml|css|js|ico|woff|woff2|ttf|eot|map)(\?|$)/i,
  /[?#]/, /\/page\/\d+/i,
  /\/wp-signup/i, /\/xmlrpc/i, /\/trackback/i,
];

function isJunkUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    return JUNK_PATTERNS.some(p => p.test(url) || p.test(pathname));
  } catch {
    return true;
  }
}

function normalizeUrl(url: string, baseOrigin: string): string | null {
  try {
    const parsed = new URL(url, baseOrigin);
    // Remove trailing slash for consistency, but keep root as /
    let normalized = parsed.origin + parsed.pathname.replace(/\/+$/, '');
    if (normalized === parsed.origin) normalized = parsed.origin + '/';
    return normalized;
  } catch {
    return null;
  }
}

// Simple HTML nav parser - extracts links from <nav> elements with nesting
function parseNavigation(html: string, baseOrigin: string): NavItem[] {
  const navItems: NavItem[] = [];
  
  // Extract all <nav> blocks
  const navRegex = /<nav[^>]*>([\s\S]*?)<\/nav>/gi;
  let navMatch;
  const navBlocks: string[] = [];
  
  while ((navMatch = navRegex.exec(html)) !== null) {
    navBlocks.push(navMatch[1]);
  }
  
  if (navBlocks.length === 0) {
    // Fallback: look for common menu containers
    const menuRegex = /<(?:ul|div)[^>]*(?:class|id)="[^"]*(?:menu|nav|navigation)[^"]*"[^>]*>([\s\S]*?)<\/(?:ul|div)>/gi;
    let menuMatch;
    while ((menuMatch = menuRegex.exec(html)) !== null) {
      navBlocks.push(menuMatch[1]);
    }
  }

  if (navBlocks.length === 0) return [];

  // Use the largest nav block (likely main navigation)
  const mainNav = navBlocks.sort((a, b) => b.length - a.length)[0];
  
  // Parse nested list structure
  function parseList(listHtml: string): NavItem[] {
    const items: NavItem[] = [];
    // Match top-level <li> items (non-greedy, handling nesting)
    const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    let liMatch;
    
    // We need a smarter approach - find <a> tags and sub-<ul> at the li level
    // Split by </li> boundaries first
    const liParts = listHtml.split(/<\/li>/i);
    
    for (const part of liParts) {
      const liStart = part.search(/<li[^>]*>/i);
      if (liStart === -1) continue;
      
      const liContent = part.substring(liStart).replace(/<li[^>]*>/i, '');
      
      // Find the first <a> tag
      const aMatch = liContent.match(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!aMatch) continue;
      
      const href = aMatch[1];
      const rawLabel = aMatch[2].replace(/<[^>]*>/g, '').trim();
      
      if (!rawLabel || !href || href === '#') continue;
      
      const fullUrl = normalizeUrl(href, baseOrigin);
      if (!fullUrl || isJunkUrl(fullUrl)) continue;
      
      // Check if same origin
      try {
        const parsedUrl = new URL(fullUrl);
        const parsedBase = new URL(baseOrigin);
        if (parsedUrl.hostname !== parsedBase.hostname) continue;
      } catch { continue; }
      
      const item: NavItem = { label: rawLabel, url: fullUrl, children: [] };
      
      // Look for nested <ul> (sub-menu)
      const subUlMatch = liContent.match(/<ul[^>]*>([\s\S]*)<\/ul>/i);
      if (subUlMatch) {
        item.children = parseList(subUlMatch[1]);
      }
      
      // Deduplicate - don't add if same URL already exists
      if (!items.some(i => i.url === item.url)) {
        items.push(item);
      }
    }
    
    return items;
  }
  
  // Find <ul> in the nav block
  const ulMatch = mainNav.match(/<ul[^>]*>([\s\S]*)<\/ul>/i);
  if (ulMatch) {
    return parseList(ulMatch[1]);
  }
  
  // Fallback: just extract all links from nav
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(mainNav)) !== null) {
    const href = linkMatch[1];
    const label = linkMatch[2].replace(/<[^>]*>/g, '').trim();
    if (!label || !href || href === '#') continue;
    const fullUrl = normalizeUrl(href, baseOrigin);
    if (!fullUrl || isJunkUrl(fullUrl)) continue;
    try {
      const parsedUrl = new URL(fullUrl);
      const parsedBase = new URL(baseOrigin);
      if (parsedUrl.hostname !== parsedBase.hostname) continue;
    } catch { continue; }
    if (!navItems.some(i => i.url === fullUrl)) {
      navItems.push({ label, url: fullUrl, children: [] });
    }
  }
  
  return navItems;
}

// Collect all URLs from navigation tree
function collectNavUrls(items: NavItem[]): Set<string> {
  const urls = new Set<string>();
  for (const item of items) {
    urls.add(item.url);
    for (const u of collectNavUrls(item.children)) {
      urls.add(u);
    }
  }
  return urls;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl connector not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const baseOrigin = new URL(formattedUrl).origin;
    console.log('Crawling nav for:', formattedUrl);

    // Step 1 & 2: Scrape homepage HTML + Map all URLs in parallel
    const [scrapeRes, mapRes] = await Promise.all([
      fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formattedUrl,
          formats: ['html'],
          onlyMainContent: false,
        }),
      }),
      fetch('https://api.firecrawl.dev/v1/map', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: formattedUrl,
          limit: 200,
          includeSubdomains: false,
        }),
      }),
    ]);

    const scrapeData = await scrapeRes.json();
    const mapData = await mapRes.json();

    if (!scrapeRes.ok) {
      console.error('Scrape error:', scrapeData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to scrape homepage' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Parse navigation from HTML
    const html = scrapeData.data?.html || scrapeData.html || '';
    const navigation = parseNavigation(html, baseOrigin);
    console.log('Found', navigation.length, 'top-level nav items');

    // Step 4: Find orphaned URLs (in map but not in nav, and not junk)
    const navUrls = collectNavUrls(navigation);
    // Add the homepage itself
    navUrls.add(baseOrigin + '/');
    navUrls.add(baseOrigin);

    const allMapUrls: string[] = mapData.links || [];
    const orphanedUrls = allMapUrls
      .map(u => normalizeUrl(u, baseOrigin))
      .filter((u): u is string => u !== null)
      .filter(u => !navUrls.has(u) && !isJunkUrl(u))
      // Filter to same origin only
      .filter(u => {
        try { return new URL(u).hostname === new URL(baseOrigin).hostname; } catch { return false; }
      })
      // Deduplicate
      .filter((u, i, arr) => arr.indexOf(u) === i);

    console.log('Found', orphanedUrls.length, 'orphaned URLs');

    return new Response(
      JSON.stringify({ success: true, navigation, orphanedUrls }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Failed to crawl navigation' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
