import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Zap, 
  Settings, 
  LogOut,
  Map,
  GitBranch,
  Crown,
  CreditCard,
  BarChart3,
  Users,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeCard } from "@/components/dashboard/UpgradeCard";
import { toast } from "sonner";

export default function SharedMaps() {
  const { user, signOut } = useAuth();
  const { plan, isPro, isFreeTier, openCustomerPortal } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const url = await openCustomerPortal();
      if (url) {
        window.open(url, "_blank");
      }
    } catch {
      toast.error("Failed to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const planLabel = plan === "team" ? "Team Plan" : plan === "pro" ? "Pro Plan" : "Free Plan";

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40 hidden lg:flex lg:flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Mapprr</span>
          </Link>
        </div>

        <nav className="px-3 flex-1">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <Map className="h-4 w-4" />
              My Maps
            </Link>
            <Link
              to="/dashboard/shared"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary text-foreground"
            >
              <GitBranch className="h-4 w-4" />
              Shared with me
            </Link>
            {isPro && (
              <Link
                to="/analytics"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            )}
          </div>

          {/* Upgrade Card - only show for free tier */}
          {isFreeTier && (
            <div className="mt-6">
              <UpgradeCard />
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-medium">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <div className="flex items-center gap-1.5">
                {isPro && <Crown className="h-3 w-3 text-primary" />}
                <p className="text-xs text-muted-foreground truncate">{planLabel}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            {isPro && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                <CreditCard className="h-4 w-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" className="flex-1" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="bg-gradient-primary p-1.5 rounded-lg">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">Mapprr</span>
            </Link>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Shared with me</h1>
            <p className="text-muted-foreground">
              Maps that others have shared with you
            </p>
          </div>

          {/* Empty State */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No shared maps yet</h3>
            <p className="text-muted-foreground max-w-sm">
              When someone shares a map with you, it will appear here. Start by sharing one of your own maps with a friend!
            </p>
            <Button variant="outline" className="mt-6" asChild>
              <Link to="/dashboard">
                Go to My Maps
              </Link>
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
