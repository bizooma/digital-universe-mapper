

# Comprehensive Feature Implementation Plan

## Overview

This plan covers all suggested enhancements to transform LinkScape into a polished, feature-rich application. We'll implement these in logical phases to maintain stability while adding functionality.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        FEATURE IMPLEMENTATION ROADMAP                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PHASE 1: Core UX Improvements                                          │
│  ├── Auto-save with debounce                                            │
│  ├── Edit existing nodes                                                │
│  └── Undo/Redo functionality                                            │
│                                                                          │
│  PHASE 2: Sharing & Public View                                         │
│  ├── Public view page (/view/:id)                                       │
│  └── Enhanced share dialog                                              │
│                                                                          │
│  PHASE 3: Dashboard Enhancements                                        │
│  ├── Map thumbnails with mini preview                                   │
│  ├── Duplicate maps                                                     │
│  └── Rename maps                                                        │
│                                                                          │
│  PHASE 4: Templates & Onboarding                                        │
│  ├── Starter templates                                                  │
│  └── Guided onboarding tour                                             │
│                                                                          │
│  PHASE 5: Pro Features                                                  │
│  └── Analytics dashboard (Pro)                                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Core UX Improvements

### 1.1 Auto-Save with Debounce

**What we'll build:**
Save maps automatically 2 seconds after the user stops making changes, with a visual indicator showing save status.

**User Experience:**
- Status indicator in toolbar: "Saved", "Saving...", "Unsaved changes"
- Green checkmark when saved, spinning icon when saving
- Works silently in background without interrupting workflow

**Files to modify:**
- `src/pages/MapEditor.tsx` - Add debounced auto-save logic and status indicator

**Implementation approach:**
```text
User edits map
      │
      ▼
┌─────────────────┐
│ Debounce Timer  │ ◄── Resets on each change
│   (2 seconds)   │
└────────┬────────┘
         │
         ▼ Timer expires
┌─────────────────┐
│   Save to DB    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Show "Saved ✓"  │
└─────────────────┘
```

---

### 1.2 Edit Existing Nodes

**What we'll build:**
Click on any node to open an edit panel where users can modify the label, URL, platform, and notes.

**User Experience:**
- Single click on a node selects it and opens edit panel
- Same panel design as "Add Node" but pre-populated with existing data
- Save button updates the node, Cancel discards changes
- Delete button to remove the node

**Files to create:**
- `src/components/editor/EditNodePanel.tsx` - New panel for editing nodes

**Files to modify:**
- `src/pages/MapEditor.tsx` - Add node click handler and state for selected node
- `src/components/editor/LinkNode.tsx` - Make nodes clickable for editing

---

### 1.3 Undo/Redo Functionality

**What we'll build:**
Working Undo/Redo buttons that track node and edge changes, with keyboard shortcuts.

**User Experience:**
- Undo: Cmd/Ctrl+Z
- Redo: Cmd/Ctrl+Shift+Z
- Buttons in toolbar become active when history is available
- Tracks last 50 actions

**Files to create:**
- `src/hooks/useUndoRedo.ts` - Custom hook for managing undo/redo history

**Files to modify:**
- `src/pages/MapEditor.tsx` - Integrate undo/redo hook and keyboard shortcuts

**Implementation approach:**
```text
History Stack:
├── State 0: Initial map
├── State 1: Added node
├── State 2: Moved node        ◄── Current
├── State 3: (empty - redo available after undo)
└── ...

Undo: Move pointer back, restore previous state
Redo: Move pointer forward, restore next state
New action: Clear redo stack, add new state
```

---

## Phase 2: Sharing & Public View

### 2.1 Public View Page

**What we'll build:**
A read-only public page at `/view/:id` where anyone can view a shared map without logging in.

**User Experience:**
- Clean, minimal interface showing just the map
- LinkScape branding in corner (removable for Pro users)
- No editing controls
- Links on nodes are clickable and open in new tab
- Share button to copy the public URL

**Database changes:**
Add `is_public` boolean column to `maps` table to control visibility.

**Files to create:**
- `src/pages/PublicMapView.tsx` - Read-only public view component

**Files to modify:**
- `src/App.tsx` - Add route for `/view/:id`
- `src/pages/MapEditor.tsx` - Add toggle to make map public/private

**Security:**
- RLS policy allowing public SELECT on maps where `is_public = true`
- No authentication required for public view

---

### 2.2 Enhanced Share Dialog

**What we'll build:**
Improved share dialog with public/private toggle and social sharing options.

**User Experience:**
- Toggle switch to make map public/private
- Copy link button
- Social share buttons (Twitter, LinkedIn, Facebook)
- QR code for easy mobile sharing (Pro feature)

**Files to modify:**
- `src/pages/MapEditor.tsx` - Enhance existing share dialog

---

## Phase 3: Dashboard Enhancements

### 3.1 Dynamic Map Thumbnails

**What we'll build:**
Generate visual mini-previews of each map showing the actual node layout.

**User Experience:**
- Instead of placeholder blocks, show a simplified visual of the map
- Hub node centered with connected nodes around it
- Color-coded by node category

**Files to create:**
- `src/components/dashboard/MapThumbnail.tsx` - Mini canvas renderer

**Files to modify:**
- `src/pages/Dashboard.tsx` - Replace placeholder with MapThumbnail

