

## Plan: Edge Direction Control + Better Label Discoverability

### Problem 1: No way to change arrow direction per connector
Currently edges have no arrow markers at all, and there's no per-edge direction setting. Users need to be able to set direction (none, forward, backward, bidirectional) on each individual connector.

### Problem 2: Label click target is invisible
The "add label" button on unlabeled edges is a tiny 4x4 circle that's `opacity-0` until hovered -- nearly impossible to discover.

---

### Changes

**1. `src/components/editor/EditableEdge.tsx`**
- Add arrow direction support by reading `data.direction` (`'none' | 'forward' | 'backward' | 'both'`, default `'forward'`)
- Compute `markerStart` / `markerEnd` based on direction using React Flow's `MarkerType.ArrowClosed`
- Make the unlabeled edge midpoint more discoverable: replace the invisible 4x4 circle with a slightly larger pill that shows "+" icon at partial opacity, becoming fully visible on hover
- Add a small direction toggle button next to the label area -- a clickable arrow icon that cycles through directions (forward → backward → both → none → forward)

**2. `src/pages/MapEditor.tsx`**
- When creating new edges in `onConnect`, set `data.direction: 'forward'` as default
- In the settings sync effect, preserve existing `data.direction` when updating edges
- Add default `markerEnd` with arrow in `defaultEdgeOptions`

**3. `src/pages/PublicMapView.tsx` + `src/pages/EmbedMapView.tsx`**
- No changes needed beyond what EditableEdge already handles (direction is read from edge data)

### Direction cycling UX
- A small arrow icon button appears near the edge midpoint (next to label area) on hover
- Clicking it cycles: → (forward) → ← (backward) → ↔ (both) → no arrow (none)
- The arrow markers on the edge update immediately

### Label discoverability UX
- Unlabeled edges show a small pill with a "+" icon at ~40% opacity, increasing to full on hover
- This replaces the current invisible circle, making it obvious you can click to add a label

