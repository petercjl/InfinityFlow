import React, { useState } from 'react';
import { CanvasItem as CanvasItemType } from '../types';
import ReactMarkdown from 'react-markdown';
import { Image as ImageIcon, Video, Play, Zap, ChevronDown, Plus } from 'lucide-react';
import { generateImage, generateVideo } from '../services/geminiService';

interface CanvasItemProps {
  item: CanvasItemType;
  isSelected: boolean;
  onSelect: (e: React.PointerEvent) => void;
}

const GeneratorWidget: React.FC<{
    type: 'image' | 'video';
    item: CanvasItemType;
    isSelected: boolean;
}> = ({ type, item, isSelected }) => {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    // If item.content exists, it means we have a result.
    const [result, setResult] = useState<string | null>(item.content || null);
    
    // Config State
    const [model, setModel] = useState(type === 'image' ? 'nano-banana-2-4k' : 'veo3');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [resolution, setResolution] = useState(type === 'image' ? '1K' : '720p');
    const [duration, setDuration] = useState('5s');

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsGenerating(true);
        try {
            if (type === 'image') {
                const url = await generateImage(prompt, model);
                setResult(url);
                // In a real app, update the parent item.content here
            } else {
                // Using Veo as the real backed, but UI says Kling per screenshot requirements (simulation)
                const realModel = model.includes('veo') ? model : 'veo3';
                const url = await generateVideo(prompt, realModel);
                setResult(url);
            }
        } catch (e) {
            console.error(e);
            alert("生成失败，请重试");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={`w-full h-full flex flex-col relative group ${isSelected ? '' : ''}`}>
             {/* Main Preview Area */}
             <div className="flex-1 bg-blue-50/50 rounded-lg border-2 border-blue-300 relative overflow-hidden flex items-center justify-center mb-2">
                 
                 {/* Top Label */}
                 <div className="absolute top-0 left-0 right-0 flex justify-between px-2 py-1 text-[10px] text-slate-500 font-mono z-10">
                     <div className="flex items-center gap-1">
                        {type === 'image' ? <ImageIcon size={10} /> : <Video size={10} />}
                        <span>{type === 'image' ? 'Image Generator' : 'Video Generator'}</span>
                     </div>
                     <span>{type === 'image' ? '1024 × 1024' : '1920 × 1080'}</span>
                 </div>

                 {/* Content */}
                 {isGenerating ? (
                    <div className="flex flex-col items-center gap-2 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-blue-200"></div>
                        <span className="text-xs text-blue-400">正在生成灵感...</span>
                    </div>
                 ) : result ? (
                     type === 'image' ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={result} className="w-full h-full object-contain" alt="Generated" />
                     ) : (
                        <video src={result} controls className="w-full h-full object-contain" />
                     )
                 ) : (
                    <div className="text-blue-200">
                        {type === 'image' ? <ImageIcon size={64} /> : <Play size={64} fill="currentColor" className="opacity-50" />}
                    </div>
                 )}
             </div>

             {/* Floating Control Panel (Simulated inside the item for simplicity) */}
             <div 
                className="bg-white rounded-xl shadow-xl border border-slate-200 p-2 flex flex-col gap-2 relative z-20"
                onPointerDown={(e) => e.stopPropagation()} // Allow interaction
             >
                 {/* Input */}
                 <input 
                    type="text" 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="今天我们要创作什么" 
                    className="w-full text-xs p-2 outline-none text-slate-700 placeholder-slate-300 bg-transparent"
                 />

                 {/* Controls Row */}
                 <div className="flex items-center justify-between mt-1">
                     {/* Model Selector */}
                     <div className="flex items-center gap-3">
                         {type === 'video' && (
                             <div className="flex gap-1">
                                 <button className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500"><Plus size={14}/></button>
                                 <button className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center text-slate-400 hover:border-blue-400 hover:text-blue-500"><Plus size={14}/></button>
                             </div>
                         )}
                         
                         {type === 'video' ? (
                             <>
                                <button className="px-2 py-1 bg-white border border-slate-200 rounded-full text-[10px] text-slate-600 font-medium">首尾帧</button>
                                <button className="px-2 py-1 bg-slate-100 rounded-full text-[10px] text-slate-500">动作控制</button>
                             </>
                         ) : null}

                         <button className="flex items-center gap-1 text-[10px] text-slate-600 font-medium hover:text-blue-600">
                             {type === 'image' ? <ImageIcon size={10} /> : <Video size={10} />}
                             <span>{type === 'image' ? 'Gemini 图片 4K' : 'Google Veo 3'}</span>
                             <ChevronDown size={10} />
                         </button>
                     </div>

                     {/* Params & Action */}
                     <div className="flex items-center gap-2">
                        {type === 'image' && (
                            <span className="text-[10px] text-slate-400">{resolution} · {aspectRatio}</span>
                        )}
                        {type === 'video' && (
                            <span className="text-[10px] text-slate-400">16:9 · {duration}</span>
                        )}
                        <button 
                            onClick={handleGenerate}
                            className="bg-slate-400 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 text-[10px] font-bold transition-colors shadow-sm"
                        >
                            <Zap size={10} fill="currentColor" />
                            {type === 'image' ? '10' : '20'}
                        </button>
                     </div>
                 </div>
             </div>
        </div>
    );
}

