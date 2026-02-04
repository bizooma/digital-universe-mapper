import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  type Edge,
  type Node,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import { Zap, Share2, Copy, Check, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { nodeTypes } from "@/components/editor/LinkNode";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

function PublicMapViewInner() {
  const { id } = useParams();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [mapName, setMapName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = window.location.href;

  useEffect(() => {
    const loadMap = async () => {
      if (!id) {
        setError("Map not found");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fetchError } = await supabase
          .from("maps")
          .select("*")
          .eq("id", id)
          .eq("is_public", true)
          .single();

        if (fetchError || !data) {
          console.error("Error loading map:", fetchError);
          setError("This map is private or doesn't exist");
          setIsLoading(false);
          return;
        }

        setMapName(data.name);
        setNodes((data.nodes as unknown) as Node[]);
        setEdges((data.edges as unknown) as Edge[]);
      } catch (err) {
        console.error("Error loading map:", err);
        setError("Failed to load map");
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, [id]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  // Handle node click to open URL in new tab
  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    const url = node.data?.url as string;
    if (url && url !== "https://") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <ExternalLink className="h-8 w-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{error}</h1>
          <p className="text-muted-foreground max-w-md">
            The map you're looking for might be private or has been removed.
          </p>
          <Button asChild variant="outline">
            <Link to="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share this map</DialogTitle>
            <DialogDescription>
              Share this link with anyone to show them this map.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={shareUrl} className="flex-1" />
            <Button onClick={handleCopyLink} size="icon" variant="outline">
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                window.open(
                  `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out ${mapName} on LinkScape!`)}`,
                  "_blank"
                );
              }}
            >
              Share on X
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                window.open(
                  `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
                  "_blank"
                );
              }}
            >
              Share on LinkedIn
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <header className="h-14 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-primary p-1.5 rounded-lg">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">LinkScape</span>
          </Link>
          <div className="h-6 w-px bg-border" />
          <span className="font-medium text-foreground">{mapName}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowShareDialog(true)}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="hero" size="sm" asChild>
            <Link to="/signup">Create Your Own</Link>
          </Button>
        </div>
      </header>

      {/* Main Canvas - Read Only */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          className="bg-background"
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: "hsl(var(--primary))" },
            animated: true,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--border))"
          />
          <Controls
            className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-secondary"
            showInteractive={false}
          />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--background) / 0.8)"
          />

          {/* Click hint */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-card/80 backdrop-blur-xl border border-border rounded-xl px-4 py-2 shadow-lg text-sm text-muted-foreground"
          >
            Click any node to visit the link
          </motion.div>
        </ReactFlow>
      </div>

      {/* Branding footer */}
      <div className="absolute bottom-4 right-4 z-10">
        <Link
          to="/"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-card/80 backdrop-blur-xl border border-border rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Zap className="h-3 w-3" />
          Made with LinkScape
        </Link>
      </div>
    </div>
  );
}

export default function PublicMapView() {
  return (
    <ReactFlowProvider>
      <PublicMapViewInner />
    </ReactFlowProvider>
  );
}
