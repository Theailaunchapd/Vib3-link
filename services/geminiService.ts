
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AIModel, ContentItem } from "../types";

// Helper to get client using Replit AI Integrations
const getClient = () => new GoogleGenAI({ 
  apiKey: import.meta.env.VITE_AI_INTEGRATIONS_GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY || '',
  httpOptions: {
    apiVersion: "",
    baseUrl: import.meta.env.VITE_AI_INTEGRATIONS_GEMINI_BASE_URL || process.env.AI_INTEGRATIONS_GEMINI_BASE_URL,
  }
});

// 1. Thinking Mode for Complex Bio Generation
export const generateBioWithThinking = async (currentBio: string, context: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: AIModel.Thinking,
      contents: `Analyze this user context and current bio. Write a compelling, high-converting social media bio. 
      Context: ${context}
      Current Bio: ${currentBio}`,
      config: {
        thinkingConfig: { thinkingBudget: 1024 }, // Using a moderate budget for speed/quality balance
      }
    });
    return response.text || "Could not generate bio.";
  } catch (error) {
    console.error("Thinking Bio Error:", error);
    throw error;
  }
};

// 2. Search Grounding for Trends
export const getTrendingTopics = async (): Promise<{text: string, sources: any[]}> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: AIModel.Fast,
      contents: "What are the top 3 trending topics in tech and social media right now? Keep it brief.",
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    return {
      text: response.text || "No trends found.",
      sources
    };
  } catch (error) {
    console.error("Search Error:", error);
    throw error;
  }
};

// 3. Image Generation (Nano Banana Pro)
export const generateProfileImage = async (prompt: string, resolution: '1K' | '2K' | '4K'): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: AIModel.ImageGen,
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: resolution
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

// 4. Image Editing (Nano Banana)
export const editImageWithPrompt = async (base64Image: string, prompt: string, mimeType: string = 'image/png'): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: AIModel.ImageEdit,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType } },
          { text: prompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No edited image returned");
  } catch (error) {
    console.error("Image Edit Error:", error);
    throw error;
  }
};

// 5. Video Generation (Veo)
export const generateBackgroundVideo = async (prompt: string, aspectRatio: '16:9' | '9:16' = '9:16'): Promise<string> => {
  const ai = getClient();
  
  try {
    let operation = await ai.models.generateVideos({
      model: AIModel.VideoGen,
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) throw new Error("Video generation failed to return a URI.");
    
    // Proxy fetch to get the blob/url accessible to frontend
    const videoResponse = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
    const blob = await videoResponse.blob();
    return URL.createObjectURL(blob);
    
  } catch (error) {
    console.error("Veo Error:", error);
    throw error;
  }
};

// 6. Text-to-Speech (TTS)
export const generateWelcomeSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: AIModel.TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName }, 
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    return base64Audio; 
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

// 7. Chatbot (Conversational)
export const sendChatMessage = async (history: {role: 'user' | 'model', parts: [{text: string}]}[], message: string) => {
  const ai = getClient();
  const chat = ai.chats.create({
    model: AIModel.Thinking, // Using Pro for better chat
    history: history,
  });
  
  const result = await chat.sendMessage({ message });
  return result.text;
};

// 8. Generate Product Description (Fast)
export const generateProductDescription = async (productName: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: AIModel.Fast,
      contents: `Write a short, catchy product description (max 20 words) for an item named "${productName}".`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Product Desc Error:", error);
    return "";
  }
};

// 9. Analytics Insights (Thinking)
export const generateAnalyticsInsights = async (stats: any): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateContent({
      model: AIModel.Thinking,
      contents: `You are a Data Analyst for a social media influencer. Analyze these stats and provide 3 key strategic insights/actions to grow audience and revenue. Be specific.
      
      Data Overview:
      - Total Views: ${stats.totalViews} (Trend: ${stats.viewsTrend})
      - Link Clicks: ${stats.clicks} (Trend: ${stats.clicksTrend})
      - Revenue: ${stats.revenue} (Trend: ${stats.revenueTrend})
      - Top Platform: ${stats.topSource}
      
      Output format: 
      1. [Insight Title]: [Description]
      2. [Insight Title]: [Description]
      3. [Insight Title]: [Description]`,
      config: {
        thinkingConfig: { thinkingBudget: 2048 },
      }
    });
    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Analytics Error:", error);
    throw error;
  }
};

// 10. Magic Theme Generator
export const generateThemeFromDescription = async (description: string): Promise<{
    backgroundColor: string;
    theme: 'modern' | 'retro' | 'glass';
    backgroundPrompt: string;
}> => {
    const ai = getClient();
    try {
        const response = await ai.models.generateContent({
            model: AIModel.Fast,
            contents: `Generate a UI theme configuration based on this description: "${description}".
            
            Return JSON with:
            - backgroundColor: Hex code matching the vibe.
            - theme: One of 'modern', 'retro', 'glass'.
            - backgroundPrompt: A high-quality image generation prompt for a background texture/image that fits the vibe.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        backgroundColor: { type: Type.STRING },
                        theme: { type: Type.STRING, enum: ['modern', 'retro', 'glass'] },
                        backgroundPrompt: { type: Type.STRING }
                    },
                    required: ['backgroundColor', 'theme', 'backgroundPrompt']
                }
            }
        });
        
        // Fix: Strip markdown syntax if present (Gemini sometimes wraps JSON in ```json ... ```)
        const text = response.text || "{}";
        const cleanText = text.replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error("Theme Gen Error:", error);
        throw error;
    }
};

export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
