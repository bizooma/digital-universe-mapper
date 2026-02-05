import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";

export interface LogoNodeData {
  logoUrl: string;
  [key: string]: unknown;
}

function LogoNode({ data, selected }: NodeProps) {
  const nodeData = data as LogoNodeData;

  return (
    <div
      className={`
        relative bg-card/90 backdrop-blur-sm border-2 rounded-lg p-2 shadow-lg transition-all duration-200 cursor-move
        ${selected ? "border-primary ring-2 ring-primary/30" : "border-border"}
      `}
      data-logo="true"
    >
      {/* Invisible handles for consistency, but logo doesn't connect to anything */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!opacity-0 !pointer-events-none"
      />
      
      <img
        src={nodeData.logoUrl}
        alt="Map logo"
        className="h-12 w-auto max-w-[150px] object-contain pointer-events-none"
        crossOrigin="anonymous"
        draggable={false}
      />
    </div>
  );
}

export const LogoNodeComponent = memo(LogoNode);
