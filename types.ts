
export type ItemType = 'note' | 'text' | 'image' | 'video' | 'shape' | 'html' | 'image-generator' | 'video-generator' | 'mindmap-root' | 'mindmap-child';

// Helper interface for node data specific to mind maps
export interface MindMapNodeData {
  label: string;
  isRoot?: boolean;
  parentId?: string; // For logical traversal
  isCollapsed?: boolean;
  // Dynamic layout helpers
  depth?: number;
  order?: number;
}

export interface CanvasItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string; // For mindmaps, this is the text label
  color?: string;
  meta?: {
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    backgroundColor?: string;
    depth?: number; // For mindmap
    rootId?: string; // ID of the root node this belongs to
    parentId?: string; // ID of the immediate parent
    isCollapsed?: boolean;
    [key: string]: any; 
  }; 
}

export interface CanvasEdge {
  id: string;
  source: string;  // Source node ID
  target: string;  // Target node ID
  type?: 'default' | 'smoothstep' | 'straight' | 'step';
  animated?: boolean;
  style?: {
    stroke?: string;
    strokeWidth?: number;
  };
  label?: string;
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

// New: View Modes for Dashboard
export type ViewMode = 'grid-lg' | 'grid-sm' | 'list';

// New: Folder Interface
export interface Folder {
  id: string;
  name: string;
  workspace: WorkspaceType;
  parentId: string | null; // For nested folders (optional)
  createdAt: string;
}

export interface Board {
  id: string;
  title: string;
  lastModified: string;
  workspace: WorkspaceType;
  folderId?: string | null; // New: Belong to a folder
  items?: CanvasItem[]; 
  edges?: CanvasEdge[]; // New: Connection edges
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