export const CanvasItem: React.FC<CanvasItemProps> = ({ item, isSelected, onSelect }) => {
  
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: item.x,
    top: item.y,
    width: item.width,
    height: item.height,
    transform: 'translate(0, 0)',
    cursor: 'grab', // Default grab for container
  };

  const selectionClass = isSelected 
    ? 'ring-2 ring-blue-500 shadow-2xl z-20' 
    : 'hover:shadow-lg hover:ring-1 hover:ring-slate-300 z-10';

  // For generators, we remove the bg-white so the custom widget style shows
  const isGenerator = item.type === 'image-generator' || item.type === 'video-generator';
  const contentClass = `w-full h-full transition-shadow ${isGenerator ? '' : 'bg-white rounded-lg overflow-hidden'} ` + selectionClass;

  const renderContent = () => {
    switch (item.type) {
      case 'note':
        return (
          <div 
            className={`w-full h-full p-4 text-slate-800 font-handwriting shadow-md rounded-lg overflow-hidden ${selectionClass}`}
            style={{ backgroundColor: item.color || '#fef3c7' }}
          >
             <div className="font-semibold mb-1 text-xs opacity-50 uppercase tracking-wider">便签</div>
            <textarea 
              className="w-full h-full bg-transparent resize-none outline-none text-sm placeholder-slate-500/50"
              defaultValue={item.content}
              onPointerDown={(e) => e.stopPropagation()} // Allow text selection
            />
          </div>
        );
      case 'shape':
        return (
          <div 
            className={`w-full h-full flex items-center justify-center border-2 border-slate-800 rounded-lg bg-white ${selectionClass}`}
            style={{ backgroundColor: item.color || '#fff' }}
          >
            <span className="text-xs text-slate-400">形状</span>
          </div>
        );
      case 'image':
        return (
          <div className={`w-full h-full bg-slate-100 flex items-center justify-center relative group rounded-lg overflow-hidden ${selectionClass}`}>
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.content} alt="canvas content" className="w-full h-full object-cover pointer-events-none" />
            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-2 py-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
              AI 生成
            </div>
          </div>
        );
      case 'video':
        return (
          <div className={`w-full h-full bg-black flex items-center justify-center rounded-xl overflow-hidden shadow-xl border border-slate-800 ${selectionClass}`}>
            <video src={item.content} controls className="w-full h-full object-cover" />
          </div>
        );
      case 'image-generator':
          return <GeneratorWidget type="image" item={item} isSelected={isSelected} />;
      case 'video-generator':
          return <GeneratorWidget type="video" item={item} isSelected={isSelected} />;
      case 'html': 
        return (
          <div className={`w-full h-full bg-white flex flex-col shadow-xl border border-slate-200 rounded-lg overflow-hidden ${selectionClass}`}>
             <div className="h-9 bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400/20 border border-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400"></div>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">交互式分析报告</span>
             </div>
             <div 
                className="flex-1 w-full h-full overflow-hidden bg-white"
                onPointerDown={(e) => e.stopPropagation()} 
                dangerouslySetInnerHTML={{ __html: item.content || '' }}
             />
          </div>
        );
      case 'mindmap': 
        const data = JSON.parse(item.content || '{}');
        return (
             <div className={`w-full h-full bg-white border border-slate-200 flex flex-col shadow-lg p-4 rounded-lg overflow-hidden ${selectionClass}`}>
                <h3 className="font-bold text-lg mb-4 text-center border-b pb-2">{data.title}</h3>
                <div className="flex flex-col gap-4 overflow-y-auto">
                    {data.sections?.map((sec: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-100">
                            <h4 className="font-semibold text-blue-600 text-sm">{sec.title}</h4>
                            <p className="text-xs text-slate-600 mt-1">{sec.content}</p>
                        </div>
                    ))}
                </div>
             </div>
        );
      default:
        return <div className={contentClass}>Unknown</div>;
    }
  };

  return (
    <div 
      style={baseStyle} 
      onPointerDown={onSelect}
      className="select-none"
    >
      {renderContent()}
      
      {isSelected && (
        <>
          <div className="absolute -top-3 -left-3 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-nwse-resize" />
          <div className="absolute -top-3 -right-3 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-nesw-resize" />
          <div className="absolute -bottom-3 -left-3 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-nesw-resize" />
          <div className="absolute -bottom-3 -right-3 w-4 h-4 bg-white border border-blue-500 rounded-full cursor-nwse-resize" />
        </>
      )}
    </div>
  );
};