

# Remove Non-Working Footer Links

## Problem
The footer contains 15 links across 4 categories, but only 4 actually have working routes. The other 11 lead to the 404 page.

## Change

**`src/components/layout/Footer.tsx`**

Replace the current 4-category link grid with just the working links in a single row:

| Keep | Remove |
|------|--------|
| Features (`/#features`) | Changelog, Roadmap |
| Pricing (`/pricing`) | Blog, Documentation, Help Center, API |
| Privacy (`/privacy`) | About, Careers, Contact, Press |
| Terms (`/terms`) | Cookies |

The footer will be simplified to show these 4 links in a single flat list (no category headers), alongside the existing brand column and copyright line. This keeps the footer clean without empty categories.

## Technical Detail

- Remove the `footerLinks` object with its 4 categories
- Replace the link grid with a simple inline list of the 4 working links
- Keep the brand/logo column and copyright section unchanged
