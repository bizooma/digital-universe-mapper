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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { nodeTypes, type NodeCategory } from "@/components/editor/LinkNode";
import { AddNodePanel } from "@/components/editor/AddNodePanel";

// Initial demo nodes
const initialNodes: Node[] = [
  {
    id: "hub",
    type: "hubNode",
    position: { x: 400, y: 200 },
    data: { label: "mysite.com", url: "https://mysite.com", category: "website" },
  },
  {
    id: "twitter",
    type: "linkNode",
    position: { x: 150, y: 100 },
    data: { label: "@username", url: "https://twitter.com/username", category: "social", platform: "twitter" },
  },
  {
    id: "instagram",
    type: "linkNode",
    position: { x: 650, y: 80 },
    data: { label: "@username", url: "https://instagram.com/username", category: "social", platform: "instagram" },
  },
  {
    id: "youtube",
    type: "linkNode",
    position: { x: 100, y: 320 },
    data: { label: "My Channel", url: "https://youtube.com/@channel", category: "content", platform: "youtube" },
  },
  {
    id: "linktree",
    type: "linkNode",
    position: { x: 700, y: 300 },
    data: { label: "linktr.ee/me", url: "https://linktr.ee/me", category: "link", platform: "linktree" },
  },
  {
    id: "newsletter",
    type: "linkNode",
    position: { x: 400, y: 400 },
    data: { label: "Newsletter", url: "https://newsletter.com", category: "email", platform: "newsletter" },
  },
];

const initialEdges: Edge[] = [
  { id: "e-hub-twitter", source: "hub", target: "twitter", animated: true },
  { id: "e-hub-instagram", source: "hub", target: "instagram", animated: true },
  { id: "e-hub-youtube", source: "hub", target: "youtube", animated: true },
  { id: "e-hub-linktree", source: "hub", target: "linktree", animated: true },
  { id: "e-hub-newsletter", source: "hub", target: "newsletter", animated: true },
  { id: "e-linktree-instagram", source: "linktree", target: "instagram", animated: true, style: { stroke: "hsl(174, 72%, 56%)" } },
];

export default function MapEditor() {
  const { id } = useParams();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isAddPanelOpen, setIsAddPanelOpen] = useState(false);
  const [backgroundVariant, setBackgroundVariant] = useState<"dots" | "lines" | "cross">("dots");
  const nodeIdCounter = useRef(7);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge({ ...params, animated: true }, eds)
      ),
    [setEdges]
  );

  const handleAddNode = useCallback(
    (nodeData: {
      label: string;
      url: string;
      category: NodeCategory;
      platform: string;
      notes: string;
    }) => {
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
    [setNodes]
  );

  const cycleBackground = () => {
    const variants: ("dots" | "lines" | "cross")[] = ["dots", "lines", "cross"];
    const currentIndex = variants.indexOf(backgroundVariant);
    setBackgroundVariant(variants[(currentIndex + 1) % variants.length]);
  };

  return (
    <div className="h-screen w-screen bg-background dark flex flex-col">
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
              defaultValue={id === "new" ? "Untitled Map" : "Personal Brand"}
              className="bg-transparent border-none text-foreground font-medium focus:outline-none focus:ring-0 w-auto"
            />
          </div>
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

          <Button variant="ghost" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="hero" size="sm">
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
                variant="hero"
                size="icon"
                onClick={() => setIsAddPanelOpen(true)}
                title="Add Node"
              >
                <Plus className="h-5 w-5" />
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
                <span className="font-medium text-foreground">{nodes.length}</span> nodes
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
