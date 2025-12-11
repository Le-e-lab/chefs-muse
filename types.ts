export interface RecipeStep {
  instruction: string;
  tip?: string;
  duration?: string;
}

export interface Recipe {
  id: string;
  createdAt: number;
  title: string;
  description: string;
  cuisineStyle: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  totalTime: string;
  ingredientsFound: string[];
  pantryItemsNeeded: string[];
  steps: RecipeStep[];
  constraints?: string[];
}

// Simplified recipe summary for meal plans
export interface RecipeSummary {
  title: string;
  description: string;
  prepTime: string;
}

export interface DayPlan {
  day: string;
  meals: {
    type: 'Breakfast' | 'Lunch' | 'Dinner';
    recipe: RecipeSummary;
  }[];
}

export interface MealPlan {
  id: string; // Unique ID for the plan
  createdAt: number;
  title: string;
  description: string;
  days: DayPlan[];
  shoppingList: string[];
}

export enum AppState {
  LANDING = 'LANDING',
  ABOUT = 'ABOUT',
  COOKBOOK = 'COOKBOOK',
  IDLE = 'IDLE',
  RECORDING = 'RECORDING',
  PROCESSING = 'PROCESSING',
  RECIPE_VIEW = 'RECIPE_VIEW',
  MEAL_PLAN_VIEW = 'MEAL_PLAN_VIEW', // New State
  INGREDIENTS_INPUT = 'INGREDIENTS_INPUT',
  ERROR = 'ERROR'
}

export enum GenerationMode {
  INSTANT = 'INSTANT',
  MEAL_PREP = 'MEAL_PREP'
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';

export interface CaptureData {
  images: string[]; // Base64 strings
  audio: string | null; // Base64 string
  audioMimeType?: string;
  constraints?: string[];
  mode?: GenerationMode; // Optional mode
  mealTypes?: MealType[]; // Optional specific meals for prep
}