

# Fix URL Crawler: Navigation-Based Hierarchy

## Problem

The URL crawler currently uses Firecrawl's `map` endpoint which returns a flat list of ALL discovered URLs on a site. Hierarchy is then guessed from URL path segments (e.g., `/team/attorney-name`). This causes three issues:

1. **Junk pages appear**: Blog categories, Elementor templates, headers, footers, and other non-content pages show up as nodes
2. **Wrong hierarchy**: Pages like "Meet the Team" and its sub-pages (attorneys) appear at the same level instead of as parent-child
3. **No navigation awareness**: The tool ignores the site's actual menu structure, which is the best indicator of how pages relate to each other

## Solution

Use a two-step approach:

1. **Step 1 -- Scrape the homepage** using Firecrawl's `scrape` endpoint with `formats: ['links', 'html']` to extract the navigation menu structure from the actual HTML
2. **Step 2 -- Discover all pages** using Firecrawl's `map` endpoint (as today) to find orphaned pages not in navigation
3. **Step 3 -- Build hierarchy from nav**, classify remaining pages as orphans, and filter out junk URLs

Pages in the nav menu get proper parent-child relationships. Pages discovered by `map` but NOT in the nav are shown in a separate "Other Pages" group. Junk URLs are auto-filtered out.

## Changes

### 1. New edge function: `supabase/functions/firecrawl-crawl-nav/index.ts`

A new backend function that:
- Scrapes the homepage HTML using Firecrawl scrape endpoint
- Extracts navigation structure from `<nav>` elements, parsing `<ul>/<li>/<a>` nesting to determine parent-child relationships
- Also calls the map endpoint to get all site URLs
- Returns both the nav structure AND the full URL list
- Filters out junk URLs (containing patterns like `/elementor/`, `/wp-admin/`, `/category/`, `/tag/`, `/author/`, `/feed/`, `/cart/`, `/checkout/`, `#`, `?`, file extensions like `.pdf`, `.jpg`, `.xml`)

Response shape:
```text
{
  success: true,
  navigation: [
    { label: "Home", url: "https://...", children: [] },
    { label: "Meet the Team", url: "https://...", children: [
      { label: "Bobbie Stewart", url: "https://..." },
      { label: "Christopher J Greene", url: "https://..." }
    ]},
    ...
  ],
  orphanedUrls: ["https://site.com/some-page-not-in-nav", ...]
}
```

### 2. Update `src/lib/api/firecrawl.ts`

Add a new `crawlNav` method that calls the new edge function.

### 3. Update `src/components/editor/URLCrawlerDialog.tsx`

- Switch from calling `firecrawlApi.map()` to `firecrawlApi.crawlNav()`
- Display discovered URLs grouped into two sections: "Navigation Pages" (with indentation showing hierarchy) and "Other Pages" (orphans)
- Pre-select navigation pages, pre-deselect orphans
- When importing, pass proper `parentUrl` relationships based on the nav structure (not URL path guessing)
- Remove the old URL-path-based hierarchy builder from `handleImport`

### 4. Junk URL filter patterns

The following URL patterns will be auto-excluded from results:
- `/elementor/`, `/wp-content/`, `/wp-admin/`, `/wp-json/`, `/wp-includes/`
- `/category/`, `/tag/`, `/author/`, `/feed/`, `/comments/`
- `/cart/`, `/checkout/`, `/my-account/`, `/wp-login`
- URLs with file extensions: `.pdf`, `.jpg`, `.png`, `.xml`, `.css`, `.js`
- URLs with `?` query parameters or `#` fragments
- `/page/2`, `/page/3` etc. (pagination)

## How it will look for the user

When a user enters a URL and clicks "Crawl":
1. They see a loading state: "Analyzing site navigation..."
2. Results appear in two groups:
   - **Navigation** (checked by default) -- shows pages with indentation matching menu structure. e.g., "Meet the Team" with "Bobbie Stewart" and "Christopher J Greene" indented below it
   - **Other Pages** (unchecked by default) -- pages found on the site but not in the main navigation
3. On import, the map displays the correct parent-child tree matching the website's actual navigation

