// Single source of truth for Stripe product -> Mapprr tier mapping.
// Imported by check-subscription and stripe-webhook so the two cannot drift.

export type PaidTier = "pro" | "proplus" | "team";

export const PRODUCT_TIERS: Record<string, PaidTier> = {
  prod_Tv1XmbuF1Eq9mD: "pro", // Pro monthly
  prod_Tv1Xpev3vVpb63: "pro", // Pro yearly
  prod_TvHvzw0LtqJdTG: "proplus", // Pro Plus monthly
  prod_TvHvO0TaHthQYE: "proplus", // Pro Plus yearly
  prod_Tv1YL0NqFMF2J6: "team", // Team monthly
  prod_Tv1Y02rLWusFXX: "team", // Team yearly
};

// Subscription statuses that keep a user on their paid tier.
export const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

export function tierForProduct(productId: string | null | undefined): PaidTier | "free" {
  if (!productId) return "free";
  return PRODUCT_TIERS[productId] ?? "free";
}

export function tierForSubscription(status: string, productId: string | null | undefined): PaidTier | "free" {
  if (!ENTITLED_STATUSES.has(status)) return "free";
  return tierForProduct(productId);
}
