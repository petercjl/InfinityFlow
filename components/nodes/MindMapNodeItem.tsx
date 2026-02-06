
import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { MindMap } from '../MindMap/MindMap';
import { MindMapData } from '../../types';

const MindMapNodeItem = ({ data, selected, id }: NodeProps) => {
  // Parse content from string if needed, or use default
  const mindMapData: MindMapData | undefined = data.content && typeof data.content === 'string' 
    ? JSON.parse(data.content) 
    : undefined;

  const handleChange = useCallback((newData: MindMapData) => {
      // Serialize back to string for storage in CanvasItem
      if (data.onContentChange) {
          data.onContentChange(JSON.stringify(newData));
      }
  }, [data]);

  return (
    <>
      <NodeResizer 
        minWidth={300} 
        minHeight={200} 
        isVisible={selected} 
        lineClassName="border-blue-500" 
        handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded"
      />
      {/* Handles for connecting to other canvas items (optional) */}
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />

      <div className={`w-full h-full rounded-lg border bg-white overflow-hidden shadow-sm flex flex-col ${selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-300'}`}>
        {/* Header/Title Bar (Optional, acts as drag handle for the whole block) */}
        <div className="bg-slate-50 border-b border-slate-100 px-3 py-1 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500"></div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mind Map</span>
        </div>
        
        <div className="flex-1 w-full h-full relative" onPointerDown={(e) => e.stopPropagation()}> 
           {/* StopPropagation is crucial here so clicking inside the mindmap doesn't drag the ReactFlow node */}
           <MindMap 
              initialData={mindMapData}
              onChange={handleChange}
              isEditable={true}
           />
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
    </>
  );
};

export default memo(MindMapNodeItem);
