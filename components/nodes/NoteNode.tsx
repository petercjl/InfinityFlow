import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';

const NoteNode = ({ data, selected }: NodeProps) => {
  return (
    <>
      <NodeResizer 
        minWidth={100} 
        minHeight={100} 
        isVisible={selected} 
        lineClassName="border-blue-500" 
        handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded"
      />
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />

      <div
        className="h-full w-full p-4 rounded-lg shadow-md flex flex-col font-handwriting"
        style={{
          backgroundColor: data.color || '#fef3c7',
          fontFamily: data.meta?.fontFamily || 'sans-serif',
          fontSize: `${data.meta?.fontSize || 16}px`
        }}
      >
        <div className="font-semibold mb-1 text-xs opacity-50 uppercase tracking-wider select-none pointer-events-none">便签</div>
        <textarea
          className="w-full h-full bg-transparent resize-none outline-none text-slate-800 placeholder-slate-500/50"
          value={data.content || ''}
          onChange={(e) => data.onContentChange?.(e.target.value)}
          onPointerDown={(e) => e.stopPropagation()} // Allow text selection without dragging node
          placeholder="写点什么..."
        />
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
    </>
  );
};

export default memo(NoteNode);