import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

export interface MindMapNodeData {
  label: string;
  theme?: 'default' | 'colorful' | 'dark' | 'minimal';
  depth?: number;
  layout?: string;
  onLabelChange?: (id: string, newLabel: string) => void;
}

const MindMapNode = ({ id, data, selected }: NodeProps<MindMapNodeData>) => {
  const { label, theme = 'default', depth = 0, onLabelChange } = data;

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    if (onLabelChange) {
      onLabelChange(id, evt.target.value);
    }
  };

  // Theme Logic
  let bgClass = 'bg-white';
  let borderClass = 'border-slate-300';
  let textClass = 'text-slate-800';

  if (theme === 'dark') {
    bgClass = 'bg-slate-800';
    borderClass = 'border-slate-600';
    textClass = 'text-white';
  } else if (theme === 'colorful') {
    // Simple depth-based coloring
    const colors = ['bg-blue-100 border-blue-300', 'bg-green-100 border-green-300', 'bg-purple-100 border-purple-300', 'bg-orange-100 border-orange-300'];
    const style = colors[depth % colors.length] || colors[0];
    bgClass = style.split(' ')[0];
    borderClass = style.split(' ')[1];
  } else if (theme === 'minimal') {
    bgClass = 'bg-transparent';
    borderClass = 'border-transparent border-b-slate-400 rounded-none';
  }

  // Handle Logic based on simplified "Tree Right" assumption for default handle positions
  // In a real advanced mindmap, handle positions might change dynamically.
  // We place handles on left and right to support tree-right logic primarily.
  
  return (
    <div 
      className={`
        px-3 py-2 rounded-lg shadow-sm border-2 min-w-[100px] text-center transition-all
        ${bgClass} ${borderClass}
        ${selected ? 'ring-2 ring-blue-500 border-transparent shadow-md' : ''}
      `}
    >
      <Handle type="target" position={Position.Left} className="opacity-0" />
      
      <input 
        className={`w-full bg-transparent outline-none text-sm text-center font-medium ${textClass}`}
        value={label}
        onChange={handleChange}
        placeholder="节点"
      />

      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
};

export default memo(MindMapNode);