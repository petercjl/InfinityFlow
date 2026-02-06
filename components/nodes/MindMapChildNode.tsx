
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { ChevronRight } from 'lucide-react';

const MindMapChildNode = ({ data, selected }: NodeProps) => {
  const hasChildren = data.hasChildren;
  const isCollapsed = data.isCollapsed;

  return (
    <div className={`relative group ${selected ? 'z-50' : 'z-10'}`}>
      
      {/* Target Handle (Left) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!bg-slate-300 !w-2 !h-2 !-left-1 opacity-0 group-hover:opacity-100 transition-opacity" 
      />

      <div 
        className={`
          px-4 py-2 rounded-lg border transition-all min-w-[80px]
          ${selected ? 'border-blue-500 bg-white shadow-md ring-1 ring-blue-200' : 'border-slate-200 bg-white hover:border-blue-300'}
        `}
      >
        {data.isEditing ? (
             <input
                autoFocus
                className="bg-transparent text-slate-800 outline-none w-full text-sm"
                value={data.content}
                onChange={(e) => data.onContentChange(e.target.value)}
                onBlur={data.stopEditing}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') data.stopEditing();
                }}
             />
        ) : (
            <span className="text-sm text-slate-700 select-none">{data.content || '分支主题'}</span>
        )}
      </div>

      {/* Collapse/Expand Toggle */}
      {hasChildren && (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (data.onToggleCollapse) data.onToggleCollapse();
            }}
            className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border border-slate-300 rounded-full flex items-center justify-center hover:bg-slate-50 hover:border-blue-400 z-20 cursor-pointer shadow-sm"
        >
            {isCollapsed ? (
                <span className="text-[8px] font-bold text-slate-500 flex items-center justify-center w-full h-full">+</span>
            ) : (
                <div className="w-1 h-1 bg-slate-400 rounded-full" />
            )}
        </button>
      )}

      {/* Source Handle (Right) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-slate-300 !w-2 !h-2 !-right-1 opacity-0 group-hover:opacity-100 transition-opacity" 
      />
    </div>
  );
};

export default memo(MindMapChildNode);
