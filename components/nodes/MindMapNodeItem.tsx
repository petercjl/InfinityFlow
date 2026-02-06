import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

const MindMapNodeItem = ({ data, selected }: NodeProps) => {
  const theme = data.meta?.theme || 'default';
  const depth = data.meta?.depth || 0;

  // Theme Logic
  let bgClass = 'bg-white border-slate-300';
  let textClass = 'text-slate-800';

  if (theme === 'dark') {
    bgClass = 'bg-slate-800 border-slate-600';
    textClass = 'text-white';
  } else if (theme === 'colorful') {
    const colors = ['bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200', 'bg-orange-50 border-orange-200'];
    bgClass = colors[depth % colors.length] || colors[0];
  } else if (theme === 'minimal') {
    bgClass = 'bg-transparent border-transparent border-b-slate-400 rounded-none';
  }

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />

      <div className={`px-4 py-2 rounded-lg border-2 shadow-sm min-w-[100px] text-center transition-all ${bgClass} ${selected ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}>
        <input
          className={`bg-transparent outline-none text-center font-medium w-full ${textClass}`}
          value={data.content || ''}
          onChange={(e) => data.onContentChange?.(e.target.value)}
          placeholder="主题"
          onPointerDown={(e) => e.stopPropagation()}
        />
      </div>

      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </>
  );
};

export default memo(MindMapNodeItem);