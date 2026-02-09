import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Globe, Loader2, AlertCircle, Check, ExternalLink, Lock, Sparkles, Network, GitBranch } from "lucide-react";
import { mapTemplates, type MapTemplate } from "@/data/mapTemplates";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { MapThumbnail } from "./MapThumbnail";
import { useSubscription } from "@/hooks/useSubscription";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { firecrawlApi } from "@/lib/api/firecrawl";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Node, Edge } from "@xyflow/react";

interface TemplateSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (template: MapTemplate) => void;
}

interface DiscoveredURL {
  url: string;
  label: string;
  selected: boolean;
}

type LayoutMode = 'radial' | 'hierarchical';

// Generate label from URL path
function getLabelFromURL(url: string): string {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname.replace(/\/$/, "");
    if (!path || path === "/") {
      return parsed.hostname.replace("www.", "");
    }
    const segments = path.split("/").filter(Boolean);
    const lastSegment = segments[segments.length - 1];
    return lastSegment
      .replace(/[-_]/g, " ")
      .replace(/\.\w+$/, "")
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } catch {
    return url;
  }
}

// Get URL path segments for hierarchy
function getPathSegments(url: string): string[] {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean);
  } catch {
    return [];
  }
}

// Create radial layout - all nodes around hub
function createRadialLayout(urls: DiscoveredURL[], siteUrl: string): { nodes: Node[]; edges: Edge[] } {
  const hubLabel = getLabelFromURL(siteUrl);
  const selectedUrls = urls.filter(u => u.selected);
  
  const nodes: Node[] = [
    {
      id: "hub",
      type: "logo",
      position: { x: 0, y: 0 },
      data: { label: hubLabel, isHub: true },
    },
  ];

  const edges: Edge[] = [];

  const radius = 200;
  const angleStep = (2 * Math.PI) / Math.max(selectedUrls.length, 1);

  selectedUrls.forEach((url, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    const nodeId = `node-${index}`;

    nodes.push({
      id: nodeId,
      type: "link",
      position: { x, y },
      data: {
        label: url.label,
        url: url.url,
        category: "website",
        platform: "website",
        notes: "",
      },
    });

    edges.push({
      id: `edge-hub-${nodeId}`,
      source: "hub",
      target: nodeId,
      type: "smoothstep",
    });
  });

  return { nodes, edges };
}

// Create hierarchical tree layout based on URL paths
function createHierarchicalLayout(urls: DiscoveredURL[], siteUrl: string): { nodes: Node[]; edges: Edge[] } {
  const hubLabel = getLabelFromURL(siteUrl);
  const selectedUrls = urls.filter(u => u.selected);
  
  // Build tree structure from URLs
  interface TreeNode {
    url: string;
    label: string;
    path: string;
    children: TreeNode[];
    nodeId?: string;
  }

  const root: TreeNode = {
    url: siteUrl,
    label: hubLabel,
    path: "",
    children: [],
  };

  // Map paths to nodes for parent lookup
  const pathMap = new Map<string, TreeNode>();
  pathMap.set("", root);

  // Sort URLs by path depth (shorter first)
  const sortedUrls = [...selectedUrls].sort((a, b) => {
    const aSegments = getPathSegments(a.url).length;
    const bSegments = getPathSegments(b.url).length;
    return aSegments - bSegments;
  });

  // Build tree with intermediate directory nodes
  sortedUrls.forEach(urlData => {
    const segments = getPathSegments(urlData.url);
    if (segments.length === 0) return; // Skip root URLs
    
    const fullPath = segments.join("/");
    if (pathMap.has(fullPath)) return; // Already exists
    
    // Ensure all intermediate paths exist
    for (let i = 1; i < segments.length; i++) {
      const intermediatePath = segments.slice(0, i).join("/");
      if (!pathMap.has(intermediatePath)) {
        // Find parent for this intermediate node
        const parentPath = i === 1 ? "" : segments.slice(0, i - 1).join("/");
        const parent = pathMap.get(parentPath) || root;
        
        const parsedUrl = new URL(urlData.url);
        const intermediateUrl = `${parsedUrl.origin}/${intermediatePath}`;
        const intermediateNode: TreeNode = {
          url: intermediateUrl,
          label: segments[i - 1]
            .replace(/[-_]/g, " ")
            .replace(/\.\w+$/, "")
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" "),
          path: intermediatePath,
          children: [],
        };
        parent.children.push(intermediateNode);
        pathMap.set(intermediatePath, intermediateNode);
      }
    }
    
    // Now add the actual node under its direct parent
    const parentPath = segments.length === 1 ? "" : segments.slice(0, -1).join("/");
    const parent = pathMap.get(parentPath) || root;
    const newNode: TreeNode = {
      url: urlData.url,
      label: urlData.label,
      path: fullPath,
      children: [],
    };
    parent.children.push(newNode);
    pathMap.set(fullPath, newNode);
  });

  // Layout constants
  const levelHeight = 120;
  const nodeWidth = 180;
  const nodeSpacing = 40;

  // Calculate positions using tree traversal
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Calculate subtree widths
  function getSubtreeWidth(node: TreeNode): number {
    if (node.children.length === 0) return nodeWidth;
    return node.children.reduce((sum, child) => sum + getSubtreeWidth(child), 0) + 
           (node.children.length - 1) * nodeSpacing;
  }

  // Position nodes
  let nodeIndex = 0;
  function positionNode(node: TreeNode, x: number, y: number, isRoot: boolean): string {
    const nodeId = isRoot ? "hub" : `node-${nodeIndex++}`;
    node.nodeId = nodeId;

    nodes.push({
      id: nodeId,
      type: isRoot ? "logo" : "link",
      position: { x, y },
      data: isRoot 
        ? { label: node.label, isHub: true }
        : {
            label: node.label,
            url: node.url,
            category: "website",
            platform: "website",
            notes: "",
          },
    });

    // Position children
    if (node.children.length > 0) {
      const totalWidth = getSubtreeWidth(node);
      let currentX = x - totalWidth / 2;

      node.children.forEach(child => {
        const childWidth = getSubtreeWidth(child);
        const childX = currentX + childWidth / 2;
        const childNodeId = positionNode(child, childX, y + levelHeight, false);
        
        edges.push({
          id: `edge-${nodeId}-${childNodeId}`,
          source: nodeId,
          target: childNodeId,
          type: "smoothstep",
        });

        currentX += childWidth + nodeSpacing;
      });
    }

    return nodeId;
  }

  positionNode(root, 0, 0, true);

  return { nodes, edges };
}

