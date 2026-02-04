import type { Node, Edge } from "@xyflow/react";

interface MapThumbnailProps {
  nodes: Node[];
  edges: Edge[];
  width?: number;
  height?: number;
}

interface NodeData {
  label?: string;
  platform?: string;
  isHub?: boolean;
}

export function MapThumbnail({ nodes, edges, width = 200, height = 128 }: MapThumbnailProps) {
  if (!nodes || nodes.length === 0) {
    return (
      <div 
        className="bg-secondary canvas-dots flex items-center justify-center"
        style={{ width, height }}
      >
        <span className="text-xs text-muted-foreground">Empty map</span>
      </div>
    );
  }

  // Calculate bounds of all nodes
  const positions = nodes.map(n => ({ x: n.position.x, y: n.position.y }));
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));

  // Add padding for node sizes
  const nodeWidth = 120;
  const nodeHeight = 50;
  const padding = 20;

  const contentWidth = maxX - minX + nodeWidth + padding * 2;
  const contentHeight = maxY - minY + nodeHeight + padding * 2;

  // Calculate scale to fit content in thumbnail
  const scaleX = width / contentWidth;
  const scaleY = height / contentHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Don't scale up, only down

  // Center offset
  const offsetX = (width - contentWidth * scale) / 2;
  const offsetY = (height - contentHeight * scale) / 2;

  // Transform node position to thumbnail coordinates
  const transformPosition = (x: number, y: number) => ({
    x: (x - minX + padding) * scale + offsetX,
    y: (y - minY + padding) * scale + offsetY,
  });

  // Get node center for edge drawing
  const getNodeCenter = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;
    const pos = transformPosition(node.position.x, node.position.y);
    return {
      x: pos.x + (nodeWidth * scale) / 2,
      y: pos.y + (nodeHeight * scale) / 2,
    };
  };

  return (
    <div 
      className="bg-secondary canvas-dots relative overflow-hidden"
      style={{ width, height }}
    >
      {/* SVG for edges */}
      <svg 
        className="absolute inset-0" 
        width={width} 
        height={height}
      >
        {edges.map(edge => {
          const sourceCenter = getNodeCenter(edge.source);
          const targetCenter = getNodeCenter(edge.target);
          if (!sourceCenter || !targetCenter) return null;
          
          return (
            <line
              key={edge.id}
              x1={sourceCenter.x}
              y1={sourceCenter.y}
              x2={targetCenter.x}
              y2={targetCenter.y}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeOpacity={0.5}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      {nodes.map(node => {
        const pos = transformPosition(node.position.x, node.position.y);
        const data = node.data as NodeData;
        const isHub = data?.isHub || node.type === "hub";
        
        return (
          <div
            key={node.id}
            className={`absolute rounded transition-transform ${
              isHub 
                ? "bg-primary" 
                : "bg-accent"
            }`}
            style={{
              left: pos.x,
              top: pos.y,
              width: nodeWidth * scale,
              height: nodeHeight * scale,
              minWidth: 12,
              minHeight: 8,
            }}
          />
        );
      })}
    </div>
  );
}
