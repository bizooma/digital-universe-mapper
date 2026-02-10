

# Fix Lifetime Purchase Verification Race Condition

## Problem
After completing Stripe checkout, the dashboard calls `verify-lifetime-purchase` multiple times simultaneously (React strict mode / re-renders). The first call succeeds, but subsequent calls fail with a "duplicate key value violates unique constraint" error because the purchase was already recorded. This causes the toast error you saw.

## Root Cause
The edge function checks for an existing record before inserting, but when 3 calls arrive at the same time, they all pass the check before any insert completes -- a classic race condition.

## Changes

### 1. Edge Function: Handle duplicate gracefully
**File: `supabase/functions/verify-lifetime-purchase/index.ts`**
- Catch the specific "duplicate key" insert error and treat it as a success instead of throwing a 500 error
- This makes the function idempotent -- calling it multiple times with the same data always succeeds

### 2. Dashboard: Prevent duplicate calls
**File: `src/pages/Dashboard.tsx`**
- Add a ref to track whether verification is already in progress
- Skip the call if it's already running, preventing the race condition on the client side
- Clean up the URL params after the first verification attempt to prevent re-triggering on re-renders

---

## Technical Details

### Edge Function Fix (verify-lifetime-purchase)
After the insert, if the error message contains "duplicate key", return a 200 success response instead of throwing:

```typescript
if (insertError) {
  if (insertError.message.includes("duplicate key")) {
    return new Response(JSON.stringify({
      success: true,
      message: "Lifetime purchase already recorded"
    }), { status: 200, headers: ... });
  }
  throw new Error(`Failed to record purchase: ${insertError.message}`);
}
```

### Dashboard Fix (Dashboard.tsx)
Add a ref guard to prevent concurrent calls:

```typescript
const verifyingRef = useRef(false);

// Inside the useEffect:
if (lifetimeStatus === "success" && sessionId && !verifyingRef.current) {
  verifyingRef.current = true;
  verifyLifetimePurchase();
}
```

Also remove `lifetime` and `session_id` from the URL after triggering verification to prevent re-triggers.
