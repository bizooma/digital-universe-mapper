

# Interactive Node Features

Three new interactive capabilities for nodes on the map canvas.

---

## Feature 1: Hover Screenshot Preview

When a user hovers over a node that has a URL, a floating card appears next to the node showing a thumbnail screenshot of that website.

**How it works:**
- Uses a free, no-API-key screenshot service (e.g., `https://image.thum.io/get/width/300/` + URL) to generate thumbnails on the fly
- No Firecrawl credits consumed -- these are free public thumbnail APIs
- Screenshots are lazy-loaded only on hover (not pre-fetched for all nodes)
- A loading skeleton shows while the image loads, with a fallback if it fails
- The preview card appears as a floating HoverCard (using the existing Radix HoverCard component) positioned below the node

**Changes:**
- `src/components/editor/LinkNode.tsx` -- Replace the current Tooltip with a HoverCard that shows a thumbnail image plus the URL. The existing tooltip only shows the URL text; the new version adds a ~300px wide preview card with the screenshot above the URL.
- No new edge functions or API keys needed

---

## Feature 2: Node Status Indicators

Show a small colored dot/badge on each node indicating whether its URL is reachable:
- Green dot = live (HTTP 200)
- Yellow dot = redirect (HTTP 3xx)  
- Red dot = broken (HTTP 4xx/5xx or unreachable)
- Gray dot = not yet checked

**How it works:**
- A new edge function `check-url-status` accepts an array of URLs and returns their HTTP status codes using HEAD requests
- The editor provides a "Check Links" button in the toolbar that triggers a batch status check for all nodes
- Results are stored in node data (`data.urlStatus`) so they persist with the map
- A small colored circle renders in the top-right corner of each node

**Changes:**
- New edge function: `supabase/functions/check-url-status/index.ts` -- accepts `{ urls: string[] }`, performs HEAD requests, returns status map
- `src/components/editor/LinkNode.tsx` -- Add a status indicator dot to the node UI, reading from `data.urlStatus`
- `src/pages/MapEditor.tsx` -- Add a "Check Links" toolbar button that calls the edge function and updates all node data with results
- `src/components/editor/LinkNode.tsx` (types) -- Add `urlStatus?: 'live' | 'redirect' | 'broken' | 'unchecked'` to `LinkNodeData`

---

## Feature 3: Connection (Edge) Labels

Allow users to add text labels on the lines connecting nodes (e.g., "links to", "redirects to", "embeds").

**How it works:**
- Uses React Flow's built-in edge label support
- When a user clicks an edge, a small input field appears allowing them to type a label
- Labels are saved as part of the edge data and persist with the map
- Styled to match the map theme with a small pill-shaped background

**Changes:**
- `src/pages/MapEditor.tsx` -- Add an `onEdgeClick` handler that opens a label editor (inline popover or small dialog). Update edge data with the label text. Define a custom edge type or use React Flow's `label` property on edges.
- `src/components/editor/EditableEdge.tsx` (new) -- A custom edge component that renders the connection line with an optional label, and shows a click-to-edit input
- Register the custom edge type in the ReactFlow configuration

---

## Summary of all file changes

| File | Action |
|------|--------|
| `src/components/editor/LinkNode.tsx` | Add HoverCard preview + status dot |
| `src/components/editor/EditableEdge.tsx` | New -- custom edge with editable labels |
| `src/pages/MapEditor.tsx` | Add "Check Links" button, edge click handler, register custom edge type |
| `src/pages/PublicMapView.tsx` | Register custom edge type for public view |
| `src/pages/EmbedMapView.tsx` | Register custom edge type for embed view |
| `supabase/functions/check-url-status/index.ts` | New -- batch URL health checker |
| `supabase/config.toml` | Add check-url-status function config |
| `src/lib/api/firecrawl.ts` | No changes needed |

## Cost impact
- Screenshot previews: Free (public thumbnail API, no credits)
- URL status checks: Free (direct HEAD requests from edge function, no external API)
- Connection labels: Free (client-side only)
