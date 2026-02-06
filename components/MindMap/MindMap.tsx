import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  Panel,
  ReactFlowProvider,
} from 'reactflow';
import MindMapNode from './MindMapNode';
import { getLayoutedElements, LayoutType } from './layoutUtils';
import { GitBranch, Network, ArrowDown, Layout, Palette } from 'lucide-react';

interface MindMapData {
  nodes: Node[];
  edges: Edge[];
  layout: LayoutType;
  theme: 'default' | 'colorful' | 'dark' | 'minimal';
}

interface MindMapProps {
  initialData?: Partial<MindMapData>;
  onChange: (data: Partial<MindMapData>) => void;
  isEditable: boolean;
}

const nodeTypes = {
  mindMap: MindMapNode,
};

const DEFAULT_NODES: Node[] = [
  { id: 'root', type: 'mindMap', data: { label: '中心主题', depth: 0 }, position: { x: 0, y: 0 } },
  { id: '1', type: 'mindMap', data: { label: '分支 1', depth: 1 }, position: { x: 0, y: 0 } },
  { id: '2', type: 'mindMap', data: { label: '分支 2', depth: 1 }, position: { x: 0, y: 0 } },
];

const DEFAULT_EDGES: Edge[] = [
  { id: 'e1', source: 'root', target: '1' },
  { id: 'e2', source: 'root', target: '2' },
];

const MindMapContent: React.FC<MindMapProps> = ({ initialData, onChange, isEditable }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || DEFAULT_NODES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || DEFAULT_EDGES);
  const [layout, setLayout] = React.useState<LayoutType>(initialData?.layout || 'tree-right');
  const [theme, setTheme] = React.useState<MindMapData['theme']>(initialData?.theme || 'default');

  // Handle Label Changes from custom node
  const onLabelChange = useCallback((id: string, newLabel: string) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === id) {
          return { ...node, data: { ...node.data, label: newLabel } };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Inject handlers into nodes
  useEffect(() => {
    setNodes((nds) => 
        nds.map(n => ({
            ...n,
            data: { ...n.data, theme, onLabelChange }
        }))
    );
  }, [theme, setNodes, onLabelChange]);

  // Auto Layout effect
  useEffect(() => {
    const layouted = getLayoutedElements(nodes, edges, layout);
    // We only update positions to avoid resetting other state
    setNodes((nds) => 
        nds.map(n => {
            const layoutedNode = layouted.nodes.find(ln => ln.id === n.id);
            return layoutedNode ? { ...n, position: layoutedNode.position, sourcePosition: layoutedNode.sourcePosition, targetPosition: layoutedNode.targetPosition } : n;
        })
    );
  }, [layout, nodes.length, edges.length]); // Re-run when structure changes

  // Sync up to parent
  useEffect(() => {
    // Debounce this in a real app
    const timeout = setTimeout(() => {
        // Strip functions from data before saving
        const cleanNodes = nodes.map(({data, ...rest}) => ({
            ...rest,
            data: { label: data.label, depth: data.depth }
        }));
        onChange({ nodes: cleanNodes, edges, layout, theme });
    }, 500);
    return () => clearTimeout(timeout);
  }, [nodes, edges, layout, theme]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const addNode = () => {
    const newId = `n-${Date.now()}`;
    const parentId = nodes.length > 0 ? nodes[0].id : null;
    
    const newNode: Node = {
      id: newId,
      type: 'mindMap',
      data: { label: '新节点', depth: 1 },
      position: { x: 0, y: 0 }, // Layout will fix this
    };

    setNodes((nds) => [...nds, newNode]);
    if (parentId) {
      setEdges((eds) => [...eds, { id: `e-${newId}`, source: parentId, target: newId }]);
    }
  };

  return (
    <div className="w-full h-full bg-white rounded-lg">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        panOnScroll={isEditable}
        zoomOnScroll={isEditable}
        panOnDrag={isEditable}
        nodesDraggable={isEditable}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#f1f5f9" gap={16} />
        {isEditable && (
            <>
                <Controls showInteractive={false} className="bg-white border border-slate-200 shadow-sm" />
                <Panel position="top-right" className="flex flex-col gap-2 bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex gap-1">
                        <button onClick={() => setLayout('tree-right')} className={`p-1.5 rounded ${layout === 'tree-right' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100'}`} title="向右展开"><GitBranch size={16} className="rotate-90" /></button>
                        <button onClick={() => setLayout('tree-down')} className={`p-1.5 rounded ${layout === 'tree-down' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100'}`} title="向下展开"><ArrowDown size={16} /></button>
                        <button onClick={() => setLayout('radial')} className={`p-1.5 rounded ${layout === 'radial' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100'}`} title="发散布局"><Network size={16} /></button>
                        <button onClick={() => setLayout('org-chart')} className={`p-1.5 rounded ${layout === 'org-chart' ? 'bg-blue-100 text-blue-600' : 'hover:bg-slate-100'}`} title="组织架构"><Layout size={16} /></button>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <div className="flex gap-1">
                        <button onClick={() => setTheme('default')} className={`w-5 h-5 rounded-full border border-slate-200 bg-white ${theme==='default'?'ring-2 ring-blue-500':''}`} title="默认"></button>
                        <button onClick={() => setTheme('colorful')} className={`w-5 h-5 rounded-full border border-slate-200 bg-gradient-to-br from-blue-100 to-purple-100 ${theme==='colorful'?'ring-2 ring-blue-500':''}`} title="多彩"></button>
                        <button onClick={() => setTheme('dark')} className={`w-5 h-5 rounded-full border border-slate-600 bg-slate-800 ${theme==='dark'?'ring-2 ring-blue-500':''}`} title="深色"></button>
                        <button onClick={() => setTheme('minimal')} className={`w-5 h-5 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center text-[8px] text-slate-400 ${theme==='minimal'?'ring-2 ring-blue-500':''}`} title="极简">M</button>
                    </div>
                    <div className="h-px bg-slate-100" />
                    <button onClick={addNode} className="text-xs bg-blue-600 text-white px-2 py-1.5 rounded hover:bg-blue-700 transition-colors">添加节点</button>
                </Panel>
            </>
        )}
      </ReactFlow>
    </div>
  );
};

export const MindMap = (props: MindMapProps) => (
    <ReactFlowProvider>
        <MindMapContent {...props} />
    </ReactFlowProvider>
);