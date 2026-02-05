import { Crown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { Link } from "react-router-dom";

export function UpgradeCard() {
  const { isFreeTier } = useSubscription();

  if (!isFreeTier) return null;

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
            asChild
          >
            <Link to="/pricing">
              <Sparkles className="h-4 w-4" />
              View Plans
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
