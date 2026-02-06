
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const MindMapRootNode = ({ data, selected }: NodeProps) => {
  return (
    <div className={`relative group ${selected ? 'z-50' : 'z-10'}`}>
      <div 
        className={`
          px-6 py-3 rounded-full shadow-lg border-2 transition-all min-w-[120px] text-center
          ${selected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-600'}
        `}
        style={{ backgroundColor: '#2563eb', color: 'white' }}
      >
        {data.isEditing ? (
             <input
                autoFocus
                className="bg-transparent text-white text-center outline-none w-full font-bold"
                value={data.content}
                onChange={(e) => data.onContentChange(e.target.value)}
                onBlur={data.stopEditing}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') data.stopEditing();
                }}
             />
        ) : (
            <span className="font-bold text-lg select-none">{data.content || '中心主题'}</span>
        )}
      </div>
      
      {/* Source Handle (Right) */}
      <Handle 
        type="source" 
        position={Position.Right} 
        className="!bg-blue-200 !w-3 !h-3 !-right-1.5" 
      />
    </div>
  );
};

export default memo(MindMapRootNode);
