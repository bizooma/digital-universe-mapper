

# SEO, AEO, and Voice SEO Optimization Plan for Mapprr

## Current State Assessment

**What's already in place:**
- Basic meta tags (title, description, OG, Twitter cards) in index.html
- Dynamic page-level meta via `usePageMeta` hook
- Canonical URL management via `useCanonicalUrl` hook
- JSON-LD structured data (WebApplication schema)
- robots.txt with sitemap reference
- sitemap.xml with 4 routes
- Google Analytics (GA4) tag

**Gaps identified across SEO, AEO (Answer Engine Optimization), and Voice SEO:**

---

## 1. Traditional SEO Fixes

### 1a. Expand sitemap.xml
The sitemap only lists 4 pages. Add all public-facing routes:
- /terms
- /privacy
- /lifetime
- /forgot-password

Update `lastmod` dates to 2026-02-10.

### 1b. Add missing OG tags
- `og:url` is missing from index.html
- `og:site_name` is missing
- `twitter:title` and `twitter:description` are missing

### 1c. Semantic HTML improvements
- Landing page sections lack proper heading hierarchy (some `h2` tags skip context)
- Add `aria-label` attributes to the Google Maps iframe and key interactive sections
- Add `alt` text review for all images (most are fine, but avatar images use Unsplash URLs without meaningful alt text)

### 1d. Add a `usePageMeta` call to pages missing it
- `LifetimeDeal.tsx` -- no `usePageMeta` or `useCanonicalUrl`
- `NotFound.tsx` -- no meta (and should return a proper 404-like experience with noindex)

### 1e. Absolute OG image URLs
OG image tags use relative paths (`/og-image.png`). These should be absolute: `https://mapprr.com/og-image.png`. Same for Twitter image.

---

## 2. AEO (Answer Engine Optimization)

AEO targets AI-powered search engines (Google AI Overviews, Bing Copilot, Perplexity, ChatGPT search) that pull structured answers from pages.

### 2a. Add FAQPage structured data (JSON-LD)
Inject FAQ schema on the Pricing page and Lifetime Deal page so AI engines can directly cite Q&A pairs. This will be done via a reusable component that renders a `<script type="application/ld+json">` block with the FAQ schema.

### 2b. Add SoftwareApplication schema
Enhance the existing WebApplication schema with additional properties:
- `aggregateRating` (if reviews exist)
- `screenshot` (link to hero map example)
- `softwareVersion`
- `releaseNotes`

### 2c. Add Organization schema
Add a separate JSON-LD block for Bizooma, LLC as the parent organization with:
- `name`, `url`, `logo`, `contactPoint`, `sameAs` (social links if any)

### 2d. Add BreadcrumbList schema
Add breadcrumb structured data on sub-pages (Pricing, Terms, Privacy, Lifetime Deal) so AI engines understand page hierarchy.

### 2e. "How-to" content structure
The Features section content is already well-structured but lacks explicit "how to" phrasing that AI engines favor. Add concise "How it works" steps (3-step process) to the landing page as a visible section with HowTo schema markup.

---

## 3. Voice SEO Optimization

Voice search queries are typically longer, conversational, and question-based. Voice assistants pull from featured snippets and structured data.

### 3a. Add Speakable schema
Add `speakable` property to the WebApplication schema pointing to the hero section's headline and description -- this tells voice assistants which parts of the page are suitable to read aloud.

### 3b. Optimize FAQ content for conversational queries
Rewrite some FAQ answers to start with direct, concise answers (the "position zero" pattern):
- "What is Mapprr?" -- Add this as a new FAQ
- "How much does Mapprr cost?" -- Already covered but can be more direct
- "How do I create a site map?" -- New question targeting voice queries

### 3c. Add a "What is Mapprr?" definition block
Add a visible, short paragraph near the top of the landing page that directly answers "What is Mapprr?" in 1-2 sentences. This is the #1 voice search query pattern for SaaS tools.

---

## Technical Implementation Details

### Files to create:
1. **`src/components/seo/JsonLd.tsx`** -- Reusable component for injecting JSON-LD blocks via React Helmet-style approach (using `useEffect` to append/remove script tags)
2. **`src/components/seo/FAQSchema.tsx`** -- Component that takes FAQ data and renders FAQPage schema
3. **`src/components/seo/BreadcrumbSchema.tsx`** -- Component for breadcrumb structured data

### Files to modify:
1. **`index.html`** -- Fix OG image URLs to absolute, add og:url, og:site_name, twitter:title, twitter:description, enhance WebApplication schema with speakable, add Organization schema
2. **`public/sitemap.xml`** -- Add missing routes, update dates
3. **`src/pages/Index.tsx`** -- Add "What is Mapprr?" section, add HowTo section
4. **`src/pages/Pricing.tsx`** -- Add FAQSchema component, add BreadcrumbSchema, add new voice-friendly FAQ entries
5. **`src/pages/LifetimeDeal.tsx`** -- Add usePageMeta, useCanonicalUrl, FAQSchema, BreadcrumbSchema
6. **`src/pages/Terms.tsx`** -- Add BreadcrumbSchema
7. **`src/pages/Privacy.tsx`** -- Add BreadcrumbSchema
8. **`src/pages/NotFound.tsx`** -- Add noindex meta tag via useEffect
9. **`src/hooks/usePageMeta.ts`** -- Extend to support og:url (absolute canonical URL) and optional noindex flag
10. **`src/components/landing/HeroSection.tsx`** -- Add a short "What is Mapprr?" descriptor paragraph optimized for voice/AEO

### New landing page section: "How It Works"
A simple 3-step visual section between the Hero and Features sections:
1. **Sign up free** -- Create your account in seconds
2. **Add your links** -- Drop in your websites, social profiles, and digital properties
3. **Share your map** -- Generate a beautiful, interactive map to share anywhere

This section will also have HowTo JSON-LD schema attached.

---

## Summary of Impact

| Area | Change | Expected Impact |
|------|--------|----------------|
| SEO | Absolute OG URLs, expanded sitemap, missing meta tags | Better social previews, more indexed pages |
| SEO | Semantic HTML, heading hierarchy | Improved crawlability |
| AEO | FAQPage schema on Pricing + Lifetime | Direct citation in AI search results |
| AEO | Organization + BreadcrumbList schema | Entity recognition by AI engines |
| AEO | "How It Works" with HowTo schema | Featured in AI-generated guides |
| Voice | Speakable schema | Voice assistant compatibility |
| Voice | Conversational FAQ rewrites | Featured snippet / position zero captures |
| Voice | "What is Mapprr?" definition block | Direct answer to voice queries |

