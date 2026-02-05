import { GoogleGenAI } from "@google/genai";
import { ProjectFile } from "../types";

// Helper to initialize the Google GenAI client.
// We create a new instance each time to ensure the latest API key is used,
// especially important for Veo models where the user might select a key dynamically.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Direct Image Generation Function
 * Uses gemini-2.5-flash-image by default, or Imagen models if specified.
 */
export const generateImage = async (prompt: string, modelId: string): Promise<string> => {
    try {
        const ai = getAI();
        // Map 'imagen-3' from UI to the correct model name 'imagen-4.0-generate-001'
        let realModelId = modelId;
        if (modelId === 'imagen-3') realModelId = 'imagen-4.0-generate-001';

        if (realModelId.startsWith('imagen')) {
            // Imagen Models
            const response = await ai.models.generateImages({
                model: realModelId,
                prompt: prompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '1:1',
                },
            });
            const b64 = response.generatedImages?.[0]?.image?.imageBytes;
            if (!b64) throw new Error("Image generation failed");
            return `data:image/jpeg;base64,${b64}`;
        } else {
            // Gemini Image Generation (Nano Banana)
            // Do not set responseMimeType for these models.
            const response = await ai.models.generateContent({
                model: realModelId,
                contents: { parts: [{ text: prompt }] },
            });

            // Find the image part in the response
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
            throw new Error("No image found in response");
        }
    } catch (e) {
        console.error("Image generation failed", e);
        throw e;
    }
};

/**
 * Direct Video Generation Function
 * Uses Veo models. Checks for API key selection first.
 */
export const generateVideo = async (prompt: string, modelId: string): Promise<string> => {
    try {
        // Check if API key is selected for Veo models
        if ((window as any).aistudio) {
            const hasKey = await (window as any).aistudio.hasSelectedApiKey();
            if (!hasKey) {
                await (window as any).aistudio.openSelectKey();
                // Race condition handled by creating new GoogleGenAI instance below
            }
        }

        const ai = getAI();
        // Map model ID if needed. Guidelines say 'veo-3.1-fast-generate-preview' for general tasks.
        const realModel = modelId.includes('veo') ? modelId : 'veo-3.1-fast-generate-preview';

        let operation = await ai.models.generateVideos({
            model: realModel,
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p', // 720p is safer for preview
                aspectRatio: '16:9'
            }
        });

        // Polling for completion
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("Video generation failed");

        // Fetch the video content using the API key
        const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        if (!response.ok) throw new Error("Failed to download video");
        
        const blob = await response.blob();
        return URL.createObjectURL(blob);

    } catch (e) {
        console.error("Video generation failed", e);
        throw e;
    }
};

/**
 * Chat with the Agent (Multi-modal)
 * Handles Chat, Image Gen, and Video Gen intents using the SDK.
 */
export const chatWithAgent = async (
  message: string, 
  contextImages: string[], 
  mode: 'CHAT' | 'IMAGE_GEN' | 'VIDEO_GEN', 
  systemInstruction?: string,
  modelId?: string
): Promise<{ text?: string, media?: { type: 'image' | 'video', url: string } }> => {
  try {
      if (mode === 'IMAGE_GEN') {
          const url = await generateImage(message, modelId || 'gemini-2.5-flash-image');
          return { text: 'Here is your generated image.', media: { type: 'image', url } };
      }
      if (mode === 'VIDEO_GEN') {
          const url = await generateVideo(message, modelId || 'veo-3.1-fast-generate-preview');
          return { text: 'Here is your generated video.', media: { type: 'video', url } };
      }

      // Chat Mode
      const ai = getAI();
      const parts: any[] = [];

      // Add context images
      for (const img of contextImages) {
          // Assume contextImages are base64 data URLs
          if (img.startsWith('data:')) {
              const matches = img.match(/^data:(.+);base64,(.+)$/);
              if (matches) {
                  parts.push({
                      inlineData: {
                          mimeType: matches[1],
                          data: matches[2]
                      }
                  });
              }
          }
      }
      parts.push({ text: message });

      const model = modelId || 'gemini-3-flash-preview';
      
      const config: any = {};
      if (systemInstruction) {
          config.systemInstruction = systemInstruction;
      }

      const response = await ai.models.generateContent({
          model,
          contents: { parts },
          config
      });

      return { text: response.text };
  } catch (e) {
      console.error(e);
      return { text: "Sorry, I encountered an error. Please try again." };
  }
};

/**
 * Workflow: Market Analysis
 * Analyzes project files and returns an HTML report.
 */
export const runAnalysisWorkflow = async (files: ProjectFile[], userQuery: string): Promise<string> => {
  try {
      const ai = getAI();
      let fileContext = "";
      files.forEach(f => {
          // Simplify content inclusion for this example
          fileContext += `Filename: ${f.name}\nType: ${f.type}\nContent: ${f.content.substring(0, 5000)}\n\n`;
      });

      const prompt = `You are a market analysis expert. Analyze the following files and answer the user query.\n\nFiles:\n${fileContext}\n\nUser Query: ${userQuery}\n\nProvide the output strictly as an HTML report string.`;

      const response = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt,
      });

      return response.text || "<p>Analysis failed.</p>";
  } catch(e) {
      console.error(e);
      return "<p>Error generating report.</p>";
  }
};