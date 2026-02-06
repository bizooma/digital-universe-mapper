

# Lifetime Deal Implementation Plan

## Overview
Create a hidden special offer page at `/lifetime` where users can purchase lifetime access to Pro Plus features for a one-time payment of $59. This will not be advertised on the homepage or main pricing page.

---

## How It Works

### Payment Flow
1. User visits the special `/lifetime` page
2. User signs up or logs in (if not already)
3. User clicks "Get Lifetime Access" button
4. Stripe Checkout opens for a **one-time $59 payment** (not subscription)
5. After successful payment, user gains permanent Pro Plus access

### Access Verification
When a user logs in, the system will check:
1. First, if they have an admin role (gets Team access)
2. Then, if they have a lifetime purchase recorded in the database
3. Finally, checks for active Stripe subscriptions

---

## What Gets Built

### 1. Database Table
A new `lifetime_purchases` table to track one-time purchases:
- `user_id` - Links to the user
- `stripe_payment_id` - The Stripe payment/checkout session ID
- `purchased_at` - When the purchase was made
- `plan` - The plan granted (proplus)

### 2. New Edge Function: `create-lifetime-checkout`
Creates a Stripe Checkout session in **payment mode** (one-time, not subscription):
- Price: $59 for lifetime Pro Plus
- On success, redirects to `/dashboard?lifetime=success`

### 3. New Edge Function: `verify-lifetime-purchase`
Called after checkout success to:
- Verify the Stripe payment was successful
- Record the purchase in the `lifetime_purchases` table
- Grant the user Pro Plus access

### 4. Updated: `check-subscription` Edge Function
Modified to check for lifetime purchases:
- If user has a `lifetime_purchases` record, return `plan: "proplus"` with `is_lifetime: true`
- This happens before checking Stripe subscriptions

### 5. New Page: `/lifetime`
A dedicated landing page featuring:
- Compelling headline about the limited-time offer
- Feature comparison showing Pro Plus benefits
- Clear $59 one-time pricing (no recurring fees)
- Sign up / Purchase button
- FAQ section addressing common questions

### 6. Frontend Hook Update
Update `useSubscription` to track `isLifetime` status so the UI can show "Lifetime" badge instead of subscription end date.

---

## Technical Details

### New Stripe Product
I'll need to create a new Stripe product and price for the lifetime deal:
- **Product**: Pro Plus Lifetime
- **Price**: $59 one-time payment

### Database Migration
```sql
CREATE TABLE public.lifetime_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  stripe_payment_id TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'proplus',
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- RLS: Users can only see their own purchases
ALTER TABLE public.lifetime_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lifetime purchases"
  ON public.lifetime_purchases FOR SELECT
  USING (auth.uid() = user_id);
```

### Edge Function: create-lifetime-checkout
- Uses Stripe Checkout with `mode: "payment"` (not subscription)
- Sets metadata with user_id for verification
- Redirects to dashboard on success

### Edge Function: verify-lifetime-purchase
- Receives checkout session ID from success redirect
- Verifies payment status with Stripe
- Inserts record into `lifetime_purchases` table
- Returns success/failure status

### check-subscription Updates
```typescript
// After admin check, before Stripe subscription check:
const { data: lifetimePurchase } = await supabaseClient
  .from("lifetime_purchases")
  .select("plan")
  .eq("user_id", user.id)
  .single();

if (lifetimePurchase) {
  return { 
    plan: lifetimePurchase.plan, 
    subscribed: true, 
    is_lifetime: true 
  };
}
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/pages/LifetimeDeal.tsx` | Create | Special offer landing page |
| `src/App.tsx` | Edit | Add `/lifetime` route |
| `supabase/functions/create-lifetime-checkout/index.ts` | Create | One-time payment checkout |
| `supabase/functions/verify-lifetime-purchase/index.ts` | Create | Verify and record purchase |
| `supabase/functions/check-subscription/index.ts` | Edit | Check lifetime purchases |
| `src/hooks/useSubscription.tsx` | Edit | Add `isLifetime` flag |
| Database migration | Create | `lifetime_purchases` table |

---

## Security Considerations

- Lifetime purchases are verified through Stripe's payment confirmation
- RLS policies ensure users can only view their own purchase records
- The edge function uses service role key to insert purchase records
- Payment verification happens server-side, not client-side

