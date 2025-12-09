import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { RECIPE_GENERATION_SYSTEM_INSTRUCTION } from "../constants";
import { Recipe } from "../types";

// Helper to get API key
const getApiKey = () => import.meta.env.VITE_GEMINI_API_KEY || '';

// Define Schema for structured output
const recipeSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    cuisineStyle: { type: Type.STRING },
    difficulty: { type: Type.STRING, enum: ['Easy', 'Medium', 'Hard', 'Expert'] },
    totalTime: { type: Type.STRING },
    ingredientsFound: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    pantryItemsNeeded: {
      type: Type.ARRAY,
      items: { type: Type.STRING }
    },
    steps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          instruction: { type: Type.STRING },
          tip: { type: Type.STRING },
          duration: { type: Type.STRING }
        },
        required: ['instruction']
      }
    }
  },
  required: ['title', 'description', 'difficulty', 'ingredientsFound', 'steps']
};

export const generateRecipeFromInput = async (
  images: string[],
  audioBase64: string | null,
  audioMimeType?: string,
  textPrompt?: string,
  constraints: string[] = []
): Promise<Recipe> => {
  if (!getApiKey()) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const parts: any[] = [];

  // Add images
  images.forEach(img => {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: img
      }
    });
  });

  // Add audio if present
  if (audioBase64) {
    parts.push({
      inlineData: {
        mimeType: audioMimeType || 'audio/wav',
        data: audioBase64
      }
    });
  }

  // Construct constraint string
  const constraintText = constraints.length > 0
    ? `CRITICAL CONSTRAINTS: The user has the following limitations: ${constraints.join(', ')}. You MUST strictly adhere to these. Do not use equipment that is restricted (e.g. if 'No Stove', use microwave, oven, or raw prep only).`
    : "";

  // Add text prompt or default instruction
  if (textPrompt) {
    parts.push({ text: `User text request: "${textPrompt}". ${constraintText} Create a recipe based on this.` });
  } else if (!audioBase64) {
    parts.push({ text: `I have these ingredients. ${constraintText} Make me something delicious.` });
  } else {
    // If audio is present, just append constraints to context
    parts.push({ text: constraintText });
  }

  // Add final prompt
  parts.push({ text: "Analyze the ingredients and the user request. Create a recipe." });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: { parts },
      config: {
        systemInstruction: RECIPE_GENERATION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
      }
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response generated");

    const rawRecipe = JSON.parse(text);

    // Enrich with local data
    return {
      ...rawRecipe,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      createdAt: Date.now(),
      constraints: constraints // Store constraints in the recipe
    } as Recipe;

  } catch (error) {
    console.error("Recipe Generation Error:", error);
    throw error;
  }
};

export const generateDishImage = async (title: string, description: string): Promise<string> => {
  // Use Pollinations.ai (Free Alternative)
  // We create a concise, URL-safe prompt
  const prompt = `professional food photography, ${title}, ${description.split('.')[0]}`.slice(0, 300); // Limit length
  const encodedPrompt = encodeURIComponent(prompt);

  // Return the URL directly. The browser will handle the loading.
  // We add a random seed to ensure uniqueness if called multiple times.
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${seed}&width=1024&height=1024&model=flux`;
};

export const generateTTS = async (text: string): Promise<string> => {
  if (!getApiKey()) throw new Error("API Key missing");
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("No audio generated");
    return audioData;

  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};