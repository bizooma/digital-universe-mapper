import { Crown, Sparkles, X, Loader2 } from "lucide-react";
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
  limitType: "maps" | "nodes";
  currentCount: number;
  maxCount: number;
}

export function UpgradeLimitDialog({
  open,
  onOpenChange,
  limitType,
  currentCount,
  maxCount,
}: UpgradeLimitDialogProps) {
  const { createCheckout } = useSubscription();
  const [loading, setLoading] = useState<"monthly" | "yearly" | null>(null);

  const handleUpgrade = async (billingCycle: "monthly" | "yearly") => {
    setLoading(billingCycle);
    try {
      const priceKey: PriceKey = billingCycle === "yearly" ? "pro_yearly" : "pro_monthly";
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

  const limitMessage = limitType === "maps" 
    ? `You've reached the limit of ${maxCount} map on the Free plan.`
    : `You've reached the limit of ${maxCount} nodes per map on the Free plan.`;

  const upgradeMessage = limitType === "maps"
    ? "Upgrade to Pro for unlimited maps and much more!"
    : "Upgrade to Pro for unlimited nodes and much more!";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Crown className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center">
            {limitType === "maps" ? "Map Limit Reached" : "Node Limit Reached"}
          </DialogTitle>
          <DialogDescription className="text-center">
            {limitMessage}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <p className="text-center text-sm text-muted-foreground">
            {upgradeMessage}
          </p>

          <div className="flex flex-col gap-3">
            <Button
              variant="hero"
              size="lg"
              onClick={() => handleUpgrade("monthly")}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === "monthly" ? (
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
              onClick={() => handleUpgrade("yearly")}
              disabled={loading !== null}
              className="w-full"
            >
              {loading === "yearly" ? (
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

          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime. 30-day money-back guarantee.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
