import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import CameraCapture from './components/CameraCapture';
import RecipeView from './components/RecipeView';
import LandingPage from './components/LandingPage';
import AboutPage from './components/AboutPage';
import Cookbook from './components/Cookbook';
import IngredientsInputPage from './components/IngredientsInputPage';
import MealPlanView from './components/MealPlanView';
import { AppState, CaptureData, Recipe, MealPlan, GenerationMode, MealType } from './types';
import { generateRecipeFromInput, generateMealPlanFromInput } from './services/geminiService';
import { Loader2, AlertCircle } from 'lucide-react';

const LOADING_THOUGHTS = [
  "Tasting the air...",
  "Consulting Grandma's secret stash...",
  "Chopping onions (virtually)...",
  "Checking the spice rack...",
  "Inventing a new flavor...",
  "Asking the stars for salt...",
  "Simmering ideas...",
  "Pairing flavors...",
  "Designing your week...",
  "Budgeting the pantry...",
  "Organizing the fridge..."
];

const App: React.FC = () => {
  // Start at LANDING instead of IDLE
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [history, setHistory] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Fun loading state
  const [loadingThought, setLoadingThought] = useState(LOADING_THOUGHTS[0]);

  // Track if current recipe is saved to history
  const [isCurrentRecipeSaved, setIsCurrentRecipeSaved] = useState(false);

  // Keep track of current inputs for regeneration/remixing
  const [currentSessionImages, setCurrentSessionImages] = useState<string[]>([]);
  const [currentSessionAudio, setCurrentSessionAudio] = useState<string | null>(null);
  const [currentSessionText, setCurrentSessionText] = useState<string | undefined>(undefined);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('chefMuseHistory');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  // Cycle loading thoughts
  useEffect(() => {
    let interval: any;
    if (appState === AppState.PROCESSING) {
      let i = 0;
      interval = setInterval(() => {
        i = (i + 1) % LOADING_THOUGHTS.length;
        setLoadingThought(LOADING_THOUGHTS[i]);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [appState]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Save history helper
  const saveToHistory = (newRecipe: Recipe) => {
    // Avoid duplicates based on ID
    if (history.some(r => r.id === newRecipe.id)) return;

    const newHistory = [newRecipe, ...history];
    setHistory(newHistory);
    localStorage.setItem('chefMuseHistory', JSON.stringify(newHistory));
    setIsCurrentRecipeSaved(true);
    showToast("Recipe saved to Cookbook");
  };

  const deleteFromHistory = (recipeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const newHistory = history.filter(r => r.id !== recipeId);
    setHistory(newHistory);
    localStorage.setItem('chefMuseHistory', JSON.stringify(newHistory));
    showToast("Recipe removed");
  };

  const handleCapture = async (data: CaptureData) => {
    setAppState(AppState.PROCESSING);
    setError(null);
    setErrorDetails(null);

    // Store inputs for potential remixing
    setCurrentSessionImages(data.images);
    setCurrentSessionAudio(data.audio);
    setCurrentSessionText(undefined);

    try {
      if (data.mode === GenerationMode.MEAL_PREP) {
        // GENERATE MEAL PLAN
        const generatedPlan = await generateMealPlanFromInput(
          data.images,
          data.audio,
          data.audioMimeType,
          undefined,
          data.constraints || [],
          data.mealTypes
        );
        setMealPlan(generatedPlan);
        setAppState(AppState.MEAL_PLAN_VIEW);

      } else {
        // GENERATE INSTANT RECIPE
        const generatedRecipe = await generateRecipeFromInput(
          data.images,
          data.audio,
          data.audioMimeType,
          undefined,
          data.constraints || []
        );

        setRecipe(generatedRecipe);
        setIsCurrentRecipeSaved(false);
        setAppState(AppState.RECIPE_VIEW);
      }

    } catch (e: any) {
      handleError(e);
    }
  };

  const handleTextGeneration = async (text: string, mode: GenerationMode = GenerationMode.INSTANT, mealTypes: MealType[] = ['Dinner'], constraints: string[] = []) => {
    setAppState(AppState.PROCESSING);
    setError(null);
    setErrorDetails(null);

    // Store inputs
    setCurrentSessionImages([]);
    setCurrentSessionAudio(null);
    setCurrentSessionText(text);

    try {
      if (mode === GenerationMode.MEAL_PREP) {
        // GENERATE MEAL PLAN
        const generatedPlan = await generateMealPlanFromInput(
          [],
          null,
          undefined,
          text,
          constraints,
          mealTypes
        );
        setMealPlan(generatedPlan);
        setAppState(AppState.MEAL_PLAN_VIEW);

      } else {
        // INSTANT
        const generatedRecipe = await generateRecipeFromInput([], null, undefined, text, constraints);
        setRecipe(generatedRecipe);
        setIsCurrentRecipeSaved(false);
        setAppState(AppState.RECIPE_VIEW);
      }
    } catch (e: any) {
      handleError(e);
    }
  };

  const handleRemix = async (constraints: string[]) => {
    setAppState(AppState.PROCESSING);
    setError(null);
    try {
      const generatedRecipe = await generateRecipeFromInput(
        currentSessionImages,
        currentSessionAudio,
        undefined,
        currentSessionText,
        constraints
      );

      setRecipe(generatedRecipe);
      setIsCurrentRecipeSaved(false); // Remixed recipe is considered new
      setAppState(AppState.RECIPE_VIEW);

    } catch (e: any) {
      handleError(e);
    }
  }

  const handleRefine = async (missingIngredients: string[]) => {
    setAppState(AppState.PROCESSING);
    setLoadingThought("Removing missing ingredients...");
    setError(null);

    // Create specific constraint for missing items
    const sanitizedIngredients = missingIngredients.map(ing =>
      ing.replace(/\s*\(.*?\)\s*/g, '').trim()
    ).filter(Boolean);

    const exclusionConstraint = `Exclude ingredients: ${sanitizedIngredients.join(', ')}`;
    // Keep existing constraints if any, and add the new one
    const currentConstraints = recipe?.constraints || [];
    const newConstraints = [...currentConstraints, exclusionConstraint];

    try {
      const generatedRecipe = await generateRecipeFromInput(
        currentSessionImages,
        currentSessionAudio,
        undefined,
        currentSessionText,
        newConstraints
      );

      setRecipe(generatedRecipe);
      setIsCurrentRecipeSaved(false);
      setAppState(AppState.RECIPE_VIEW);

    } catch (e: any) {
      handleError(e);
    }
  }

  const handleError = (e: any) => {
    console.error("App Error:", e);
    let msg = "The Muse was silent.";
    let details = "We couldn't generate a recipe. Please try again.";

    const errorMessage = e.message || "";

    if (errorMessage.includes('API Key')) {
      msg = "Configuration Error";
      details = "The API Key is missing. Please check the environment configuration.";
    } else if (errorMessage.includes('No response generated') || errorMessage.includes('Candidate was blocked')) {
      msg = "Inspiration blocked";
      details = "The Muse couldn't understand the request or it was flagged. Try different wording.";
    } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      msg = "Connection Lost";
      details = "Please check your internet connection and try again.";
    } else if (errorMessage.includes('JSON')) {
      msg = "Creative Confusion";
      details = "The Muse hallucinated an invalid format. Trying again usually fixes this.";
    }

    setError(msg);
    setErrorDetails(details);
    setAppState(AppState.ERROR);
  }

  const handleReset = () => {
    // Return to Camera view (IDLE)
    setAppState(AppState.IDLE);
    setRecipe(null);
    setMealPlan(null);
    setError(null);
  };

  const handleStart = () => {
    setAppState(AppState.IDLE);
  };

  const handleAbout = () => {
    setAppState(AppState.ABOUT);
  };

  const handleCookbook = () => {
    setAppState(AppState.COOKBOOK);
  }

  const handleIngredientsInput = () => {
    setAppState(AppState.INGREDIENTS_INPUT);
  }

  const handleSelectRecipe = (selected: Recipe) => {
    setRecipe(selected);
    setIsCurrentRecipeSaved(true); // Coming from cookbook, it's saved
    // Clear session inputs since this is a loaded recipe
    setCurrentSessionImages([]);
    setCurrentSessionAudio(null);
    setCurrentSessionText(undefined);
    setAppState(AppState.RECIPE_VIEW);
  }

  const handleBackToLanding = () => {
    setAppState(AppState.LANDING);
  };

  const handleBackFromRecipe = () => {
    if (isCurrentRecipeSaved) {
      setAppState(AppState.COOKBOOK);
    } else {
      setAppState(AppState.LANDING);
    }
  };

  return (
    <div className="h-screen w-full bg-stone-950 text-stone-100 flex flex-col overflow-hidden">

      {/* Viewport Area */}
      <main className="flex-1 relative overflow-hidden">
        <Helmet>
          <title>The Chef's Muse | AI-Powered Cooking Companion</title>
          <meta name="description" content="Turn your fridge ingredients into culinary masterpieces with AI. Visual recipes, voice guidance, and zero waste cooking." />
          <meta name="theme-color" content="#0c0a09" />
          <meta property="og:title" content="The Chef's Muse - Cook with AI" />
          <meta property="og:description" content="No recipes? No problem. Use what you have." />
          <meta property="og:image" content="https://images.unsplash.com/photo-1556910103-1c02745a30bf?auto=format&fit=crop&q=80&w=1200" />
          <meta property="og:type" content="website" />
        </Helmet>

        {/* State: Landing Page */}
        {appState === AppState.LANDING && (
          <div className="absolute inset-0 z-50 animate-fade-in">
            <LandingPage
              onStart={handleStart}
              onAbout={handleAbout}
              onCookbook={handleCookbook}
              onIngredientsInput={handleIngredientsInput}
            />
          </div>
        )}

        {/* State: About Page */}
        {appState === AppState.ABOUT && (
          <div className="absolute inset-0 z-50 bg-stone-950 animate-fade-in">
            <AboutPage onBack={handleBackToLanding} />
          </div>
        )}

        {/* State: Cookbook Page */}
        {appState === AppState.COOKBOOK && (
          <div className="absolute inset-0 z-50 bg-stone-950 animate-fade-in">
            <Cookbook
              recipes={history}
              onSelectRecipe={handleSelectRecipe}
              onBack={handleBackToLanding}
              onGenerateFromText={(text) => handleTextGeneration(text)} // Adapter for existing signature
              onDeleteRecipe={deleteFromHistory}
            />
          </div>
        )}

        {/* State: Ingredients Input Page */}
        {appState === AppState.INGREDIENTS_INPUT && (
          <div className="absolute inset-0 z-50 bg-stone-950 animate-fade-in">
            <IngredientsInputPage
              onBack={handleBackToLanding}
              onSubmit={handleTextGeneration}
            />
          </div>
        )}

        {/* State: Camera/Idle/Processing/Error */}
        {(appState === AppState.IDLE || appState === AppState.RECORDING || appState === AppState.PROCESSING || appState === AppState.ERROR) && (
          <div className="absolute inset-0 transition-opacity duration-500 opacity-100">
            {appState === AppState.ERROR ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6 bg-stone-900 animate-fade-in">
                <div className="p-4 bg-stone-800 rounded-full text-amber-350/50">
                  <AlertCircle size={48} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-serif text-white">{error}</h2>
                  <p className="text-stone-400 max-w-xs mx-auto text-sm leading-relaxed">{errorDetails}</p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-stone-100 text-stone-900 font-bold rounded-full hover:bg-amber-350 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <CameraCapture
                  onCapture={handleCapture}
                  onBack={handleBackToLanding}
                  isProcessing={appState === AppState.PROCESSING}
                />

                {/* Processing Overlay */}
                {appState === AppState.PROCESSING && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-fade-in">
                    <div className="relative">
                      <div className="absolute inset-0 bg-amber-350 blur-xl opacity-20 animate-pulse"></div>
                      <Loader2 className="w-16 h-16 text-amber-350 animate-spin mb-6 relative z-10" />
                    </div>

                    <p className="text-amber-350/90 font-serif italic text-xl animate-float min-h-[2rem] text-center px-4">
                      "{loadingThought}"
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* State: Recipe View */}
        {appState === AppState.RECIPE_VIEW && recipe && (
          <div className="absolute inset-0 bg-stone-900 z-40 animate-fade-in">
            <RecipeView
              recipe={recipe}
              onBack={handleBackFromRecipe}
              onSave={saveToHistory}
              onRemix={handleRemix}
              onRefine={handleRefine}
              isSaved={isCurrentRecipeSaved}
            />
          </div>
        )}

        {/* State: Meal Plan View */}
        {appState === AppState.MEAL_PLAN_VIEW && mealPlan && (
          <div className="absolute inset-0 bg-stone-900 z-40 animate-fade-in">
            <MealPlanView
              plan={mealPlan}
              onBack={handleBackToLanding}
            />
          </div>
        )}

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[60] animate-slide-down">
            <div className="bg-stone-800 text-stone-200 px-6 py-3 rounded-full shadow-xl border border-stone-700 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-amber-350 animate-pulse"></div>
              <span className="text-sm font-medium">{toastMessage}</span>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;