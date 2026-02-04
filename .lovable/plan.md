
# Implementation Plan: Auto-Login Signup Flow with Stripe Upgrades

## Overview
Transform the signup flow to auto-login users directly to the dashboard (free tier), then allow upgrades via Stripe Checkout.

```text
┌─────────────┐     ┌──────────────┐     ┌─────────────────────┐
│   Sign Up   │ ──► │  Auto-Login  │ ──► │  Dashboard (Free)   │
└─────────────┘     └──────────────┘     └─────────────────────┘
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │  Click "Upgrade"     │
                                         └──────────────────────┘
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │  Stripe Checkout     │
                                         └──────────────────────┘
                                                    │
                                                    ▼
                                         ┌──────────────────────┐
                                         │  Dashboard (Pro)     │
                                         └──────────────────────┘
```

---

## Phase 1: Enable Auto-Confirm Email Signups

### What we'll do
- Configure the backend to automatically confirm email signups (no email verification required)
- Update the signup page to redirect directly to dashboard after successful signup
- Update success messaging

### Files to modify
- `src/pages/Signup.tsx` - Change redirect from `/login` to `/dashboard`, update success message

---

## Phase 2: Enable Stripe Integration

### What we'll do
- Enable Stripe via Lovable's built-in integration
- This will unlock Stripe tools for creating products, subscriptions, and checkout sessions

---

## Phase 3: Create Subscriptions Database Table

### Database changes
Create a `subscriptions` table to track user subscription status:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| stripe_customer_id | text | Stripe customer ID |
| stripe_subscription_id | text | Stripe subscription ID |
| status | text | active, canceled, past_due, etc. |
| price_id | text | Stripe price ID |
| current_period_end | timestamp | When subscription renews/expires |
| created_at | timestamp | When created |
| updated_at | timestamp | Last update |

### Security (RLS)
- Users can only read their own subscription
- No direct inserts/updates from client (handled by webhooks)

---

## Phase 4: Create Backend Functions

### 4.1 `create-checkout-session` Function
Handles creating a Stripe checkout session for upgrades:
- Accepts: `priceId`, `billingCycle` (monthly/yearly)
- Creates or retrieves Stripe customer
- Creates checkout session with success/cancel URLs
- Returns checkout URL for redirect

### 4.2 `stripe-webhook` Function  
Handles Stripe webhook events:
- `checkout.session.completed` - Create/update subscription record
- `customer.subscription.updated` - Sync subscription status
- `customer.subscription.deleted` - Mark subscription as canceled

### 4.3 `create-portal-session` Function
For users to manage their subscription (cancel, update payment, etc.)

---

## Phase 5: Create Subscription Hook

### `useSubscription` Hook
- Fetches current user's subscription status from database
- Provides helper functions: `isPro`, `isTeam`, `isFreeTier`
- Real-time updates when subscription changes

---

## Phase 6: Update Dashboard UI

### Dashboard Changes
1. Show current plan in sidebar (already shows "Free Plan")
2. Add "Upgrade to Pro" button/card
3. Show Pro badge when upgraded
4. Add billing/subscription section

### Pricing Page Changes
- Connect CTA buttons to actual checkout flow
- Show "Current Plan" badge for active subscription
- "Manage Subscription" link for existing subscribers

---

## Technical Details

### Stripe Products to Create
| Plan | Monthly Price | Yearly Price |
|------|---------------|--------------|
| Pro | $8/month | $72/year ($6/month) |
| Team | $20/month | $192/year ($16/month) |

### Environment Variables Needed
- `STRIPE_SECRET_KEY` - For backend API calls
- `STRIPE_WEBHOOK_SECRET` - For webhook signature verification

### Checkout Flow
1. User clicks "Upgrade" button
2. Frontend calls `create-checkout-session` edge function
3. Edge function creates Stripe checkout session
4. User is redirected to Stripe Checkout
5. After payment, Stripe redirects to `/dashboard?upgrade=success`
6. Stripe webhook updates subscription in database
7. Dashboard shows Pro status

---

## Summary of Files

### New Files
- `supabase/functions/create-checkout-session/index.ts`
- `supabase/functions/stripe-webhook/index.ts`  
- `supabase/functions/create-portal-session/index.ts`
- `src/hooks/useSubscription.tsx`
- `src/components/dashboard/UpgradeCard.tsx`

### Modified Files
- `src/pages/Signup.tsx` - Auto-redirect to dashboard
- `src/pages/Dashboard.tsx` - Show plan status, upgrade button
- `src/pages/Pricing.tsx` - Connect to checkout flow
