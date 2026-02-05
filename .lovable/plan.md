
# Pro Plus Plan Implementation

## Overview

Create a new "Pro Plus" tier at $15/month positioned between Pro ($8/month) and Team ($20/month), offering two powerful automation features:
1. **CSV Import** - Upload a CSV file to bulk-create nodes on a map
2. **URL Crawler** - Enter a URL and automatically generate a map of all pages on that website

---

## New Features Summary

### Feature 1: CSV Import
Users can upload a CSV file with columns like `label`, `url`, `category`, `platform`, and `notes` to automatically create multiple nodes at once.

### Feature 2: URL Crawler  
Users enter a website URL, and the system uses Firecrawl's Map API to discover all pages, then generates nodes from the discovered URLs.

---

## Implementation Tasks

### 1. Create Stripe Products & Prices
Create new products and prices in Stripe for Pro Plus:
- **Pro Plus Monthly**: $15/month
- **Pro Plus Yearly**: $135/year (save 25%, equivalent to $11.25/month)

### 2. Update Backend Edge Functions

**check-subscription/index.ts**
- Add Pro Plus product IDs to the `PRODUCT_IDS` object
- Add logic to return `plan: "proplus"` when matching Pro Plus products

**create-checkout/index.ts**
- Add Pro Plus price IDs to the `PRICE_IDS` object
- Support `proplus_monthly` and `proplus_yearly` price keys

### 3. Update Frontend Subscription System

**useSubscription.tsx**
- Add `"proplus"` to the `Plan` type
- Add Pro Plus limits to `PLAN_LIMITS` (unlimited maps/nodes like Pro)
- Add `proplus_monthly` and `proplus_yearly` to `PRICE_KEYS`
- Add `isProPlus` computed property

### 4. Update Pricing Pages

**Pricing.tsx** (full pricing page)
- Add Pro Plus plan card between Pro and Team
- Set price to $15/month, $135/year
- List features including CSV import and URL crawler
- Update grid from 3 columns to 4 columns

**PricingSection.tsx** (landing page section)
- Add Pro Plus plan card
- Update grid layout to 4 columns

### 5. Create Firecrawl Integration

**Connect Firecrawl connector** to enable URL crawling

**Create edge function: firecrawl-map/index.ts**
- Uses Firecrawl Map API to discover all URLs on a website
- Returns list of discovered page URLs

### 6. Create CSV Import Components

**CSVImportDialog.tsx** (new component)
- File upload interface for CSV files
- Parses CSV and validates columns
- Shows preview of nodes to be created
- Supports required columns: `label`, `url`
- Optional columns: `category`, `platform`, `notes`
- Auto-connects nodes to the hub node

**CSVTemplateDownload** button
- Provides a sample CSV template for users

### 7. Create URL Crawler Components

**URLCrawlerDialog.tsx** (new component)
- Input field for website URL
- Progress indicator during crawl
- Displays discovered pages
- Allows user to select which pages to import
- Creates nodes from selected pages with auto-categorization

### 8. Integrate into Map Editor

**MapEditor.tsx**
- Add toolbar buttons for CSV Import and URL Crawler
- Restrict features to Pro Plus tier (show upgrade dialog for other tiers)
- Add handlers for bulk node creation
- Auto-layout imported nodes in a radial pattern around the hub

### 9. Update Upgrade Dialogs

**UpgradeLimitDialog.tsx / UpgradeCard.tsx**
- Add Pro Plus as an upgrade option
- Highlight the new automation features

---

## Technical Details

### CSV Format Specification
```text
+----------+------------------------+-----------+----------+------------------+
| label    | url                    | category  | platform | notes            |
+----------+------------------------+-----------+----------+------------------+
| Twitter  | https://twitter.com/me | social    | twitter  | Main account     |
| Website  | https://mysite.com     | website   | website  | Portfolio        |
| YouTube  | https://youtube.com/c  | social    | youtube  | Video content    |
+----------+------------------------+-----------+----------+------------------+
```

### URL Crawler Flow
1. User enters domain URL (e.g., `https://example.com`)
2. Backend calls Firecrawl Map API
3. Returns list of discovered URLs
4. Frontend displays URLs with checkboxes
5. User selects pages to import
6. System creates nodes, auto-detecting platform from URL patterns
7. Nodes are arranged radially around the hub

### Node Auto-Layout Algorithm
When importing multiple nodes, position them in a circular/radial pattern:
- Calculate angle offset based on number of nodes
- Place nodes at increasing radius from hub center
- Ensure no overlapping

---

## Files to Create
- `src/components/editor/CSVImportDialog.tsx`
- `src/components/editor/URLCrawlerDialog.tsx`
- `src/lib/api/firecrawl.ts`
- `supabase/functions/firecrawl-map/index.ts`

## Files to Modify
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/create-checkout/index.ts`
- `src/hooks/useSubscription.tsx`
- `src/pages/Pricing.tsx`
- `src/components/landing/PricingSection.tsx`
- `src/pages/MapEditor.tsx`
- `src/components/dashboard/UpgradeLimitDialog.tsx`

---

## Summary

This plan adds a complete new pricing tier with two powerful automation features that differentiate Pro Plus from the standard Pro plan. The CSV import allows power users to quickly set up maps with existing data, while the URL crawler provides a unique way to visualize a website's structure - perfect for agencies auditing client sites.

