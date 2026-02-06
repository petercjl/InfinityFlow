
import { MindMapData, MindMapNodeData } from '../../types';

export interface LayoutNode {
  id: string;
  data: MindMapNodeData;
  x: number;
  y: number;
  width: number;
  height: number;
  depth: number;
  color: string;
}

const NODE_HEIGHT = 40;
const NODE_H_GAP = 50;  // Horizontal gap between parent and child
const NODE_V_GAP = 12;  // Vertical gap between siblings
const CHAR_WIDTH = 14;  // Approximate width per character
const BASE_PADDING = 24;

const COLORS = [
  '#3b82f6', // blue (root)
  '#ef4444', // red
  '#f59e0b', // amber
  '#10b981', // green
  '#8b5cf6', // violet
  '#ec4899', // pink
];

/**
 * Calculates the size (width/height) of a node based on text
 */
const measureNode = (text: string, depth: number): { width: number, height: number } => {
  const isRoot = depth === 0;
  // Simple estimation. In a real app, use a hidden canvas or DOM element to measure.
  const width = Math.max(isRoot ? 120 : 80, text.length * CHAR_WIDTH + BASE_PADDING);
  const height = isRoot ? 50 : 36;
  return { width, height };
};

/**
 * Main Layout Function
 * 1. Measures all nodes
 * 2. Recursively calculates sub-tree heights
 * 3. Assigns X/Y coordinates
 */
export const calculateMindMapLayout = (data: MindMapData): { nodes: LayoutNode[], width: number, height: number } => {
  const { rootId, nodes } = data;
  const layoutNodes: Record<string, LayoutNode> = {};
  
  if (!rootId || !nodes[rootId]) return { nodes: [], width: 0, height: 0 };

  // Helper to get children sorted by order (if needed)
  const getChildren = (id: string) => {
    const node = nodes[id];
    if (!node.children || (node.isCollapsed && node.children.length > 0)) return [];
    return node.children.map(cid => nodes[cid]).filter(Boolean);
  };

  // 1. Measure & Initialize
  const initialize = (id: string, depth: number): LayoutNode => {
    const nodeData = nodes[id];
    const { width, height } = measureNode(nodeData.text, depth);
    const layoutNode: LayoutNode = {
      id,
      data: nodeData,
      x: 0,
      y: 0,
      width,
      height,
      depth,
      color: depth === 0 ? COLORS[0] : COLORS[(depth - 1) % (COLORS.length - 1) + 1]
    };
    layoutNodes[id] = layoutNode;
    
    getChildren(id).forEach(child => initialize(child.id, depth + 1));
    return layoutNode;
  };

  initialize(rootId, 0);

  // 2. Post-order traversal to calculate subtree heights
  const subtreeHeights: Record<string, number> = {};
  
  const calcHeight = (id: string): number => {
    const children = getChildren(id);
    if (children.length === 0) {
      subtreeHeights[id] = layoutNodes[id].height;
      return subtreeHeights[id];
    }

    let totalHeight = 0;
    children.forEach(child => {
      totalHeight += calcHeight(child.id);
    });
    
    // Add vertical gaps between children
    totalHeight += (children.length - 1) * NODE_V_GAP;
    
    // The node's subtree height is max of its own height vs children total
    subtreeHeights[id] = Math.max(layoutNodes[id].height, totalHeight);
    return subtreeHeights[id];
  };

  calcHeight(rootId);

  // 3. Pre-order traversal to set coordinates
  let maxX = 0;
  let maxY = 0;

  const setPositions = (id: string, x: number, y: number) => {
    const node = layoutNodes[id];
    node.x = x;
    node.y = y + (subtreeHeights[id] - node.height) / 2; // Center node relative to its subtree

    maxX = Math.max(maxX, node.x + node.width);
    maxY = Math.max(maxY, node.y + node.height);

    const children = getChildren(id);
    if (children.length > 0) {
      let currentY = y;
      const nextX = x + node.width + NODE_H_GAP;

      children.forEach(child => {
        const childHeight = subtreeHeights[child.id];
        // Position child vertically centered within its allocated slot
        setPositions(child.id, nextX, currentY);
        currentY += childHeight + NODE_V_GAP;
      });
    }
  };

  // Start positioning from (0,0) - container will center it or handle offset
  setPositions(rootId, 50, 50);

  return {
    nodes: Object.values(layoutNodes),
    width: maxX + 50,
    height: maxY + 50
  };
};

