import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  getNodesBounds,
  getViewportForBounds,
  useReactFlow,
  type Connection,
  type Edge,
  type Node,
  Panel,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { motion } from "framer-motion";
import {
  Zap,
  Plus,
  Undo2,
  Redo2,
  Maximize2,
  FileImage,
  FileText,
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nodeTypes, type NodeCategory } from "@/components/editor/LinkNode";
import { AddNodePanel } from "@/components/editor/AddNodePanel";
import { UpgradeLimitDialog } from "@/components/dashboard/UpgradeLimitDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Default hub node for new maps
const getDefaultNodes = (): Node[] => [
  {
    id: "hub",
    type: "hubNode",
    position: { x: 400, y: 200 },
    data: { label: "My Brand", url: "https://", category: "website" },
  },
];

function MapEditorInner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNewMap = id === "new";
  const [nodes, setNodes, onNodesChange] = useNodesState(getDefaultNodes());
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [backgroundVariant, setBackgroundVariant] = useState<"dots" | "lines" | "cross">("dots");
  const nodeIdCounter = useRef(5);
  const [mapName, setMapName] = useState("Untitled Map");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isNewMap);
  const [mapId, setMapId] = useState<string | null>(isNewMap ? null : id || null);
  
  const { isFreeTier, isPro, limits, canAddNode } = useSubscription();
  const { user } = useAuth();
  const { getNodes } = useReactFlow();

  // Load existing map from database
  useEffect(() => {
    const loadMap = async () => {
      if (isNewMap || !id || id === "new") {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("maps")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error loading map:", error);
          toast.error("Failed to load map");
          navigate("/dashboard");
          return;
        }

        if (data) {
          setMapName(data.name);
          setNodes((data.nodes as unknown) as Node[]);
          setEdges((data.edges as unknown) as Edge[]);
          setMapId(data.id);
          
          // Update node counter based on existing nodes
          const loadedNodes = (data.nodes as unknown) as Node[];
          const maxNodeId = loadedNodes.reduce((max, node) => {
            const match = node.id.match(/node-(\d+)/);
            return match ? Math.max(max, parseInt(match[1])) : max;
          }, 0);
          nodeIdCounter.current = maxNodeId + 1;
        }
      } catch (err) {
        console.error("Error loading map:", err);
        toast.error("Failed to load map");
      } finally {
        setIsLoading(false);
      }
    };

    loadMap();
  }, [id, isNewMap, navigate, setNodes, setEdges]);

  // Generate a shareable URL
  const shareUrl = `${window.location.origin}/view/${mapId || "new"}`;

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true }, eds)
      ),
    [setEdges]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      toast.success("Connection removed");
    },
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

  const handleSave = async () => {
    if (!user) {
      toast.error("Please log in to save your map");
      return;
    }

    setIsSaving(true);
    
    try {
      if (mapId) {
        // Update existing map
        const { error } = await supabase
          .from("maps")
          .update({
            name: mapName,
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
          })
          .eq("id", mapId);

        if (error) throw error;
        
        toast.success("Map saved successfully!", {
          description: `"${mapName}" has been updated.`,
        });
      } else {
        // Create new map
        const { data, error } = await supabase
          .from("maps")
          .insert([{
            user_id: user.id,
            name: mapName,
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Update URL to the new map ID without full reload
        setMapId(data.id);
        navigate(`/editor/${data.id}`, { replace: true });
        
        toast.success("Map saved successfully!", {
          description: `"${mapName}" has been created.`,
        });
      }
    } catch (err) {
      console.error("Error saving map:", err);
      toast.error("Failed to save map", {
        description: "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
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

  const generateImageData = async () => {
    // Find the React Flow viewport element
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
      throw new Error("Could not find map viewport");
    }

    // Get the bounds of all nodes
    const currentNodes = getNodes();
    if (currentNodes.length === 0) {
      throw new Error("No nodes to export");
    }

    const nodesBounds = getNodesBounds(currentNodes);
    const padding = 50;
    const imageWidth = nodesBounds.width + padding * 2;
    const imageHeight = nodesBounds.height + padding * 2;

    // Calculate the viewport transform to fit all nodes
    const transform = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2,
      padding
    );

    // Generate the PNG
    const dataUrl = await toPng(viewport, {
      backgroundColor: "hsl(240, 10%, 4%)", // Match background color
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    });

    return { dataUrl, imageWidth, imageHeight };
  };

  const handleExportPNG = async () => {
    if (isFreeTier) {
      setShowExportDialog(true);
      return;
    }

    setIsExporting(true);
    
    try {
      const { dataUrl } = await generateImageData();

      // Create download link
      const link = document.createElement('a');
      link.download = `${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      link.href = dataUrl;
      link.click();

      toast.success("Map exported successfully!", {
        description: `"${mapName}" has been downloaded as PNG.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export map", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    if (isFreeTier) {
      setShowExportDialog(true);
      return;
    }

    setIsExporting(true);
    
    try {
      const { dataUrl, imageWidth, imageHeight } = await generateImageData();

      // Create PDF with the image
      const orientation = imageWidth > imageHeight ? 'landscape' : 'portrait';
      const pdf = new jsPDF({
        orientation,
        unit: 'px',
        format: [imageWidth, imageHeight],
      });

      // Add the image to the PDF
      pdf.addImage(dataUrl, 'PNG', 0, 0, imageWidth, imageHeight);
      
      // Save the PDF
      pdf.save(`${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.pdf`);

      toast.success("Map exported successfully!", {
        description: `"${mapName}" has been downloaded as PDF.`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export map", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const atNodeLimit = !canAddNode(nodes.length);

  // Show loading state while loading map
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

          {isFreeTier ? (
            <Button variant="ghost" size="sm" onClick={() => setShowExportDialog(true)}>
              <Download className="h-4 w-4 mr-2" />
              Export
              <Lock className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isExporting}>
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {isExporting ? "Exporting..." : "Export"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportPNG}>
                  <FileImage className="h-4 w-4 mr-2" />
                  Export as PNG
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="hero" size="sm" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isSaving ? "Saving..." : "Save"}
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
          onEdgeClick={onEdgeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: "hsl(var(--primary))" },
            animated: true,
          }}
          edgesReconnectable
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={backgroundVariant as BackgroundVariant}
            gap={20}
            size={1}
            color="hsl(var(--border))"
          />
          <Controls
            className="!bg-card !border-border !shadow-lg !left-4 !top-[220px] !bottom-auto [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-secondary"
            showInteractive={false}
            position="top-left"
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

// Wrap with ReactFlowProvider to access useReactFlow hook
export default function MapEditor() {
  return (
    <ReactFlowProvider>
      <MapEditorInner />
    </ReactFlowProvider>
  );
}
