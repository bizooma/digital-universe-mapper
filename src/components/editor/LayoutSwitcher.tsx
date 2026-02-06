import { useState } from "react";
import { Network, GitBranch, LayoutGrid, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Node, Edge } from "@xyflow/react";

export type LayoutMode = 'radial' | 'hierarchical';

interface LayoutSwitcherProps {
  nodes: Node[];
  edges: Edge[];
  onLayoutChange: (nodes: Node[], edges: Edge[]) => void;
}

// Get URL path segments for hierarchy
function getPathSegments(url: string): string[] {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split("/").filter(Boolean);
  } catch {
    return [];
  }
}

// Create radial layout - all nodes around hub
function createRadialLayout(nodes: Node[]): Node[] {
  const hubNode = nodes.find(n => n.type === "hubNode" || n.type === "logo" || n.data?.isHub);
  const otherNodes = nodes.filter(n => n !== hubNode && n.type !== "logoNode");
  
  if (!hubNode) return nodes;

  const hubPosition = { x: 0, y: 0 };
  const radius = Math.max(200, otherNodes.length * 25);
  const angleStep = (2 * Math.PI) / Math.max(otherNodes.length, 1);

  const newNodes: Node[] = [
    { ...hubNode, position: hubPosition },
  ];

  otherNodes.forEach((node, index) => {
    const angle = angleStep * index - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    newNodes.push({ ...node, position: { x, y } });
  });

  // Keep logo node in its original position if it exists
  const logoNode = nodes.find(n => n.type === "logoNode");
  if (logoNode) {
    newNodes.push(logoNode);
  }

  return newNodes;
}

// Create hierarchical tree layout based on URL paths
function createHierarchicalLayout(nodes: Node[], edges: Edge[]): Node[] {
  const hubNode = nodes.find(n => n.type === "hubNode" || n.type === "logo" || n.data?.isHub);
  const otherNodes = nodes.filter(n => n !== hubNode && n.type !== "logoNode");
  
  if (!hubNode) return nodes;

  // Build tree structure from edges
  interface TreeNode {
    node: Node;
    children: TreeNode[];
    depth: number;
  }

  // Create a map of node IDs to their children based on edges
  const childrenMap = new Map<string, string[]>();
  edges.forEach(edge => {
    if (!childrenMap.has(edge.source)) {
      childrenMap.set(edge.source, []);
    }
    childrenMap.get(edge.source)!.push(edge.target);
  });

  // Build tree starting from hub
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set<string>();

  function buildTree(nodeId: string, depth: number): TreeNode | null {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);
    
    const node = nodeMap.get(nodeId);
    if (!node || node.type === "logoNode") return null;

    const childIds = childrenMap.get(nodeId) || [];
    const children: TreeNode[] = [];
    
    for (const childId of childIds) {
      const childTree = buildTree(childId, depth + 1);
      if (childTree) {
        children.push(childTree);
      }
    }

    return { node, children, depth };
  }

  const root = buildTree(hubNode.id, 0);
  if (!root) return nodes;

  // Layout constants
  const levelHeight = 120;
  const nodeWidth = 180;
  const nodeSpacing = 40;

  // Calculate subtree widths
  function getSubtreeWidth(treeNode: TreeNode): number {
    if (treeNode.children.length === 0) return nodeWidth;
    return treeNode.children.reduce((sum, child) => sum + getSubtreeWidth(child), 0) + 
           (treeNode.children.length - 1) * nodeSpacing;
  }

  // Position nodes
  const newNodes: Node[] = [];

  function positionNode(treeNode: TreeNode, x: number, y: number): void {
    newNodes.push({ ...treeNode.node, position: { x, y } });

    if (treeNode.children.length > 0) {
      const totalWidth = getSubtreeWidth(treeNode);
      let currentX = x - totalWidth / 2;

      treeNode.children.forEach(child => {
        const childWidth = getSubtreeWidth(child);
        const childX = currentX + childWidth / 2;
        positionNode(child, childX, y + levelHeight);
        currentX += childWidth + nodeSpacing;
      });
    }
  }

  positionNode(root, 0, 0);

  // Add any unvisited nodes (orphans) in a row below
  const orphanNodes = otherNodes.filter(n => !visited.has(n.id));
  if (orphanNodes.length > 0) {
    const maxDepth = Math.max(...newNodes.map(n => {
      const treeNode = [...visited].find(id => nodeMap.get(id) === n);
      return treeNode ? 1 : 0;
    }), 1);
    const orphanY = (maxDepth + 1) * levelHeight;
    const orphanStartX = -((orphanNodes.length - 1) * (nodeWidth + nodeSpacing)) / 2;
    
    orphanNodes.forEach((node, index) => {
      newNodes.push({
        ...node,
        position: {
          x: orphanStartX + index * (nodeWidth + nodeSpacing),
          y: orphanY,
        },
      });
    });
  }

  // Keep logo node in its original position if it exists
  const logoNode = nodes.find(n => n.type === "logoNode");
  if (logoNode) {
    newNodes.push(logoNode);
  }

  return newNodes;
}

export function LayoutSwitcher({ nodes, edges, onLayoutChange }: LayoutSwitcherProps) {
  const [isApplying, setIsApplying] = useState(false);

  const applyLayout = async (mode: LayoutMode) => {
    setIsApplying(true);
    
    // Small delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      let newNodes: Node[];
      
      if (mode === 'radial') {
        newNodes = createRadialLayout(nodes);
      } else {
        newNodes = createHierarchicalLayout(nodes, edges);
      }
      
      onLayoutChange(newNodes, edges);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isApplying}>
                {isApplying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LayoutGrid className="h-4 w-4" />
                )}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="start" side="right" className="w-48">
            <DropdownMenuLabel>Re-layout Map</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => applyLayout('radial')}>
              <Network className="h-4 w-4 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Radial</p>
                <p className="text-xs text-muted-foreground">Circle around hub</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => applyLayout('hierarchical')}>
              <GitBranch className="h-4 w-4 mr-2" />
              <div className="flex-1">
                <p className="text-sm font-medium">Site Structure</p>
                <p className="text-xs text-muted-foreground">Tree from hub</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>Auto Layout</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
