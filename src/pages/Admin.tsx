import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, 
  Users, 
  Crown, 
  ArrowLeft,
  RefreshCw,
  Loader2,
  MessageSquare
} from "lucide-react";
import mapprLogo from "@/assets/mapprr-logo.png";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { usePageMeta } from "@/hooks/usePageMeta";
import { UserTable, type AdminUser } from "@/components/admin/UserTable";
import { TicketTable, type SupportTicket } from "@/components/admin/TicketTable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  usePageMeta({
    title: "Admin Dashboard",
    description: "Manage users and monitor your SaaS platform."
  });

  const { user } = useAuth();
  const { isAdmin, loading: subLoading } = useSubscription();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true);
      
      const { data, error } = await supabase.functions.invoke("admin-list-users");
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setUsers(data.users || []);
      if (showRefreshToast) toast.success("User list refreshed");
    } catch (err) {
      console.error("Error fetching users:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTickets = async () => {
    try {
      setTicketsLoading(true);
      const { data, error } = await supabase.functions.invoke("admin-list-tickets");
      
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      toast.error(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchTickets();
    }
  }, [isAdmin]);

  // Show loading while checking subscription
  if (subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect non-admins
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Calculate stats
  const totalUsers = users.length;
  const paidUsers = users.filter(u => u.plan !== "free").length;
  const activeUsers = users.filter(u => !u.is_banned).length;
  const proUsers = users.filter(u => u.plan === "pro").length;
  const proPlusUsers = users.filter(u => u.plan === "proplus").length;
  const teamUsers = users.filter(u => u.plan === "team").length;
  const openTickets = tickets.filter(t => t.status === "open").length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon-sm">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/" className="flex items-center">
                <img 
                  src={mapprLogo} 
                  alt="Mapprr" 
                  className="h-8 w-auto object-contain"
                />
              </Link>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">Admin Dashboard</span>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => fetchUsers(true)}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{totalUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-2xl font-bold">{activeUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Paid Subscribers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">{paidUsers}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Free Users</CardTitle>
              </CardHeader>
              <CardContent>
                <span className="text-2xl font-bold">{totalUsers - paidUsers}</span>
              </CardContent>
            </Card>
          </div>

          {/* Plan Breakdown */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-secondary/30">
              <CardContent className="pt-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-primary">{proUsers}</span>
                  <p className="text-sm text-muted-foreground mt-1">Pro</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-primary/10 to-accent/10">
              <CardContent className="pt-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-primary">{proPlusUsers}</span>
                  <p className="text-sm text-muted-foreground mt-1">Pro Plus</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-secondary/30">
              <CardContent className="pt-4">
                <div className="text-center">
                  <span className="text-3xl font-bold text-primary">{teamUsers}</span>
                  <p className="text-sm text-muted-foreground mt-1">Team</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for Users and Support Tickets */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="tickets" className="gap-2">
                <MessageSquare className="h-4 w-4" />
                Support Tickets
                {openTickets > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    {openTickets}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UserTable 
                    users={users} 
                    onRefresh={() => fetchUsers()} 
                    loading={loading} 
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tickets">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Support Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TicketTable 
                    tickets={tickets} 
                    onRefresh={() => fetchTickets()} 
                    loading={ticketsLoading} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
