
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { MindMapData, MindMapNodeData } from '../../types';
import { 
  calculateMindMapLayout, 
  LayoutNode, 
  addChildNode, 
  addSiblingNode, 
  deleteNode, 
  toggleCollapse,
  moveNode,
  createNode
} from './layoutUtils';
import { ChevronRight, GripVertical, Plus } from 'lucide-react';

interface MindMapProps {
  initialData?: MindMapData;
  onChange?: (data: MindMapData) => void;
  isEditable?: boolean;
}

const DEFAULT_DATA: MindMapData = {
  rootId: 'root',
  nodes: {
    'root': { id: 'root', text: '中心主题', parentId: null, children: ['n1', 'n2'] },
    'n1': { id: 'n1', text: '分支主题 1', parentId: 'root', children: [] },
    'n2': { id: 'n2', text: '分支主题 2', parentId: 'root', children: ['n2-1'] },
    'n2-1': { id: 'n2-1', text: '子节点 A', parentId: 'n2', children: [] },
  }
};

export const MindMap: React.FC<MindMapProps> = ({ initialData, onChange, isEditable = true }) => {
  const [data, setData] = useState<MindMapData>(initialData && initialData.rootId ? initialData : DEFAULT_DATA);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dragTargetId, setDragTargetId] = useState<string | null>(null);
  
  // Calculate layout whenever data changes
  const layout = useMemo(() => calculateMindMapLayout(data), [data]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync back to parent
  useEffect(() => {
    if (onChange) onChange(data);
  }, [data, onChange]);

  // --- Actions ---

  const handleSelect = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setEditingId(null);
  };

  const handleEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    setEditingId(id);
  };

  const handleUpdateText = (id: string, newText: string) => {
    setData(prev => ({
      ...prev,
      nodes: {
        ...prev.nodes,
        [id]: { ...prev.nodes[id], text: newText }
      }
    }));
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!selectedId || editingId || !isEditable) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const newData = addChildNode(data, selectedId);
      setData(newData);
      // Select the newly created child (last child of selected)
      const updatedParent = newData.nodes[selectedId];
      if (updatedParent.children.length > 0) {
          const newChildId = updatedParent.children[updatedParent.children.length - 1];
          setSelectedId(newChildId);
          setEditingId(newChildId);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedId === data.rootId) return; // Cannot add sibling to root
      const newData = addSiblingNode(data, selectedId);
      setData(newData);
       // Select new sibling (next to current)
      const parentId = data.nodes[selectedId].parentId!;
      const updatedParent = newData.nodes[parentId];
      const idx = updatedParent.children.indexOf(selectedId);
      if (idx !== -1 && idx + 1 < updatedParent.children.length) {
          const newSiblingId = updatedParent.children[idx+1];
          setSelectedId(newSiblingId);
          setEditingId(newSiblingId);
      }
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      if (selectedId === data.rootId) return;
      const parentId = data.nodes[selectedId].parentId!;
      const newData = deleteNode(data, selectedId);
      setData(newData);
      setSelectedId(parentId);
    } else if (e.key === 'ArrowLeft') {
       e.preventDefault();
       const node = data.nodes[selectedId];
       if (node.parentId) setSelectedId(node.parentId);
    } else if (e.key === 'ArrowRight') {
       e.preventDefault();
       const node = data.nodes[selectedId];
       if (node.children.length > 0 && !node.isCollapsed) setSelectedId(node.children[0]);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
       e.preventDefault();
       const node = data.nodes[selectedId];
       if (!node.parentId) return;
       const parent = data.nodes[node.parentId];
       const idx = parent.children.indexOf(selectedId);
       if (e.key === 'ArrowDown' && idx < parent.children.length - 1) setSelectedId(parent.children[idx + 1]);
       if (e.key === 'ArrowUp' && idx > 0) setSelectedId(parent.children[idx - 1]);
    } else if (e.key === 'F2') {
       setEditingId(selectedId);
    }
  }, [data, selectedId, editingId, isEditable]);

  // --- Drag & Drop ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
      if (id === data.rootId) {
          e.preventDefault(); // Root not draggable
          return;
      }
      e.dataTransfer.setData('nodeId', id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDragTargetId(id);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const dragId = e.dataTransfer.getData('nodeId');
      if (dragId && dragId !== targetId) {
          setData(moveNode(data, dragId, targetId));
      }
      setDragTargetId(null);
  };

  // --- Render Helpers ---

  const renderBezier = (start: LayoutNode, end: LayoutNode) => {
    const startX = start.x + start.width;
    const startY = start.y + start.height / 2;
    const endX = end.x;
    const endY = end.y + end.height / 2;
    
    // Control points for nice curve
    const c1x = startX + (endX - startX) / 2;
    const c1y = startY;
    const c2x = endX - (endX - startX) / 2;
    const c2y = endY;

    return (
      <path
        key={`${start.id}-${end.id}`}
        d={`M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`}
        fill="none"
        stroke={start.color}
        strokeWidth="2"
        strokeOpacity="0.4"
      />
    );
  };

  return (
    <div 
        ref={containerRef}
        className="relative w-full h-full min-w-[300px] min-h-[200px] bg-white select-none overflow-auto custom-scrollbar outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => { setSelectedId(null); setEditingId(null); }} // Deselect on background click
    >
      {/* SVG Layer for Edges */}
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ width: Math.max(layout.width, 1000), height: Math.max(layout.height, 1000) }}
      >
        {layout.nodes.map(node => {
           const childIds = data.nodes[node.id].children;
           // If collapsed, don't draw edges to children (layout engine won't return children coordinates anyway, but safe check)
           if (data.nodes[node.id].isCollapsed) return null;

           return childIds.map(childId => {
             const childNode = layout.nodes.find(n => n.id === childId);
             if (childNode) return renderBezier(node, childNode);
             return null;
           });
        })}
      </svg>

      {/* Nodes Layer */}
      <div 
        className="absolute top-0 left-0"
        style={{ width: Math.max(layout.width, 1000), height: Math.max(layout.height, 1000) }}
      >
        {layout.nodes.map(node => {
           const isSelected = node.id === selectedId;
           const isEditing = node.id === editingId;
           const isRoot = node.depth === 0;
           const isDragTarget = node.id === dragTargetId;
           const hasChildren = data.nodes[node.id].children.length > 0;
           const isCollapsed = data.nodes[node.id].isCollapsed;

           return (
             <div
                key={node.id}
                draggable={isEditable && !isRoot && !isEditing}
                onDragStart={(e) => handleDragStart(e, node.id)}
                onDragOver={(e) => handleDragOver(e, node.id)}
                onDragLeave={() => setDragTargetId(null)}
                onDrop={(e) => handleDrop(e, node.id)}
                className={`absolute transition-all duration-200 group`}
                style={{
                    left: node.x,
                    top: node.y,
                    width: node.width,
                    height: node.height,
                }}
             >
                <div 
                    onClick={(e) => handleSelect(e, node.id)}
                    onDoubleClick={(e) => isEditable && handleEdit(e, node.id)}
                    className={`
                        relative w-full h-full flex items-center justify-center px-4 rounded-lg border-2 shadow-sm
                        transition-colors cursor-pointer
                        ${isRoot ? 'text-white font-bold text-lg' : 'text-slate-800 text-sm'}
                        ${isSelected ? 'ring-2 ring-blue-400 shadow-md' : 'border-slate-200'}
                        ${isDragTarget ? 'ring-2 ring-green-500 bg-green-50' : ''}
                    `}
                    style={{
                        backgroundColor: isRoot ? node.color : '#fff',
                        borderColor: isRoot ? node.color : (isSelected ? node.color : '#e2e8f0'),
                        borderLeftWidth: isRoot ? 2 : 4,
                        borderLeftColor: node.color
                    }}
                >
                    {isEditing ? (
                        <input
                            autoFocus
                            className={`w-full bg-transparent outline-none text-center ${isRoot ? 'text-white' : 'text-slate-800'}`}
                            value={data.nodes[node.id].text}
                            onChange={(e) => handleUpdateText(node.id, e.target.value)}
                            onBlur={() => setEditingId(null)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    setEditingId(null);
                                    // Refocus container to keep keyboard nav working
                                    containerRef.current?.focus(); 
                                }
                                e.stopPropagation(); // Stop bubbling to main container
                            }}
                        />
                    ) : (
                        <span className="truncate w-full text-center select-none">{data.nodes[node.id].text}</span>
                    )}

                    {/* Expand/Collapse Button */}
                    {hasChildren && !isRoot && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setData(toggleCollapse(data, node.id)); }}
                            className="absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border border-slate-300 rounded-full flex items-center justify-center hover:bg-slate-50 hover:border-blue-400 z-10"
                        >
                            {isCollapsed ? (
                                <span className="text-[10px] font-bold text-slate-500">{data.nodes[node.id].children.length}</span>
                            ) : (
                                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                            )}
                        </button>
                    )}
                </div>
             </div>
           );
        })}
      </div>
    </div>
  );
};
