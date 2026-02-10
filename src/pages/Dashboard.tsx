import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Plus, 
  Settings, 
  LogOut,
  Map,
  GitBranch,
  Clock,
  MoreHorizontal,
  Grid,
  List,
  Crown,
  CreditCard,
  Lock,
  Loader2,
  Trash2,
  Copy,
  Pencil,
  Check,
  X,
  BarChart3,
  Sparkles,
  Shield,
  HelpCircle
} from "lucide-react";
import mapprLogo from "@/assets/mapprr-logo.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePageMeta } from "@/hooks/usePageMeta";
import { UpgradeCard } from "@/components/dashboard/UpgradeCard";
import { UpgradeLimitDialog } from "@/components/dashboard/UpgradeLimitDialog";
import { MapThumbnail } from "@/components/dashboard/MapThumbnail";
import { TemplateSelector } from "@/components/dashboard/TemplateSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Node, Edge } from "@xyflow/react";
import type { MapTemplate } from "@/data/mapTemplates";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SupportDialog } from "@/components/support/SupportDialog";

interface UserMap {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  usePageMeta({
    title: "Dashboard",
    description: "Manage your visual site maps, create new maps, and organize your digital presence with Mapprr."
  });
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchParams] = useSearchParams();
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [userMaps, setUserMaps] = useState<UserMap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapToDelete, setMapToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [renamingMapId, setRenamingMapId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isDuplicating, setIsDuplicating] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const { user, signOut } = useAuth();
  const { plan, isPro, isProPlus, isFreeTier, isAdmin, isLifetime, limits, canCreateMap, checkSubscription, openCustomerPortal } = useSubscription();
  const [portalLoading, setPortalLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user's avatar from profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("user_id", user.id)
        .single();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch user's maps from database
  useEffect(() => {
    const fetchMaps = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("maps")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (error) {
          console.error("Error fetching maps:", error);
          toast.error("Failed to load maps");
        } else {
          setUserMaps((data || []).map(map => ({
            ...map,
            nodes: (map.nodes as unknown) as Node[],
            edges: (map.edges as unknown) as Edge[],
          })));
        }
      } catch (err) {
        console.error("Error fetching maps:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaps();
  }, [user]);

  // Focus rename input when editing starts
  useEffect(() => {
    if (renamingMapId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingMapId]);

  const currentMapCount = userMaps.length;

  // Check for upgrade success/cancel from URL params
  const verifyingRef = useRef(false);
  useEffect(() => {
    const upgradeStatus = searchParams.get("upgrade");
    const lifetimeStatus = searchParams.get("lifetime");
    const sessionId = searchParams.get("session_id");
    
    if (lifetimeStatus === "success" && sessionId && !verifyingRef.current) {
      verifyingRef.current = true;
      // Clean URL params to prevent re-triggers
      const url = new URL(window.location.href);
      url.searchParams.delete("lifetime");
      url.searchParams.delete("session_id");
      window.history.replaceState({}, "", url.pathname + url.search);
      
      // Verify the lifetime purchase
      const verifyLifetimePurchase = async () => {
        try {
          const { data, error } = await supabase.functions.invoke("verify-lifetime-purchase", {
            body: { session_id: sessionId }
          });
          
          if (error) {
            console.error("Lifetime verification error:", error);
            toast.error("Failed to verify purchase. Please contact support.");
          } else if (data?.success) {
            toast.success("🎉 Welcome to Pro Plus Lifetime! Your access is now permanent.");
            checkSubscription();
          }
        } catch (err) {
          console.error("Lifetime verification error:", err);
          toast.error("Failed to verify purchase. Please contact support.");
        }
      };
      verifyLifetimePurchase();
    } else if (upgradeStatus === "success") {
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

  const handleCreateMap = () => {
    if (!canCreateMap(currentMapCount)) {
      setShowUpgradeDialog(true);
      return;
    }
    setShowTemplateSelector(true);
  };

  const handleSelectTemplate = (template: MapTemplate) => {
    setShowTemplateSelector(false);
    // Navigate to editor with template data in state
    navigate("/editor/new", { 
      state: { 
        template: { 
          nodes: template.nodes, 
          edges: template.edges 
        } 
      } 
    });
  };

  const handleDeleteMap = async () => {
    if (!mapToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("maps")
        .delete()
        .eq("id", mapToDelete);

      if (error) throw error;
      
      setUserMaps(maps => maps.filter(m => m.id !== mapToDelete));
      toast.success("Map deleted successfully");
    } catch (err) {
      console.error("Error deleting map:", err);
      toast.error("Failed to delete map");
    } finally {
      setIsDeleting(false);
      setMapToDelete(null);
    }
  };

  const handleDuplicateMap = async (map: UserMap) => {
    if (!user) return;
    
    // Check if user can create more maps
    if (!canCreateMap(currentMapCount)) {
      setShowUpgradeDialog(true);
      return;
    }

    setIsDuplicating(map.id);
    try {
      const { data, error } = await supabase
        .from("maps")
        .insert([{
          user_id: user.id,
          name: `Copy of ${map.name}`,
          nodes: JSON.parse(JSON.stringify(map.nodes)),
          edges: JSON.parse(JSON.stringify(map.edges)),
        }])
        .select()
        .single();

      if (error) throw error;
      
      const newMap: UserMap = {
        ...data,
        nodes: (data.nodes as unknown) as Node[],
        edges: (data.edges as unknown) as Edge[],
      };
      
      setUserMaps(maps => [newMap, ...maps]);
      toast.success("Map duplicated successfully");
      
      // Navigate to the new map
      navigate(`/editor/${data.id}`);
    } catch (err) {
      console.error("Error duplicating map:", err);
      toast.error("Failed to duplicate map");
    } finally {
      setIsDuplicating(null);
    }
  };

  const handleStartRename = (map: UserMap) => {
    setRenamingMapId(map.id);
    setRenameValue(map.name);
  };

  const handleCancelRename = () => {
    setRenamingMapId(null);
    setRenameValue("");
  };

  const handleSaveRename = async () => {
    if (!renamingMapId || !renameValue.trim()) {
      handleCancelRename();
      return;
    }

    try {
      const { error } = await supabase
        .from("maps")
        .update({ name: renameValue.trim() })
        .eq("id", renamingMapId);

      if (error) throw error;
      
      setUserMaps(maps => 
        maps.map(m => 
          m.id === renamingMapId 
            ? { ...m, name: renameValue.trim() } 
            : m
        )
      );
      toast.success("Map renamed successfully");
    } catch (err) {
      console.error("Error renaming map:", err);
      toast.error("Failed to rename map");
    } finally {
      handleCancelRename();
    }
  };

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveRename();
    } else if (e.key === "Escape") {
      handleCancelRename();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const planLabel = plan === "team" ? "Team Plan" : plan === "proplus" ? "Pro Plus" : plan === "pro" ? "Pro Plan" : "Free Plan";
  const canCreate = canCreateMap(currentMapCount);

  const totalNodes = userMaps.reduce((sum, m) => sum + (m.nodes?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!mapToDelete} onOpenChange={(open) => !open && setMapToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Map</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this map? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMap} 
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade Dialog */}
      <UpgradeLimitDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        limitType="maps"
        currentCount={currentMapCount}
        maxCount={limits.maxMaps}
      />

      {/* Template Selector */}
      <TemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelect={handleSelectTemplate}
      />

      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border z-40 hidden lg:flex lg:flex-col">
        <div className="p-6">
          <Link to="/" className="flex items-center mb-8">
            <img 
              src={mapprLogo} 
              alt="Mapprr" 
              className="h-10 w-auto object-contain"
            />
          </Link>

          {canCreate ? (
            <Button variant="hero" className="w-full" onClick={handleCreateMap}>
              <Plus className="h-4 w-4" />
              New Map
            </Button>
          ) : (
            <Button variant="hero" className="w-full" onClick={handleCreateMap}>
              <Lock className="h-4 w-4" />
              New Map
            </Button>
          )}
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
            {isPro && (
              <Link
                to="/analytics"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Link>
            )}
            <SupportDialog
              trigger={
                <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors w-full">
                  <HelpCircle className="h-4 w-4" />
                  Help & Support
                </button>
              }
            />
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
            <Avatar className="h-10 w-10">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-medium">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{displayName}</p>
              <div className="flex items-center gap-1.5">
                {isProPlus ? (
                  <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground text-[10px] px-1.5 py-0 h-4 gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    {isLifetime ? "Lifetime Pro Plus" : "Pro Plus"}
                  </Badge>
                ) : isPro ? (
                  <>
                    <Crown className="h-3 w-3 text-primary" />
                    <p className="text-xs text-muted-foreground truncate">{planLabel}</p>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground truncate">{planLabel}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="flex-1 flex-col h-auto py-2 gap-1" asChild>
              <Link to="/settings">
                <Settings className="h-4 w-4" />
                <span className="text-[10px]">Settings</span>
              </Link>
            </Button>
            {isPro ? (
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex-1 flex-col h-auto py-2 gap-1"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                <CreditCard className="h-4 w-4" />
                <span className="text-[10px]">Billing</span>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="flex-1 flex-col h-auto py-2 gap-1" asChild>
                <Link to="/pricing">
                  <Crown className="h-4 w-4" />
                  <span className="text-[10px]">Upgrade</span>
                </Link>
              </Button>
            )}
            <Button variant="ghost" size="sm" className="flex-1 flex-col h-auto py-2 gap-1" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
              <span className="text-[10px]">Sign Out</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img 
                src={mapprLogo} 
                alt="Mapprr" 
                className="h-8 w-auto object-contain"
              />
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/settings" className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xs font-medium">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
              {canCreate ? (
                <Button variant="hero" size="sm" onClick={handleCreateMap}>
                  <Plus className="h-4 w-4" />
                  New
                </Button>
              ) : (
                <Button variant="hero" size="sm" onClick={handleCreateMap}>
                  <Lock className="h-4 w-4" />
                  New
                </Button>
              )}
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Maps</h1>
              <p className="text-muted-foreground">
                Create and manage your digital presence maps
                {isFreeTier && (
                  <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {currentMapCount}/{limits.maxMaps} maps
                  </span>
                )}
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

          {/* Stats - only show if user has maps */}
          {userMaps.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Total Maps", value: String(currentMapCount), icon: Map },
                { label: "Total Nodes", value: String(totalNodes), icon: GitBranch },
                { label: "Last Edited", value: userMaps[0] ? formatDate(userMaps[0].updated_at) : "Never", icon: Clock },
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
          )}

          {/* Maps Grid */}
          <div className={viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
            {/* New Map Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {canCreate ? (
                <button onClick={handleCreateMap} className="group block h-full w-full text-left">
                  <div className="h-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">Create New Map</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose a template to get started
                    </p>
                  </div>
                </button>
              ) : (
                <button onClick={handleCreateMap} className="group block h-full w-full text-left">
                  <div className="h-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors p-8 flex flex-col items-center justify-center text-center min-h-[200px]">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium text-foreground mb-1">Create New Map</h3>
                    <p className="text-sm text-muted-foreground">
                      Upgrade to Pro to create more maps
                    </p>
                  </div>
                </button>
              )}
            </motion.div>

            {/* Loading State */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full flex items-center justify-center py-12"
              >
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </motion.div>
            )}

            {/* Existing Maps */}
            {!isLoading && userMaps.map((map, index) => (
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
                    <div className="h-32 relative">
                      <MapThumbnail 
                        nodes={map.nodes || []} 
                        edges={map.edges || []} 
                        width={400}
                        height={128}
                      />
                    </div>
                    
                    {/* Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        {renamingMapId === map.id ? (
                          <div className="flex-1 mr-2 flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                            <Input
                              ref={renameInputRef}
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onKeyDown={handleRenameKeyDown}
                              onBlur={handleSaveRename}
                              className="h-7 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSaveRename();
                              }}
                              className="p-1 rounded-md hover:bg-secondary text-primary"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCancelRename();
                              }}
                              className="p-1 rounded-md hover:bg-secondary text-muted-foreground"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate flex-1 mr-2">
                            {map.name}
                          </h3>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              onClick={(e) => e.preventDefault()}
                              className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-card">
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                handleStartRename(map);
                              }}
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                handleDuplicateMap(map);
                              }}
                              disabled={isDuplicating === map.id}
                            >
                              {isDuplicating === map.id ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Copy className="h-4 w-4 mr-2" />
                              )}
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                setMapToDelete(map.id);
                              }}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{map.nodes?.length || 0} nodes</span>
                        <span>{map.edges?.length || 0} connections</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Edited {formatDate(map.updated_at)}
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
