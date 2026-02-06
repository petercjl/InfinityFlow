import { ProjectFile, CanvasItem } from "../types";

const API_BASE = '/api';

/**
 * Generate Image via Backend API
 * POST /api/generate/image
 */
export const generateImage = async (prompt: string, modelId: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/generate/image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, modelId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  } catch (e) {
    console.error("Image generation failed", e);
    throw e;
  }
};

/**
 * Generate Video via Backend API
 * POST /api/generate/video
 */
export const generateVideo = async (prompt: string, modelId: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/generate/video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt, modelId }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.url;
  } catch (e) {
    console.error("Video generation failed", e);
    throw e;
  }
};

/**
 * Chat with Agent via Backend API
 * POST /api/chat
 */
export const chatWithAgent = async (
  message: string, 
  contextImages: string[], 
  mode: 'CHAT' | 'IMAGE_GEN' | 'VIDEO_GEN', 
  systemInstruction?: string, 
  modelId?: string
): Promise<{ text?: string, media?: { type: 'image' | 'video', url: string } }> => {
  try {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message, 
        contextImages, 
        mode, 
        systemInstruction, 
        modelId 
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return await response.json();
  } catch (e) {
    console.error("Chat request failed", e);
    return { text: "抱歉，服务器暂时无法响应。" };
  }
};

/**
 * Run Analysis Workflow via Backend API
 * POST /api/workflow/analysis
 */
export const runAnalysisWorkflow = async (files: ProjectFile[], userQuery: string): Promise<string> => {
  try {
    const response = await fetch(`${API_BASE}/workflow/analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files, userQuery }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return data.html || "<p>分析完成，但未返回内容。</p>";
  } catch(e) {
    console.error("Analysis workflow failed", e);
    return "<p>生成报告时出错，请检查网络连接。</p>";
  }
};

/**
 * Get Board Items from Backend API
 * GET /api/boards/{boardId}/items
 */
export const getBoardItems = async (boardId: string): Promise<CanvasItem[]> => {
    try {
        const response = await fetch(`${API_BASE}/boards/${boardId}/items`);
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        return await response.json();
    } catch (e) {
        console.error("Failed to get board items", e);
        return [];
    }
};

/**
 * Save Board Items
 * PUT /api/boards/{boardId}/items/sync
 */
export const saveBoardItems = async (boardId: string, items: CanvasItem[]): Promise<void> => {
    try {
        await fetch(`${API_BASE}/boards/${boardId}/items/sync`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(items),
            keepalive: true // Ensures request completes even if page unloads
        });
    } catch (e) {
        console.error("Failed to save board items", e);
        // Not throwing to avoid blocking UI flow, but logged for debugging
    }
};