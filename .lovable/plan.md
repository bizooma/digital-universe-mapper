

# Fix Lifetime Deal Signup Redirect Flow

## Problem
When an unauthenticated user clicks "Get Lifetime Access" on `/lifetime`, they are redirected to `/signup?redirect=/lifetime`. However, the Signup page ignores the `redirect` query parameter and always sends users to `/dashboard` after account creation. The user never returns to `/lifetime` to complete the Stripe payment.

## Solution
Update the Signup page to read the `redirect` query parameter and navigate there after successful signup instead of always going to `/dashboard`.

## Changes

### File: `src/pages/Signup.tsx`
1. Import `useSearchParams` from `react-router-dom`
2. Read the `redirect` query parameter
3. On successful signup, navigate to the redirect URL if present, otherwise fall back to `/dashboard`

The change is minimal -- roughly 3 lines modified:

```typescript
// Add useSearchParams
const [searchParams] = useSearchParams();
const redirectTo = searchParams.get("redirect");

// In handleSubmit, change:
navigate("/dashboard");
// To:
navigate(redirectTo || "/dashboard");
```

This matches the existing pattern where `/lifetime` already passes `?redirect=/lifetime` and expects it to be honored. Once the user lands back on `/lifetime` after signup, they will now be authenticated, so `handlePurchase` will proceed directly to the Stripe checkout flow.
