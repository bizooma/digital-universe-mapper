import { useState, useEffect, useCallback } from "react";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

export type Plan = "free" | "pro" | "proplus" | "team";

interface SubscriptionState {
  plan: Plan;
  subscribed: boolean;
  subscriptionEnd: string | null;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  isLifetime: boolean;
}

// Plan limits
export const PLAN_LIMITS = {
  free: {
    maxMaps: 1,
    maxNodesPerMap: 5,
  },
  pro: {
    maxMaps: Infinity,
    maxNodesPerMap: Infinity,
  },
  proplus: {
    maxMaps: Infinity,
    maxNodesPerMap: Infinity,
  },
  team: {
    maxMaps: Infinity,
    maxNodesPerMap: Infinity,
  },
} as const;

// Price keys for checkout
export const PRICE_KEYS = {
  pro_monthly: "pro_monthly",
  pro_yearly: "pro_yearly",
  proplus_monthly: "proplus_monthly",
  proplus_yearly: "proplus_yearly",
  team_monthly: "team_monthly",
  team_yearly: "team_yearly",
} as const;

export type PriceKey = keyof typeof PRICE_KEYS;

export function useSubscription() {
  const { session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    plan: "free",
    subscribed: false,
    subscriptionEnd: null,
    loading: true,
    error: null,
    isAdmin: false,
    isLifetime: false,
  });

  const checkSubscription = useCallback(async () => {
    if (!session) {
      setState({
        plan: "free",
        subscribed: false,
        subscriptionEnd: null,
        loading: false,
        error: null,
        isAdmin: false,
        isLifetime: false,
      });
      return;
    }

    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const { data, error } = await supabase.functions.invoke("check-subscription");
      
      if (error) throw error;
      
      setState({
        plan: data.plan || "free",
        subscribed: data.subscribed || false,
        subscriptionEnd: data.subscription_end || null,
        loading: false,
        error: null,
        isAdmin: data.is_admin || false,
        isLifetime: data.is_lifetime || false,
      });
    } catch (err) {
      console.error("Error checking subscription:", err);
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to check subscription",
      }));
    }
  }, [session]);

  // Check subscription on mount and when session changes
  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Auto-refresh every minute
  useEffect(() => {
    if (!session) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session, checkSubscription]);

  const createCheckout = async (priceKey: PriceKey): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceKey },
      });
      
      if (error) throw error;
      
      return data.url;
    } catch (err) {
      console.error("Error creating checkout:", err);
      throw err;
    }
  };

  const openCustomerPortal = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      
      if (error) throw error;
      
      return data.url;
    } catch (err) {
      console.error("Error opening customer portal:", err);
      throw err;
    }
  };

  const limits = PLAN_LIMITS[state.plan];

  return {
    ...state,
    isPro: state.plan === "pro" || state.plan === "proplus" || state.plan === "team",
    isProPlus: state.plan === "proplus" || state.plan === "team",
    isTeam: state.plan === "team",
    isFreeTier: state.plan === "free",
    isAdmin: state.isAdmin,
    isLifetime: state.isLifetime,
    limits,
    canCreateMap: (currentMapCount: number) => currentMapCount < limits.maxMaps,
    canAddNode: (currentNodeCount: number) => currentNodeCount < limits.maxNodesPerMap,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}
