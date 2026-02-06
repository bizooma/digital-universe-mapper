import { useState } from "react";
import { format } from "date-fns";
import { Loader2, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export interface SupportTicket {
  id: string;
  user_id: string;
  user_email: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TicketTableProps {
  tickets: SupportTicket[];
  loading: boolean;
  onRefresh: () => void;
}

const statusColors: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  in_progress: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  resolved: "bg-green-500/10 text-green-600 border-green-500/20",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
};

export function TicketTable({ tickets, loading, onRefresh }: TicketTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    setUpdatingId(ticketId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-ticket", {
        body: { ticketId, status: newStatus },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Ticket status updated");
      onRefresh();
    } catch (err) {
      console.error("Error updating ticket:", err);
      toast.error("Failed to update ticket status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleSaveNotes = async (ticketId: string) => {
    setUpdatingId(ticketId);
    try {
      const { data, error } = await supabase.functions.invoke("admin-update-ticket", {
        body: { ticketId, adminNotes: notesValue },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      toast.success("Notes saved");
      setEditingNotesId(null);
      onRefresh();
    } catch (err) {
      console.error("Error saving notes:", err);
      toast.error("Failed to save notes");
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleExpand = (ticketId: string, currentNotes: string | null) => {
    if (expandedId === ticketId) {
      setExpandedId(null);
      setEditingNotesId(null);
    } else {
      setExpandedId(ticketId);
      setNotesValue(currentNotes || "");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No support tickets yet</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>User</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Submitted</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tickets.map((ticket) => (
          <>
            <TableRow
              key={ticket.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => toggleExpand(ticket.id, ticket.admin_notes)}
            >
              <TableCell>
                {expandedId === ticket.id ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </TableCell>
              <TableCell className="font-medium">{ticket.user_email}</TableCell>
              <TableCell className="max-w-[200px] truncate">{ticket.subject}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <Select
                  value={ticket.status}
                  onValueChange={(value) => handleStatusChange(ticket.id, value)}
                  disabled={updatingId === ticket.id}
                >
                  <SelectTrigger className="w-[130px]">
                    {updatingId === ticket.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Badge variant="outline" className={statusColors[ticket.status]}>
                        {statusLabels[ticket.status]}
                      </Badge>
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">
                      <Badge variant="outline" className={statusColors.open}>
                        Open
                      </Badge>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <Badge variant="outline" className={statusColors.in_progress}>
                        In Progress
                      </Badge>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <Badge variant="outline" className={statusColors.resolved}>
                        Resolved
                      </Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
              </TableCell>
            </TableRow>

            {expandedId === ticket.id && (
              <TableRow key={`${ticket.id}-expanded`}>
                <TableCell colSpan={5} className="bg-muted/30">
                  <div className="p-4 space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Issue Description</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">Admin Notes</h4>
                        {editingNotesId !== ticket.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingNotesId(ticket.id);
                              setNotesValue(ticket.admin_notes || "");
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </div>

                      {editingNotesId === ticket.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={notesValue}
                            onChange={(e) => setNotesValue(e.target.value)}
                            placeholder="Add internal notes about this ticket..."
                            className="min-h-[80px]"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleSaveNotes(ticket.id)}
                              disabled={updatingId === ticket.id}
                            >
                              {updatingId === ticket.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Save"
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNotesId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          {ticket.admin_notes || "No notes yet"}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </>
        ))}
      </TableBody>
    </Table>
  );
}
