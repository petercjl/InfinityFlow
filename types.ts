
export type ItemType = 'note' | 'image' | 'video' | 'shape' | 'mindmap' | 'report' | 'html' | 'image-generator' | 'video-generator';

export interface CanvasItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string; // Text content, Image/Video URL, or HTML string
  color?: string;
  meta?: any; // For extra data like original prompt, analysis source, etc.
}

export type FileCategory = 
  | 'CategoryRankings'
  | 'SearchTermRankings'
  | 'ReviewTable'
  | 'QATable'
  | 'ProductImages'
  | 'AnalysisReports';

export interface ProjectFile {
  id: string;
  name: string;
  type: 'pdf' | 'excel' | 'text' | 'image';
  category: FileCategory;
  content: string; // Simulated content or Base64 URL for images
  uploadDate: string;
}

export interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

export enum AgentMode {
  None = 'NONE',
  Chat = 'CHAT', // General Chat
  // Legacy modes removed from direct selection, logic handled internally
  Workflow = 'WORKFLOW' 
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  attachments?: string[]; // URLs or Base64 of attached images
  isError?: boolean;
}

export type WorkspaceType = 'personal' | 'team';

export interface Board {
  id: string;
  title: string;
  lastModified: string;
  workspace: WorkspaceType;
  items?: CanvasItem[]; 
  thumbnailColor?: string;
}

// New Types for Agent System
export interface AgentCategory {
  id: string;
  label: string;
  agents: string[];
}

export interface AIModel {
  id: string;
  name: string;
  type: 'image' | 'video' | 'chat';
}
