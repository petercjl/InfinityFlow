import React, { useState, useEffect } from 'react';
import { Board, WorkspaceType, Folder, ViewMode } from '../types';
import { User, Users, Plus, LayoutGrid, MoreHorizontal, Search, Clock, Folder as FolderIcon, Grid3X3, List, ChevronRight, FolderPlus, ArrowRightLeft, Trash2, X, Edit2 } from 'lucide-react';

interface DashboardProps {
  boards: Board[];
  folders: Folder[];
  onCreateBoard: (workspace: WorkspaceType, folderId: string | null) => void;
  onCreateFolder: (workspace: WorkspaceType, name: string, parentId: string | null) => void;
  onSelectBoard: (boardId: string) => void;
  onMoveItem: (itemId: string, isFolder: boolean, targetWorkspace: WorkspaceType, targetFolderId: string | null) => void;
  onDeleteItem: (itemId: string, isFolder: boolean) => void;
  onRenameItem: (itemId: string, isFolder: boolean, newName: string) => void;
  initialSpace?: WorkspaceType | null;
}

// Mock User for Permissions
const MOCK_USER = {
    id: 'u1',
    name: '当前用户',
    role: 'member' // Change to 'admin' to test permissions
};

export const Dashboard: React.FC<DashboardProps> = ({ 
    boards, 
    folders,
    onCreateBoard, 
    onCreateFolder,
    onSelectBoard,
    onMoveItem,
    onDeleteItem,
    onRenameItem,
    initialSpace
}) => {
  const [activeSpace, setActiveSpace] = useState<WorkspaceType>('personal');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid-lg');
  
  // Create Folder Modal State
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  // Move Modal State
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<{id: string, isFolder: boolean} | null>(null);
  const [moveTargetSpace, setMoveTargetSpace] = useState<WorkspaceType>('personal');
  const [moveTargetFolderId, setMoveTargetFolderId] = useState<string | null>(null);

  // Rename State
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Restore active space from props if provided
  useEffect(() => {
    if (initialSpace) {
        setActiveSpace(initialSpace);
    }
  }, [initialSpace]);

  // Permission Check
  const canManage = activeSpace === 'personal' || (activeSpace === 'team' && MOCK_USER.role === 'admin');

  // Filter Data
  const currentFolders = folders.filter(
      f => f.workspace === activeSpace && (currentFolderId ? f.parentId === currentFolderId : f.parentId == null) && f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const currentBoards = boards.filter(
    b => b.workspace === activeSpace && (currentFolderId ? b.folderId === currentFolderId : b.folderId == null) && b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Breadcrumbs Logic
  const getBreadcrumbs = () => {
      const crumbs = [{ id: null, name: activeSpace === 'personal' ? '个人空间' : '团队空间' }];
      if (!currentFolderId) return crumbs;

      let curr = folders.find(f => f.id === currentFolderId);
      const path = [];
      const maxDepth = 10; // Prevent infinite loops if data is corrupted
      let depth = 0;
      while (curr && depth < maxDepth) {
          path.unshift({ id: curr.id, name: curr.name });
          curr = folders.find(f => f.id === curr!.parentId);
          depth++;
      }
      return [...crumbs, ...path];
  };

  const handleCreateNewFolder = () => {
     if (newFolderName.trim()) {
         onCreateFolder(activeSpace, newFolderName.trim(), currentFolderId);
         setNewFolderName('');
         setIsCreateFolderOpen(false);
     }
  };

  const openMoveModal = (id: string, isFolder: boolean) => {
      setItemToMove({ id, isFolder });
      setMoveTargetSpace(activeSpace);
      setMoveTargetFolderId(null);
      setIsMoveModalOpen(true);
  };

  const confirmMove = () => {
      if (itemToMove) {
          onMoveItem(itemToMove.id, itemToMove.isFolder, moveTargetSpace, moveTargetFolderId);
          setIsMoveModalOpen(false);
          setItemToMove(null);
      }
  };

  const startRename = (id: string, currentName: string) => {
      setEditingItemId(id);
      setEditingName(currentName);
  };

  const saveRename = (id: string, isFolder: boolean) => {
      if (editingName.trim()) {
          onRenameItem(id, isFolder, editingName.trim());
      }
      setEditingItemId(null);
      setEditingName('');
  };

  const NavItem = ({ space, icon: Icon, label }: { space: WorkspaceType, icon: any, label: string }) => (
    <button
      onClick={() => { setActiveSpace(space); setCurrentFolderId(null); }}
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

  const ViewOption = ({ mode, icon: Icon }: { mode: ViewMode, icon: any }) => (
      <button 
        onClick={() => setViewMode(mode)}
        className={`p-2 rounded-lg transition-colors ${viewMode === mode ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
      >
          <Icon size={18} />
      </button>
  );

  return (
    <div className="flex w-full h-full bg-slate-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">IF</div>
          <span className="font-bold text-xl tracking-tight text-slate-800">无限画板</span>
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
              <div className="text-sm font-semibold text-slate-900 truncate">{MOCK_USER.name}</div>
              <div className="text-xs text-slate-500 truncate">{MOCK_USER.role === 'admin' ? '管理员' : '成员'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-4 flex-1">
              <h2 className="text-xl font-bold text-slate-800 hidden md:block">
                {activeSpace === 'personal' ? '我的画板' : '团队画板'}
              </h2>
              <div className="h-6 w-px bg-slate-200 hidden md:block" />
              
              {/* Breadcrumbs */}
              <div className="flex items-center text-sm text-slate-500">
                  {getBreadcrumbs().map((crumb, idx, arr) => (
                      <React.Fragment key={crumb.id || 'root'}>
                          <button 
                            onClick={() => setCurrentFolderId(crumb.id as string)}
                            className={`hover:text-blue-600 hover:underline ${idx === arr.length - 1 ? 'font-bold text-slate-800' : ''}`}
                          >
                              {crumb.name}
                          </button>
                          {idx < arr.length - 1 && <ChevronRight size={14} className="mx-1 text-slate-300" />}
                      </React.Fragment>
                  ))}
              </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-slate-100 border-transparent focus:bg-white focus:border-blue-500 border rounded-lg text-sm outline-none transition-all w-48"
              />
            </div>
            
            <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-200">
                <ViewOption mode="grid-lg" icon={LayoutGrid} />
                <ViewOption mode="grid-sm" icon={Grid3X3} />
                <ViewOption mode="list" icon={List} />
            </div>

            <button onClick={() => setIsCreateFolderOpen(true)} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg" title="新建文件夹">
                <FolderPlus size={20} />
            </button>

            <button 
              onClick={() => onCreateBoard(activeSpace, currentFolderId)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-colors"
            >
              <Plus size={16} />
              新建画板
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
            
            {/* Empty State */}
            {currentFolders.length === 0 && currentBoards.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <FolderIcon size={32} />
                    </div>
                    <p>此文件夹为空</p>
                    <div className="flex gap-4 mt-4">
                        <button onClick={() => setIsCreateFolderOpen(true)} className="text-blue-600 hover:underline text-sm">新建文件夹</button>
                        <button onClick={() => onCreateBoard(activeSpace, currentFolderId)} className="text-blue-600 hover:underline text-sm">创建新画板</button>
                    </div>
                </div>
            )}

            <div className={`
                ${viewMode === 'grid-lg' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : ''}
                ${viewMode === 'grid-sm' ? 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4' : ''}
                ${viewMode === 'list' ? 'flex flex-col gap-2' : ''}
            `}>
                
                {/* Folders */}
                {currentFolders.map(folder => (
                    <div 
                        key={folder.id}
                        onClick={() => setCurrentFolderId(folder.id)}
                        className={`
                            group bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md cursor-pointer transition-all
                            ${viewMode === 'list' ? 'flex items-center px-4 py-3 rounded-lg' : 'flex flex-col rounded-xl overflow-hidden aspect-[4/3] p-4'}
                        `}
                    >
                        {viewMode === 'list' ? (
                            <>
                                <FolderIcon size={20} className="text-yellow-400 fill-yellow-400 mr-4" />
                                <span className="flex-1 font-medium text-slate-700 text-sm truncate">{folder.name}</span>
                                <span className="text-xs text-slate-400 mr-8">{folder.createdAt}</span>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                    {canManage && (
                                        <>
                                            <button onClick={() => openMoveModal(folder.id, true)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ArrowRightLeft size={14} /></button>
                                            <button onClick={() => onDeleteItem(folder.id, true)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={14} /></button>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex-1 flex items-center justify-center">
                                    <FolderIcon size={viewMode === 'grid-lg' ? 64 : 48} className="text-yellow-100 fill-yellow-100 group-hover:text-yellow-200 group-hover:fill-yellow-200 transition-colors" />
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                    <span className="font-medium text-slate-700 text-sm truncate px-1">{folder.name}</span>
                                    {canManage && (
                                        <div className="relative group/menu">
                                            <MoreHorizontal size={14} className="text-slate-400 hover:text-slate-600" />
                                            <div className="absolute bottom-full right-0 mb-2 w-24 bg-white border shadow-lg rounded-lg py-1 hidden group-hover/menu:block z-10">
                                                <button onClick={(e) => { e.stopPropagation(); openMoveModal(folder.id, true); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 flex gap-2"><ArrowRightLeft size={12}/> 移动</button>
                                                <button onClick={(e) => { e.stopPropagation(); onDeleteItem(folder.id, true); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-red-50 text-red-500 flex gap-2"><Trash2 size={12}/> 删除</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {/* Boards */}
                {currentBoards.map(board => (
                     <div 
                     key={board.id} 
                     onClick={() => onSelectBoard(board.id)}
                     className={`
                         group bg-white border border-slate-200 overflow-hidden hover:shadow-xl hover:border-blue-300 transition-all cursor-pointer relative
                         ${viewMode === 'list' ? 'flex items-center px-4 py-3 rounded-lg' : 'flex flex-col rounded-2xl'}
                         ${viewMode === 'grid-lg' ? 'h-48' : ''}
                         ${viewMode === 'grid-sm' ? 'h-40' : ''}
                     `}
                   >
                     {viewMode === 'list' ? (
                         <>
                            <div className="w-8 h-8 rounded mr-4" style={{ backgroundColor: board.thumbnailColor || '#eee' }}></div>
                            <span className="flex-1 font-semibold text-slate-800 text-sm truncate">{board.title}</span>
                            <span className="text-xs text-slate-400 mr-8">{board.lastModified}</span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                {canManage && (
                                    <>
                                        <button onClick={() => openMoveModal(board.id, false)} className="p-1 hover:bg-slate-100 rounded text-slate-400"><ArrowRightLeft size={14} /></button>
                                        <button onClick={() => onDeleteItem(board.id, false)} className="p-1 hover:bg-red-50 rounded text-red-400"><Trash2 size={14} /></button>
                                    </>
                                )}
                            </div>
                         </>
                     ) : (
                         <>
                            <div 
                                className="flex-1 relative overflow-hidden"
                                style={{ backgroundColor: board.thumbnailColor || '#f1f5f9' }}
                            >
                                <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity">
                                    <LayoutGrid size={48} className="text-black" />
                                </div>
                            </div>
        
                            <div className="h-14 px-4 flex items-center justify-between border-t border-slate-100 bg-white relative z-10">
                                <div className="flex flex-col min-w-0 flex-1 mr-2">
                                    {editingItemId === board.id ? (
                                        <input 
                                            autoFocus
                                            type="text"
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onBlur={() => saveRename(board.id, false)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') saveRename(board.id, false);
                                                if (e.key === 'Escape') setEditingItemId(null);
                                                e.stopPropagation();
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                            className="font-semibold text-slate-800 text-sm bg-white border border-blue-400 rounded px-1 outline-none w-full"
                                        />
                                    ) : (
                                        <span className="font-semibold text-slate-800 truncate text-sm" title={board.title}>{board.title}</span>
                                    )}
                                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                        <Clock size={10} />
                                        <span>{board.lastModified}</span>
                                    </div>
                                </div>
                                {canManage && (
                                    <div className="relative group/menu" onClick={e => e.stopPropagation()}>
                                        <button className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
                                            <MoreHorizontal size={16} />
                                        </button>
                                        <div className="absolute bottom-full right-0 mb-1 w-28 bg-white border shadow-lg rounded-lg py-1 hidden group-hover/menu:block z-20">
                                            <button onClick={() => startRename(board.id, board.title)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                                <Edit2 size={12}/> 重命名
                                            </button>
                                            <button onClick={() => openMoveModal(board.id, false)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2">
                                                <ArrowRightLeft size={12}/> 移动
                                            </button>
                                            <button onClick={() => onDeleteItem(board.id, false)} className="w-full text-left px-4 py-2 text-xs hover:bg-red-50 text-red-500 flex items-center gap-2">
                                                <Trash2 size={12}/> 删除
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                         </>
                     )}
                   </div>
                ))}
            </div>
        </div>

        {/* Create Folder Modal */}
        {isCreateFolderOpen && (
            <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-80 p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold">新建文件夹</h3>
                        <button onClick={() => setIsCreateFolderOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
                    </div>
                    <input 
                        type="text" 
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        placeholder="输入文件夹名称"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 outline-none mb-4"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleCreateNewFolder()}
                    />
                    <div className="flex justify-end gap-2">
                         <button onClick={() => setIsCreateFolderOpen(false)} className="px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
                         <button onClick={handleCreateNewFolder} disabled={!newFolderName.trim()} className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">创建</button>
                    </div>
                </div>
            </div>
        )}

        {/* Move Modal */}
        {isMoveModalOpen && (
            <div className="absolute inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-2xl w-96 p-6 animate-in zoom-in-95 duration-200">
                    <h3 className="text-lg font-bold mb-4">移动到...</h3>
                    
                    <div className="mb-4">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">目标空间</label>
                        <div className="flex bg-slate-100 p-1 rounded-lg">
                            <button 
                                onClick={() => { setMoveTargetSpace('personal'); setMoveTargetFolderId(null); }}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${moveTargetSpace === 'personal' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                            >
                                个人空间
                            </button>
                            <button 
                                onClick={() => { setMoveTargetSpace('team'); setMoveTargetFolderId(null); }}
                                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${moveTargetSpace === 'team' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
                            >
                                团队空间
                            </button>
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">选择文件夹</label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg">
                            <button 
                                onClick={() => setMoveTargetFolderId(null)}
                                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 ${moveTargetFolderId === null ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                            >
                                <div className="w-4 h-4 border border-slate-400 rounded-sm" />
                                根目录
                            </button>
                            {folders.filter(f => f.workspace === moveTargetSpace).map(f => (
                                <button 
                                    key={f.id}
                                    onClick={() => setMoveTargetFolderId(f.id)}
                                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-slate-50 ${moveTargetFolderId === f.id ? 'bg-blue-50 text-blue-700' : 'text-slate-700'}`}
                                >
                                    <FolderIcon size={14} className="fill-current opacity-50" />
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <button onClick={() => setIsMoveModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">取消</button>
                        <button onClick={confirmMove} className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg">确认移动</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};