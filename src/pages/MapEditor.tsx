import { useState, useCallback, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
  type Node,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion } from "framer-motion";
import {
  Zap,
  Plus,
  Undo2,
  Redo2,
  Maximize2,
  Download,
  Share2,
  Settings,
  ChevronLeft,
  Grid,
  Circle,
  LayoutGrid,
  Save,
  Lock,
  Check,
  Copy,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nodeTypes, type NodeCategory } from "@/components/editor/LinkNode";
import { AddNodePanel } from "@/components/editor/AddNodePanel";
import { UpgradeLimitDialog } from "@/components/dashboard/UpgradeLimitDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

// Start with empty canvas - just a central hub node for new maps
const getInitialNodes = (isNewMap: boolean): Node[] => {
  if (isNewMap) {
    return [
      {
        id: "hub",
        type: "hubNode",
        position: { x: 400, y: 200 },
        data: { label: "My Brand", url: "https://", category: "website" },
      },
    ];
  }
  // For existing maps, this would be loaded from database
  return [
    {
      id: "hub",
      type: "hubNode",
      position: { x: 400, y: 200 },
      data: { label: "My Brand", url: "https://", category: "website" },
    },
  ];
};

const getInitialEdges = (): Edge[] => {
  return [];
};

export default function MapEditor() {
  const { id } = useParams();
  const isNewMap = id === "new";
  const [nodes, setNodes, onNodesChange] = useNodesState(getInitialNodes(isNewMap));
  const [edges, setEdges, onEdgesChange] = useEdgesState(getInitialEdges());
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [backgroundVariant, setBackgroundVariant] = useState<"dots" | "lines" | "cross">("dots");
  const nodeIdCounter = useRef(5);
  const [mapName, setMapName] = useState(isNewMap ? "Untitled Map" : "Personal Brand");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { isFreeTier, isPro, limits, canAddNode } = useSubscription();

  // Generate a shareable URL (in production this would be a real permalink)
  const shareUrl = `${window.location.origin}/view/${id || "new"}`;

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true }, eds)
      ),
    [setEdges]
  );

  const handleOpenAddPanel = () => {
    if (!canAddNode(nodes.length)) {
      setShowUpgradeDialog(true);
      return;
    }
    setIsAddPanelOpen(true);
  };

  const handleAddNode = useCallback(
    (nodeData: {
      label: string;
      url: string;
      category: NodeCategory;
      platform: string;
      notes: string;
    }) => {
      // Double-check limit before adding
      if (!canAddNode(nodes.length)) {
        setShowUpgradeDialog(true);
        return;
      }

      const newNode: Node = {
        id: `node-${nodeIdCounter.current++}`,
        type: "linkNode",
        position: { x: 300 + Math.random() * 200, y: 200 + Math.random() * 200 },
        data: {
          label: nodeData.label,
          url: nodeData.url,
          category: nodeData.category,
          platform: nodeData.platform,
          notes: nodeData.notes,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, nodes.length, canAddNode]
  );

  const cycleBackground = () => {
    const variants: ("dots" | "lines" | "cross")[] = ["dots", "lines", "cross"];
    const currentIndex = variants.indexOf(backgroundVariant);
    setBackgroundVariant(variants[(currentIndex + 1) % variants.length]);
  };

  const handleSave = () => {
    // In production, this would save to the database
    toast.success("Map saved successfully!", {
      description: `"${mapName}" has been saved.`,
    });
  };

  const handleShare = () => {
    setShowShareDialog(true);
  };

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

  const handleExport = () => {
    if (isFreeTier) {
      setShowExportDialog(true);
    } else {
      // In production, this would trigger the actual export
      toast.success("Exporting map...", {
        description: "Your PNG will download shortly.",
      });
    }
  };

  const atNodeLimit = !canAddNode(nodes.length);

  return (
    <div className="h-screen w-screen bg-background flex flex-col">
      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share your map</DialogTitle>
            <DialogDescription>
              Anyone with this link can view your map.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={shareUrl}
              className="flex-1"
            />
            <Button onClick={handleCopyLink} size="icon" variant="outline">
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isFreeTier && (
            <p className="text-xs text-muted-foreground mt-2">
              <Crown className="h-3 w-3 inline mr-1" />
              Upgrade to Pro for a custom shareable URL
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Upgrade Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade to Export
            </DialogTitle>
            <DialogDescription>
              Export features are available on Pro and Team plans.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-2">Pro includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PNG export (high resolution)</li>
                <li>• PDF export</li>
                <li>• No watermark</li>
                <li>• Unlimited maps & nodes</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(false)} className="flex-1">
                Maybe Later
              </Button>
              <Button variant="hero" asChild className="flex-1">
                <Link to="/pricing">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade Now
                </Link>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <UpgradeLimitDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        limitType="nodes"
        currentCount={nodes.length}
        maxCount={limits.maxNodesPerMap}
      />

      {/* Top Toolbar */}
      <header className="h-14 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 z-20">
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
            <input
              type="text"
              value={mapName}
              onChange={(e) => setMapName(e.target.value)}
              className="bg-transparent border-none text-foreground font-medium focus:outline-none focus:ring-0 w-auto"
            />
          </div>
          
          {/* Node count indicator for free tier */}
          {isFreeTier && (
            <div className={`text-xs px-2 py-1 rounded-full ${
              atNodeLimit 
                ? "bg-destructive/10 text-destructive" 
                : "bg-secondary text-muted-foreground"
            }`}>
              {nodes.length}/{limits.maxNodesPerMap} nodes
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 mr-2">
            <Button variant="ghost" size="icon-sm" title="Undo">
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" title="Redo">
              <Redo2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="h-6 w-px bg-border mx-2" />

          <Button variant="ghost" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
            {isFreeTier && <Lock className="h-3 w-3 ml-1 opacity-50" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="hero" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </header>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: "hsl(var(--primary))" },
            animated: true,
          }}
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={backgroundVariant as BackgroundVariant}
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

          {/* Left Toolbar Panel */}
          <Panel position="top-left" className="!m-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex flex-col gap-2 bg-card border border-border rounded-xl p-2 shadow-lg"
            >
              <Button
                variant={atNodeLimit ? "outline" : "hero"}
                size="icon"
                onClick={handleOpenAddPanel}
                title={atNodeLimit ? "Node limit reached - Upgrade to add more" : "Add Node"}
              >
                {atNodeLimit ? <Lock className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </Button>
              <div className="h-px bg-border" />
              <Button
                variant="ghost"
                size="icon"
                onClick={cycleBackground}
                title="Toggle Background"
              >
                {backgroundVariant === "dots" ? (
                  <Circle className="h-4 w-4" />
                ) : backgroundVariant === "lines" ? (
                  <Grid className="h-4 w-4" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" title="Auto Layout">
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" title="Settings">
                <Settings className="h-4 w-4" />
              </Button>
            </motion.div>
          </Panel>

          {/* Quick Stats */}
          <Panel position="bottom-left" className="!m-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 bg-card/80 backdrop-blur-xl border border-border rounded-xl px-4 py-2 shadow-lg text-sm"
            >
              <span className="text-muted-foreground">
                <span className={`font-medium ${atNodeLimit ? "text-destructive" : "text-foreground"}`}>
                  {nodes.length}
                </span>
                {isFreeTier && <span className="text-muted-foreground">/{limits.maxNodesPerMap}</span>} nodes
              </span>
              <span className="text-muted-foreground">
                <span className="font-medium text-foreground">{edges.length}</span> connections
              </span>
            </motion.div>
          </Panel>
        </ReactFlow>

        {/* Add Node Panel */}
        <AddNodePanel
          isOpen={isAddPanelOpen}
          onClose={() => setIsAddPanelOpen(false)}
          onAdd={handleAddNode}
        />
      </div>
    </div>
  );
}
