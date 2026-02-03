import React, { useState } from 'react';
import { Board, WorkspaceType } from '../types';
import { User, Users, Plus, LayoutGrid, MoreHorizontal, Search, Clock } from 'lucide-react';

interface DashboardProps {
  boards: Board[];
  onCreateBoard: (workspace: WorkspaceType) => void;
  onSelectBoard: (boardId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ boards, onCreateBoard, onSelectBoard }) => {
  const [activeSpace, setActiveSpace] = useState<WorkspaceType>('personal');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBoards = boards.filter(
    b => b.workspace === activeSpace && b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const NavItem = ({ space, icon: Icon, label }: { space: WorkspaceType, icon: any, label: string }) => (
    <button
      onClick={() => setActiveSpace(space)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
        activeSpace === space 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex w-full h-full bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-6">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">IF</div>
          <span className="font-bold text-xl tracking-tight text-slate-800">InfinityFlow</span>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <div className="text-xs font-bold text-slate-400 uppercase px-4 mb-2">工作空间</div>
          <NavItem space="personal" icon={User} label="个人空间" />
          <NavItem space="team" icon={Users} label="团队空间" />
        </div>

        <div className="mt-auto border-t pt-6">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-500 font-medium">
              我
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-slate-900 truncate">高级工程师</div>
              <div className="text-xs text-slate-500 truncate">专业版</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-20 border-b border-slate-200 bg-white px-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800">
            {activeSpace === 'personal' ? '我的画板' : '团队画板'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="搜索画板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 border rounded-lg text-sm outline-none transition-all w-64"
              />
            </div>
            <button 
              onClick={() => onCreateBoard(activeSpace)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-md transition-colors"
            >
              <Plus size={18} />
              新建画板
            </button>
          </div>
        </div>

        {/* Board Grid */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Create New Card Placeholder */}
            <button 
              onClick={() => onCreateBoard(activeSpace)}
              className="group h-48 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <Plus size={24} />
              </div>
              <span className="font-medium text-slate-500 group-hover:text-blue-600">创建新画板</span>
            </button>

            {/* Board Cards */}
            {filteredBoards.map(board => (
              <div 
                key={board.id} 
                onClick={() => onSelectBoard(board.id)}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-all cursor-pointer flex flex-col h-48 relative"
              >
                {/* Thumbnail Area */}
                <div 
                  className="flex-1 relative overflow-hidden"
                  style={{ backgroundColor: board.thumbnailColor || '#f1f5f9' }}
                >
                    <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                        <LayoutGrid size={64} className="text-black" />
                    </div>
                    {/* Mock Content Preview */}
                    <div className="absolute top-4 left-4 right-4 bottom-4 bg-white/50 rounded-lg shadow-sm transform group-hover:scale-105 transition-transform duration-500"></div>
                </div>

                {/* Info Area */}
                <div className="h-14 px-4 flex items-center justify-between border-t border-slate-100 bg-white relative z-10">
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-slate-800 truncate text-sm">{board.title}</span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock size={10} />
                        <span>{board.lastModified}</span>
                    </div>
                  </div>
                  <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};