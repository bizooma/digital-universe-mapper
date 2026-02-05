import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Zap,
  ChevronLeft,
  Eye,
  TrendingUp,
  Calendar,
  BarChart3,
  Crown,
  Loader2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ViewsChart } from "@/components/analytics/ViewsChart";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePageMeta } from "@/hooks/usePageMeta";
import { supabase } from "@/integrations/supabase/client";
import type { Node, Edge } from "@xyflow/react";

interface MapWithViews {
  id: string;
  name: string;
  nodes: Node[];
  edges: Edge[];
  is_public: boolean;
  view_count: number;
}

interface ViewData {
  date: string;
  views: number;
}

export default function Analytics() {
  usePageMeta({
    title: "Analytics",
    description: "Track views and engagement for your shared Mapprr site maps with detailed analytics."
  });
  const { user } = useAuth();
  const { isPro } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [maps, setMaps] = useState<MapWithViews[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [viewsData, setViewsData] = useState<ViewData[]>([]);
  const [totalViews, setTotalViews] = useState(0);
  const [viewsThisWeek, setViewsThisWeek] = useState(0);
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "90d">("30d");

  // Fetch user's maps with view counts
  useEffect(() => {
    const fetchMaps = async () => {
      if (!user) return;

      try {
        // Get all user maps
        const { data: mapsData, error: mapsError } = await supabase
          .from("maps")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false });

        if (mapsError) throw mapsError;

        // Get view counts for each map
        const mapsWithViews = await Promise.all(
          (mapsData || []).map(async (map) => {
            const { count } = await supabase
              .from("map_views")
              .select("*", { count: "exact", head: true })
              .eq("map_id", map.id);

            return {
              ...map,
              nodes: (map.nodes as unknown) as Node[],
              edges: (map.edges as unknown) as Edge[],
              view_count: count || 0,
            };
          })
        );

        setMaps(mapsWithViews);
        
        // Auto-select first public map with views, or just first map
        const publicMaps = mapsWithViews.filter(m => m.is_public);
        if (publicMaps.length > 0) {
          setSelectedMapId(publicMaps[0].id);
        } else if (mapsWithViews.length > 0) {
          setSelectedMapId(mapsWithViews[0].id);
        }
      } catch (err) {
        console.error("Error fetching maps:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaps();
  }, [user]);

  // Fetch view data for selected map
  useEffect(() => {
    const fetchViewData = async () => {
      if (!selectedMapId) {
        setViewsData([]);
        setTotalViews(0);
        setViewsThisWeek(0);
        return;
      }

      const daysAgo = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      try {
        const { data, error } = await supabase
          .from("map_views")
          .select("viewed_at")
          .eq("map_id", selectedMapId)
          .gte("viewed_at", startDate.toISOString())
          .order("viewed_at", { ascending: true });

        if (error) throw error;

        // Group views by date
        const viewsByDate: Record<string, number> = {};
        const now = new Date();
        
        // Initialize all dates with 0
        for (let i = 0; i < daysAgo; i++) {
          const date = new Date();
          date.setDate(now.getDate() - (daysAgo - 1 - i));
          const dateStr = date.toISOString().split("T")[0];
          viewsByDate[dateStr] = 0;
        }

        // Count views per date
        (data || []).forEach((view) => {
          const dateStr = new Date(view.viewed_at).toISOString().split("T")[0];
          viewsByDate[dateStr] = (viewsByDate[dateStr] || 0) + 1;
        });

        // Convert to array for chart
        const chartData = Object.entries(viewsByDate).map(([date, views]) => ({
          date,
          views,
        }));

        setViewsData(chartData);
        setTotalViews(data?.length || 0);

        // Calculate views this week
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekViews = (data || []).filter(
          (v) => new Date(v.viewed_at) >= weekAgo
        ).length;
        setViewsThisWeek(weekViews);
      } catch (err) {
        console.error("Error fetching view data:", err);
      }
    };

    fetchViewData();
  }, [selectedMapId, dateRange]);

  if (!isPro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Analytics is a Pro Feature
          </h1>
          <p className="text-muted-foreground mb-6">
            Upgrade to Pro to access detailed analytics for your shared maps, including view counts, trends, and referral sources.
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" asChild>
              <Link to="/dashboard">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/pricing">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  const selectedMap = maps.find((m) => m.id === selectedMapId);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="h-14 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon-sm" asChild>
            <Link to="/dashboard">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="bg-gradient-primary p-1.5 rounded-lg">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-medium text-foreground">Analytics</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 lg:p-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : maps.length === 0 ? (
          <div className="text-center py-20">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No maps yet</h2>
            <p className="text-muted-foreground mb-6">
              Create and share a map to start seeing analytics.
            </p>
            <Button variant="hero" asChild>
              <Link to="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Map Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Map Analytics</h1>
                <p className="text-muted-foreground">
                  Track views and engagement for your shared maps
                </p>
              </div>
              <div className="flex gap-2">
                <Select
                  value={selectedMapId || ""}
                  onValueChange={setSelectedMapId}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select a map" />
                  </SelectTrigger>
                  <SelectContent>
                    {maps.map((map) => (
                      <SelectItem key={map.id} value={map.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{map.name}</span>
                          {!map.is_public && (
                            <Lock className="h-3 w-3 text-muted-foreground" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as "7d" | "30d" | "90d")}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedMap && !selectedMap.is_public && (
              <div className="bg-secondary/50 border border-border rounded-xl p-4 mb-6 flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  This map is currently private. Make it public in the editor to start tracking views.
                </p>
              </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Eye className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{totalViews}</p>
                    <p className="text-sm text-muted-foreground">Total Views</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{viewsThisWeek}</p>
                    <p className="text-sm text-muted-foreground">Views This Week</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 rounded-xl bg-card border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {viewsData.length > 0
                        ? Math.round(totalViews / viewsData.length * 10) / 10
                        : 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Avg. Daily Views</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Views Chart */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 rounded-xl bg-card border border-border"
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">Views Over Time</h2>
              <ViewsChart data={viewsData} />
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}
