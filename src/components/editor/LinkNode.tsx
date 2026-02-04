import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { 
  Globe, 
  Twitter, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Link2, 
  Mail, 
  ShoppingBag,
  FileText
} from "lucide-react";

export type NodeCategory = 
  | "website" 
  | "social" 
  | "link" 
  | "email" 
  | "ecommerce" 
  | "content";

export interface LinkNodeData {
  label: string;
  url?: string;
  category: NodeCategory;
  platform?: string;
  notes?: string;
  [key: string]: unknown;
}

const categoryConfig: Record<NodeCategory, { color: string; gradient: string }> = {
  website: { 
    color: "hsl(var(--node-website))", 
    gradient: "from-[hsl(239,84%,67%)] to-[hsl(260,84%,65%)]" 
  },
  social: { 
    color: "hsl(var(--node-social))", 
    gradient: "from-[hsl(174,72%,56%)] to-[hsl(190,90%,50%)]" 
  },
  link: { 
    color: "hsl(var(--node-link))", 
    gradient: "from-[hsl(280,70%,60%)] to-[hsl(300,70%,55%)]" 
  },
  email: { 
    color: "hsl(var(--node-email))", 
    gradient: "from-[hsl(350,80%,60%)] to-[hsl(360,80%,55%)]" 
  },
  ecommerce: { 
    color: "hsl(var(--node-ecommerce))", 
    gradient: "from-[hsl(35,90%,55%)] to-[hsl(45,90%,50%)]" 
  },
  content: { 
    color: "hsl(var(--node-content))", 
    gradient: "from-[hsl(145,60%,45%)] to-[hsl(160,60%,40%)]" 
  },
};

const platformIcons: Record<string, React.ElementType> = {
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  youtube: Youtube,
  linkedin: Linkedin,
  linktree: Link2,
  newsletter: Mail,
  shopify: ShoppingBag,
  medium: FileText,
  substack: FileText,
  default: Globe,
};

function LinkNode({ data, selected }: NodeProps) {
  const nodeData = data as LinkNodeData;
  const config = categoryConfig[nodeData.category] || categoryConfig.website;
  const Icon = platformIcons[nodeData.platform?.toLowerCase() || ""] || platformIcons.default;

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl bg-card border-2 transition-all duration-200
        ${selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
      `}
      style={{ 
        borderColor: config.color,
        boxShadow: `0 0 20px -5px ${config.color}40`
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card"
      />

      <div className="flex items-center gap-3">
        <div
          className={`w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradient} flex items-center justify-center flex-shrink-0`}
        >
          <Icon className="w-4 h-4 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-foreground text-sm truncate max-w-[120px]">
            {nodeData.label}
          </p>
          {nodeData.url && (
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
              {nodeData.url.replace(/^https?:\/\//, "")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const LinkNodeComponent = memo(LinkNode);

// Hub Node - Central node for main website/brand
function HubNode({ data, selected }: NodeProps) {
  const nodeData = data as LinkNodeData;

  return (
    <div
      className={`
        relative px-6 py-4 rounded-2xl bg-gradient-to-br from-primary to-primary/80 
        border-2 border-primary-foreground/20 transition-all duration-200
        ${selected ? "ring-2 ring-primary-foreground ring-offset-2 ring-offset-background" : ""}
      `}
      style={{ 
        boxShadow: "0 0 40px -5px hsl(var(--primary) / 0.5)"
      }}
    >
      <Handle
        type="source"
        position={Position.Top}
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary"
      />
      <Handle
        type="source"
        position={Position.Left}
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary"
      />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-primary-foreground text-base truncate">
            {nodeData.label}
          </p>
          {nodeData.url && (
            <p className="text-sm text-primary-foreground/70 truncate">
              {nodeData.url.replace(/^https?:\/\//, "")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export const HubNodeComponent = memo(HubNode);

export const nodeTypes = {
  linkNode: LinkNodeComponent,
  hubNode: HubNodeComponent,
};
