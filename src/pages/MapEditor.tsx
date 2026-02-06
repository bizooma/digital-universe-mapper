import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
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
  Cloud,
  CloudOff,
  HelpCircle,
  ImagePlus,
  FileSpreadsheet,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nodeTypes, type NodeCategory, type LinkNodeData } from "@/components/editor/LinkNode";
import { AddNodePanel } from "@/components/editor/AddNodePanel";
import { EditNodePanel } from "@/components/editor/EditNodePanel";
import { LogoUpload } from "@/components/editor/LogoUpload";
import { CSVImportDialog } from "@/components/editor/CSVImportDialog";
import { URLCrawlerDialog } from "@/components/editor/URLCrawlerDialog";
import { LayoutSwitcher } from "@/components/editor/LayoutSwitcher";
import { MapSettingsDialog, type MapSettings, DEFAULT_SETTINGS } from "@/components/editor/MapSettingsDialog";
import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { UpgradeLimitDialog } from "@/components/dashboard/UpgradeLimitDialog";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { useOnboarding } from "@/hooks/useOnboarding";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const location = useLocation();
  const isNewMap = id === "new";
  
  // Check for template in navigation state
  const templateData = location.state?.template as { nodes: Node[]; edges: Edge[] } | undefined;
  const initialNodes = templateData?.nodes || getDefaultNodes();
  const initialEdges = templateData?.edges || [];
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [upgradeLimitType, setUpgradeLimitType] = useState<"maps" | "nodes" | "feature">("nodes");
  const [upgradeFeatureName, setUpgradeFeatureName] = useState<string | undefined>(undefined);
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
  const [isPublic, setIsPublic] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  
  // Auto-save state
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);
  
  // Pro Plus dialogs
  const [showCSVImportDialog, setShowCSVImportDialog] = useState(false);
  const [showURLCrawlerDialog, setShowURLCrawlerDialog] = useState(false);
  const [showMapSettingsDialog, setShowMapSettingsDialog] = useState(false);
  const [mapSettings, setMapSettings] = useState<MapSettings>(DEFAULT_SETTINGS);
  
  const { isFreeTier, isPro, isProPlus, limits, canAddNode } = useSubscription();
  const { user } = useAuth();
  const { getNodes } = useReactFlow();
  
  // Undo/Redo functionality
  const { canUndo, canRedo, undo, redo, takeSnapshot, reset: resetHistory } = useUndoRedo({ maxHistory: 50 });
  
  // Onboarding tour
  const { isCompleted: onboardingCompleted, isActive: onboardingActive, currentStep, nextStep, prevStep, skipTour, startTour } = useOnboarding();
  
  // Auto-start onboarding tour for new users on new maps
  useEffect(() => {
    if (isNewMap && !onboardingCompleted && !isLoading) {
      // Small delay to let the UI settle
      const timer = setTimeout(() => startTour(), 500);
      return () => clearTimeout(timer);
    }
  }, [isNewMap, onboardingCompleted, isLoading, startTour]);

  // Load existing map from database
  useEffect(() => {
    const loadMap = async () => {
      if (isNewMap || !id || id === "new") {
        setIsLoading(false);
        isInitialLoadRef.current = false;
        // Initialize history for new maps
        resetHistory(getDefaultNodes(), []);
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
          const loadedNodes = (data.nodes as unknown) as Node[];
          const loadedEdges = (data.edges as unknown) as Edge[];
          setNodes(loadedNodes);
          setEdges(loadedEdges);
          setMapId(data.id);
          setIsPublic(data.is_public || false);
          setLogoUrl(data.logo_url || null);
          
          // Initialize history with loaded state
          resetHistory(loadedNodes, loadedEdges);
          
          // Update node counter based on existing nodes
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
        isInitialLoadRef.current = false;
      }
    };

    loadMap();
  }, [id, isNewMap, navigate, setNodes, setEdges, resetHistory]);

  // Auto-save functionality with debounce
  const performAutoSave = useCallback(async () => {
    if (!user || !mapId) return;
    
    setSaveStatus("saving");
    
    try {
      const { error } = await supabase
        .from("maps")
        .update({
          name: mapName,
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
          logo_url: logoUrl,
        })
        .eq("id", mapId);

      if (error) throw error;
      setSaveStatus("saved");
    } catch (err) {
      console.error("Auto-save error:", err);
      setSaveStatus("unsaved");
    }
  }, [user, mapId, mapName, nodes, edges, logoUrl]);

  // Trigger auto-save when nodes or edges change (debounced)
  useEffect(() => {
    // Skip on initial load
    if (isInitialLoadRef.current || isLoading) return;
    
    // Only auto-save if we have a saved map
    if (!mapId) {
      setSaveStatus("unsaved");
      return;
    }

    setSaveStatus("unsaved");
    
    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    // Set new timeout for auto-save (2 seconds)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [nodes, edges, mapId, performAutoSave, isLoading]);

  // Take snapshot for undo/redo when nodes/edges change
  useEffect(() => {
    if (isInitialLoadRef.current || isLoading) return;
    takeSnapshot(nodes, edges);
  }, [nodes, edges, takeSnapshot, isLoading]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;
      
      if (modKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (modKey && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        handleRedo();
      } else if (modKey && e.key === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Sync logo URL with logo node
  useEffect(() => {
    if (isInitialLoadRef.current || isLoading) return;
    
    setNodes((nds) => {
      const existingLogoNode = nds.find((n) => n.type === "logoNode");
      
      if (logoUrl) {
        if (existingLogoNode) {
          // Update existing logo node if data changed
          const currentData = existingLogoNode.data as { logoUrl?: string; brandColor?: string };
          if (currentData.logoUrl !== logoUrl || currentData.brandColor !== mapSettings.primaryColor) {
            return nds.map((node) =>
              node.type === "logoNode"
                ? { ...node, data: { ...node.data, logoUrl, brandColor: mapSettings.primaryColor } }
                : node
            );
          }
          return nds; // No changes needed
        } else {
          // Add new logo node - position in top-left area of canvas
          const newLogoNode: Node = {
            id: "logo-node",
            type: "logoNode",
            position: { x: 50, y: 50 },
            data: { logoUrl, brandColor: mapSettings.primaryColor },
            draggable: true,
            selectable: true,
          };
          return [...nds, newLogoNode];
        }
      } else {
        // Remove logo node if logo URL is cleared
        if (existingLogoNode) {
          return nds.filter((n) => n.type !== "logoNode");
        }
        return nds;
      }
    });
  }, [logoUrl, isLoading, setNodes, mapSettings.primaryColor]);

  // Generate a shareable URL
  const shareUrl = `${window.location.origin}/view/${mapId || "new"}`;

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ 
          ...params, 
          animated: true,
          style: { strokeWidth: 2, stroke: mapSettings.primaryColor },
          type: mapSettings.connectionStyle,
        }, eds)
      ),
    [setEdges, mapSettings.primaryColor, mapSettings.connectionStyle]
  );

  // Update all existing edges and nodes when map settings change
  useEffect(() => {
    if (isInitialLoadRef.current || isLoading) return;
    
    // Update edges with new color and style
    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        style: { ...edge.style, strokeWidth: 2, stroke: mapSettings.primaryColor },
        type: mapSettings.connectionStyle,
      }))
    );
    
    // Update all nodes with brand color and node style
    setNodes((nds) =>
      nds.map((node) => {
        // Don't update logo nodes
        if (node.type === "logoNode") return node;
        
        return {
          ...node,
          data: {
            ...node.data,
            brandColor: mapSettings.primaryColor,
            nodeStyle: mapSettings.nodeStyle,
          },
        };
      })
    );
  }, [mapSettings.primaryColor, mapSettings.connectionStyle, mapSettings.nodeStyle, setEdges, setNodes, isLoading]);

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: Edge) => {
      setEdges((eds) => eds.filter((e) => e.id !== edge.id));
      toast.success("Connection removed");
    },
    [setEdges]
  );

  // Node click handler for editing
  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Don't open edit panel for logo nodes
      if (node.type === "logoNode") return;
      
      setSelectedNode(node);
      setIsEditPanelOpen(true);
    },
    []
  );

  // Handle node save from edit panel
  const handleNodeSave = useCallback(
    (nodeId: string, data: Partial<LinkNodeData>) => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === nodeId
            ? { ...node, data: { ...node.data, ...data } }
            : node
        )
      );
      toast.success("Node updated");
    },
    [setNodes]
  );

  // Handle node delete from edit panel
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));
      setEdges((eds) => eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId));
      toast.success("Node deleted");
    },
    [setNodes, setEdges]
  );

  // Undo handler
  const handleUndo = useCallback(() => {
    const previousState = undo();
    if (previousState) {
      setNodes(previousState.nodes);
      setEdges(previousState.edges);
    }
  }, [undo, setNodes, setEdges]);

  // Redo handler
  const handleRedo = useCallback(() => {
    const nextState = redo();
    if (nextState) {
      setNodes(nextState.nodes);
      setEdges(nextState.edges);
    }
  }, [redo, setNodes, setEdges]);

  const handleOpenAddPanel = () => {
    if (!canAddNode(nodes.length)) {
      setUpgradeLimitType("nodes");
      setUpgradeFeatureName(undefined);
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
        setUpgradeLimitType("nodes");
        setUpgradeFeatureName(undefined);
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
          brandColor: mapSettings.primaryColor,
          nodeStyle: mapSettings.nodeStyle,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [setNodes, nodes.length, canAddNode]
  );

  // Handle bulk import from CSV or URL crawler
  const handleBulkImport = useCallback(
    (importedNodes: { label: string; url: string; category: NodeCategory; platform: string; notes: string }[]) => {
      // Get hub node position for radial layout
      const hubNode = nodes.find(n => n.type === "hubNode");
      const centerX = hubNode?.position.x ?? 400;
      const centerY = hubNode?.position.y ?? 200;
      const baseRadius = 200;
      
      const newNodes: Node[] = importedNodes.map((nodeData, index) => {
        // Calculate radial position
        const angle = (index / importedNodes.length) * 2 * Math.PI - Math.PI / 2;
        const radius = baseRadius + Math.floor(index / 8) * 100; // Expand radius every 8 nodes
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        
        return {
          id: `node-${nodeIdCounter.current++}`,
          type: "linkNode",
          position: { x, y },
          data: {
            label: nodeData.label,
            url: nodeData.url,
            category: nodeData.category,
            platform: nodeData.platform,
            notes: nodeData.notes,
            brandColor: mapSettings.primaryColor,
            nodeStyle: mapSettings.nodeStyle,
          },
        };
      });
      
      setNodes((nds) => [...nds, ...newNodes]);
      
      // Auto-connect to hub if it exists
      if (hubNode) {
        const newEdges: Edge[] = newNodes.map((node) => ({
          id: `edge-${hubNode.id}-${node.id}`,
          source: hubNode.id,
          target: node.id,
          animated: true,
        }));
        setEdges((eds) => [...eds, ...newEdges]);
      }
    },
    [nodes, setNodes, setEdges]
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
    setSaveStatus("saving");
    
    // Clear any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }
    
    try {
      if (mapId) {
        // Update existing map
        const { error } = await supabase
          .from("maps")
          .update({
            name: mapName,
            nodes: JSON.parse(JSON.stringify(nodes)),
            edges: JSON.parse(JSON.stringify(edges)),
            logo_url: logoUrl,
          })
          .eq("id", mapId);

        if (error) throw error;
        
        setSaveStatus("saved");
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
            logo_url: logoUrl,
          }])
          .select()
          .single();

        if (error) throw error;
        
        // Update URL to the new map ID without full reload
        setMapId(data.id);
        navigate(`/editor/${data.id}`, { replace: true });
        
        setSaveStatus("saved");
        toast.success("Map saved successfully!", {
          description: `"${mapName}" has been created.`,
        });
      }
    } catch (err) {
      console.error("Error saving map:", err);
      setSaveStatus("unsaved");
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
      backgroundColor: "#ffffff", // White background for exports
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

  // Add watermark to image for free tier users
  const addWatermark = async (dataUrl: string, imageWidth: number, imageHeight: number): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = imageWidth;
        canvas.height = imageHeight;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        // Draw the original image
        ctx.drawImage(img, 0, 0, imageWidth, imageHeight);

        // Calculate watermark size based on image dimensions
        const fontSize = Math.max(16, Math.min(imageWidth, imageHeight) * 0.04);
        const padding = fontSize * 0.8;

        // Set up watermark style
        ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        const text = 'Made with Mapprr.com';
        const textMetrics = ctx.measureText(text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;

        // Position in bottom-right corner
        const x = imageWidth - padding;
        const y = imageHeight - padding;

        // Draw semi-transparent background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        const bgPadding = fontSize * 0.3;
        ctx.beginPath();
        ctx.roundRect(
          x - textWidth - bgPadding,
          y - textHeight - bgPadding,
          textWidth + bgPadding * 2,
          textHeight + bgPadding * 2,
          fontSize * 0.2
        );
        ctx.fill();

        // Draw text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, x, y);

        resolve(canvas.toDataURL('image/png'));
      };
      img.src = dataUrl;
    });
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    
    try {
      const { dataUrl, imageWidth, imageHeight } = await generateImageData();

      // Add watermark for free tier users
      const finalDataUrl = isFreeTier 
        ? await addWatermark(dataUrl, imageWidth, imageHeight) 
        : dataUrl;

      // Create download link
      const link = document.createElement('a');
      link.download = `${mapName.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.png`;
      link.href = finalDataUrl;
      link.click();

      toast.success("Map exported successfully!", {
        description: isFreeTier 
          ? `"${mapName}" has been downloaded with Mapprr watermark.`
          : `"${mapName}" has been downloaded as PNG.`,
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
              {isPublic 
                ? "Anyone with this link can view your map."
                : "Make your map public to share it with others."}
            </DialogDescription>
          </DialogHeader>
          
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="space-y-0.5">
              <Label htmlFor="public-toggle" className="text-base font-medium">
                Public Map
              </Label>
              <p className="text-sm text-muted-foreground">
                {isPublic ? "Anyone can view this map" : "Only you can see this map"}
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              disabled={!mapId || isTogglingPublic}
              onCheckedChange={async (checked) => {
                if (!mapId) {
                  toast.error("Save your map first to enable sharing");
                  return;
                }
                
                setIsTogglingPublic(true);
                try {
                  const { error } = await supabase
                    .from("maps")
                    .update({ is_public: checked })
                    .eq("id", mapId);
                    
                  if (error) throw error;
                  
                  setIsPublic(checked);
                  toast.success(checked ? "Map is now public!" : "Map is now private");
                } catch (err) {
                  console.error("Error updating visibility:", err);
                  toast.error("Failed to update visibility");
                } finally {
                  setIsTogglingPublic(false);
                }
              }}
            />
          </div>
          
          {/* Share URL */}
          {isPublic && (
            <>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={shareUrl}
                  className="flex-1"
                />
                <Button onClick={handleCopyLink} size="icon" variant="outline">
                  {copied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {/* Social sharing buttons */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    window.open(
                      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Check out my digital presence map "${mapName}" on LinkScape!`)}`,
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
            </>
          )}
          
          {!mapId && (
            <p className="text-xs text-muted-foreground">
              Save your map first to enable sharing.
            </p>
          )}
          
          {isFreeTier && mapId && (
            <p className="text-xs text-muted-foreground">
              <Crown className="h-3 w-3 inline mr-1" />
              Upgrade to Pro for a custom shareable URL
            </p>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Upgrade Dialog - for PDF export */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Upgrade for PDF Export
            </DialogTitle>
            <DialogDescription>
              PDF export and watermark-free exports are available on Pro plans.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-secondary/50 border border-border">
              <h4 className="font-medium text-foreground mb-2">Pro includes:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• PDF export</li>
                <li>• No watermark on exports</li>
                <li>• Unlimited maps & nodes</li>
                <li>• Custom branding</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">Tip:</span> You can export PNG for free – it will include a small Mapprr watermark.
            </p>
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
        limitType={upgradeLimitType}
        currentCount={nodes.length}
        maxCount={limits.maxNodesPerMap}
        featureName={upgradeFeatureName}
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
          
          {/* Auto-save status indicator */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors ${
                  saveStatus === "saved" 
                    ? "bg-green-500/10 text-green-500" 
                    : saveStatus === "saving"
                    ? "bg-primary/10 text-primary"
                    : "bg-orange-500/10 text-orange-500"
                }`}>
                  {saveStatus === "saved" ? (
                    <>
                      <Cloud className="h-3 w-3" />
                      <span>Saved</span>
                    </>
                  ) : saveStatus === "saving" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="h-3 w-3" />
                      <span>Unsaved</span>
                    </>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {saveStatus === "saved" 
                  ? "All changes saved" 
                  : saveStatus === "saving"
                  ? "Saving changes..."
                  : mapId ? "Changes will auto-save" : "Save to enable auto-save"}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
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
          <TooltipProvider>
            <div className="flex items-center gap-1 mr-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className={!canUndo ? "opacity-50" : ""}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon-sm" 
                    onClick={handleRedo}
                    disabled={!canRedo}
                    className={!canRedo ? "opacity-50" : ""}
                  >
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

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
          <Button variant="ghost" size="sm" onClick={handleShare} data-onboarding="share-button">
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
          
          {/* Help/Tour button */}
          <Button variant="ghost" size="icon-sm" onClick={startTour} title="Start Tour">
            <HelpCircle className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Main Canvas */}
      <div className="flex-1 relative" data-onboarding="canvas">
        
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onEdgeClick={onEdgeClick}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: mapSettings.primaryColor },
            animated: true,
            type: mapSettings.connectionStyle,
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
            className="!bg-card !border-border !shadow-lg !left-[72px] !top-4 !bottom-auto [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-secondary"
            showInteractive={false}
            position="top-left"
          />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor="hsl(var(--primary))"
            maskColor="hsl(var(--background) / 0.8)"
          />

          {/* Left Toolbar Panel */}
          <Panel position="top-left" className="!m-4" data-onboarding="toolbar">
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
                data-onboarding="add-node"
              >
                {atNodeLimit ? <Lock className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </Button>
              <div className="h-px bg-border" />
              {/* Pro Plus: CSV Import */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (!isProPlus) {
                          setUpgradeLimitType("feature");
                          setUpgradeFeatureName("CSV Import");
                          setShowUpgradeDialog(true);
                        } else {
                          setShowCSVImportDialog(true);
                        }
                      }}
                      title="Import CSV"
                      className="relative"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      {!isProPlus && <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isProPlus ? "Import from CSV" : "CSV Import (Pro Plus)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {/* Pro Plus: URL Crawler */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (!isProPlus) {
                          setUpgradeLimitType("feature");
                          setUpgradeFeatureName("URL Crawler");
                          setShowUpgradeDialog(true);
                        } else {
                          setShowURLCrawlerDialog(true);
                        }
                      }}
                      title="URL Crawler"
                      className="relative"
                    >
                      <Globe className="h-4 w-4" />
                      {!isProPlus && <Lock className="h-2.5 w-2.5 absolute -bottom-0.5 -right-0.5 text-muted-foreground" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {isProPlus ? "URL Crawler" : "URL Crawler (Pro Plus)"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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
              <LayoutSwitcher
                nodes={nodes}
                edges={edges}
                onLayoutChange={(newNodes, newEdges) => {
                  setNodes(newNodes);
                  setEdges(newEdges);
                  toast.success("Layout applied");
                }}
              />
              <div className="h-px bg-border" />
              <LogoUpload
                mapId={mapId}
                logoUrl={logoUrl}
                onLogoChange={setLogoUrl}
                isPro={isPro}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                title="Map Settings"
                onClick={() => setShowMapSettingsDialog(true)}
              >
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

        {/* Edit Node Panel */}
        <EditNodePanel
          isOpen={isEditPanelOpen}
          node={selectedNode}
          onClose={() => {
            setIsEditPanelOpen(false);
            setSelectedNode(null);
          }}
          onSave={handleNodeSave}
          onDelete={handleNodeDelete}
        />
      </div>
      
      {/* Onboarding Tour */}
      <OnboardingTour
        isActive={onboardingActive}
        currentStep={currentStep}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipTour}
      />
      
      {/* Pro Plus: CSV Import Dialog */}
      <CSVImportDialog
        open={showCSVImportDialog}
        onOpenChange={setShowCSVImportDialog}
        onImport={handleBulkImport}
      />
      
      {/* Pro Plus: URL Crawler Dialog */}
      <URLCrawlerDialog
        open={showURLCrawlerDialog}
        onOpenChange={setShowURLCrawlerDialog}
        onImport={handleBulkImport}
      />
      
      {/* Map Settings Dialog */}
      <MapSettingsDialog
        open={showMapSettingsDialog}
        onOpenChange={setShowMapSettingsDialog}
        settings={mapSettings}
        onSettingsChange={setMapSettings}
      />
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
