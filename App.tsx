import React, { useState } from 'react';
import { Board, WorkspaceType, Folder } from './types';
import { Dashboard } from './components/Dashboard';
import { CanvasEditor } from './components/CanvasEditor';

const INITIAL_FOLDERS: Folder[] = [
    { id: 'f1', name: 'Q4 营销专案', workspace: 'team', parentId: null, createdAt: '2023-10-01' },
    { id: 'f2', name: '个人灵感集', workspace: 'personal', parentId: null, createdAt: '2023-11-05' }
];

const INITIAL_BOARDS: Board[] = [
  { id: '1', title: 'Q4 营销策略', lastModified: '2 小时前', workspace: 'team', folderId: 'f1', thumbnailColor: '#dbeafe' },
  { id: '2', title: '网站重设计', lastModified: '1 天前', workspace: 'team', folderId: null, thumbnailColor: '#e0e7ff' },
  { id: '3', title: '个人笔记', lastModified: '3 天前', workspace: 'personal', folderId: 'f2', thumbnailColor: '#f3f4f6' },
  { id: '4', title: '产品创意', lastModified: '1 周前', workspace: 'personal', folderId: null, thumbnailColor: '#fef3c7' }
];

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>(INITIAL_BOARDS);
  const [folders, setFolders] = useState<Folder[]>(INITIAL_FOLDERS);

  const handleCreateBoard = (workspace: WorkspaceType, folderId: string | null) => {
    const newBoard: Board = {
      id: Date.now().toString(),
      title: '未命名项目',
      lastModified: '刚刚',
      workspace: workspace,
      folderId: folderId,
      thumbnailColor: ['#dbeafe', '#e0e7ff', '#f3f4f6', '#fef3c7'][Math.floor(Math.random() * 4)],
      items: []
    };
    setBoards(prev => [newBoard, ...prev]);
    setActiveBoardId(newBoard.id);
    setCurrentView('editor');
  };

  const handleCreateFolder = (workspace: WorkspaceType, name: string, parentId: string | null) => {
      const newFolder: Folder = {
          id: 'f_' + Date.now(),
          name,
          workspace,
          parentId,
          createdAt: new Date().toLocaleDateString()
      };
      setFolders(prev => [...prev, newFolder]);
  };

  const handleMoveItem = (itemId: string, isFolder: boolean, targetWorkspace: WorkspaceType, targetFolderId: string | null) => {
      if (isFolder) {
          // Move folder logic (simplified, assuming no circular checks for this demo)
          setFolders(prev => prev.map(f => f.id === itemId ? { ...f, workspace: targetWorkspace, parentId: targetFolderId } : f));
      } else {
          setBoards(prev => prev.map(b => b.id === itemId ? { ...b, workspace: targetWorkspace, folderId: targetFolderId } : b));
      }
  };

  const handleDeleteItem = (itemId: string, isFolder: boolean) => {
      if (isFolder) {
          setFolders(prev => prev.filter(f => f.id !== itemId));
          // Reset boards in that folder to root (or delete them, logic choice. Here: reset to root)
          setBoards(prev => prev.map(b => b.folderId === itemId ? { ...b, folderId: null } : b));
      } else {
          setBoards(prev => prev.filter(b => b.id !== itemId));
      }
  };

  const handleRenameItem = (itemId: string, isFolder: boolean, newName: string) => {
    if (isFolder) {
        setFolders(prev => prev.map(f => f.id === itemId ? { ...f, name: newName } : f));
    } else {
        setBoards(prev => prev.map(b => b.id === itemId ? { ...b, title: newName } : b));
    }
  };

  const handleSelectBoard = (boardId: string) => {
    setActiveBoardId(boardId);
    setCurrentView('editor');
  };

  const handleBackToDashboard = () => {
    setActiveBoardId(null);
    setCurrentView('dashboard');
  };

  const activeBoard = boards.find(b => b.id === activeBoardId);

  if (currentView === 'editor' && activeBoard) {
    return (
        <CanvasEditor 
            board={activeBoard} 
            onBack={handleBackToDashboard} 
            onRenameBoard={(newName) => handleRenameItem(activeBoard.id, false, newName)}
        />
    );
  }

  return (
    <Dashboard 
      boards={boards} 
      folders={folders}
      onCreateBoard={handleCreateBoard}
      onCreateFolder={handleCreateFolder}
      onSelectBoard={handleSelectBoard} 
      onMoveItem={handleMoveItem}
      onDeleteItem={handleDeleteItem}
      onRenameItem={handleRenameItem}
    />
  );
}