

# Replace All "LinkScape" References with "Mapprr"

## Problem
The app was rebranded from "LinkScape" to "Mapprr," but 85 references across 13 files still use the old name.

## Changes

### 1. Onboarding (the issue you spotted)
**`src/hooks/useOnboarding.ts`**
- Change `"Welcome to LinkScape! 🎉"` to `"Welcome to Mapprr! 🎉"`
- Rename the localStorage key from `linkscape_onboarding_completed` to `mapprr_onboarding_completed`

### 2. Landing / Marketing Pages
- **`src/components/landing/CTASection.tsx`** -- Update CTA copy referencing LinkScape to Mapprr
- **`src/pages/Pricing.tsx`** -- Update FAQ answers and section text (2 occurrences)

### 3. Auth Pages (logo text still says "LinkScape")
- **`src/pages/ForgotPassword.tsx`** -- Update brand name in header
- **`src/pages/ResetPassword.tsx`** -- Update brand name in header
- **`src/pages/SharedMaps.tsx`** -- Update brand name in header and footer (2 occurrences)

### 4. Editor
- **`src/components/editor/CSVImportDialog.tsx`** -- Rename downloaded template file from `linkscape-import-template.csv` to `mapprr-import-template.csv`

### 5. Edge Functions (code comments and fallback URLs)
- **`supabase/functions/create-checkout/index.ts`** -- Update comment and fallback origin URL
- **`supabase/functions/customer-portal/index.ts`** -- Update fallback origin URL
- **`supabase/functions/create-lifetime-checkout/index.ts`** -- Update fallback origin URL
- **`supabase/functions/check-subscription/index.ts`** -- Update comment
- **`supabase/functions/admin-list-users/index.ts`** -- Update comment

### 6. CSS Comment
- **`src/index.css`** -- Update design system comment from "LinkScape" to "Mapprr"

## Notes
- All changes are straightforward find-and-replace of the brand name
- The localStorage key rename means users who already completed onboarding will see the tour once more (a minor, acceptable side effect)
- Fallback origin URLs in edge functions will be updated to `https://mapprr.com`

