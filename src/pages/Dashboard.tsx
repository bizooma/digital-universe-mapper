import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Plus, 
  Zap, 
  Settings, 
  LogOut,
  Map,
  GitBranch,
  Clock,
  MoreHorizontal,
  Grid,
  List,
  Crown,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeCard } from "@/components/dashboard/UpgradeCard";
import { toast } from "sonner";

// Mock data for demo
const mockMaps = [
  {
    id: "1",
    name: "Personal Brand",
    nodes: 12,
    connections: 15,
    lastEdited: "2 hours ago",
    thumbnail: "personal",
  },
  {
    id: "2",
    name: "Business Portfolio",
    nodes: 8,
    connections: 10,
    lastEdited: "Yesterday",
    thumbnail: "business",
  },
  {
    id: "3",
    name: "Side Project",
    nodes: 5,
    connections: 6,
    lastEdited: "3 days ago",
    thumbnail: "project",
  },
];

export default function Dashboard() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchParams] = useSearchParams();
  const { user, signOut } = useAuth();
  const { plan, isPro, isFreeTier, loading: subLoading, checkSubscription, openCustomerPortal } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);

  // Check for upgrade success/cancel from URL params
  useEffect(() => {
    const upgradeStatus = searchParams.get("upgrade");
    if (upgradeStatus === "success") {
      toast.success("Welcome to Pro! Your subscription is now active.");
      checkSubscription();
    } else if (upgradeStatus === "canceled") {
      toast.info("Checkout was canceled. You can upgrade anytime.");
    }
  }, [searchParams, checkSubscription]);

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
            <span className="text-xl font-bold text-foreground">LinkScape</span>
          </Link>

          <Button variant="hero" className="w-full" asChild>
            <Link to="/editor/new">
              <Plus className="h-4 w-4" />
              New Map
            </Link>
          </Button>
        </div>

        <nav className="px-3 flex-1">
          <div className="space-y-1">
            <Link
              to="/dashboard"
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary text-foreground"
            >
              <Map className="h-4 w-4" />
              My Maps
            </Link>
            <Link
              to="/dashboard/shared"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
              <GitBranch className="h-4 w-4" />
              Shared with me
            </Link>
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
              <span className="font-bold text-foreground">LinkScape</span>
            </Link>
            <Button variant="hero" size="sm" asChild>
              <Link to="/editor/new">
                <Plus className="h-4 w-4" />
                New
              </Link>
            </Button>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Maps</h1>
              <p className="text-muted-foreground">
                Create and manage your digital presence maps
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-secondary rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-card text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Grid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === "list"
                      ? "bg-card text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Maps", value: "3", icon: Map },
              { label: "Total Nodes", value: "25", icon: GitBranch },
              { label: "Last Edited", value: "2h ago", icon: Clock },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Maps Grid */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {/* New Map Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Link
                to="/editor/new"
                className="group block h-full"
              >
                <div className="h-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-medium text-foreground mb-1">Create New Map</h3>
                  <p className="text-sm text-muted-foreground">
                    Start mapping your digital presence
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Existing Maps */}
            {mockMaps.map((map, index) => (
              <motion.div
                key={map.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={`/editor/${map.id}`}
                  className="group block h-full"
                >
                  <div className="h-full rounded-xl bg-card border border-border hover:border-primary/50 transition-all overflow-hidden">
                    {/* Thumbnail */}
                    <div className="h-32 bg-secondary relative canvas-grid">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex gap-2">
                          <div className="w-16 h-8 rounded-lg bg-primary/80" />
                          <div className="w-12 h-8 rounded-lg bg-accent/80" />
                        </div>
                      </div>
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {map.name}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            // TODO: Open menu
                          }}
                          className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{map.nodes} nodes</span>
                        <span>{map.connections} connections</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Edited {map.lastEdited}
                      </p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
