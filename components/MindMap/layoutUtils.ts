
import { Node, Edge } from 'reactflow';

// Constants for layout - Adjusted for new visuals
const NODE_WIDTH_ROOT = 180; // Slightly wider
const NODE_WIDTH_CHILD = 140; // Wider child nodes
const NODE_HEIGHT = 44; // Taller for padding
const HORIZONTAL_GAP = 60; // Space between parent and child
const VERTICAL_GAP = 16; // Tighter vertical packing

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
    
    // Sort children by their Y position to maintain visual order stability
    const childNodes = childEdges
      .map(e => allNodes.find(n => n.id === e.target))
      .filter((n): n is Node => !!n)
      .sort((a, b) => a.position.y - b.position.y);

    const isRoot = node.type === 'mindmap-root';
    // Use stored dimensions if available (via resize observer in real app), or defaults
    const width = node.width || (isRoot ? NODE_WIDTH_ROOT : NODE_WIDTH_CHILD);
    const height = node.height || NODE_HEIGHT;

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
      // Calculate starting Y for children block
      // The children block height is calculated by sum of their subtree heights + gaps
      const childrenBlockHeight = node.children.reduce((acc, c) => acc + calcSubtreeHeight(c), 0) + (node.children.length - 1) * VERTICAL_GAP;
      
      // Center the children block relative to the parent's center
      // Parent center Y = nodeY + node.height/2
      // Children block top = Parent Center Y - ChildrenBlockHeight/2
      let currentY = (nodeY + node.height / 2) - (childrenBlockHeight / 2);

      const nextX = x + node.width + HORIZONTAL_GAP;

      node.children.forEach(child => {
        const h = calcSubtreeHeight(child);
        assignPositions(child, nextX, currentY, h);
        currentY += h + VERTICAL_GAP;
      });
    }
  };

  const rootHeight = calcSubtreeHeight(root);
  
  // Keep root at its current visual position
  const originalRoot = allNodes.find(n => n.id === rootId);
  const startX = originalRoot ? originalRoot.position.x : 0;
  const startY = originalRoot ? originalRoot.position.y : 0;

  // Adjust Y so the tree grows evenly up and down around the root
  const boundingBoxTop = startY - (rootHeight - NODE_HEIGHT) / 2;

  assignPositions(root, startX, boundingBoxTop, rootHeight);

  return updates;
};
