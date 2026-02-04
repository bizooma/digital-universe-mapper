import type { Node, Edge } from "@xyflow/react";

export interface MapTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  nodes: Node[];
  edges: Edge[];
}

const createHubNode = (label: string): Node => ({
  id: "hub",
  type: "hub",
  position: { x: 400, y: 300 },
  data: { label, isHub: true },
});

const createLinkNode = (
  id: string,
  label: string,
  platform: string,
  x: number,
  y: number,
  url?: string
): Node => ({
  id,
  type: "link",
  position: { x, y },
  data: { label, platform, url: url || "", notes: "" },
});

const createEdge = (source: string, target: string): Edge => ({
  id: `${source}-${target}`,
  source,
  target,
  type: "smoothstep",
  animated: true,
});

export const mapTemplates: MapTemplate[] = [
  {
    id: "blank",
    name: "Blank Canvas",
    description: "Start fresh with just your hub",
    icon: "🎨",
    nodes: [createHubNode("My Brand")],
    edges: [],
  },
  {
    id: "creator",
    name: "Content Creator",
    description: "YouTube, Instagram, TikTok, and more",
    icon: "🎬",
    nodes: [
      createHubNode("My Channel"),
      createLinkNode("youtube", "YouTube", "youtube", 150, 150),
      createLinkNode("instagram", "Instagram", "instagram", 650, 150),
      createLinkNode("tiktok", "TikTok", "tiktok", 150, 450),
      createLinkNode("patreon", "Patreon", "patreon", 650, 450),
      createLinkNode("linktree", "Linktree", "link", 400, 500),
    ],
    edges: [
      createEdge("hub", "youtube"),
      createEdge("hub", "instagram"),
      createEdge("hub", "tiktok"),
      createEdge("hub", "patreon"),
      createEdge("hub", "linktree"),
    ],
  },
  {
    id: "business",
    name: "Business",
    description: "Website, LinkedIn, Email, Blog",
    icon: "💼",
    nodes: [
      createHubNode("My Business"),
      createLinkNode("website", "Website", "website", 150, 200),
      createLinkNode("linkedin", "LinkedIn", "linkedin", 650, 200),
      createLinkNode("email", "Email", "email", 150, 400),
      createLinkNode("blog", "Blog", "blog", 650, 400),
    ],
    edges: [
      createEdge("hub", "website"),
      createEdge("hub", "linkedin"),
      createEdge("hub", "email"),
      createEdge("hub", "blog"),
    ],
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    description: "Online store with social presence",
    icon: "🛒",
    nodes: [
      createHubNode("My Store"),
      createLinkNode("shopify", "Shopify Store", "website", 400, 100),
      createLinkNode("instagram", "Instagram Shop", "instagram", 150, 250),
      createLinkNode("facebook", "Facebook Shop", "facebook", 650, 250),
      createLinkNode("email", "Newsletter", "email", 150, 450),
      createLinkNode("reviews", "Reviews", "link", 650, 450),
    ],
    edges: [
      createEdge("hub", "shopify"),
      createEdge("hub", "instagram"),
      createEdge("hub", "facebook"),
      createEdge("hub", "email"),
      createEdge("hub", "reviews"),
      createEdge("shopify", "instagram"),
      createEdge("shopify", "facebook"),
    ],
  },
  {
    id: "personal",
    name: "Personal Brand",
    description: "Portfolio and social presence",
    icon: "✨",
    nodes: [
      createHubNode("My Name"),
      createLinkNode("portfolio", "Portfolio", "website", 400, 100),
      createLinkNode("twitter", "Twitter/X", "twitter", 150, 250),
      createLinkNode("linkedin", "LinkedIn", "linkedin", 650, 250),
      createLinkNode("github", "GitHub", "github", 150, 450),
      createLinkNode("email", "Contact", "email", 650, 450),
    ],
    edges: [
      createEdge("hub", "portfolio"),
      createEdge("hub", "twitter"),
      createEdge("hub", "linkedin"),
      createEdge("hub", "github"),
      createEdge("hub", "email"),
    ],
  },
];
