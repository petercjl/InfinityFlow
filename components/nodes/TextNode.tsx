import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';

const TextNode = ({ data, selected }: NodeProps) => {
  return (
    <>
      <NodeResizer 
        minWidth={100} 
        minHeight={40} 
        isVisible={selected} 
        lineClassName="border-blue-500" 
        handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded"
      />
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="target" position={Position.Left} className="!bg-slate-400 !w-2 !h-2" />

      <div
        className={`h-full w-full p-2 bg-white/90 backdrop-blur-sm border rounded transition-all ${selected ? 'border-blue-400 ring-2 ring-blue-100' : 'border-slate-200'}`}
        style={{
          fontFamily: data.meta?.fontFamily || 'sans-serif',
          fontSize: `${data.meta?.fontSize || 14}px`
        }}
      >
        <textarea
          className="w-full h-full bg-transparent resize-none outline-none text-sm text-slate-800"
          placeholder="输入文本..."
          value={data.content || ''}
          onChange={(e) => data.onContentChange?.(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400 !w-2 !h-2" />
    </>
  );
};

export default memo(TextNode);