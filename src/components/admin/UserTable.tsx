import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { 
  Search, 
  Pause, 
  Play, 
  Trash2, 
  Shield, 
  Loader2,
  Crown,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  plan: string;
  subscription_start: string | null;
  is_banned: boolean;
  banned_until: string | null;
  is_admin: boolean;
}

interface UserTableProps {
  users: AdminUser[];
  onRefresh: () => void;
  loading: boolean;
}

export function UserTable({ users, onRefresh, loading }: UserTableProps) {
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ type: "pause" | "unpause" | "delete"; user: AdminUser } | null>(null);

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleAction = async (action: "pause" | "unpause" | "delete", userId: string) => {
    setActionLoading(userId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-manage-user", {
        body: { action, targetUserId: userId }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success(data.message || `User ${action}d successfully`);
      onRefresh();
    } catch (err) {
      console.error(`Error ${action}ing user:`, err);
      toast.error(err instanceof Error ? err.message : `Failed to ${action} user`);
    } finally {
      setActionLoading(null);
      setConfirmAction(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getPlanBadge = (plan: string, isAdmin: boolean) => {
    if (isAdmin) {
      return (
        <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground gap-1">
          <Shield className="h-3 w-3" />
          Admin
        </Badge>
      );
    }
    
    switch (plan) {
      case "team":
        return <Badge variant="default" className="gap-1"><Crown className="h-3 w-3" />Team</Badge>;
      case "proplus":
        return <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground gap-1"><Sparkles className="h-3 w-3" />Pro Plus</Badge>;
      case "pro":
        return <Badge variant="default" className="gap-1"><Crown className="h-3 w-3" />Pro</Badge>;
      default:
        return <Badge variant="secondary">Free</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "delete" 
                ? "Delete User" 
                : confirmAction?.type === "pause" 
                  ? "Pause User" 
                  : "Unpause User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "delete" 
                ? `Are you sure you want to permanently delete ${confirmAction?.user.email}? This will remove all their data and cannot be undone.`
                : confirmAction?.type === "pause"
                  ? `Are you sure you want to pause ${confirmAction?.user.email}? They won't be able to log in until unpaused.`
                  : `Are you sure you want to unpause ${confirmAction?.user.email}? They will be able to log in again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!actionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmAction && handleAction(confirmAction.type, confirmAction.user.id)}
              disabled={!!actionLoading}
              className={confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                confirmAction?.type === "delete" ? "Delete" : confirmAction?.type === "pause" ? "Pause" : "Unpause"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Subscription Start</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {search ? "No users found matching your search" : "No users found"}
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>{getPlanBadge(user.plan, user.is_admin)}</TableCell>
                  <TableCell>{formatDate(user.subscription_start)}</TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                  <TableCell>
                    {user.is_banned ? (
                      <Badge variant="destructive">Paused</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600">Active</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.is_admin ? (
                      <span className="text-xs text-muted-foreground">Protected</span>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        {user.is_banned ? (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setConfirmAction({ type: "unpause", user })}
                            disabled={!!actionLoading}
                            title="Unpause user"
                          >
                            <Play className="h-4 w-4 text-green-600" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setConfirmAction({ type: "pause", user })}
                            disabled={!!actionLoading}
                            title="Pause user"
                          >
                            <Pause className="h-4 w-4 text-amber-600" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setConfirmAction({ type: "delete", user })}
                          disabled={!!actionLoading}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </div>
  );
}
