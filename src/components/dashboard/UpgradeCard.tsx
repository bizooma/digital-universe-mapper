import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription, PriceKey } from "@/hooks/useSubscription";
import { useState } from "react";
import { toast } from "sonner";

interface UpgradeCardProps {
  billingCycle?: "monthly" | "yearly";
}

export function UpgradeCard({ billingCycle = "monthly" }: UpgradeCardProps) {
  const { isFreeTier, createCheckout } = useSubscription();
  const [loading, setLoading] = useState(false);

  if (!isFreeTier) return null;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const priceKey: PriceKey = billingCycle === "yearly" ? "pro_yearly" : "pro_monthly";
      const url = await createCheckout(priceKey);
      if (url) {
        window.open(url, "_blank");
      }
    } catch (err) {
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Crown className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1">Upgrade to Pro</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Unlock unlimited maps, all export options, and more.
          </p>
          <Button
            variant="hero"
            size="sm"
            onClick={handleUpgrade}
            disabled={loading}
          >
            {loading ? "Loading..." : (
              <>
                <Sparkles className="h-4 w-4" />
                Upgrade Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
