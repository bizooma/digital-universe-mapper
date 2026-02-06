

# Layout Toggle for Map from URL

## Overview
Add a toggle switch to the "Map from URL" feature that lets users choose between two layout styles:
- **Radial View** (current) - All pages arranged in a circle around the hub
- **Site Structure View** - Hierarchical tree/org chart layout based on URL paths

---

## How It Will Work

### User Experience
1. After scanning a website, users see the list of discovered pages (as they do now)
2. Above the page list, a toggle switch appears: **"Radial"** ↔ **"Site Structure"**
3. Users select their preferred layout before clicking "Create Map"
4. The map is generated with the chosen layout style

### Layout Comparison

```text
RADIAL (Current)                    SITE STRUCTURE (New)
                                    
       [About]                              [Home]
          \                                    |
    [Blog] - [HUB] - [Products]      ┌────────┼────────┐
          /                        [About]  [Blog]  [Products]
     [Contact]                        |                  |
                                   [Team]          ┌────┴────┐
                                                [Shoes]  [Hats]
```

---

## Technical Approach

### 1. Infer Hierarchy from URLs
The URL paths naturally contain structural information:
- `example.com/` → Root (hub)
- `example.com/about` → Level 1
- `example.com/about/team` → Level 2 (child of /about)
- `example.com/products/shoes` → Level 2 (child of /products)

### 2. New Layout Function
Create a `createHierarchicalMapFromUrls` function that:
1. Parses URL paths to build a tree structure
2. Identifies parent-child relationships based on path segments
3. Positions nodes in a top-down tree layout with proper spacing
4. Creates edges that connect parent pages to child pages

### 3. UI Changes
Add a layout toggle using the existing Switch component with labels for each mode.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/dashboard/TemplateSelector.tsx` | Add layout toggle state, new layout function, update UI |

---

## Implementation Details

### New State
```typescript
const [layoutMode, setLayoutMode] = useState<'radial' | 'hierarchical'>('radial');
```

### URL Path Parsing Logic
```typescript
// Example: "/products/shoes/running" → ["products", "shoes", "running"]
// Used to determine parent-child relationships
```

### Hierarchical Positioning
- Root/Home at top center
- Each level arranged horizontally below
- Child nodes positioned under their parent
- Dynamic spacing based on number of siblings

### Edge Creation
- Radial: Hub connects to all nodes directly
- Hierarchical: Parent pages connect to child pages (forming a tree)

---

## Visual Design

The toggle will appear after scanning, styled to match the existing UI:

```text
┌─────────────────────────────────────────────┐
│  Layout Style                               │
│  ○ Radial    ●───────○ Site Structure       │
│                                             │
│  12 of 15 pages selected    [Select All]    │
│  ┌─────────────────────────────────────┐    │
│  │ ☑ Home                         ↗    │    │
│  │ ☑ About                        ↗    │    │
│  │ ☑ About / Team                 ↗    │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

---

## Edge Cases Handled

1. **Orphan pages** - Pages with no clear parent default to connecting to the hub
2. **Deep nesting** - Supports multiple levels of hierarchy
3. **Missing parents** - If `/about/team` exists but `/about` doesn't, team still connects to hub
4. **Single level sites** - Falls back to radial-like behavior if all pages are at root level

