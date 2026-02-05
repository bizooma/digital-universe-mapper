import { memo, useState, useRef, useEffect, useCallback } from "react";
import { Handle, Position, useReactFlow, type NodeProps } from "@xyflow/react";
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
import {
  FacebookIcon,
  TikTokIcon,
  PinterestIcon,
  ThreadsIcon,
  WhatsAppIcon,
  TelegramIcon,
  DiscordIcon,
  SpotifyIcon,
  GitHubIcon,
  DribbbleIcon,
  BehanceIcon,
  TwitchIcon,
  PatreonIcon,
  RedditIcon,
} from "./PlatformIcons";

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
  brandColor?: string; // Custom brand color from map settings
  nodeStyle?: "rounded" | "square" | "pill";
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
  // Social media platforms
  facebook: FacebookIcon,
  fb: FacebookIcon,
  twitter: Twitter,
  x: Twitter,
  instagram: Instagram,
  ig: Instagram,
  youtube: Youtube,
  yt: Youtube,
  linkedin: Linkedin,
  tiktok: TikTokIcon,
  pinterest: PinterestIcon,
  threads: ThreadsIcon,
  whatsapp: WhatsAppIcon,
  telegram: TelegramIcon,
  discord: DiscordIcon,
  reddit: RedditIcon,
  twitch: TwitchIcon,
  
  // Music/Audio
  spotify: SpotifyIcon,
  
  // Portfolio/Design
  dribbble: DribbbleIcon,
  behance: BehanceIcon,
  github: GitHubIcon,
  
  // Creator economy
  patreon: PatreonIcon,
  
  // Link aggregators
  linktree: Link2,
  
  // Content platforms
  medium: FileText,
  substack: FileText,
  newsletter: Mail,
  
  // E-commerce
  shopify: ShoppingBag,
  
  // Default
  default: Globe,
};

function LinkNode({ data, selected }: NodeProps) {
  const nodeData = data as LinkNodeData;
  const config = categoryConfig[nodeData.category] || categoryConfig.website;
  const Icon = platformIcons[nodeData.platform?.toLowerCase() || ""] || platformIcons.default;
  
  // Use brand color if provided, otherwise fall back to category color
  const borderColor = nodeData.brandColor || config.color;
  
  // Determine border radius based on nodeStyle
  const borderRadiusClass = nodeData.nodeStyle === "square" 
    ? "rounded-none" 
    : nodeData.nodeStyle === "pill" 
    ? "rounded-full" 
    : "rounded-xl";

  return (
    <div
      className={`
        relative px-4 py-3 ${borderRadiusClass} bg-card border-2 transition-all duration-200
        ${selected ? "ring-2 ring-offset-2 ring-offset-background" : ""}
      `}
      style={{ 
        borderColor: borderColor,
        boxShadow: `0 0 20px -5px ${borderColor}40`,
        ...(selected && { ringColor: borderColor })
      }}
    >
      {/* Handles - both source and target on each side for flexible connections */}
      {/* Top handles */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card hover:!bg-primary hover:!scale-125 transition-all"
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card hover:!bg-primary hover:!scale-125 transition-all !-translate-x-3"
      />
      
      {/* Bottom handles */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card hover:!bg-primary hover:!scale-125 transition-all !translate-x-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card hover:!bg-primary hover:!scale-125 transition-all"
      />
      
      {/* Left handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card hover:!bg-primary hover:!scale-125 transition-all"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card hover:!bg-primary hover:!scale-125 transition-all !translate-y-3"
      />
      
      {/* Right handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card hover:!bg-primary hover:!scale-125 transition-all !-translate-y-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-card hover:!bg-primary hover:!scale-125 transition-all"
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
function HubNode({ data, selected, id }: NodeProps) {
  const nodeData = data as LinkNodeData;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(nodeData.label);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setNodes } = useReactFlow();

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    if (editValue.trim()) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, label: editValue.trim() } }
            : node
        )
      );
    } else {
      setEditValue(nodeData.label);
    }
    setIsEditing(false);
  }, [editValue, id, nodeData.label, setNodes]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(nodeData.label);
      setIsEditing(false);
    }
  };

  // Use brand color if provided
  const brandColor = nodeData.brandColor || "hsl(var(--primary))";
  
  // Determine border radius based on nodeStyle
  const borderRadiusClass = nodeData.nodeStyle === "square" 
    ? "rounded-none" 
    : nodeData.nodeStyle === "pill" 
    ? "rounded-full" 
    : "rounded-2xl";

  return (
    <div
      className={`
        relative px-6 py-4 ${borderRadiusClass} 
        border-2 transition-all duration-200
        ${selected ? "ring-2 ring-offset-2 ring-offset-background" : ""}
      `}
      style={{ 
        background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)`,
        borderColor: "rgba(255,255,255,0.2)",
        boxShadow: `0 0 40px -5px ${brandColor}80`,
        ...(selected && { ringColor: "rgba(255,255,255,0.8)" })
      }}
      data-onboarding="hub-node"
    >
      {/* Hub node has both source and target handles on all sides */}
      <Handle
        type="source"
        position={Position.Top}
        id="top-source"
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary"
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary !opacity-0 !pointer-events-auto"
        style={{ top: 0 }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom-target"
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary !opacity-0 !pointer-events-auto"
        style={{ bottom: 0 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left-source"
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary"
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary !opacity-0 !pointer-events-auto"
        style={{ left: 0 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary"
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right-target"
        className="!w-4 !h-4 !bg-primary-foreground !border-2 !border-primary !opacity-0 !pointer-events-auto"
        style={{ right: 0 }}
      />

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={handleKeyDown}
              className="font-bold text-primary-foreground text-base bg-transparent border-none outline-none w-full min-w-[100px] placeholder:text-primary-foreground/50"
              placeholder="Enter name..."
            />
          ) : (
            <p 
              className="font-bold text-primary-foreground text-base truncate cursor-text hover:underline decoration-primary-foreground/40"
              onDoubleClick={() => setIsEditing(true)}
              title="Double-click to edit"
            >
              {nodeData.label}
            </p>
          )}
          {nodeData.url && !isEditing && (
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

import { LogoNodeComponent } from "./LogoNode";

export const nodeTypes = {
  linkNode: LinkNodeComponent,
  hubNode: HubNodeComponent,
  logoNode: LogoNodeComponent,
};
