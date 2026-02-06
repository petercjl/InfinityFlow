import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { Image as ImageIcon, Video, Play, Zap, ChevronDown, Plus } from 'lucide-react';
import { generateImage, generateVideo } from '../../services/geminiService';

const GeneratorWidget: React.FC<{
    type: 'image' | 'video';
    content: string;
    onUpdate: (content: string) => void;
}> = ({ type, content, onUpdate }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Config State
    const [model, setModel] = useState(type === 'image' ? 'nano-banana-2-4k' : 'veo3');
    const [resolution] = useState(type === 'image' ? '1K' : '720p');

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            if (type === 'image') {
                const url = await generateImage(prompt, model);
                onUpdate(url);
            } else {
                const realModel = model.includes('veo') ? model : 'veo3';
                const url = await generateVideo(prompt, realModel);
                onUpdate(url);
            }
        } catch (e) {
            console.error(e);
            alert("生成失败，请重试");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col relative group">
             {/* Main Preview Area */}
             <div className="flex-1 bg-blue-50/50 rounded-lg border-2 border-blue-300 relative overflow-hidden flex items-center justify-center mb-2">
                 <div className="absolute top-0 left-0 right-0 flex justify-between px-2 py-1 text-[10px] text-slate-500 font-mono z-10 bg-white/50 backdrop-blur-sm">
                     <div className="flex items-center gap-1">
                        {type === 'image' ? <ImageIcon size={10} /> : <Video size={10} />}
                        <span>{type === 'image' ? 'Image Gen' : 'Video Gen'}</span>
                     </div>
                     <span>{resolution}</span>
                 </div>

                 {isGenerating ? (
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        <div className="w-8 h-8 rounded-full bg-blue-200"></div>
                        <span className="text-xs text-blue-400">Generating...</span>
                    </div>
                 ) : content ? (
                     type === 'image' ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={content} className="w-full h-full object-contain" alt="Generated" />
                     ) : (
                        <video src={content} controls className="w-full h-full object-contain" />
                     )
                 ) : (
                    <div className="text-blue-200">
                        {type === 'image' ? <ImageIcon size={48} /> : <Play size={48} fill="currentColor" className="opacity-50" />}
                    </div>
                 )}
             </div>

             {/* Control Panel */}
             <div 
                className="bg-white rounded-lg border border-slate-200 p-2 flex flex-col gap-2"
                onPointerDown={(e) => e.stopPropagation()}
             >
                 <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="输入提示词..." 
                    className="w-full text-xs p-1.5 border border-slate-100 rounded outline-none text-slate-700 bg-slate-50 focus:bg-white focus:border-blue-300"
                 />
                 <div className="flex items-center justify-between">
                     <button className="flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded hover:bg-slate-200">
                         <span>{model}</span> <ChevronDown size={10} />
                     </button>
                     <button 
                        onClick={handleGenerate}
                        disabled={!prompt}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 text-[10px] font-bold disabled:opacity-50"
                     >
                        <Zap size={10} fill="currentColor" /> 生成
                     </button>
                 </div>
             </div>
        </div>
    );
};

const GeneralNode = ({ id, type, data, selected }: NodeProps) => {
  const nodeType = data.itemType || 'shape'; // 'image', 'video', 'shape', 'html', 'image-generator', 'video-generator'

  return (
    <>
      <NodeResizer 
        minWidth={50} 
        minHeight={50} 
        isVisible={selected} 
        lineClassName="border-blue-500" 
        handleClassName="h-3 w-3 bg-white border-2 border-blue-500 rounded"
      />
      <Handle type="target" position={Position.Top} className="!bg-slate-400" />
      <Handle type="target" position={Position.Left} className="!bg-slate-400" />

      <div className={`w-full h-full ${selected ? 'ring-2 ring-blue-500 rounded-lg' : ''}`}>
        
        {/* Shape */}
        {nodeType === 'shape' && (
             <div 
                className="w-full h-full flex items-center justify-center border-2 border-slate-800 rounded-lg bg-white"
                style={{ backgroundColor: data.color || '#fff' }}
             >
                {data.content && <span className="text-xs text-slate-800">{data.content}</span>}
             </div>
        )}

        {/* Image */}
        {nodeType === 'image' && (
             <div className="w-full h-full bg-slate-100 flex items-center justify-center rounded-lg overflow-hidden border border-slate-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.content} alt="content" className="w-full h-full object-cover pointer-events-none" />
             </div>
        )}

        {/* Video */}
        {nodeType === 'video' && (
             <div className="w-full h-full bg-black flex items-center justify-center rounded-lg overflow-hidden shadow-lg border border-slate-800">
                <video src={data.content} controls className="w-full h-full object-cover" />
             </div>
        )}

        {/* HTML Report */}
        {nodeType === 'html' && (
             <div className="w-full h-full bg-white flex flex-col shadow-lg border border-slate-200 rounded-lg overflow-hidden">
                <div className="h-6 bg-slate-50 border-b border-slate-200 flex items-center px-2 shrink-0 gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400"></div>
                    <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                    <div className="w-2 h-2 rounded-full bg-green-400"></div>
                    <span className="text-[10px] text-slate-400 ml-2">Report Preview</span>
                </div>
                <div 
                    className="flex-1 w-full h-full overflow-hidden bg-white p-2"
                    onPointerDown={(e) => e.stopPropagation()} 
                    dangerouslySetInnerHTML={{ __html: data.content || '' }}
                />
             </div>
        )}

        {/* Generators */}
        {nodeType === 'image-generator' && (
            <GeneratorWidget type="image" content={data.content} onUpdate={(val) => data.onContentChange?.(val)} />
        )}
        {nodeType === 'video-generator' && (
            <GeneratorWidget type="video" content={data.content} onUpdate={(val) => data.onContentChange?.(val)} />
        )}

      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-slate-400" />
      <Handle type="source" position={Position.Right} className="!bg-slate-400" />
    </>
  );
};

export default memo(GeneralNode);