/// <reference types="vite/client" />
import { createClient } from "@supabase/supabase-js";
import { Type, Schema, Modality } from "@google/genai";
import { RECIPE_GENERATION_SYSTEM_INSTRUCTION } from "../constants";
import { Recipe } from "../types";

// Initialize Supabase Client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key missing. AI features will not work until configured.");
}

const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

// Helper to call Edge Function
const callGeminiEdge = async (model: string, contents: any, config?: any) => {
  const { data, error } = await supabase.functions.invoke('generate-recipe', {
    body: { model, contents, config }
  });

  if (error) {
    console.error("Supabase Edge Function Error:", error);
    throw new Error(`Edge Function failed: ${error.message}`);
  }

  // The Edge Function returns the full response object
  return data;
};

// Define Schema for structured output (Keep existing schema)
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
    ? `CRITICAL CONSTRAINTS: The user has the following limitations: ${constraints.join(', ')}. 
      
      IMPORTANT: If a constraint says "Exclude ingredients:", you MUST NOT under any circumstances use those ingredients in the recipe steps, ingredient list, or garnish. Find substitutes or omit them entirely.
      
      You MUST strictly adhere to these. Do not use equipment that is restricted (e.g. if 'No Stove', use microwave, oven, or raw prep only).`
    : "";

  // Add text prompt or default instruction
  if (textPrompt) {
    parts.push({ text: `User text request: "${textPrompt}". ${constraintText} Create a recipe based on this.` });
  } else if (!audioBase64) {
    parts.push({ text: `I have these ingredients. ${constraintText} Make me something delicious.` });
  } else {
    parts.push({ text: constraintText });
  }

  // Add final prompt
  parts.push({ text: "Analyze the ingredients and the user request. Create a recipe." });

  try {
    const response = await callGeminiEdge('gemini-flash-latest', [{ parts }], {
      systemInstruction: RECIPE_GENERATION_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response generated");

    const rawRecipe = JSON.parse(text);

    return {
      ...rawRecipe,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      createdAt: Date.now(),
      constraints: constraints
    } as Recipe;

  } catch (error) {
    console.error("Recipe Generation Error:", error);
    throw error;
  }
};

export const generateDishImage = async (title: string, description: string): Promise<string> => {
  // Use Pollinations.ai (No API key needed)
  const prompt = `professional food photography, ${title}, ${description.split('.')[0]}`.slice(0, 300);
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 1000);
  return `https://image.pollinations.ai/prompt/${encodedPrompt}?nologo=true&seed=${seed}&width=1024&height=1024&model=flux`;
};

export const generateTTS = async (text: string): Promise<string> => {
  try {
    const response = await callGeminiEdge("gemini-2.5-flash-preview-tts", [{ parts: [{ text }] }], {
      responseModalities: [Modality.AUDIO], // Pass enum value, checks serialization
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
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

// --- MEAL PREP MODE ---

const mealPlanSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    description: { type: Type.STRING },
    shoppingList: { type: Type.ARRAY, items: { type: Type.STRING } },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING },
          meals: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['Breakfast', 'Lunch', 'Dinner'] },
                recipe: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    prepTime: { type: Type.STRING }
                  },
                  required: ['title', 'description', 'prepTime']
                }
              },
              required: ['type', 'recipe']
            }
          }
        },
        required: ['day', 'meals']
      }
    }
  },
  required: ['title', 'description', 'days', 'shoppingList']
};

export const generateMealPlanFromInput = async (
  images: string[],
  audioBase64: string | null,
  audioMimeType?: string,
  textPrompt?: string,
  constraints: string[] = [],
  mealTypes: string[] = ['Dinner']
): Promise<any> => {
  const parts: any[] = [];

  // Add inputs
  images.forEach(img => parts.push({ inlineData: { mimeType: 'image/jpeg', data: img } }));
  if (audioBase64) parts.push({ inlineData: { mimeType: audioMimeType || 'audio/wav', data: audioBase64 } });

  // Construct Prompt
  const mealsToPrep = mealTypes.join(', ');
  const constraintText = constraints.length > 0 ? `Constraints: ${constraints.join(', ')}.` : "";

  const systemPrompt = `
    You are The Chef's Muse, specializing in student meal prep.
    Create a practical 5-day meal plan based on the available ingredients.
    Focus on:
    1. Minimizing waste (reuse ingredients across days).
    2. Student-friendly budget and simplicity.
    3. Generate plans ONLY for: ${mealsToPrep}.
    
    ${constraintText}
    
    If text/audio is provided ("${textPrompt || ''}"), use it as context.
    Output purely strictly valid JSON matching the schema.
  `;

  parts.push({ text: systemPrompt });

  try {
    const response = await callGeminiEdge('gemini-flash-latest', [{ parts }], {
      responseMimeType: "application/json",
      responseSchema: mealPlanSchema,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response generated");

    const rawPlan = JSON.parse(text);

    return {
      ...rawPlan,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      createdAt: Date.now(),
    };

  } catch (error) {
    console.error("Meal Plan Generation Error:", error);
    throw error;
  }
};

export const generateRecipeFromSummary = async (
  title: string,
  description: string,
  constraints: string[] = []
): Promise<Recipe> => {

  const constraintText = constraints.length > 0 ? `Constraints: ${constraints.join(', ')}.` : "";

  const prompt = `
    You are expanding a meal plan summary into a full recipe.
    Title: ${title}
    Description: ${description}
    ${constraintText}

    Create a detailed step-by-step recipe for this dish. 
    Ensure it matches the description EXACTLY.
    For ingredients, categorize them into 'ingredientsFound' (core items likely to be in a student pantry or the weekly shop) and 'pantryItemsNeeded' (staples like oil, spices).
  `;

  try {
    const response = await callGeminiEdge('gemini-flash-latest', [{ parts: [{ text: prompt }] }], {
      systemInstruction: RECIPE_GENERATION_SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: recipeSchema,
    });

    const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("No response generated");

    const rawRecipe = JSON.parse(text);

    return {
      ...rawRecipe,
      id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(),
      createdAt: Date.now(),
      constraints: constraints
    } as Recipe;

  } catch (error) {
    console.error("Recipe Expansion Error:", error);
    throw error;
  }
};