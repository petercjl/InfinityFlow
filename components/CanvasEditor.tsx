import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Controls,
  Background,
  MiniMap,
  ReactFlowProvider,
  NodeTypes,
  ReactFlowInstance,
  Panel,
  MarkerType,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CanvasItem, ProjectFile, Board, ItemType } from '../types';
import { Toolbar } from './Toolbar';
import { RightSidebar } from './RightSidebar';
import { ChevronLeft, ChevronRight, Check, Loader2, Cloud } from 'lucide-react';
import { saveBoardItems, getBoardItems } from '../services/geminiService';
import { recalculateMindMapLayout } from './MindMap/layoutUtils';

// Import Custom Nodes
import NoteNode from './nodes/NoteNode';
import TextNode from './nodes/TextNode';
import GeneralNode from './nodes/GeneralNode';
import MindMapRootNode from './nodes/MindMapRootNode';
import MindMapChildNode from './nodes/MindMapChildNode';

const nodeTypes: NodeTypes = {
  'note': NoteNode,
  'text': TextNode,
  'general': GeneralNode,
  'mindmap-root': MindMapRootNode,
  'mindmap-child': MindMapChildNode
};

// --- Color Palette for Mind Map ---
const MINDMAP_COLORS = [
    '#ef4444', // Red
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
];

// --- Helpers ---

const itemToNode = (item: CanvasItem): Node => {
    // Special handling for MindMap specific nodes
    const isMindMap = item.type === 'mindmap-root' || item.type === 'mindmap-child';
    const isGeneral = ['image', 'video', 'shape', 'html', 'image-generator', 'video-generator'].includes(item.type);
    
    return {
        id: item.id,
        type: isGeneral ? 'general' : item.type,
        position: { x: item.x, y: item.y },
        // MindMap nodes calculate size dynamically, others use explicit size
        style: isMindMap ? undefined : { width: item.width, height: item.height },
        data: {
            content: item.content,
            color: item.color,
            meta: item.meta,
            itemType: isGeneral ? item.type : undefined,
            isCollapsed: item.meta?.isCollapsed,
            rootId: item.meta?.rootId,
            parentId: item.meta?.parentId
        },
    };
};

const nodeToItem = (node: Node): CanvasItem => {
    // Check if it's a general node (wrapper) or a specific type
    let type = node.type;
    let itemType: ItemType = 'shape'; // Default fallback

    if (type === 'general') {
        itemType = (node.data.itemType || 'shape') as ItemType;
    } else {
        itemType = type as ItemType;
    }

    return {
        id: node.id,
        type: itemType,
        x: node.position.x,
        y: node.position.y,
        width: node.style?.width ? Number(node.style.width) : (node.width || 200),
        height: node.style?.height ? Number(node.style.height) : (node.height || 40),
        content: node.data.content,
        color: node.data.color,
        meta: {
            ...node.data.meta,
            rootId: node.data.rootId,
            parentId: node.data.parentId,
            isCollapsed: node.data.isCollapsed
        },
    };
};

// Initial Mock Files
const INITIAL_FILES: ProjectFile[] = [
    {
        id: '1',
        name: 'Q3_销售数据.xlsx',
        type: 'excel',
        category: 'CategoryRankings',
        uploadDate: '2023-10-01',
        content: 'Date,Product,Revenue,Customer Rating\n2023-09-01,Widget A,1200,4.5'
    },
    {
        id: '2',
        name: '产品需求文档.pdf',
        type: 'pdf',
        category: 'AnalysisReports',
        uploadDate: '2023-10-05',
        content: '<div class="p-4 bg-white"><h1>历史分析</h1><p>趋势良好。</p></div>'
    }
];

interface CanvasEditorProps {
    board: Board;
    onBack: () => void;
    onRenameBoard: (newName: string) => void;
}

