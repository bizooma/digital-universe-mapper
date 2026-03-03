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
  type EdgeMarker,
} from "@xyflow/react";
import { ArrowRight, ArrowLeft, ArrowLeftRight, Minus, Plus } from "lucide-react";

export type Direction = "forward" | "backward" | "both" | "none";

const DIRECTION_CYCLE: Direction[] = ["forward", "backward", "both", "none"];

function getDirectionIcon(dir: Direction) {
  switch (dir) {
    case "forward": return <ArrowRight className="h-3 w-3" />;
    case "backward": return <ArrowLeft className="h-3 w-3" />;
    case "both": return <ArrowLeftRight className="h-3 w-3" />;
    case "none": return <Minus className="h-3 w-3" />;
  }
}

/** Build markerEnd / markerStart objects for a given direction + color */
export function getEdgeMarkers(direction: Direction, color?: string): { markerEnd?: EdgeMarker; markerStart?: EdgeMarker } {
  const marker: EdgeMarker = {
    type: MarkerType.ArrowClosed,
    width: 20,
    height: 20,
    color: color || "hsl(var(--primary))",
  };

  return {
    markerEnd: direction === "forward" || direction === "both" ? marker : undefined,
    markerStart: direction === "backward" || direction === "both" ? marker : undefined,
  };
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
  markerEnd,
  markerStart,
  data,
}: EdgeProps) {
  const edgeData = data as { label?: string; edgeType?: string; direction?: Direction } | undefined;
  const edgeType = edgeData?.edgeType || "default";
  const direction: Direction = edgeData?.direction || "forward";

  // Compute animation direction class name for the edge path
  const animationClass =
    direction === "backward"
      ? "react-flow__edge-path-reverse"
      : "";
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(edgeData?.label || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const { setEdges } = useReactFlow();

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
    const strokeColor = (style as any)?.stroke;
    const markers = getEdgeMarkers(nextDirection, strokeColor);

    setEdges((eds) =>
      eds.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              data: { ...edge.data, direction: nextDirection },
              markerEnd: markers.markerEnd,
              markerStart: markers.markerStart,
            }
          : edge
      )
    );
  }, [id, direction, setEdges, style]);

  const label = edgeData?.label;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} markerStart={markerStart} style={style} className={animationClass} />
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
            className="w-6 h-6 rounded-full bg-card/80 backdrop-blur-sm border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all opacity-40 hover:opacity-100 shadow-sm"
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
