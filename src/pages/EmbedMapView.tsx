import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  type Edge,
  type Node,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Loader2 } from "lucide-react";
import { nodeTypes } from "@/components/editor/LinkNode";
import { edgeTypes } from "@/components/editor/EditableEdge";
import { supabase } from "@/integrations/supabase/client";

function EmbedMapViewInner() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Customization options from URL params
  const showControls = searchParams.get("controls") !== "false";
  const showBackground = searchParams.get("background") !== "false";
  const bgColor = searchParams.get("bg") || "transparent";

  // Track view on load
  useEffect(() => {
    const trackView = async () => {
      if (!id) return;
      
      try {
        await supabase.functions.invoke("track-view", {
          body: {
            mapId: id,
            userAgent: navigator.userAgent,
            referrer: document.referrer || null,
          },
        });
      } catch (err) {
        // Silently fail - don't disrupt user experience
        console.error("Failed to track view:", err);
      }
    };

    trackView();
  }, [id]);

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

  // Handle node click to open URL in new tab
  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    const url = node.data?.url as string;
    if (url && url !== "https://") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  if (isLoading) {
    return (
      <div 
        className="h-screen w-screen flex items-center justify-center"
        style={{ backgroundColor: bgColor === "transparent" ? "transparent" : bgColor }}
      >
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="h-screen w-screen flex items-center justify-center"
        style={{ backgroundColor: bgColor === "transparent" ? "transparent" : bgColor }}
      >
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-screen w-screen"
      style={{ backgroundColor: bgColor === "transparent" ? "transparent" : bgColor }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={true}
        zoomOnScroll={true}
        className="bg-transparent"
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: "hsl(var(--primary))" },
          animated: true,
        }}
        proOptions={{ hideAttribution: true }}
      >
        {showBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="hsl(var(--border))"
          />
        )}
        {showControls && (
          <Controls
            className="!bg-card !border-border !shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground [&>button:hover]:!bg-secondary"
            showInteractive={false}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export default function EmbedMapView() {
  return (
    <ReactFlowProvider>
      <EmbedMapViewInner />
    </ReactFlowProvider>
  );
}
