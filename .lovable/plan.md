

# Fix URL Mapping to Use Directory Structure

## Problem
When mapping a URL, all discovered pages are placed on a single flat level around the hub (radial layout). The hierarchical/tree layout exists but is not the default, and users may not notice the layout toggle.

## Changes

### 1. Default to "Site Structure" layout for Map from URL
In `src/components/dashboard/TemplateSelector.tsx`, change the default `layoutMode` state from `'radial'` to `'hierarchical'` so URL-mapped sites automatically use the tree structure based on URL path segments.

### 2. Fix the URLCrawlerDialog (editor) to also support hierarchy
The `src/components/editor/URLCrawlerDialog.tsx` (used from within the editor) currently imports all URLs as flat nodes with no parent-child edges. Update it to parse URL path segments and create hierarchical edges between nodes, so pages like `/products/shoes` become children of `/products`.

### 3. Improve intermediate path node creation
Currently, if a site has `/blog/post-1` but no explicit `/blog` page in the crawl results, the tree structure breaks (the post goes directly under the hub). Add logic to auto-create intermediate "directory" nodes for missing parent paths, ensuring a proper tree structure.

---

## Technical Details

### File: `src/components/dashboard/TemplateSelector.tsx`
- **Line ~263**: Change `useState<LayoutMode>('radial')` to `useState<LayoutMode>('hierarchical')`
- **Lines ~387, ~395**: Update `handleClose` and `handleBack` to reset to `'hierarchical'` instead of `'radial'`
- **Lines 153-178** (createHierarchicalLayout): Enhance the tree-building logic to create intermediate nodes for missing path segments. For example, if we have `/products/shoes/sneakers` but no `/products` or `/products/shoes` in the discovered URLs, create placeholder nodes for those directories.

### File: `src/components/editor/URLCrawlerDialog.tsx`
- Update the `handleImport` callback to include hierarchy information (parent-child relationships based on URL paths) so that when nodes are added to the editor canvas, they get proper edges reflecting the directory structure rather than all connecting flat to the hub.

### Intermediate Node Creation Logic (pseudocode)
```text
For each URL's path segments:
  1. Walk up the path (e.g., /a/b/c -> check /a/b, then /a)
  2. If a parent path doesn't exist in the discovered URLs, create a "directory" node for it
  3. Connect child to its nearest parent in the tree
```

This ensures that even if Firecrawl doesn't return every intermediate directory page, the map still shows proper nesting.