const EditorContent: React.FC<CanvasEditorProps> = ({ board, onBack, onRenameBoard }) => {
    // ReactFlow State
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);

    // Sidebar & UI State
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES);
    const [contextImages, setContextImages] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Edit State for nodes (inline editing)
    const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

    // Save Status
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ignoreNextSaveRef = useRef(true);

    // Header Title
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(board.title);

    useEffect(() => { setTempTitle(board.title); }, [board.title]);

    // Initial Load
    useEffect(() => {
        let isMounted = true;
        const loadItems = async () => {
            setIsLoading(true);
            const backendItems = await getBoardItems(board.id);
            if (isMounted) {
                if (backendItems && backendItems.length > 0) {
                    const loadedNodes = backendItems.map(itemToNode);
                    setNodes(loadedNodes);
                    // Load edges if available from backend (stored in board for now in mock)
                    if (board.edges) {
                        setEdges(board.edges);
                    }
                    ignoreNextSaveRef.current = true;
                }
                setIsLoading(false);
                setSaveStatus('saved');
            }
        };
        loadItems();
        return () => { isMounted = false; };
    }, [board.id, board.edges, setNodes, setEdges]);

    // Auto Save (Triggered by nodes/edges change)
    useEffect(() => {
        if (ignoreNextSaveRef.current) {
            ignoreNextSaveRef.current = false;
            return;
        }
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        setSaveStatus('unsaved');
        saveTimeoutRef.current = setTimeout(() => {
            setSaveStatus('saving');
            const itemsToSave = nodes.map(nodeToItem);
            saveBoardItems(board.id, itemsToSave).then(() => setSaveStatus('saved'));
        }, 1500);

        return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
    }, [nodes, edges, board.id]);

    // --- Interaction Handlers ---

    // 1. Content Update (Text inputs inside nodes)
    const onNodeContentChange = useCallback((id: string, newContent: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, content: newContent } };
            }
            return node;
        }));
    }, [setNodes]);

    // 2. Collapse Toggle
    const toggleCollapse = useCallback((nodeId: string) => {
        setNodes(nds => {
            const node = nds.find(n => n.id === nodeId);
            if (!node) return nds;

            const isCollapsed = !node.data.isCollapsed;
            
            // Helper to find all descendants
            const getDescendants = (parentId: string, allNodes: Node[], allEdges: Edge[]): string[] => {
                const children = allEdges.filter(e => e.source === parentId).map(e => e.target);
                let descendants = [...children];
                children.forEach(child => {
                    descendants = [...descendants, ...getDescendants(child, allNodes, allEdges)];
                });
                return descendants;
            };

            const descendants = getDescendants(nodeId, nds, edges);
            
            return nds.map(n => {
                if (n.id === nodeId) {
                    return { ...n, data: { ...n.data, isCollapsed } };
                }
                if (descendants.includes(n.id)) {
                    // Hide/Show descendants
                    return { ...n, hidden: isCollapsed };
                }
                return n;
            });
        });
        
        // Trigger Layout Recalculation after state update
        requestAnimationFrame(() => updateMindMapLayout(nodeId));

    }, [edges, setNodes]);

    // 3. Inject handlers into node data
    useEffect(() => {
        setNodes((nds) => nds.map((node) => {
            const isMindMap = node.type === 'mindmap-root' || node.type === 'mindmap-child';
            // Determine if node has children for the collapse button
            const hasChildren = isMindMap ? edges.some(e => e.source === node.id) : false;

            return {
                ...node,
                data: {
                    ...node.data,
                    onContentChange: (val: string) => onNodeContentChange(node.id, val),
                    isEditing: editingNodeId === node.id,
                    stopEditing: () => setEditingNodeId(null),
                    onToggleCollapse: () => toggleCollapse(node.id),
                    hasChildren
                }
            };
        }));
    }, [onNodeContentChange, editingNodeId, edges, toggleCollapse, setNodes]);


    // --- Layout Engine ---
    
    const updateMindMapLayout = useCallback((nodeId: string) => {
        // 1. Find the root of this mindmap
        const findRoot = (currId: string): string => {
            const parentEdge = edges.find(e => e.target === currId);
            if (!parentEdge) return currId;
            return findRoot(parentEdge.source);
        };
        const rootId = findRoot(nodeId);

        // 2. Calculate new positions
        setNodes(currentNodes => {
             const updates = recalculateMindMapLayout(rootId, currentNodes, edges);
             return currentNodes.map(n => {
                 const update = updates.find(u => u.id === n.id);
                 if (update) {
                     return { ...n, position: update.position };
                 }
                 return n;
             });
        });

    }, [edges, setNodes]);


    // --- Advanced Features: Navigation & Reparenting ---

    // Keyboard Navigation (Alt + Arrow)
    const navigate = useCallback((direction: 'top' | 'bottom' | 'left' | 'right') => {
        if (!rfInstance) return;
        
        const selectedNodes = rfInstance.getNodes().filter(n => n.selected);
        if (selectedNodes.length !== 1) return;

        const selectedNode = selectedNodes[0];
        // Allow navigation only on mind map nodes for now to match prompt requirement
        if (!selectedNode.type?.startsWith('mindmap')) return;

        const { x, y } = selectedNode.position;
        // Use visual width/height approximation if actual not set yet
        const nodeWidth = selectedNode.width || (selectedNode.type === 'mindmap-root' ? 180 : 140);
        const nodeHeight = selectedNode.height || 44;
        
        const centerX = x + nodeWidth / 2;
        const centerY = y + nodeHeight / 2;

        const allMindMapNodes = rfInstance.getNodes().filter(n =>
            (n.type === 'mindmap-root' || n.type === 'mindmap-child') && !n.hidden && n.id !== selectedNode.id
        );

        // Filter and Find Closest
        const candidates = allMindMapNodes.filter(n => {
            const nW = n.width || 120;
            const nH = n.height || 40;
            const nCX = n.position.x + nW / 2;
            const nCY = n.position.y + nH / 2;

            switch (direction) {
                case 'right': return n.position.x > x;
                case 'left': return n.position.x < x;
                case 'top': return n.position.y < y;
                case 'bottom': return n.position.y > y;
            }
            return false;
        });

        if (candidates.length === 0) return;

        // Sort by Euclidean distance from center to center
        candidates.sort((a, b) => {
            const aW = a.width || 120, aH = a.height || 40;
            const bW = b.width || 120, bH = b.height || 40;
            
            const distA = Math.hypot((a.position.x + aW/2) - centerX, (a.position.y + aH/2) - centerY);
            const distB = Math.hypot((b.position.x + bW/2) - centerX, (b.position.y + bH/2) - centerY);
            
            return distA - distB;
        });

        const target = candidates[0];
        
        // Select target
        setNodes(nds => nds.map(n => ({ ...n, selected: n.id === target.id })));
        
        // Optional: Smooth pan
        // rfInstance.fitView({ nodes: [target], duration: 300, padding: 2 }); 

    }, [rfInstance, setNodes]);

    // Drag to Reparent
    const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
        if (node.type !== 'mindmap-child') return;

        const allNodes = rfInstance?.getNodes() || [];
        
        // Find a nearby node to attach to
        const nearbyNode = allNodes.find(n => {
            if (n.id === node.id) return false;
            // Only attach to other mindmap nodes
            if (n.type !== 'mindmap-root' && n.type !== 'mindmap-child') return false;
            if (n.hidden) return false;

            const nWidth = n.width || 150;
            
            // Logic: Is 'node' to the right of 'n'?
            // Distance horizontal: node.x - (n.x + n.width)
            const dx = node.position.x - (n.position.x + nWidth);
            const dy = Math.abs(node.position.y - n.position.y);

            // Thresholds: 
            // Horizontal: 20px to 300px to the right
            // Vertical: Within 100px up or down
            return dx > 20 && dx < 300 && dy < 150;
        });

        if (nearbyNode) {
            const oldParentId = node.data.parentId;
            const newParentId = nearbyNode.id;

            // Prevent attaching to own descendant to avoid cycles
            // Simple check: don't attach if newParent's root is the dragged node (not fully robust but prevents simple loops)
            if (oldParentId !== newParentId) {
                // Remove old edge
                setEdges(eds => {
                    const filtered = eds.filter(e => !(e.target === node.id));
                    // Add new edge
                    const newEdge: Edge = {
                        id: `e-${newParentId}-${node.id}`,
                        source: newParentId,
                        target: node.id,
                        type: 'default', // Bezier
                        style: { stroke: nearbyNode.data.color || '#cbd5e1', strokeWidth: 2 }
                    };
                    return [...filtered, newEdge];
                });

                // Update Node Data
                setNodes(nds => nds.map(n => {
                    if (n.id === node.id) {
                        return { 
                            ...n, 
                            data: { 
                                ...n.data, 
                                parentId: newParentId,
                                color: nearbyNode.data.color // Inherit new parent color
                            } 
                        };
                    }
                    return n;
                }));

                // Trigger Layout
                setTimeout(() => updateMindMapLayout(newParentId), 50);
                // Also layout old parent if it exists to close gap
                if (oldParentId) setTimeout(() => updateMindMapLayout(oldParentId), 50);
            }
        }
    }, [rfInstance, setEdges, setNodes, updateMindMapLayout]);


    // --- Creation Handlers ---

    const handleAddNode = (type: string, content: string = '', itemType?: string) => {
        let x = 100, y = 100;
        if (rfInstance) {
             const center = rfInstance.project({ 
                x: window.innerWidth / 2 - 200, 
                y: window.innerHeight / 2 
            });
            x = center.x + (Math.random() - 0.5) * 50;
            y = center.y + (Math.random() - 0.5) * 50;
        }

        const isGeneral = ['shape', 'image', 'video', 'html', 'image-generator', 'video-generator'].includes(itemType || type);

        const newNode: Node = {
            id: Date.now().toString(),
            type: isGeneral ? 'general' : type,
            position: { x, y },
            data: { 
                content, 
                itemType: itemType || type
            },
            style: { 
                width: type === 'note' ? 200 : 300, 
                height: type === 'note' ? 200 : 40 
            },
        };
        setNodes((nds) => nds.concat(newNode));
    };

    const handleAddMindMap = () => {
        if (!rfInstance) return;
        const center = rfInstance.project({ 
            x: window.innerWidth / 2, 
            y: window.innerHeight / 2 
        });

        const rootId = `root-${Date.now()}`;
        const rootNode: Node = {
            id: rootId,
            type: 'mindmap-root',
            position: center,
            data: { content: '中心主题', rootId: rootId }
        };

        const child1Id = `child-${Date.now()}-1`;
        const color1 = MINDMAP_COLORS[0];
        const child1: Node = {
            id: child1Id,
            type: 'mindmap-child',
            position: { x: center.x + 200, y: center.y - 50 },
            data: { content: '分支 1', rootId: rootId, parentId: rootId, color: color1 }
        };

        const child2Id = `child-${Date.now()}-2`;
        const color2 = MINDMAP_COLORS[1];
        const child2: Node = {
            id: child2Id,
            type: 'mindmap-child',
            position: { x: center.x + 200, y: center.y + 50 },
            data: { content: '分支 2', rootId: rootId, parentId: rootId, color: color2 }
        };

        const edge1: Edge = { id: `e-${rootId}-${child1Id}`, source: rootId, target: child1Id, type: 'default', style: { stroke: color1, strokeWidth: 2 } };
        const edge2: Edge = { id: `e-${rootId}-${child2Id}`, source: rootId, target: child2Id, type: 'default', style: { stroke: color2, strokeWidth: 2 } };

        setNodes(nds => [...nds, rootNode, child1, child2]);
        setEdges(eds => [...eds, edge1, edge2]);
        
        setTimeout(() => updateMindMapLayout(rootId), 50);
    };

    // --- Keyboard Shortcuts ---

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const isEditing = editingNodeId !== null;
        
        // --- 1. Navigation (Alt + Arrows) ---
        if (e.altKey && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            const keyMap: Record<string, 'top' | 'bottom' | 'left' | 'right'> = {
                'ArrowUp': 'top',
                'ArrowDown': 'bottom',
                'ArrowLeft': 'left',
                'ArrowRight': 'right'
            };
            const direction = keyMap[e.key];
            if (direction) {
                navigate(direction);
            }
            return;
        }

        // --- 2. Start Editing (Space) ---
        if (e.key === ' ' && !isEditing) {
            const selectedNodes = rfInstance?.getNodes().filter(n => n.selected) || [];
            if (selectedNodes.length === 1 && selectedNodes[0].type?.startsWith('mindmap')) {
                e.preventDefault();
                setEditingNodeId(selectedNodes[0].id);
                return;
            }
        }

        // Only trigger following shortcuts if NOT editing (except specifically handled keys)
        if (isEditing && e.key !== 'Tab' && e.key !== 'Enter') return;

        // Get selected node
        const selectedIds = rfInstance?.getNodes().filter(n => n.selected).map(n => n.id) || [];
        if (selectedIds.length !== 1) return; 

        const selectedNode = rfInstance?.getNode(selectedIds[0]);
        if (!selectedNode || !selectedNode.type?.startsWith('mindmap')) return;

        // --- 3. Add Child (Tab) ---
        if (e.key === 'Tab') {
            e.preventDefault();
            const newId = `node-${Date.now()}`;
            
            // Determine Color
            let newColor = selectedNode.data.color;
            if (selectedNode.type === 'mindmap-root') {
                 // Pick a random/next color for root's immediate children
                 const childCount = edges.filter(ed => ed.source === selectedNode.id).length;
                 newColor = MINDMAP_COLORS[childCount % MINDMAP_COLORS.length];
            }

            const newNode: Node = {
                id: newId,
                type: 'mindmap-child',
                position: { x: selectedNode.position.x + 150, y: selectedNode.position.y },
                data: { content: '子主题', rootId: selectedNode.data.rootId, parentId: selectedNode.id, color: newColor }
            };
            const newEdge: Edge = {
                id: `e-${selectedNode.id}-${newId}`,
                source: selectedNode.id,
                target: newId,
                type: 'default',
                style: { stroke: newColor, strokeWidth: 2 }
            };

            setNodes(nds => [...nds, newNode]);
            setEdges(eds => [...eds, newEdge]);
            
            setEditingNodeId(newId);
            setTimeout(() => {
                setNodes(nds => nds.map(n => ({ ...n, selected: n.id === newId })));
                updateMindMapLayout(selectedNode.id);
            }, 10);
        }

        // --- 4. Add Sibling (Enter) ---
        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedNode.type === 'mindmap-root') return;

            const parentId = selectedNode.data.parentId;
            if (!parentId) return;
            const parentNode = rfInstance?.getNode(parentId);
            if (!parentNode) return;

            const newId = `node-${Date.now()}`;
            
            // Sibling inherits same color as current node
            const color = selectedNode.data.color;

            const newNode: Node = {
                id: newId,
                type: 'mindmap-child',
                position: { x: selectedNode.position.x, y: selectedNode.position.y + 50 },
                data: { content: '分支主题', rootId: selectedNode.data.rootId, parentId: parentId, color }
            };
            const newEdge: Edge = {
                id: `e-${parentId}-${newId}`,
                source: parentId,
                target: newId,
                type: 'default',
                style: { stroke: color, strokeWidth: 2 }
            };

            setNodes(nds => [...nds, newNode]);
            setEdges(eds => [...eds, newEdge]);
            
            setEditingNodeId(newId);
            setTimeout(() => {
                setNodes(nds => nds.map(n => ({ ...n, selected: n.id === newId })));
                updateMindMapLayout(parentId);
            }, 10);
        }

        // --- 5. Delete ---
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (isEditing) return; 
            if (selectedNode.type === 'mindmap-root') return; 

            const parentId = selectedNode.data.parentId;
            
            // Recursive delete
            const getDescendants = (rootId: string): string[] => {
                const childEdges = edges.filter(ed => ed.source === rootId);
                let ids = [rootId];
                childEdges.forEach(ce => {
                    ids = [...ids, ...getDescendants(ce.target)];
                });
                return ids;
            };

            const nodesToDelete = getDescendants(selectedNode.id);
            
            setNodes(nds => nds.filter(n => !nodesToDelete.includes(n.id)));
            setEdges(eds => eds.filter(ed => !nodesToDelete.includes(ed.source) && !nodesToDelete.includes(ed.target)));
            
            if (parentId) {
                setNodes(nds => nds.map(n => ({ ...n, selected: n.id === parentId })));
                setTimeout(() => updateMindMapLayout(parentId), 10);
            }
        }

    }, [editingNodeId, rfInstance, edges, updateMindMapLayout, setNodes, setEdges, navigate]);


    // --- Other Handlers ---

    const handleSaveTitle = () => {
        if (tempTitle.trim() && tempTitle !== board.title) {
            onRenameBoard(tempTitle.trim());
        } else {
            setTempTitle(board.title);
        }
        setIsEditingTitle(false);
    };

    const onSelectionChange = useCallback(({ nodes: selectedNodes }: { nodes: Node[] }) => {
        const imgNodes = selectedNodes.filter(n => n.type === 'general' && n.data.itemType === 'image');
        if (imgNodes.length > 0) {
            const urls = imgNodes.map(n => n.data.content).filter(Boolean);
            setContextImages(prev => {
                const newUrls = urls.filter(u => !prev.includes(u));
                return [...prev, ...newUrls];
            });
        }
    }, []);
    
    // Connect handler
    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds));
    }, [setEdges]);

    const handleRenameFile = (fileId: string, newName: string) => {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f));
    };

    return (
        <div className="w-full h-full flex bg-slate-100 font-sans overflow-hidden">
             
             {/* Main Canvas Area */}
             <div className="flex-1 relative h-full">
                {isLoading && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/50 backdrop-blur-sm">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                )}

                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    nodeTypes={nodeTypes}
                    onInit={setRfInstance}
                    onSelectionChange={onSelectionChange}
                    onNodeDragStop={onNodeDragStop}
                    onNodeDoubleClick={(e, node) => {
                        // Enter edit mode
                        if(node.type?.startsWith('mindmap')) {
                            setEditingNodeId(node.id);
                        }
                    }}
                    fitView
                    snapToGrid
                    snapGrid={[15, 15]}
                    defaultEdgeOptions={{ type: 'default', animated: false, style: { strokeWidth: 2, stroke: '#cbd5e1' } }}
                    minZoom={0.1}
                    maxZoom={4}
                    proOptions={{ hideAttribution: true }}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Background color="#cbd5e1" gap={20} />
                    <Controls showInteractive={false} className="bg-white border border-slate-200 shadow-sm" />
                    <MiniMap className="border border-slate-200 shadow-sm rounded-lg overflow-hidden" zoomable pannable />
                    
                    {/* Header Panel */}
                    <Panel position="top-left" className="m-4 flex gap-3 pointer-events-auto">
                        <button onClick={onBack} className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg p-2 hover:bg-slate-50 text-slate-600">
                            <ChevronLeft size={20} />
                        </button>
                        <div className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg px-4 py-2 flex items-center gap-3 min-w-[240px] max-w-md">
                            <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center text-white font-bold flex-shrink-0">IF</div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                {isEditingTitle ? (
                                    <input 
                                        autoFocus
                                        className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-blue-500 outline-none p-0"
                                        value={tempTitle}
                                        onChange={e => setTempTitle(e.target.value)}
                                        onBlur={handleSaveTitle}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveTitle();
                                            if (e.key === 'Escape') {
                                                setTempTitle(board.title);
                                                setIsEditingTitle(false);
                                            }
                                        }}
                                    />
                                ) : (
                                    <h1 
                                        onClick={() => setIsEditingTitle(true)}
                                        className="text-sm font-bold text-slate-800 cursor-text hover:bg-slate-100/50 rounded -ml-1 px-1 transition-colors truncate"
                                    >
                                        {board.title}
                                    </h1>
                                )}
                                <p className="text-[10px] text-slate-500 leading-none mt-0.5">{board.workspace === 'team' ? '团队空间' : '个人空间'}</p>
                            </div>
                        </div>
                        <div className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg px-3 py-2 flex items-center gap-2 text-[10px] font-medium text-slate-500">
                            {saveStatus === 'saving' && <><Loader2 size={12} className="animate-spin" /> 保存中...</>}
                            {saveStatus === 'saved' && <><Check size={12} className="text-green-500" /> 已保存</>}
                            {saveStatus === 'unsaved' && <><Cloud size={12} /> 未保存</>}
                        </div>
                    </Panel>

                    <Panel position="top-right" className="m-4 pointer-events-auto">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg p-2 hover:bg-slate-50 text-slate-600">
                            {isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        </button>
                    </Panel>
                </ReactFlow>

                <Toolbar 
                    onAddText={() => handleAddNode('text', '')}
                    onAddNote={() => handleAddNode('note', '')}
                    onAddMindMapNode={handleAddMindMap}
                    onAddShape={() => handleAddNode('general', 'Shape', 'shape')}
                    onAddImageGen={() => handleAddNode('general', '', 'image-generator')}
                    onAddVideoGen={() => handleAddNode('general', '', 'video-generator')}
                    setModeSelect={() => {}} 
                    isSelectionMode={true} 
                />
             </div>

             {/* Right Sidebar */}
             {isSidebarOpen && (
                 <div className="w-96 h-full relative z-40">
                     <RightSidebar 
                        isOpen={isSidebarOpen}
                        onClose={() => setIsSidebarOpen(false)}
                        files={files}
                        contextImages={contextImages}
                        onRemoveContextImage={(img) => setContextImages(prev => prev.filter(i => i !== img))}
                        onUploadFile={(cat, file) => setFiles(prev => [...prev, file])}
                        onAddContentToCanvas={(items) => {
                            items.forEach(i => handleAddNode('general', i.content, i.type));
                        }}
                        onSaveReport={(html) => {
                            const newFile: ProjectFile = {
                                id: Date.now().toString(),
                                name: `分析报告_${new Date().toLocaleTimeString()}.html`,
                                type: 'text',
                                category: 'AnalysisReports',
                                content: html,
                                uploadDate: '刚刚'
                            };
                            setFiles(prev => [...prev, newFile]);
                        }}
                        onRenameFile={handleRenameFile}
                     />
                 </div>
             )}
        </div>
    );
};

export const CanvasEditor = (props: CanvasEditorProps) => (
    <ReactFlowProvider>
        <EditorContent {...props} />
    </ReactFlowProvider>
);