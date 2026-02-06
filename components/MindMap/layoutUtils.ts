
import { Node, Edge } from 'reactflow';

// Constants for layout
const NODE_WIDTH_ROOT = 160;
const NODE_WIDTH_CHILD = 120;
const NODE_HEIGHT = 40;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 20;

interface LayoutNode {
  id: string;
  width: number;
  height: number;
  children: LayoutNode[];
  x: number;
  y: number;
}

/**
 * Recalculates the positions of a mind map tree.
 * Returns an array of node updates { id, position }.
 */
export const recalculateMindMapLayout = (
  rootId: string, 
  allNodes: Node[], 
  allEdges: Edge[]
): { id: string, position: { x: number, y: number } }[] => {
  
  // 1. Build the tree structure
  const buildTree = (nodeId: string): LayoutNode => {
    const node = allNodes.find(n => n.id === nodeId);
    if (!node) return { id: nodeId, width: 0, height: 0, children: [], x: 0, y: 0 };

    // Find outgoing edges from this node
    const childEdges = allEdges.filter(e => e.source === nodeId);
    // Sort children by their Y position to maintain visual order stability if possible, 
    // or by a specific 'order' meta property if we added one. 
    // For now, we rely on the edge order or existing Y to keep stability.
    const childNodes = childEdges
      .map(e => allNodes.find(n => n.id === e.target))
      .filter((n): n is Node => !!n)
      .sort((a, b) => a.position.y - b.position.y);

    const isRoot = node.type === 'mindmap-root';
    const width = isRoot ? NODE_WIDTH_ROOT : NODE_WIDTH_CHILD; // Or dynamic based on text length
    const height = NODE_HEIGHT;

    return {
      id: nodeId,
      width,
      height,
      children: node.data.isCollapsed ? [] : childNodes.map(c => buildTree(c.id)),
      x: 0, 
      y: 0
    };
  };

  const root = buildTree(rootId);
  const updates: { id: string, position: { x: number, y: number } }[] = [];

  // 2. Calculate Layout (Right-to-Left Tree)
  // First, post-order traversal to calculate subtree heights
  const calcSubtreeHeight = (node: LayoutNode): number => {
    if (node.children.length === 0) {
      return node.height;
    }
    const childrenHeight = node.children.reduce((acc, child) => acc + calcSubtreeHeight(child), 0);
    const gaps = (node.children.length - 1) * VERTICAL_GAP;
    return Math.max(node.height, childrenHeight + gaps);
  };

  // 3. Pre-order traversal to assign positions
  const assignPositions = (node: LayoutNode, x: number, y: number, subtreeHeight: number) => {
    // Center node vertically in its allocated subtree space
    const nodeY = y + (subtreeHeight - node.height) / 2;
    
    updates.push({
      id: node.id,
      position: { x, y: nodeY }
    });

    if (node.children.length > 0) {
      let currentY = y;
      const nextX = x + node.width + HORIZONTAL_GAP;

      node.children.forEach(child => {
        const h = calcSubtreeHeight(child);
        assignPositions(child, nextX, currentY, h);
        currentY += h + VERTICAL_GAP;
      });
    }
  };

  const rootHeight = calcSubtreeHeight(root);
  
  // Keep root at its current visual position (or 0,0 if new)
  // To avoid the root jumping around, we might want to get the *current* root position from allNodes
  const originalRoot = allNodes.find(n => n.id === rootId);
  const startX = originalRoot ? originalRoot.position.x : 0;
  const startY = originalRoot ? originalRoot.position.y : 0;

  // We actually want the subtree centered on the root's Y.
  // The layout logic `assignPositions` assumes (x,y) is top-left of the bounding box.
  // So we adjust y:
  const boundingBoxTop = startY - (rootHeight - NODE_HEIGHT) / 2;

  assignPositions(root, startX, boundingBoxTop, rootHeight);

  return updates;
};