/**
 * Helpers for Tree Mutation
 */
export const createNode = (text: string = '新节点'): MindMapNodeData => ({
  id: `node-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
  text,
  parentId: null,
  children: [],
});

export const addChildNode = (data: MindMapData, parentId: string, text?: string): MindMapData => {
  const newNode = createNode(text || '子节点');
  newNode.parentId = parentId;
  
  const newNodes = { ...data.nodes };
  newNodes[newNode.id] = newNode;
  newNodes[parentId] = {
    ...newNodes[parentId],
    children: [...(newNodes[parentId].children || []), newNode.id],
    isCollapsed: false // Auto expand when adding child
  };

  return { ...data, nodes: newNodes };
};

export const addSiblingNode = (data: MindMapData, referenceId: string): MindMapData => {
  const refNode = data.nodes[referenceId];
  if (!refNode.parentId) return data; // Cannot add sibling to root via this method

  const parent = data.nodes[refNode.parentId];
  const newNode = createNode('分支主题');
  newNode.parentId = parent.id;

  const children = [...parent.children];
  const index = children.indexOf(referenceId);
  children.splice(index + 1, 0, newNode.id);

  const newNodes = { ...data.nodes };
  newNodes[newNode.id] = newNode;
  newNodes[parent.id] = { ...parent, children };

  return { ...data, nodes: newNodes };
};

export const deleteNode = (data: MindMapData, id: string): MindMapData => {
  if (id === data.rootId) return data; // Cannot delete root
  
  const nodeToDelete = data.nodes[id];
  if (!nodeToDelete || !nodeToDelete.parentId) return data;

  const parent = data.nodes[nodeToDelete.parentId];
  const newNodes = { ...data.nodes };
  
  // Recursive delete helper
  const removeRecursively = (nId: string) => {
    const n = newNodes[nId];
    if (n && n.children) {
      n.children.forEach(removeRecursively);
    }
    delete newNodes[nId];
  };

  // Remove from parent's children list
  newNodes[parent.id] = {
    ...parent,
    children: parent.children.filter(cid => cid !== id)
  };

  removeRecursively(id);

  return { ...data, nodes: newNodes };
};

export const toggleCollapse = (data: MindMapData, id: string): MindMapData => {
  const node = data.nodes[id];
  return {
    ...data,
    nodes: {
      ...data.nodes,
      [id]: { ...node, isCollapsed: !node.isCollapsed }
    }
  };
};

export const moveNode = (data: MindMapData, dragId: string, dropId: string): MindMapData => {
  if (dragId === dropId || dragId === data.rootId) return data;
  
  // Check circular dependency: Is dropId inside dragId's subtree?
  let curr = data.nodes[dropId];
  while (curr.parentId) {
    if (curr.parentId === dragId) return data; // Cannot drop into own child
    curr = data.nodes[curr.parentId];
  }

  const dragNode = data.nodes[dragId];
  const oldParent = data.nodes[dragNode.parentId!];
  const newParent = data.nodes[dropId];

  const newNodes = { ...data.nodes };

  // Remove from old parent
  newNodes[oldParent.id] = {
    ...oldParent,
    children: oldParent.children.filter(c => c !== dragId)
  };

  // Add to new parent
  newNodes[newParent.id] = {
    ...newParent,
    children: [...newParent.children, dragId],
    isCollapsed: false // Ensure dropped target is expanded
  };

  // Update node parent pointer
  newNodes[dragId] = {
    ...dragNode,
    parentId: dropId
  };

  return { ...data, nodes: newNodes };
};
