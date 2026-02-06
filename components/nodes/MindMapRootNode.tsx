
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const MindMapRootNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`relative group ${selected ? 'z-50' : 'z-10'}`}>
      <div 
        className={`
          px-8 py-4 rounded-xl shadow-xl transition-all min-w-[160px] text-center
          bg-gradient-to-br from-blue-500 to-blue-600
          ${selected ? 'ring-4 ring-blue-300/50 scale-105' : 'hover:shadow-2xl hover:scale-105'}
        `}
      >
        {data.isEditing ? (
             <input
                autoFocus
                className="bg-transparent text-white text-center outline-none w-full font-bold text-lg leading-tight"
                value={data.content}
                onChange={(e) => data.onContentChange(e.target.value)}
                onBlur={data.stopEditing}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') data.stopEditing();
                }}
             />
        ) : (
            <span className="font-bold text-lg text-white select-none leading-tight tracking-wide drop-shadow-md">
                {data.content || '中心主题'}
            </span>
        )}
      </div>
      
      {/* Source Handle (Right) - Invisible but functional */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!w-1 !h-1 !opacity-0" 
      />
    </div>
  );
};

export default memo(MindMapRootNode);
