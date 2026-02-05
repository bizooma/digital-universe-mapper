import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Link2, 
  Mail, 
  ShoppingBag,
  FileText,
  X,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { NodeCategory, LinkNodeData } from "./LinkNode";
import type { Node } from "@xyflow/react";

interface EditNodePanelProps {
  isOpen: boolean;
  node: Node | null;
  onClose: () => void;
  onSave: (nodeId: string, data: Partial<LinkNodeData>) => void;
  onDelete: (nodeId: string) => void;
}

const categoryIcons: Record<NodeCategory, React.ElementType> = {
  website: Globe,
  social: Twitter,
  link: Link2,
  email: Mail,
  ecommerce: ShoppingBag,
  content: FileText,
  bbb: Globe,
  directories: Globe,
};

const platformIcons: Record<string, React.ElementType> = {
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  default: Globe,
};

export function EditNodePanel({ isOpen, node, onClose, onSave, onDelete }: EditNodePanelProps) {
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Update form when node changes
  useEffect(() => {
    if (node) {
      const data = node.data as LinkNodeData;
      setLabel(data.label || "");
      setUrl(data.url || "");
      setNotes(data.notes || "");
    }
  }, [node]);

  const handleClose = () => {
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!node || !label) return;

    onSave(node.id, {
      label,
      url,
      notes,
    });
    handleClose();
  };

  const handleDelete = () => {
    if (!node) return;
    onDelete(node.id);
    setShowDeleteConfirm(false);
    handleClose();
  };

  if (!node) return null;

  const nodeData = node.data as LinkNodeData;
  const isHubNode = node.type === "hubNode";
  const CategoryIcon = categoryIcons[nodeData.category] || Globe;
  const PlatformIcon = platformIcons[nodeData.platform?.toLowerCase() || ""] || platformIcons.default;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/50 backdrop-blur-sm z-40"
              onClick={handleClose}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 shadow-2xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {isHubNode ? (
                        <Globe className="h-5 w-5 text-primary" />
                      ) : (
                        <PlatformIcon className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">
                        Edit {isHubNode ? "Hub" : "Node"}
                      </h2>
                      <p className="text-sm text-muted-foreground capitalize">
                        {nodeData.category}
                        {nodeData.platform && ` · ${nodeData.platform}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-label">Display Name</Label>
                      <Input
                        id="edit-label"
                        value={label}
                        onChange={(e) => setLabel(e.target.value)}
                        placeholder="e.g., My Website"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-url">URL</Label>
                      <Input
                        id="edit-url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-notes">Notes (optional)</Label>
                      <Textarea
                        id="edit-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any notes..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="submit" variant="hero" className="flex-1">
                        Save Changes
                      </Button>
                    </div>

                    {!isHubNode && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Node
                      </Button>
                    )}
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this node?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{nodeData.label}" from your map. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
