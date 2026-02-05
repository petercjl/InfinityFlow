import React, { useState, useRef, useEffect } from 'react';
import { ProjectFile, FileCategory, ChatMessage, AgentCategory, AIModel } from '../types';
import { Sparkles, Send, FileText, CheckCircle, Upload, X, ChevronDown, Check, Bot, User, MoreHorizontal, Edit2, ArrowRightLeft, Trash2 } from 'lucide-react';
import { chatWithAgent } from '../services/geminiService';

interface ContentItem {
    type: 'image' | 'video' | 'html';
    content: string;
}

interface RightSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  files: ProjectFile[];
  onUploadFile: (category: FileCategory, file: ProjectFile) => void;
  contextImages: string[];
  onRemoveContextImage: (img: string) => void;
  onAddContentToCanvas: (items: ContentItem[]) => void;
  onSaveReport: (html: string) => void;
  onRenameFile?: (fileId: string, newName: string) => void;
}

// --- Data Constants ---
const FILE_CATEGORIES: { id: FileCategory, label: string }[] = [
  { id: 'CategoryRankings', label: '类目商品排行' },
  { id: 'SearchTermRankings', label: '类目搜索词排行' },
  { id: 'ReviewTable', label: '评价表格' },
  { id: 'QATable', label: '问大家表格' },
  { id: 'ProductImages', label: '产品图片' },
  { id: 'AnalysisReports', label: '分析报告' },
];

const AGENT_CATEGORIES: AgentCategory[] = [
    { id: 'market', label: '市场选款', agents: ['蓝海探测', '关键词洞察', '小红书选款', '抖音选款'] },
    { id: 'product', label: '产品调研', agents: ['关键词需求分析', '评价分析', '问大家分析'] },
    { id: 'visual', label: '视觉营销', agents: ['主图策划', '主图生成', '详情页策划', '品牌级详情页策划', '详情页生成', '买家秀生成'] },
    { id: 'operations', label: '运营推广', agents: ['智能选款', '万相台推广', '流量渠道', '商品诊断'] },
    { id: 'sales', label: '售前售后', agents: ['退款分析', '客服聊天诊断', '售后分析', '聊天需求收集'] },
];

const CORE_MODELS: AIModel[] = [
    { id: 'qwen-plus-latest', name: '千问 Plus', type: 'chat' },
    { id: 'doubao-seed-1-8-251228', name: '豆包 Seed 1.8', type: 'chat' },
];

const IMAGE_MODELS: AIModel[] = [
    { id: 'nano-banana-2-4k', name: 'Gemini 图片 4K', type: 'image' },
    { id: 'doubao-seedream-4-5-251128', name: '豆包即梦', type: 'image' },
];

const VIDEO_MODELS: AIModel[] = [
    { id: 'veo3', name: 'Google Veo 3', type: 'video' },
    { id: 'doubao-seedance-1-5-pro-251215', name: '豆包即舞', type: 'video' },
];

