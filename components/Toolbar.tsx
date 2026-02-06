import React from 'react';
import { Square, Type, MousePointer2, Image as ImageIcon, Video, StickyNote, GitBranch } from 'lucide-react';

interface ToolbarProps {
  onAddText: () => void;
  onAddNote: () => void;
  onAddShape: () => void;
  onAddMindMap: () => void;
  onAddImageGen: () => void;
  onAddVideoGen: () => void;
  setModeSelect: () => void; // Reset to selection mode
  isSelectionMode: boolean;
}

export const Toolbar: React.FC<ToolbarProps> = ({ 
  onAddText,
  onAddNote, 
  onAddShape,
  onAddMindMap,
  onAddImageGen,
  onAddVideoGen, 
  setModeSelect,
  isSelectionMode
}) => {
  
  const btnClass = (isActive: boolean) => 
    `p-3 rounded-xl transition-all duration-200 mb-2 ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white text-slate-500 hover:bg-slate-100 shadow-sm border border-slate-200'}`;

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col z-50">
      <div className="bg-slate-50/90 backdrop-blur-sm p-2 rounded-2xl border border-slate-200 shadow-xl flex flex-col">
        
        <button 
          className={btnClass(isSelectionMode)} 
          onClick={setModeSelect}
          title="选择 / 移动"
        >
          <MousePointer2 size={20} />
        </button>

        <div className="h-px w-full bg-slate-200 my-1"></div>

        <button className={btnClass(false)} onClick={onAddText} title="添加文本">
          <Type size={20} />
        </button>
        <button className={btnClass(false)} onClick={onAddNote} title="添加便签">
          <StickyNote size={20} />
        </button>
        <button className={btnClass(false)} onClick={onAddShape} title="添加形状">
          <Square size={20} />
        </button>
        <button className={btnClass(false)} onClick={onAddMindMap} title="添加思维导图">
          <GitBranch size={20} />
        </button>

        <div className="h-px w-full bg-slate-200 my-1"></div>

        <button className={btnClass(false)} onClick={onAddImageGen} title="图片生成器">
          <ImageIcon size={20} />
        </button>
        <button className={btnClass(false)} onClick={onAddVideoGen} title="视频生成器">
          <Video size={20} />
        </button>

      </div>
    </div>
  );
};