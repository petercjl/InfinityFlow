import React, { useState } from 'react';
import { Board, WorkspaceType } from './types';
import { Dashboard } from './components/Dashboard';
import { CanvasEditor } from './components/CanvasEditor';

const INITIAL_BOARDS: Board[] = [
  { id: '1', title: 'Q4 营销策略', lastModified: '2 小时前', workspace: 'team', thumbnailColor: '#dbeafe' },
  { id: '2', title: '网站重设计', lastModified: '1 天前', workspace: 'team', thumbnailColor: '#e0e7ff' },
  { id: '3', title: '个人笔记', lastModified: '3 天前', workspace: 'personal', thumbnailColor: '#f3f4f6' },
  { id: '4', title: '产品创意', lastModified: '1 周前', workspace: 'personal', thumbnailColor: '#fef3c7' }
];

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor'>('dashboard');
  const [activeBoardId, setActiveBoardId] = useState<string | null>(null);
  const [boards, setBoards] = useState<Board[]>(INITIAL_BOARDS);

  const handleCreateBoard = (workspace: WorkspaceType) => {
    const newBoard: Board = {
      id: Date.now().toString(),
      title: '未命名项目',
      lastModified: '刚刚',
      workspace: workspace,
      thumbnailColor: ['#dbeafe', '#e0e7ff', '#f3f4f6', '#fef3c7'][Math.floor(Math.random() * 4)],
      items: []
    };
    setBoards([newBoard, ...boards]);
    setActiveBoardId(newBoard.id);
    setCurrentView('editor');
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
    return <CanvasEditor board={activeBoard} onBack={handleBackToDashboard} />;
  }

  return (
    <Dashboard 
      boards={boards} 
      onCreateBoard={handleCreateBoard} 
      onSelectBoard={handleSelectBoard} 
    />
  );
}