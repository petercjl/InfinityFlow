import dagre from 'dagre';
import { Node, Edge, Position } from 'reactflow';

export type LayoutType = 'tree-right' | 'tree-down' | 'radial' | 'fishbone' | 'org-chart';

const nodeWidth = 150;
const nodeHeight = 50;

/**
 * Calculates the layout for the Mind Map.
 */
export const getLayoutedElements = (
  nodes: Node[],
  edges: Edge[],
  layout: LayoutType
): { nodes: Node[]; edges: Edge[] } => {
  
  if (layout === 'radial') {
    return getRadialLayout(nodes, edges);
  }

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Direction: LR = Left to Right (Tree Right), TB = Top to Bottom (Tree Down / Org)
  const rankDir = layout === 'tree-down' || layout === 'org-chart' ? 'TB' : 'LR';
  
  dagreGraph.setGraph({ rankdir: rankDir });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    
    // Set handle positions based on layout
    let targetPos = Position.Left;
    let sourcePos = Position.Right;
    
    if (layout === 'tree-down' || layout === 'org-chart') {
      targetPos = Position.Top;
      sourcePos = Position.Bottom;
    }

    // Assign styles
    node.targetPosition = targetPos;
    node.sourcePosition = sourcePos;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Simple Radial Layout Algorithm
 * Places root in center, children in concentric circles.
 */
const getRadialLayout = (nodes: Node[], edges: Edge[]) => {
    if (nodes.length === 0) return { nodes, edges };

    const root = nodes[0]; // Assuming first node is root for simplicity
    const hierarchy: Record<string, string[]> = {};
    
    edges.forEach(e => {
        if(!hierarchy[e.source]) hierarchy[e.source] = [];
        hierarchy[e.source].push(e.target);
    });

    const newNodes = [...nodes];
    const setNodePos = (id: string, x: number, y: number) => {
        const idx = newNodes.findIndex(n => n.id === id);
        if(idx !== -1) {
            newNodes[idx] = { ...newNodes[idx], position: { x, y } };
        }
    };

    // Root at 0,0 (relative)
    setNodePos(root.id, 0, 0);

    const levels: Record<number, string[]> = {};
    const queue: {id: string, depth: number}[] = [{id: root.id, depth: 0}];
    
    while(queue.length > 0) {
        const { id, depth } = queue.shift()!;
        if (depth > 0) {
            if (!levels[depth]) levels[depth] = [];
            levels[depth].push(id);
        }
        const children = hierarchy[id] || [];
        children.forEach(childId => queue.push({ id: childId, depth: depth + 1 }));
    }

    // Position by level
    Object.entries(levels).forEach(([depthStr, nodeIds]) => {
        const depth = parseInt(depthStr);
        const radius = depth * 250;
        const angleStep = (2 * Math.PI) / nodeIds.length;
        
        nodeIds.forEach((nodeId, idx) => {
            const angle = idx * angleStep;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            setNodePos(nodeId, x, y);
        });
    });

    return { nodes: newNodes, edges };
};