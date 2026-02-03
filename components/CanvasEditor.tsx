import React, { useState, useRef, useEffect } from 'react';
import { CanvasItem, ViewTransform, AgentMode, ProjectFile, Board } from '../types';
import { Toolbar } from './Toolbar';
import { CanvasItem as CanvasItemComponent } from './CanvasItem';
import { RightSidebar } from './RightSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({ board, onBack }) => {
  // --- State ---
  const [items, setItems] = useState<CanvasItem[]>(board.items || []);
  const [view, setView] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [files, setFiles] = useState<ProjectFile[]>(INITIAL_FILES);
  
  // Context for Agent (Images selected on canvas)
  const [contextImages, setContextImages] = useState<string[]>([]);

  // Dragging State
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const isPanningRef = useRef(false); // Distinguish between panning and item dragging
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- Helpers ---
  
  // Find a position that doesn't overlap with existing items
  const findSafePosition = (width: number, height: number, startX: number, startY: number): { x: number, y: number } => {
    const PADDING = 20;
    let attemptX = startX;
    let attemptY = startY;
    let hasCollision = true;
    let attempts = 0;
    const maxAttempts = 100; // Prevent infinite loop

    while (hasCollision && attempts < maxAttempts) {
        hasCollision = false;
        
        for (const item of items) {
            if (
                attemptX < item.x + item.width + PADDING &&
                attemptX + width + PADDING > item.x &&
                attemptY < item.y + item.height + PADDING &&
                attemptY + height + PADDING > item.y
            ) {
                hasCollision = true;
                break;
            }
        }

        if (hasCollision) {
            attemptX += 50; 
            if (attemptX > startX + 500) {
                attemptX = startX - 200; 
                attemptY += 50; 
            }
            attempts++;
        }
    }

    return { x: attemptX, y: attemptY };
  };

  const getCenterCoords = () => {
    return {
        x: -view.x / view.scale + window.innerWidth / 2 / view.scale - 150,
        y: -view.y / view.scale + window.innerHeight / 2 / view.scale - 150
    };
  };

  const addItems = (newItemsData: { type: CanvasItem['type'], content: string }[]) => {
    if (newItemsData.length === 0) return;

    const center = getCenterCoords();
    const GAP = 40; 
    
    // Determine dimensions based on type
    const getTypeDims = (type: string) => {
        if (type === 'note') return { w: 200, h: 200 };
        if (type === 'html') return { w: 500, h: 600 };
        if (type === 'image-generator') return { w: 400, h: 480 }; // Includes space for control panel
        if (type === 'video-generator') return { w: 480, h: 400 };
        return { w: 300, h: 300 };
    };

    const firstDims = getTypeDims(newItemsData[0].type);
    const startPos = findSafePosition(firstDims.w, firstDims.h, center.x, center.y);
    
    const newCanvasItems: CanvasItem[] = [];
    let currentX = startPos.x;
    let currentY = startPos.y;

    newItemsData.forEach((data, index) => {
        const dims = getTypeDims(data.type);

        const newItem: CanvasItem = {
            id: Date.now().toString() + Math.random().toString().slice(2, 5) + index,
            type: data.type,
            x: currentX,
            y: currentY,
            width: dims.w,
            height: dims.h,
            content: data.content
        };
        newCanvasItems.push(newItem);
        currentX += dims.w + GAP;
    });
    
    setItems(prev => [...prev, ...newCanvasItems]);
  };

  // --- Event Handlers ---

  useEffect(() => {
    if (selectedId) {
        const item = items.find(i => i.id === selectedId);
        if (item && item.type === 'image' && item.content) {
            if (!contextImages.includes(item.content)) {
                setContextImages(prev => [...prev, item.content!]);
            }
        }
    }
  }, [selectedId, items]); 

  // Native Wheel Event Listener
  useEffect(() => {
      const container = canvasRef.current;
      if (!container) return;

      const handleNativeWheel = (e: WheelEvent) => {
          e.preventDefault(); 
          if (e.ctrlKey || e.metaKey) {
              const zoomIntensity = 0.002; 
              const zoomFactor = -e.deltaY * zoomIntensity;
              setView(prev => {
                  const newScale = Math.min(Math.max(0.1, prev.scale + zoomFactor), 5);
                  return { ...prev, scale: newScale };
              });
          } else {
              setView(prev => ({ 
                  ...prev, 
                  x: prev.x - e.deltaX, 
                  y: prev.y - e.deltaY 
              }));
          }
      };
      container.addEventListener('wheel', handleNativeWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleNativeWheel);
  }, []); 

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return; 
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    isPanningRef.current = true; 
    setSelectedId(null); 
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const rawDx = e.clientX - dragStartRef.current.x;
    const rawDy = e.clientY - dragStartRef.current.y;

    if (selectedId && !isPanningRef.current) {
      const dx = rawDx / view.scale;
      const dy = rawDy / view.scale;
      setItems(prev => prev.map(item => item.id === selectedId ? { ...item, x: item.x + dx, y: item.y + dy } : item));
    } else {
      setView(prev => ({ ...prev, x: prev.x + rawDx, y: prev.y + rawDy }));
    }
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
    isPanningRef.current = false;
  };

  return (
    <div className="w-full h-full relative bg-slate-100 overflow-hidden font-sans flex">
      <div className="flex-1 relative h-full overflow-hidden">
        <div 
            ref={canvasRef}
            className={`w-full h-full touch-none ${isPanningRef.current ? 'cursor-grabbing' : 'cursor-grab'}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            <div 
            style={{ 
                transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
                transformOrigin: '0 0',
                width: '100%',
                height: '100%'
            }}
            >
                <div 
                    className="absolute -top-[5000px] -left-[5000px] w-[10000px] h-[10000px] pointer-events-none opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                />
                {items.map(item => (
                    <CanvasItemComponent 
                    key={item.id} 
                    item={item} 
                    isSelected={selectedId === item.id}
                    onSelect={(e) => {
                        e.stopPropagation(); 
                        setSelectedId(item.id);
                        dragStartRef.current = { x: e.clientX, y: e.clientY };
                        setIsDragging(true);
                        isPanningRef.current = false; 
                    }}
                    />
                ))}
            </div>
        </div>

        {/* Top Header */}
        <div className="absolute top-4 left-4 right-4 h-14 pointer-events-none flex justify-between items-start z-30">
            <div className="flex items-center gap-3 pointer-events-auto">
                <button onClick={onBack} className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg p-2 hover:bg-slate-50 text-slate-600">
                    <ChevronLeft size={20} />
                </button>
                <div className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg px-4 py-2 flex items-center gap-3">
                    <div className="bg-blue-600 w-8 h-8 rounded flex items-center justify-center text-white font-bold">IF</div>
                    <div>
                        <h1 className="text-sm font-bold text-slate-800">{board.title}</h1>
                        <p className="text-[10px] text-slate-500">{board.workspace === 'team' ? '团队空间' : '个人空间'}</p>
                    </div>
                </div>
            </div>
             <div className="bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-lg px-2 py-2 pointer-events-auto flex items-center gap-2">
                 <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
                    {isSidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                 </button>
            </div>
        </div>

        <Toolbar 
            onAddNote={() => addItems([{ type: 'note', content: '新想法' }])}
            onAddShape={() => addItems([{ type: 'shape', content: '' }])}
            onAddImageGen={() => addItems([{ type: 'image-generator', content: '' }])}
            onAddVideoGen={() => addItems([{ type: 'video-generator', content: '' }])}
            setModeSelect={() => setSelectedId(null)}
            isSelectionMode={selectedId === null}
        />
        
        {/* Zoom Controls */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md border border-slate-200 p-1 flex gap-1 z-30">
            <button className="p-2 hover:bg-slate-100 rounded text-slate-600" onClick={() => setView(v => ({...v, scale: Math.max(0.1, v.scale - 0.2)}))}>-</button>
            <div className="px-2 py-2 text-sm text-slate-500 min-w-[3rem] text-center">{Math.round(view.scale * 100)}%</div>
            <button className="p-2 hover:bg-slate-100 rounded text-slate-600" onClick={() => setView(v => ({...v, scale: Math.min(5, v.scale + 0.2)}))}>+</button>
        </div>
      </div>

      {/* Right Sidebar Area */}
      {isSidebarOpen && (
          <div className="w-96 h-full relative z-40">
              <RightSidebar 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                files={files}
                contextImages={contextImages}
                onUploadFile={(cat, file) => setFiles(prev => [...prev, file])}
                onAddContentToCanvas={(items) => {
                    addItems(items);
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
              />
          </div>
      )}

    </div>
  );
}