
# Plan: Update Pricing Tables with Accurate Feature Lists

## Overview
Remove unimplemented and misleading features from the pricing tiers to ensure the advertised features match what is actually available in the application.

## Changes Required

### Files to Modify
1. `src/components/landing/PricingSection.tsx` - Landing page pricing section
2. `src/pages/Pricing.tsx` - Dedicated pricing page

### Pro Plus Tier Updates
**Remove:**
- "Auto-generate maps" - No auto-generation feature exists
- "Advanced analytics" - Same as Pro analytics
- "White-label exports" - Pro already removes watermarks

**Keep:**
- "Everything in Pro"
- "CSV bulk import"
- "URL crawler"

**Consider adding (if accurate):**
- Could add "Bulk node creation" to better describe CSV/URL crawler value

### Team Tier Updates
**Remove:**
- "SSO integration" - Not implemented
- "API access" - No public API exists
- "Dedicated support" - No distinct support channel

**Keep:**
- "Everything in Pro Plus"
- "Up to 5 team members"
- "Shared workspace"
- "Team collaboration"
- "Admin controls"

**Consider adding (if implemented):**
- "Team analytics" (if there are team-specific analytics features)
- "Priority email support" (more honest than "dedicated")

### Updated Feature Lists

**Pro Plus features (proposed):**
```
"Everything in Pro",
"CSV bulk import",
"URL crawler",
"Bulk node creation"
```

**Team features (proposed):**
```
"Everything in Pro Plus",
"Up to 5 team members",
"Shared workspace",
"Team collaboration",
"Admin controls",
"Priority support"
```

---

## Technical Details

Both pricing files have similar `plans` arrays. The changes involve updating the `features` arrays for the "Pro Plus" and "Team" plan objects.

### PricingSection.tsx (lines 48-55 and 66-74)
Update the Pro Plus features array to remove 3 items and the Team features array to remove 3 items.

### Pricing.tsx (lines 60-68 and 79-88)
Same updates as above, matching the landing page changes.

---

## Implementation Notes
- The changes are purely content/copy updates to arrays
- No logic changes required
- Both files need to be updated in sync to maintain consistency
