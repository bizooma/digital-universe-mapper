import { memo, useState, useRef, useEffect, useCallback } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

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
  data,
}: EdgeProps) {
  const edgeData = data as { label?: string; edgeType?: string } | undefined;
  const edgeType = edgeData?.edgeType || "default";
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

  const label = edgeData?.label;

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
          className="nodrag nopan"
        >
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
              className="w-4 h-4 rounded-full bg-card/60 border border-border/50 hover:bg-card hover:border-primary/50 transition-all opacity-0 hover:opacity-100 cursor-text"
              title="Click to add label"
            />
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