---

### 3.2 Duplicate Maps

**What we'll build:**
Option to duplicate an existing map as a starting point for a new one.

**User Experience:**
- "Duplicate" option in the map dropdown menu
- Creates copy with name "Copy of [Original Name]"
- Opens new map in editor

**Files to modify:**
- `src/pages/Dashboard.tsx` - Add duplicate handler

---

### 3.3 Rename Maps from Dashboard

**What we'll build:**
Inline editing to rename maps directly from the dashboard.

**User Experience:**
- "Rename" option in dropdown menu
- Inline text input appears over the map name
- Enter to save, Escape to cancel

**Files to modify:**
- `src/pages/Dashboard.tsx` - Add rename functionality with inline editing

---

## Phase 4: Templates & Onboarding

### 4.1 Starter Templates

**What we'll build:**
Pre-designed map templates for common use cases that users can select when creating a new map.

**Templates:**
1. **Creator** - YouTube, Instagram, TikTok, Patreon, Linktree
2. **Business** - Website, LinkedIn, Email, Blog
3. **E-commerce** - Shopify, Instagram, Email, Reviews
4. **Blank** - Just the hub node (current default)

**User Experience:**
- Template selection modal appears when clicking "New Map"
- Preview of each template
- Click to start with that template

**Files to create:**
- `src/components/dashboard/TemplateSelector.tsx` - Template selection modal
- `src/data/mapTemplates.ts` - Template definitions

**Files to modify:**
- `src/pages/Dashboard.tsx` - Show template selector instead of direct navigation

---

### 4.2 Guided Onboarding Tour

**What we'll build:**
Interactive walkthrough for first-time users explaining how to use the editor.

**Tour Steps:**
1. Welcome - "Let's create your digital presence map!"
2. Hub Node - "This is your central brand. Double-click to edit the name."
3. Add Nodes - "Click here to add your social media, websites, and more."
4. Connect - "Drag from one node to another to show relationships."
5. Save & Share - "Save your work and share it with the world!"

**User Experience:**
- Tooltip-style overlays highlighting each feature
- Progress indicator (1/5, 2/5, etc.)
- Skip button to dismiss
- Tour only shows once per user (stored in localStorage)

**Files to create:**
- `src/components/onboarding/OnboardingTour.tsx` - Tour component
- `src/hooks/useOnboarding.ts` - Track onboarding completion

**Files to modify:**
- `src/pages/MapEditor.tsx` - Include onboarding tour for first-time users

---

## Phase 5: Pro Features

### 5.1 Analytics Dashboard (Pro Only)

**What we'll build:**
View statistics for shared maps including view counts and click-through rates.

**Metrics:**
- Total views per map
- Views over time (chart)
- Top clicked nodes
- Geographic distribution (if available)

**Database changes:**
Create `map_views` table to track view events.

**Files to create:**
- `src/pages/Analytics.tsx` - Analytics dashboard page
- `src/components/analytics/ViewsChart.tsx` - Chart component
- `supabase/functions/track-view/index.ts` - Edge function to record views

**Files to modify:**
- `src/App.tsx` - Add route for `/analytics`
- `src/pages/PublicMapView.tsx` - Track view when map is loaded
- `src/pages/Dashboard.tsx` - Add link to analytics (Pro users only)

---

## Summary of All Files

### New Files to Create:
| File | Purpose |
|------|---------|
| `src/components/editor/EditNodePanel.tsx` | Panel for editing existing nodes |
| `src/hooks/useUndoRedo.ts` | Undo/redo state management |
| `src/pages/PublicMapView.tsx` | Read-only public map viewer |
| `src/components/dashboard/MapThumbnail.tsx` | Mini map preview renderer |
| `src/components/dashboard/TemplateSelector.tsx` | Template selection modal |
| `src/data/mapTemplates.ts` | Template node/edge definitions |
| `src/components/onboarding/OnboardingTour.tsx` | Guided tour component |
| `src/hooks/useOnboarding.ts` | Onboarding state management |
| `src/pages/Analytics.tsx` | Pro analytics dashboard |
| `src/components/analytics/ViewsChart.tsx` | Analytics chart |
| `supabase/functions/track-view/index.ts` | View tracking edge function |

### Files to Modify:
| File | Changes |
|------|---------|
| `src/pages/MapEditor.tsx` | Auto-save, node editing, undo/redo, onboarding |
| `src/pages/Dashboard.tsx` | Thumbnails, duplicate, rename, templates |
| `src/App.tsx` | New routes for public view and analytics |
| `src/components/editor/LinkNode.tsx` | Click handler for editing |

### Database Changes:
| Change | Description |
|--------|-------------|
| Add `is_public` to `maps` | Boolean flag for public visibility |
| Create `map_views` table | Track view events for analytics |
| RLS policy for public maps | Allow unauthenticated reads when `is_public = true` |

---

## Recommended Implementation Order

1. **Start with Phase 1** - These are the highest-impact UX improvements
2. **Phase 2 next** - Public sharing is a key feature for virality
3. **Phase 3** - Dashboard improvements enhance daily use
4. **Phase 4** - Templates and onboarding help new users get started
5. **Phase 5** - Analytics adds value for Pro subscribers

Each phase can be implemented independently and tested before moving to the next.