// Create nodes and edges from URLs based on layout mode
function createMapFromUrls(urls: DiscoveredURL[], siteUrl: string, layoutMode: LayoutMode): { nodes: Node[]; edges: Edge[] } {
  if (layoutMode === 'hierarchical') {
    return createHierarchicalLayout(urls, siteUrl);
  }
  return createRadialLayout(urls, siteUrl);
}

export function TemplateSelector({ open, onOpenChange, onSelect }: TemplateSelectorProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProPlus, createCheckout } = useSubscription();
  
  // URL Crawler state
  const [showUrlCrawler, setShowUrlCrawler] = useState(false);
  const [inputUrl, setInputUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingMap, setIsCreatingMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredURL[]>([]);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('hierarchical');

  const handleUrlCrawlerClick = () => {
    if (!isProPlus) {
      // Show upgrade toast
      toast.error("Map from URL requires Pro Plus", {
        description: "Upgrade to Pro Plus to automatically map websites.",
        action: {
          label: "Upgrade",
          onClick: () => {
            onOpenChange(false);
            navigate("/pricing");
          },
        },
      });
      return;
    }
    setShowUrlCrawler(true);
  };

  const handleCrawl = async () => {
    if (!inputUrl.trim()) {
      setError("Please enter a URL");
      return;
    }

    setError(null);
    setIsLoading(true);
    setDiscoveredUrls([]);

    try {
      const result = await firecrawlApi.map(inputUrl, { limit: 50 });

      if (!result.success) {
        setError(result.error || "Failed to crawl website");
        return;
      }

      const urls = result.links || [];
      if (urls.length === 0) {
        setError("No pages found on this website");
        return;
      }

      const discovered: DiscoveredURL[] = urls.map((url: string) => ({
        url,
        label: getLabelFromURL(url),
        selected: true,
      }));

      setDiscoveredUrls(discovered);
    } catch (err) {
      console.error("Crawl error:", err);
      setError(err instanceof Error ? err.message : "Failed to crawl website");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleUrl = (index: number) => {
    setDiscoveredUrls(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const toggleAll = (selected: boolean) => {
    setDiscoveredUrls(prev => prev.map(item => ({ ...item, selected })));
  };

  const handleCreateMap = async () => {
    const selected = discoveredUrls.filter(u => u.selected);
    if (selected.length === 0) {
      toast.error("Please select at least one page");
      return;
    }

    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    setIsCreatingMap(true);

    try {
      // Create nodes and edges
      const { nodes, edges } = createMapFromUrls(discoveredUrls, inputUrl, layoutMode);

      // Save map to database
      const { data: newMap, error: insertError } = await supabase
        .from("maps")
        .insert([{
          user_id: user.id,
          name: getLabelFromURL(inputUrl),
          nodes: JSON.parse(JSON.stringify(nodes)),
          edges: JSON.parse(JSON.stringify(edges)),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success(`Created map with ${selected.length} pages`);
      handleClose();
      navigate(`/editor/${newMap.id}`);
    } catch (err) {
      console.error("Error creating map:", err);
      toast.error("Failed to create map");
    } finally {
      setIsCreatingMap(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowUrlCrawler(false);
    setDiscoveredUrls([]);
    setInputUrl("");
    setError(null);
    setLayoutMode('hierarchical');
  };

  const handleBack = () => {
    setShowUrlCrawler(false);
    setDiscoveredUrls([]);
    setInputUrl("");
    setError(null);
    setLayoutMode('hierarchical');
  };

  const selectedCount = discoveredUrls.filter(u => u.selected).length;

  // URL Crawler view
  if (showUrlCrawler) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-xl w-[calc(100%-2rem)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Map from URL
            </DialogTitle>
            <DialogDescription>
              Enter a website URL to discover and map all its pages.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                placeholder="https://example.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCrawl()}
                disabled={isLoading}
              />
              <Button onClick={handleCrawl} disabled={isLoading || !inputUrl.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Scan"
                )}
              </Button>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-muted-foreground">Discovering pages...</p>
                </div>
              </div>
            )}

            {/* Results */}
            {discoveredUrls.length > 0 && !isLoading && (
              <div className="space-y-4">
                {/* Layout Toggle */}
                <div className="rounded-lg bg-secondary/50 border border-border p-3">
                  <Label className="text-sm font-medium mb-3 block">Layout Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setLayoutMode('radial')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        layoutMode === 'radial'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Network className="h-4 w-4 flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium">Radial</p>
                        <p className="text-xs opacity-70">Hub in center</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setLayoutMode('hierarchical')}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                        layoutMode === 'hierarchical'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-background hover:bg-secondary/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <GitBranch className="h-4 w-4 flex-shrink-0" />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium">Site Structure</p>
                        <p className="text-xs opacity-70">Tree layout</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Page Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {selectedCount} of {discoveredUrls.length} pages selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAll(true)}
                        className="h-6 text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAll(false)}
                        className="h-6 text-xs"
                      >
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-52 rounded-lg border border-border">
                    <div className="p-2 space-y-1">
                      {discoveredUrls.map((item, idx) => (
                        <div
                          key={idx}
                          className={`flex items-center gap-3 p-2 rounded transition-colors cursor-pointer hover:bg-secondary/50 ${
                            item.selected ? "bg-secondary/30" : ""
                          }`}
                          onClick={() => toggleUrl(idx)}
                        >
                          <Checkbox
                            checked={item.selected}
                            onCheckedChange={() => toggleUrl(idx)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.label}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.url}</p>
                          </div>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" onClick={handleBack} className="flex-1">
                Back
              </Button>
              {discoveredUrls.length > 0 && !isLoading && (
                <Button
                  variant="hero"
                  onClick={handleCreateMap}
                  disabled={selectedCount === 0 || isCreatingMap}
                  className="flex-1"
                >
                  {isCreatingMap ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>Create Map {selectedCount > 0 && `(${selectedCount})`}</>
                  )}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Template selection view
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Choose a Template</DialogTitle>
          <DialogDescription>
            Start with a pre-built layout or create from scratch
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Map from URL Option */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            onClick={handleUrlCrawlerClick}
            className={`group text-left rounded-xl border overflow-hidden col-span-1 sm:col-span-2 ${
              isProPlus 
                ? "border-primary/50 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/10 hover:to-accent/10" 
                : "border-border bg-card hover:bg-secondary/30"
            } transition-all`}
          >
            <div className="p-4 flex items-center gap-4">
              <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                isProPlus 
                  ? "bg-gradient-to-br from-primary to-accent" 
                  : "bg-secondary"
              }`}>
                <Globe className={`h-6 w-6 ${isProPlus ? "text-primary-foreground" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    Map from URL
                  </h3>
                  {!isProPlus && (
                    <Badge variant="outline" className="gap-1 text-xs bg-primary/10 text-primary border-primary/20">
                      <Sparkles className="h-3 w-3" />
                      Pro Plus
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Automatically discover and map all pages from any website
                </p>
              </div>
              {!isProPlus && (
                <Lock className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </motion.button>

          {/* Regular Templates */}
          {mapTemplates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 1) * 0.05 }}
              onClick={() => onSelect(template)}
              className="group text-left rounded-xl border border-border bg-card hover:border-primary/50 hover:bg-secondary/50 transition-all overflow-hidden"
            >
              {/* Preview */}
              <div className="h-24 relative">
                <MapThumbnail 
                  nodes={template.nodes} 
                  edges={template.edges}
                  width={320}
                  height={96}
                />
              </div>
              
              {/* Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{template.icon}</span>
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {template.nodes.length} nodes • {template.edges.length} connections
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
