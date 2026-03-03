import { memo, useState, useRef, useEffect, useCallback } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  MarkerType,
  type EdgeProps,
} from "@xyflow/react";
import { ArrowRight, ArrowLeft, ArrowLeftRight, Minus, Plus } from "lucide-react";

type Direction = "forward" | "backward" | "both" | "none";

const DIRECTION_CYCLE: Direction[] = ["forward", "backward", "both", "none"];

function getDirectionIcon(dir: Direction) {
  switch (dir) {
    case "forward": return <ArrowRight className="h-3 w-3" />;
    case "backward": return <ArrowLeft className="h-3 w-3" />;
    case "both": return <ArrowLeftRight className="h-3 w-3" />;
    case "none": return <Minus className="h-3 w-3" />;
  }
}

function getMarkers(direction: Direction, color?: string) {
  const marker = {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color: color || "hsl(var(--primary))",
  };

  const markerEnd = direction === "forward" || direction === "both" ? marker : undefined;
  const markerStart = direction === "backward" || direction === "both" ? marker : undefined;

  return { markerEnd, markerStart };
}

function EditableEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: EdgeProps) {
  const edgeData = data as { label?: string; edgeType?: string; direction?: Direction } | undefined;
  const edgeType = edgeData?.edgeType || "default";
  const direction: Direction = edgeData?.direction || "forward";
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(edgeData?.label || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setEdges } = useReactFlow();

  // Compute markers
  const strokeColor = (style as any)?.stroke;
  const { markerEnd, markerStart } = getMarkers(direction, strokeColor);

  // Choose path function based on edge type
  let edgePath: string;
  let labelX: number;
  let labelY: number;

  if (edgeType === "straight") {
    [edgePath, labelX, labelY] = getStraightPath({
      sourceX, sourceY, targetX, targetY,
    });
  } else if (edgeType === "step" || edgeType === "smoothstep") {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });
  } else {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    });
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    setEdges((eds) =>
      eds.map((e) =>
        e.id === id
          ? { ...e, data: { ...e.data, label: labelValue.trim() } }
          : e
      )
    );
    setIsEditing(false);
  }, [id, labelValue, setEdges]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSave();
    else if (e.key === "Escape") {
      setLabelValue(edgeData?.label || "");
      setIsEditing(false);
    }
  };

  const cycleDirection = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = DIRECTION_CYCLE.indexOf(direction);
    const nextDirection = DIRECTION_CYCLE[(currentIndex + 1) % DIRECTION_CYCLE.length];
    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === id
          ? { ...edge, data: { ...edge.data, direction: nextDirection } }
          : edge
      )
    );
  }, [id, direction, setEdges]);

  const label = edgeData?.label;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd ? `url(#${markerEnd.type}-${id}-end)` : undefined}
        markerStart={markerStart ? `url(#${markerStart.type}-${id}-start)` : undefined}
        style={style}
      />
      {/* SVG marker definitions */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          {markerEnd && (
            <marker
              id={`${markerEnd.type}-${id}-end`}
              viewBox="0 0 16 16"
              refX="14"
              refY="8"
              markerWidth={markerEnd.width}
              markerHeight={markerEnd.height}
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 16 8 L 0 16 z" fill={markerEnd.color} />
            </marker>
          )}
          {markerStart && (
            <marker
              id={`${markerStart.type}-${id}-start`}
              viewBox="0 0 16 16"
              refX="2"
              refY="8"
              markerWidth={markerStart.width}
              markerHeight={markerStart.height}
              orient="auto-start-reverse"
            >
              <path d="M 16 0 L 0 8 L 16 16 z" fill={markerStart.color} />
            </marker>
          )}
        </defs>
      </svg>
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan flex items-center gap-1"
        >
          {/* Direction toggle button */}
          <button
            onClick={cycleDirection}
            className="w-6 h-6 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 peer shadow-sm"
            style={{ opacity: undefined }}
            title={`Direction: ${direction}. Click to cycle.`}
          >
            {getDirectionIcon(direction)}
          </button>

          {/* Label area */}
          {isEditing ? (
            <input
              ref={inputRef}
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="px-2 py-0.5 text-xs bg-card border border-border rounded-full shadow-md outline-none focus:ring-1 focus:ring-primary text-foreground min-w-[60px] text-center"
              placeholder="Add label..."
            />
          ) : label ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-2 py-0.5 text-xs bg-card/90 backdrop-blur-sm border border-border rounded-full shadow-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors cursor-text"
            >
              {label}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center justify-center w-6 h-6 rounded-full bg-card/60 border border-border/50 hover:bg-card hover:border-primary/50 transition-all opacity-40 hover:opacity-100 cursor-text shadow-sm"
              title="Click to add label"
            >
              <Plus className="h-3 w-3 text-muted-foreground" />
            </button>
          )}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export const EditableEdge = memo(EditableEdgeComponent);

export const edgeTypes = {
  editableEdge: EditableEdge,
};