export const RightSidebar: React.FC<RightSidebarProps> = ({
  isOpen,
  onClose,
  files,
  onUploadFile,
  contextImages,
  onRemoveContextImage,
  onAddContentToCanvas,
  onSaveReport,
  onRenameFile
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'files'>('chat');
  
  // "Assistant Mode": 'general' means using LLM/Auto-detect. 'agent' means a specific workflow is selected.
  const [assistantMode, setAssistantMode] = useState<'general' | 'agent'>('general');
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'model', text: '你好！我是你的 AI 项目助手。' }
  ]);
  
  // Config State
  const [selectedCoreModel, setSelectedCoreModel] = useState<string>(CORE_MODELS[0].id);
  const [selectedImageModels, setSelectedImageModels] = useState<string[]>([IMAGE_MODELS[0].id]);
  const [selectedVideoModels, setSelectedVideoModels] = useState<string[]>([VIDEO_MODELS[0].id]);
  
  // UI State for Popovers
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [selectorTab, setSelectorTab] = useState<'main' | 'image' | 'video'>('main');

  // File Renaming State
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [tempFileName, setTempFileName] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleModel = (id: string, type: 'image' | 'video') => {
      if (type === 'image') {
          setSelectedImageModels(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
      } else {
          setSelectedVideoModels(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
      }
  };

  const executeAgentWorkflow = async (agentName: string) => {
      setIsProcessing(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      let htmlReport = '';
      if (agentName === '蓝海探测') {
          const reportId = Math.random().toString(36).substr(2, 9);
          htmlReport = `
            <div class="report-container h-full flex flex-col font-sans text-slate-800 bg-white">
                <style>
                    .tab-content { display: none; animation: fadeIn 0.3s ease; }
                    #tab-overview-${reportId}:checked ~ .content-overview { display: block; }
                    #tab-trends-${reportId}:checked ~ .content-trends { display: block; }
                    .tab-label { padding: 10px 16px; cursor: pointer; font-weight: 500; color: #64748b; border-bottom: 2px solid transparent; }
                    .tab-label:hover { color: #3b82f6; }
                    #tab-overview-${reportId}:checked ~ nav label[for="tab-overview-${reportId}"],
                    #tab-trends-${reportId}:checked ~ nav label[for="tab-trends-${reportId}"] { color: #2563eb; border-bottom-color: #2563eb; background-color: #eff6ff; }
                    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                </style>
                <div class="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
                        <div class="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold">R</div>
                        <div><h1 class="font-bold text-slate-900">蓝海市场报告</h1><div class="text-xs text-slate-500">2024 Q4 • 智能家居</div></div>
                </div>
                <input type="radio" name="tabs-${reportId}" id="tab-overview-${reportId}" class="hidden" checked>
                <input type="radio" name="tabs-${reportId}" id="tab-trends-${reportId}" class="hidden">
                <nav class="flex border-b border-slate-200 bg-white text-sm px-2">
                    <label for="tab-overview-${reportId}" class="tab-label">核心概览</label>
                    <label for="tab-trends-${reportId}" class="tab-label">趋势分析</label>
                </nav>
                <div class="tab-content content-overview flex-1 p-5 overflow-y-auto bg-white">
                    <div class="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
                        <div class="text-sm font-bold text-blue-800">核心洞察</div>
                        <p class="text-xs text-blue-700 mt-1">市场供不应求 (1:18)，建议重点关注RFID智能喂食器。</p>
                    </div>
                        <table class="w-full text-xs text-left border">
                        <tr class="bg-slate-50"><th class="p-2">指标</th><th class="p-2">数值</th></tr>
                        <tr><td class="p-2 border-t">蓝海指数</td><td class="p-2 border-t font-bold">92.4</td></tr>
                        <tr><td class="p-2 border-t">平均点击</td><td class="p-2 border-t">4.5%</td></tr>
                    </table>
                </div>
                <div class="tab-content content-trends flex-1 p-5 bg-white">
                    <div class="h-40 bg-slate-50 rounded flex items-center justify-center text-slate-400 text-xs">Chart Placeholder</div>
                </div>
            </div>`;
      } else {
            htmlReport = `<div class="p-6 bg-white"><h1>${agentName} 报告</h1><p>任务已按照工作流执行完毕。</p></div>`;
      }
      onSaveReport(htmlReport);
      onAddContentToCanvas([{ type: 'html', content: htmlReport }]);
      setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'model',
          text: `【${agentName}】任务执行完毕，报告已生成。`
      }]);
      setIsProcessing(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() && contextImages.length === 0) return;
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      attachments: [...contextImages]
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
        if (assistantMode === 'agent' && selectedAgent) {
            await executeAgentWorkflow(selectedAgent);
        } else {
            const lowerText = userMsg.text.toLowerCase();
            let intent: 'CHAT' | 'IMAGE_GEN' | 'VIDEO_GEN' = 'CHAT';
            
            if (lowerText.includes('画') || lowerText.includes('图') || lowerText.includes('image') || lowerText.includes('生成')) intent = 'IMAGE_GEN';
            if (lowerText.includes('视频') || lowerText.includes('video')) intent = 'VIDEO_GEN';

            let modelId = selectedCoreModel;
            if (intent === 'IMAGE_GEN' && selectedImageModels.length > 0) modelId = selectedImageModels[0];
            if (intent === 'VIDEO_GEN' && selectedVideoModels.length > 0) modelId = selectedVideoModels[0];

            const result = await chatWithAgent(userMsg.text, contextImages, intent, undefined, modelId);
            
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'model',
                text: result.text || ''
            }]);
            
            if (result.media) {
                onAddContentToCanvas([{ type: result.media.type, content: result.media.url }]);
            }
        }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: '出错了，请稍后再试。',
        isError: true
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const getSelectorLabel = () => {
      if (assistantMode === 'agent') {
          return selectedAgent || '选择智能体工作流';
      }
      const core = CORE_MODELS.find(m => m.id === selectedCoreModel)?.name || 'General Chat';
      return core;
  };

  const getSelectorIcon = () => {
      if (assistantMode === 'agent') return <Bot size={14} className="text-green-600" />;
      return <Sparkles size={14} className="text-blue-600" />;
  };

  const startRenameFile = (file: ProjectFile) => {
      setEditingFileId(file.id);
      setTempFileName(file.name);
  };

  const saveRenameFile = (file: ProjectFile) => {
      if (onRenameFile && tempFileName.trim()) {
          let finalName = tempFileName.trim();
          const originalExt = file.name.split('.').pop();
          // If original file had an extension, ensure new name has it
          if (originalExt && file.name.includes('.') && !finalName.endsWith(`.${originalExt}`)) {
             finalName = `${finalName}.${originalExt}`;
          }
          onRenameFile(file.id, finalName);
      }
      setEditingFileId(null);
      setTempFileName('');
  };

  if (!isOpen) return null;

  return (
    <div className="w-96 bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl absolute right-0 top-0 z-50 animate-in slide-in-from-right duration-300">
      
      {/* Top Navigation */}
      <div className="flex border-b border-slate-200 bg-white z-10">
        <button 
            onClick={() => setActiveTab('chat')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
            <Sparkles size={16} /> AI 助手
        </button>
        <button 
            onClick={() => setActiveTab('files')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'files' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' : 'text-slate-500 hover:bg-slate-50'}`}
        >
            <FileText size={16} /> 项目文件
        </button>
        <button onClick={onClose} className="p-4 text-slate-400 hover:text-slate-600">
            <X size={18} />
        </button>
      </div>

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <div className="flex-1 flex flex-col relative bg-slate-50/50">
            
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5 pb-40 scroll-smooth">
                {messages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                        <div key={msg.id} className={`flex gap-3 max-w-[95%] ${isUser ? 'flex-row-reverse self-end' : 'self-start'}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${isUser ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-purple-600'}`}>
                                {isUser ? <User size={14} /> : <Bot size={16} />}
                            </div>
                            <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-3 text-sm shadow-sm leading-relaxed ${
                                    isUser 
                                    ? 'bg-blue-600 text-white rounded-2xl rounded-tr-none' 
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-none'
                                }`}>
                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                </div>
                                {msg.attachments && msg.attachments.length > 0 && (
                                    <div className={`flex flex-wrap gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                                        {msg.attachments.map((img, i) => (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img key={i} src={img} alt="attachment" className="w-20 h-20 rounded-lg border border-slate-200 shadow-sm object-cover bg-white" />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {isProcessing && (
                     <div className="flex gap-3 self-start max-w-[85%]">
                        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-purple-600 flex items-center justify-center shadow-sm">
                            <Bot size={16} />
                        </div>
                        <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-75" />
                             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce delay-150" />
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input Area */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_20px_-1px_rgba(0,0,0,0.05)] z-20">
                
                {/* Context Images */}
                {contextImages.length > 0 && (
                    <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto border-b border-slate-100 bg-slate-50/50">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex-shrink-0">
                            引用内容 ({contextImages.length})
                        </span>
                        {contextImages.map((img, idx) => (
                            <div key={idx} className="relative w-8 h-8 flex-shrink-0 group cursor-pointer transition-transform hover:scale-105">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img} className="w-full h-full object-cover rounded-md border border-blue-200 shadow-sm" alt="context" />
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onRemoveContextImage(img); }}
                                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-slate-100 hover:bg-red-500 border border-slate-300 hover:border-red-600 text-slate-400 hover:text-white rounded-full flex items-center justify-center shadow-sm transition-all opacity-0 group-hover:opacity-100 z-10"
                                >
                                    <X size={8} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Mode Switcher Tabs (As per Screenshot) */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-4 bg-white">
                    <button 
                        onClick={() => { setAssistantMode('general'); setSelectorTab('main'); setShowModelSelector(false); }}
                        className={`text-xs font-bold transition-colors pb-1 border-b-2 ${
                            assistantMode === 'general' 
                            ? 'text-blue-600 border-blue-600' 
                            : 'text-slate-500 border-transparent hover:text-slate-800'
                        }`}
                    >
                        通用对话
                    </button>
                    <button 
                        onClick={() => { 
                            setAssistantMode('agent'); 
                            setSelectorTab('main'); // Switch to main tab which will show agents
                            if (!selectedAgent) setShowModelSelector(true);
                        }}
                        className={`text-xs font-bold transition-colors pb-1 border-b-2 ${
                            assistantMode === 'agent' 
                            ? 'text-green-600 border-green-600' 
                            : 'text-slate-500 border-transparent hover:text-slate-800'
                        }`}
                    >
                        智能体
                    </button>
                </div>

                <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
                    <div className="relative bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all shadow-inner">
                        <textarea 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if(e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage();
                                }
                            }}
                            placeholder={assistantMode === 'agent' && selectedAgent ? `正在与【${selectedAgent}】对话...` : "输入消息..."}
                            className="w-full bg-transparent border-none outline-none text-sm text-slate-800 resize-none max-h-32 px-2 py-2 placeholder-slate-400"
                            rows={2}
                        />
                    </div>

                    <div className="flex justify-between items-center mt-1">
                        
                        {/* Dynamic Context Selector */}
                        <div className="relative">
                            <button 
                                onClick={() => setShowModelSelector(!showModelSelector)}
                                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors shadow-sm"
                            >
                                {getSelectorIcon()}
                                <span className="max-w-[140px] truncate">{getSelectorLabel()}</span>
                                <ChevronDown size={12} className={`text-slate-400 transition-transform ${showModelSelector ? 'rotate-180' : ''}`} />
                            </button>

                            {/* UNIFIED POPOVER */}
                            {showModelSelector && (
                                <div className="absolute bottom-full left-0 mb-3 w-[320px] bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 flex flex-col max-h-[450px]">
                                    
                                    {/* Tabs */}
                                    {assistantMode === 'general' ? (
                                        <div className="flex border-b border-slate-200 bg-slate-50/80">
                                            <button onClick={() => setSelectorTab('main')} className={`flex-1 py-2.5 text-xs font-bold ${selectorTab === 'main' ? 'text-blue-600 bg-white' : 'text-slate-500'}`}>对话模型</button>
                                            <button onClick={() => setSelectorTab('image')} className={`flex-1 py-2.5 text-xs font-bold ${selectorTab === 'image' ? 'text-blue-600 bg-white' : 'text-slate-500'}`}>生图</button>
                                            <button onClick={() => setSelectorTab('video')} className={`flex-1 py-2.5 text-xs font-bold ${selectorTab === 'video' ? 'text-blue-600 bg-white' : 'text-slate-500'}`}>视频</button>
                                        </div>
                                    ) : (
                                        <div className="flex border-b border-slate-200 bg-green-50/80">
                                            <div className="flex-1 py-2.5 text-xs font-bold text-green-700 text-center">选择智能体工作流</div>
                                        </div>
                                    )}

                                    {/* Content */}
                                    <div className="overflow-y-auto p-2 flex-1 custom-scrollbar">
                                        
                                        {/* MAIN TAB */}
                                        {selectorTab === 'main' && (
                                            <div className="flex flex-col gap-3">
                                                {assistantMode === 'general' ? (
                                                    // General Chat Models
                                                    <div className="flex flex-col gap-1">
                                                        {CORE_MODELS.map(model => (
                                                            <button
                                                                key={model.id}
                                                                onClick={() => { 
                                                                    setSelectedCoreModel(model.id); 
                                                                    setShowModelSelector(false); 
                                                                }}
                                                                className={`flex items-center justify-between p-2 rounded-lg text-xs text-left transition-all ${
                                                                    selectedCoreModel === model.id ? 'bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-200' : 'hover:bg-slate-50 text-slate-600'
                                                                }`}
                                                            >
                                                                <span>{model.name}</span>
                                                                {selectedCoreModel === model.id && <Check size={12} />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    // Agent Workflow List
                                                    <div className="flex flex-col gap-2">
                                                        {AGENT_CATEGORIES.map(cat => (
                                                            <div key={cat.id} className="mb-1">
                                                                <div className="text-[10px] font-semibold text-slate-500 px-2 py-1 bg-slate-50/50 rounded mb-1">{cat.label}</div>
                                                                <div className="grid grid-cols-2 gap-1 px-1">
                                                                    {cat.agents.map(agent => (
                                                                        <button 
                                                                            key={agent}
                                                                            onClick={() => { 
                                                                                setSelectedAgent(agent); 
                                                                                setShowModelSelector(false);
                                                                                executeAgentWorkflow(agent);
                                                                            }}
                                                                            className={`text-left text-[10px] px-2 py-1.5 rounded border transition-all ${
                                                                                selectedAgent === agent 
                                                                                ? 'bg-green-50 border-green-200 text-green-700 font-bold ring-1 ring-green-200' 
                                                                                : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'
                                                                            }`}
                                                                        >
                                                                            {agent}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* IMAGE TAB (General Only) */}
                                        {selectorTab === 'image' && assistantMode === 'general' && (
                                            <div className="flex flex-col gap-1">
                                                {IMAGE_MODELS.map(model => (
                                                    <button key={model.id} onClick={() => toggleModel(model.id, 'image')} className={`flex w-full items-center justify-between p-2 rounded-lg text-xs text-left ${selectedImageModels.includes(model.id) ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                                                        <span>{model.name}</span>
                                                        {selectedImageModels.includes(model.id) && <Check size={12} />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* VIDEO TAB (General Only) */}
                                        {selectorTab === 'video' && assistantMode === 'general' && (
                                            <div className="flex flex-col gap-1">
                                                {VIDEO_MODELS.map(model => (
                                                    <button key={model.id} onClick={() => toggleModel(model.id, 'video')} className={`flex w-full items-center justify-between p-2 rounded-lg text-xs text-left ${selectedVideoModels.includes(model.id) ? 'bg-purple-50 text-purple-700 font-bold' : 'hover:bg-slate-50 text-slate-600'}`}>
                                                        <span>{model.name}</span>
                                                        {selectedVideoModels.includes(model.id) && <Check size={12} />}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}
                        </div>

                        <button 
                            onClick={handleSendMessage}
                            disabled={!input.trim() && contextImages.length === 0}
                            className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                                input.trim() || contextImages.length > 0
                                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* FILES TAB */}
      {activeTab === 'files' && (
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
              <div className="space-y-4">
                  {FILE_CATEGORIES.map(cat => {
                      const catFiles = files.filter(f => f.category === cat.id);
                      const hasFiles = catFiles.length > 0;
                      return (
                          <div key={cat.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm transition-shadow hover:shadow-md">
                              <div className={`px-4 py-3 flex items-center justify-between border-b ${hasFiles ? 'bg-green-50/50 border-green-100' : 'border-slate-100'}`}>
                                  <div className="flex items-center gap-2">
                                      {hasFiles ? <CheckCircle size={16} className="text-green-600" /> : <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                                      <span className={`text-sm font-semibold ${hasFiles ? 'text-green-800' : 'text-slate-600'}`}>{cat.label}</span>
                                  </div>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${hasFiles ? 'bg-white text-green-700 border-green-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                                    {catFiles.length}
                                  </span>
                              </div>
                              <div className="p-2">
                                  {catFiles.length > 0 && (
                                      <div className="flex flex-col gap-1 mb-2">
                                          {catFiles.map(f => (
                                              <div key={f.id} className="group relative text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 flex items-center gap-3">
                                                  <div className="p-1 bg-white rounded border border-slate-200 text-blue-500"><FileText size={12} /></div>
                                                  
                                                  <div className="flex-1 min-w-0">
                                                      {editingFileId === f.id ? (
                                                          <input 
                                                            autoFocus
                                                            type="text"
                                                            value={tempFileName}
                                                            onChange={e => setTempFileName(e.target.value)}
                                                            onBlur={() => saveRenameFile(f)}
                                                            onKeyDown={e => {
                                                                if(e.key === 'Enter') saveRenameFile(f);
                                                                if(e.key === 'Escape') setEditingFileId(null);
                                                            }}
                                                            className="w-full bg-white border border-blue-400 rounded px-1 outline-none"
                                                          />
                                                      ) : (
                                                        <span className="truncate block font-medium" title={f.name}>{f.name}</span>
                                                      )}
                                                  </div>

                                                  {onRenameFile && (
                                                      <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-50 pl-2">
                                                          <div className="relative group/menu">
                                                                <button className="p-1 hover:bg-slate-200 rounded text-slate-500">
                                                                    <MoreHorizontal size={14} />
                                                                </button>
                                                                <div className="absolute right-0 top-full mt-1 w-24 bg-white border shadow-lg rounded-lg py-1 hidden group-hover/menu:block z-10">
                                                                    <button 
                                                                        onClick={() => startRenameFile(f)} 
                                                                        className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex gap-2 text-slate-700"
                                                                    >
                                                                        <Edit2 size={12}/> 重命名
                                                                    </button>
                                                                    {/* Placeholders for future impl */}
                                                                    <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex gap-2 text-slate-400 cursor-not-allowed"><ArrowRightLeft size={12}/> 移动</button>
                                                                    <button className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 flex gap-2 text-red-400 cursor-not-allowed"><Trash2 size={12}/> 删除</button>
                                                                </div>
                                                          </div>
                                                      </div>
                                                  )}
                                              </div>
                                          ))}
                                      </div>
                                  )}
                                  {cat.id !== 'AnalysisReports' && (
                                      <button 
                                        onClick={() => onUploadFile(cat.id, {} as any)} // Placeholder upload
                                        className="w-full py-2.5 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 transition-all flex items-center justify-center gap-2 group"
                                      >
                                          <Upload size={14} className="group-hover:-translate-y-0.5 transition-transform" /> 上传文件
                                      </button>
                                  )}
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

    </div>
  );
};