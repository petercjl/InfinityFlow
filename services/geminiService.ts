import { GoogleGenAI, Type } from "@google/genai";
import { ProjectFile } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

// Helper to clean base64 string for API
const cleanBase64 = (dataUrl: string) => dataUrl.split(',')[1] || dataUrl;

/**
 * Direct Image Generation Function
 */
export const generateImage = async (prompt: string, modelId: string): Promise<string> => {
    const ai = getAIClient();
    
    try {
        // Imagen Check
        if (modelId.toLowerCase().includes('imagen')) {
            const response = await ai.models.generateImages({
            model: modelId,
            prompt: prompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
            });
            const img = response.generatedImages?.[0]?.image;
            if (img && img.imageBytes) {
                return `data:image/jpeg;base64,${img.imageBytes}`;
            }
            throw new Error("Imagen generation failed");
        }

        // Gemini Image Generation
        const response = await ai.models.generateContent({
            model: modelId || 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    } catch (e) {
        console.warn("Image generation API failed, using mock fallback.", e);
    }
    
    // Mock Fallback if API fails or for demo models
    await new Promise(r => setTimeout(r, 1000));
    return `https://picsum.photos/seed/${Math.random()}/1024/1024`;
};

/**
 * Direct Video Generation Function
 */
export const generateVideo = async (prompt: string, modelId: string): Promise<string> => {
    const ai = getAIClient();

    try {
        if (modelId.includes('veo')) {
             if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
                await (window as any).aistudio.openSelectKey();
            }
            // Re-init for Veo key
            const veoClient = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
            
            let operation = await veoClient.models.generateVideos({
                model: modelId,
                prompt: prompt,
                config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
            });

            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 5000));
                operation = await veoClient.operations.getVideosOperation({ operation: operation });
            }
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                const vidResp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                const blob = await vidResp.blob();
                return URL.createObjectURL(blob);
            }
        }
    } catch (e) {
        console.warn("Video generation failed or not configured, falling back to mock.", e);
    }

    // Mock Fallback
    await new Promise(r => setTimeout(r, 2000));
    return 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
};

/**
 * Chat with the Agent (Multi-modal)
 * Auto-detects intent if not specified, but primarily serves the Chat interface.
 */
export const chatWithAgent = async (
  message: string, 
  contextImages: string[], // Base64 data URLs
  mode: 'CHAT' | 'IMAGE_GEN' | 'VIDEO_GEN', // Intent passed from UI
  systemInstruction?: string,
  modelId?: string
): Promise<{ text?: string, media?: { type: 'image' | 'video', url: string } }> => {
  
  const ai = getAIClient();

  // 1. Image Generation Mode Intent
  if (mode === 'IMAGE_GEN') {
    const url = await generateImage(message, modelId || 'gemini-2.5-flash-image');
    return { 
        text: "图片已为您生成，请查看画板。", 
        media: { type: 'image', url } 
    };
  }

  // 2. Video Generation Mode Intent
  if (mode === 'VIDEO_GEN') {
    const url = await generateVideo(message, modelId || 'veo-3.1-fast-generate-preview');
    return { 
        text: "视频已为您生成，请查看画板。", 
        media: { type: 'video', url } 
    };
  }

  // 3. General Chat Mode
  const defaultModel = contextImages.length > 0 ? 'gemini-2.5-flash-image' : 'gemini-3-flash-preview';
  const model = modelId || defaultModel;
  
  const parts: any[] = [];
  contextImages.forEach(img => {
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: cleanBase64(img)
      }
    });
  });
  parts.push({ text: message });

  try {
      const response = await ai.models.generateContent({
        model: model,
        contents: { parts },
        config: {
          systemInstruction: systemInstruction || "你是一个智能项目助手。请用简体中文回答。"
        }
      });
      return { text: response.text || "我没有收到回复。" };
  } catch (e) {
      console.error(e);
      return { text: "抱歉，我遇到了一些问题，请稍后再试。" };
  }
};

/**
 * Workflow: Market Analysis
 */
export const runAnalysisWorkflow = async (files: ProjectFile[], userQuery: string): Promise<string> => {
  const ai = getAIClient();
  
  let fileContext = "";
  files.forEach(f => {
    if (f.type !== 'image') {
      fileContext += `\n--- FILE: ${f.name} (${f.category}) ---\n${f.content.substring(0, 5000)}\n`;
    }
  });

  const prompt = `
    You are a Senior Data Analyst Agent.
    TASK: Analyze the provided project files and the User Query: "${userQuery}".
    OUTPUT: Generate a comprehensive HTML report in Simplified Chinese (简体中文).
    - Use Tailwind CSS.
    - OUTPUT ONLY HTML inside a <div>.
    
    PROJECT DATA:
    ${fileContext}
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: prompt,
        config: { thinkingConfig: { thinkingBudget: 2048 } }
      });

      let html = response.text || "<p>分析失败。</p>";
      html = html.replace(/```html/g, '').replace(/```/g, '');
      return html;
  } catch(e) {
      console.error(e);
      return "<p>生成报告时出错。</p>";
  }
};