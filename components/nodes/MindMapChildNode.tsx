
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const MindMapChildNode = ({ data, selected }: NodeProps) => {
  const hasChildren = data.hasChildren;
  const isCollapsed = data.isCollapsed;
  const nodeColor = data.color || '#cbd5e1'; // Default gray if no color inherited

  return (
    <div className={`relative group ${selected ? 'z-50' : 'z-10'}`}>
      
      {/* Target Handle (Left) */}
      <Handle 
        type="target" 
        position={Position.Left} 
        className="!w-1 !h-1 !opacity-0" 
      />

      <div 
        className={`
          relative px-4 py-2.5 rounded-lg border bg-white transition-all duration-200 min-w-[100px] flex items-center
          ${selected ? 'shadow-md ring-2 ring-opacity-50' : 'shadow-sm hover:shadow-md hover:scale-[1.02]'}
        `}
        style={{ 
            borderColor: selected ? nodeColor : '#e2e8f0',
            borderLeftWidth: '4px',
            borderLeftColor: nodeColor,
            boxShadow: selected ? `0 4px 6px -1px ${nodeColor}33` : undefined // Colored shadow on select
        }}
      >
        {data.isEditing ? (
             <input
                autoFocus
                className="bg-transparent text-slate-800 outline-none w-full text-sm font-medium leading-normal"
                value={data.content}
                onChange={(e) => data.onContentChange(e.target.value)}
                onBlur={data.stopEditing}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') data.stopEditing();
                }}
             />
        ) : (
            <span className="text-sm font-medium text-slate-700 select-none w-full leading-normal">
                {data.content || '分支主题'}
            </span>
        )}
      </div>

      {/* Collapse/Expand Toggle */}
      {hasChildren && (
        <button
            onClick={(e) => {
                e.stopPropagation();
                if (data.onToggleCollapse) data.onToggleCollapse();
            }}
            className={`
                absolute -right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 
                bg-white border rounded-full flex items-center justify-center 
                z-20 cursor-pointer shadow-sm transition-transform hover:scale-110
            `}
            style={{ borderColor: nodeColor }}
        >
            {isCollapsed ? (
                <span 
                    className="text-[10px] font-bold leading-none flex items-center justify-center w-full h-full pb-0.5"
                    style={{ color: nodeColor }}
                >
                    +
                </span>
            ) : (
                <div className="w-1.5 h-1.5 rounded-full opacity-50" style={{ backgroundColor: nodeColor }} />
            )}
        </button>
      )}

      {/* Source Handle (Right) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-1 !h-1 !opacity-0" 
      />
    </div>
  );
};

export default memo(MindMapChildNode);
