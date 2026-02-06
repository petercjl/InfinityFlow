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
  Panel
} from 'reactflow';
import 'reactflow/dist/style.css';

import { CanvasItem, ProjectFile, Board, CanvasEdge } from '../types';
import { Toolbar } from './Toolbar';
import { RightSidebar } from './RightSidebar';
import { ChevronLeft, ChevronRight, Check, Loader2, Cloud } from 'lucide-react';
import { saveBoardItems, getBoardItems } from '../services/geminiService';

// Import Custom Nodes
import NoteNode from './nodes/NoteNode';
import TextNode from './nodes/TextNode';
import MindMapNodeItem from './nodes/MindMapNodeItem';
import GeneralNode from './nodes/GeneralNode';

const nodeTypes: NodeTypes = {
  'note': NoteNode,
  'text': TextNode,
  'mindmap-node': MindMapNodeItem,
  'general': GeneralNode
};

// --- Helpers to convert between CanvasItem and ReactFlow Node ---

const itemToNode = (item: CanvasItem): Node => {
    const isSpecial = ['note', 'text', 'mindmap-node'].includes(item.type);
    return {
        id: item.id,
        type: isSpecial ? item.type : 'general',
        position: { x: item.x, y: item.y },
        style: { width: item.width, height: item.height }, // ReactFlow uses style for dimensions usually
        data: {
            content: item.content,
            color: item.color,
            meta: item.meta,
            itemType: item.type, // Store original type for GeneralNode
            // We'll inject update handlers in the component render
        },
    };
};

const nodeToItem = (node: Node): CanvasItem => {
    // Determine type: if it's 'general', check data.itemType
    const type = node.type === 'general' ? (node.data.itemType || 'shape') : (node.type as CanvasItem['type']);
    
    return {
        id: node.id,
        type: type,
        x: node.position.x,
        y: node.position.y,
        width: node.style?.width ? Number(node.style.width) : (node.width || 200),
        height: node.style?.height ? Number(node.style.height) : (node.height || 200),
        content: node.data.content,
        color: node.data.color,
        meta: node.data.meta,
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

    // Save Status
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const ignoreNextSaveRef = useRef(true);

    // Header Title
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [tempTitle, setTempTitle] = useState(board.title);

    // Sync title
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
                    // Edges: If backend supports edges, load them. For now assume empty or mock logic needed.
                    // For this refactor, let's use board.edges if provided via props, else empty.
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

    // Inject Handlers into Nodes
    // We update nodes whenever their data structure implies a need, OR we use the onNodesChange for position
    // BUT for content change (textarea), we need to update node data.
    const onNodeContentChange = useCallback((id: string, newContent: string) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return { ...node, data: { ...node.data, content: newContent } };
            }
            return node;
        }));
    }, [setNodes]);

    // Inject callbacks into node data whenever nodes change (to ensure handlers are fresh)
    useEffect(() => {
        setNodes((nds) => nds.map((node) => ({
            ...node,
            data: {
                ...node.data,
                onContentChange: (val: string) => onNodeContentChange(node.id, val)
            }
        })));
    }, [onNodeContentChange, setNodes]);


    // Auto Save
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

    // Handlers
    const onConnect = useCallback((params: Connection) => {
        setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: true }, eds));
    }, [setEdges]);

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

        const newNode: Node = {
            id: Date.now().toString(),
            type: ['note', 'text', 'mindmap-node'].includes(type) ? type : 'general',
            position: { x, y },
            data: { 
                content, 
                itemType: itemType || type, // For GeneralNode
                onContentChange: (val: string) => onNodeContentChange(newNode.id, val)
            },
            style: { 
                width: type === 'note' ? 200 : type === 'mindmap-node' ? 150 : 300, 
                height: type === 'note' ? 200 : type === 'mindmap-node' ? 50 : 300 
            },
        };

        setNodes((nds) => nds.concat(newNode));
    };

    const handleRenameFile = (fileId: string, newName: string) => {
        setFiles(prev => prev.map(f => f.id === fileId ? { ...f, name: newName } : f));
    };

    const handleSaveTitle = () => {
        if (tempTitle.trim() && tempTitle !== board.title) {
            onRenameBoard(tempTitle.trim());
        } else {
            setTempTitle(board.title);
        }
        setIsEditingTitle(false);
    };

    // Context Image Logic (Simple: last selected image node)
    // We can use onSelectionChange provided by ReactFlow
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
                    fitView
                    snapToGrid
                    snapGrid={[15, 15]}
                    defaultEdgeOptions={{ type: 'smoothstep', animated: true, style: { strokeWidth: 2, stroke: '#94a3b8' } }}
                    minZoom={0.1}
                    maxZoom={4}
                    proOptions={{ hideAttribution: true }}
                    style={{ width: '100%', height: '100%' }}
                >
                    <Background color="#cbd5e1" gap={20} />
                    <Controls showInteractive={false} className="bg-white border border-slate-200 shadow-sm" />
                    <MiniMap className="border border-slate-200 shadow-sm rounded-lg overflow-hidden" zoomable pannable />
                    
                    {/* Header Panel inside ReactFlow to sit on top */}
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
                    onAddMindMapNode={() => handleAddNode('mindmap-node', '新节点')}
                    onAddShape={() => handleAddNode('general', 'Shape', 'shape')}
                    onAddImageGen={() => handleAddNode('general', '', 'image-generator')}
                    onAddVideoGen={() => handleAddNode('general', '', 'video-generator')}
                    setModeSelect={() => {}} // ReactFlow handles selection mode by default
                    isSelectionMode={true} // Always selection mode in ReactFlow basically
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