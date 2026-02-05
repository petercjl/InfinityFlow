import { ProjectFile } from "../types";

const API_BASE = '/api';

/**
 * Direct Image Generation Function
 * Calls POST /api/generate/image
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
        console.warn("API request failed, falling back to mock.", e);
        // Mock Fallback
        await new Promise(r => setTimeout(r, 1000));
        return `https://picsum.photos/seed/${Math.random()}/1024/1024`;
    }
};

/**
 * Direct Video Generation Function
 * Calls POST /api/generate/video
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
        console.warn("API request failed, falling back to mock.", e);
        // Mock Fallback
        await new Promise(r => setTimeout(r, 2000));
        return 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
    }
};

/**
 * Chat with the Agent (Multi-modal)
 * Calls POST /api/chat
 */
export const chatWithAgent = async (
  message: string, 
  contextImages: string[], // Base64 data URLs
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
      console.error(e);
      return { text: "抱歉，我遇到了一些问题，请稍后再试。" };
  }
};

/**
 * Workflow: Market Analysis
 * Calls POST /api/workflow/analysis
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
      return data.html || "<p>分析失败。</p>";
  } catch(e) {
      console.error(e);
      return "<p>生成报告时出错。</p>";
  }
};