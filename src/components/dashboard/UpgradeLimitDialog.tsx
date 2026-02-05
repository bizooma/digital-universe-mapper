import { Crown, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSubscription, PriceKey } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "sonner";

interface UpgradeLimitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  limitType: "maps" | "nodes" | "feature";
  currentCount?: number;
  maxCount?: number;
  featureName?: string;
}

export function UpgradeLimitDialog({
  open,
  onOpenChange,
  limitType,
  currentCount,
  maxCount,
  featureName,
}: UpgradeLimitDialogProps) {
  const { createCheckout } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: "pro" | "proplus", billingCycle: "monthly" | "yearly") => {
    const key = `${plan}_${billingCycle}`;
    setLoading(key);
    try {
      const priceKey: PriceKey = `${plan}_${billingCycle}` as PriceKey;
      const url = await createCheckout(priceKey);
      if (url) {
        window.open(url, "_blank");
        onOpenChange(false);
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const getLimitMessage = () => {
    if (limitType === "feature" && featureName) {
      return `${featureName} is a Pro Plus feature.`;
    }
    if (limitType === "maps") {
      return `You've reached the limit of ${maxCount} map on the Free plan.`;
    }
    return `You've reached the limit of ${maxCount} nodes per map on the Free plan.`;
  };

  const getTitle = () => {
    if (limitType === "feature") return "Upgrade to Pro Plus";
    if (limitType === "maps") return "Map Limit Reached";
    return "Node Limit Reached";
  };

  const showProPlusOption = limitType === "feature";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">{getTitle()}</DialogTitle>
          <DialogDescription className="text-center">
            {getLimitMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {showProPlusOption ? (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Unlock CSV import, URL crawler, and advanced automation features.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => handleUpgrade("proplus", "monthly")}
                  disabled={loading !== null}
                  className="w-full"
                >
                  {loading === "proplus_monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Upgrade to Pro Plus - $15/month
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleUpgrade("proplus", "yearly")}
                  disabled={loading !== null}
                  className="w-full"
                >
                  {loading === "proplus_yearly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Get Pro Plus Yearly - $11.25/month
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Save 25%
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-sm text-muted-foreground">
                Upgrade to Pro for unlimited maps, nodes, and much more!
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  variant="hero"
                  size="lg"
                  onClick={() => handleUpgrade("pro", "monthly")}
                  disabled={loading !== null}
                  className="w-full"
                >
                  {loading === "pro_monthly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Upgrade to Pro - $8/month
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => handleUpgrade("pro", "yearly")}
                  disabled={loading !== null}
                  className="w-full"
                >
                  {loading === "pro_yearly" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Get Pro Yearly - $6/month
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                        Save 25%
                      </span>
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime. 30-day money-back guarantee.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
