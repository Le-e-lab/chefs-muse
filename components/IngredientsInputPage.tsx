import React, { useState } from 'react';
import { ArrowLeft, ChefHat, Sparkles, AlertCircle, SlidersHorizontal } from 'lucide-react';
import { GenerationMode, MealType } from '../types';

interface IngredientsInputPageProps {
    onBack: () => void;
    onSubmit: (text: string, mode: GenerationMode, mealTypes?: MealType[], constraints?: string[]) => void;
}

const CONSTRAINTS = [
    "Vegetarian", "Vegan", "No Stove", "Microwave Only", "Under 15m", "One Pot", "High Protein", "Low Carb"
];

const IngredientsInputPage: React.FC<IngredientsInputPageProps> = ({ onBack, onSubmit }) => {
    const [input, setInput] = useState('');
    const [mode, setMode] = useState<GenerationMode>(GenerationMode.INSTANT);
    const [selectedMealTypes, setSelectedMealTypes] = useState<MealType[]>(['Dinner']);
    const [selectedConstraints, setSelectedConstraints] = useState<string[]>([]);
    const [showConstraints, setShowConstraints] = useState(false);

    const handleSubmit = () => {
        if (input.trim().length > 0) {
            onSubmit(
                input,
                mode,
                mode === GenerationMode.MEAL_PREP ? selectedMealTypes : undefined,
                selectedConstraints
            );
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && e.metaKey) {
            handleSubmit();
        }
    };

    const toggleConstraint = (c: string) => {
        setSelectedConstraints(prev =>
            prev.includes(c) ? prev.filter(i => i !== c) : [...prev, c]
        );
    };

    const toggleMealType = (t: MealType) => {
        setSelectedMealTypes(prev => {
            // Don't allow empty selection if in meal prep mode (force at least one)
            if (prev.includes(t) && prev.length === 1) return prev;
            return prev.includes(t) ? prev.filter(i => i !== t) : [...prev, t];
        });
    }

    return (
        <div className="h-full w-full bg-stone-950 flex flex-col animate-fade-in text-stone-100 relative overflow-hidden">

            {/* Background Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-amber-900/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-20%] w-[500px] h-[500px] bg-stone-800/30 rounded-full blur-[80px] pointer-events-none" />

            {/* Floating Icons */}
            <div className="absolute top-[10%] left-[10%] text-4xl opacity-10 animate-float pointer-events-none">🍅</div>
            <div className="absolute top-[20%] right-[15%] text-3xl opacity-10 animate-float-delayed pointer-events-none">🌶️</div>
            <div className="absolute bottom-[20%] left-[15%] text-5xl opacity-5 animate-float-delayed pointer-events-none">🥦</div>
            <div className="absolute bottom-[10%] right-[20%] text-4xl opacity-10 animate-float pointer-events-none">🍋</div>

            {/* Header */}
            <div className="p-6 flex items-center justify-between relative z-10">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full border border-stone-800 hover:bg-stone-800 transition-colors text-stone-400 hover:text-white"
                >
                    <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-2 opacity-50">
                    <ChefHat size={16} />
                    <span className="text-xs uppercase tracking-widest font-bold">Kitchen Panel</span>
                </div>

                <div className="w-10"></div> {/* Spacer */}
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full relative z-10">

                <div className="text-center mb-8 space-y-2">
                    <h1 className="text-3xl md:text-5xl font-serif text-white">What's in the <span className="text-amber-350">pantry</span>?</h1>
                    <p className="text-stone-500 text-sm md:text-base">
                        List your ingredients, leftovers, or specific cravings. <br />
                        We'll turn them into something gourmet.
                    </p>
                </div>

                <div className="w-full relative group space-y-6">

                    {/* Controls Container */}
                    <div className="flex flex-col items-center gap-4 animate-fade-in w-full">

                        {/* Mode Selector */}
                        <div className="flex bg-stone-900/80 backdrop-blur-md rounded-full p-1 border border-stone-800">
                            <button
                                onClick={() => setMode(GenerationMode.INSTANT)}
                                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${mode === GenerationMode.INSTANT ? 'bg-amber-350 text-stone-900 shadow-lg' : 'text-stone-400 hover:text-white'
                                    }`}
                            >
                                Instant Recipe
                            </button>
                            <button
                                onClick={() => setMode(GenerationMode.MEAL_PREP)}
                                className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${mode === GenerationMode.MEAL_PREP ? 'bg-amber-350 text-stone-900 shadow-lg' : 'text-stone-400 hover:text-white'
                                    }`}
                            >
                                Student Meal Prep
                            </button>
                        </div>

                        {/* Meal Type Selector (Prep Only) */}
                        <div className={`transition-all duration-300 overflow-hidden w-full flex justify-center ${mode === GenerationMode.MEAL_PREP ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
                            <div className="flex gap-2 bg-stone-900/50 backdrop-blur-sm p-2 rounded-xl border border-stone-800">
                                {(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map(type => (
                                    <button
                                        key={type}
                                        onClick={() => toggleMealType(type)}
                                        className={`px-4 py-2 rounded-lg text-[10px] uppercase font-bold border transition-all ${selectedMealTypes.includes(type)
                                            ? 'bg-amber-350/20 border-amber-350 text-amber-350'
                                            : 'bg-transparent border-stone-800 text-stone-500 hover:border-stone-600'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Constraints Selector */}
                        <div className="w-full max-w-md">
                            <div className="flex justify-center mb-2">
                                <button
                                    onClick={() => setShowConstraints(!showConstraints)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${selectedConstraints.length > 0 || showConstraints ? 'bg-amber-350 text-stone-900' : 'bg-stone-900/50 text-stone-300 border border-stone-800'}`}
                                >
                                    <SlidersHorizontal size={14} />
                                    {selectedConstraints.length > 0 ? `${selectedConstraints.length} Filter${selectedConstraints.length > 1 ? 's' : ''}` : 'Kitchen Constraints'}
                                </button>
                            </div>

                            <div className={`overflow-hidden transition-all duration-300 ease-out ${showConstraints ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
                                <div className="flex flex-wrap justify-center gap-2 p-2">
                                    {CONSTRAINTS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => toggleConstraint(c)}
                                            className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider border transition-all ${selectedConstraints.includes(c)
                                                ? 'bg-amber-350 border-amber-350 text-stone-900 font-bold'
                                                : 'bg-stone-900/50 border-stone-800 text-stone-400 hover:border-amber-350/50'
                                                }`}
                                        >
                                            {c}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-stone-800/10 rounded-2xl blur-sm transition-opacity opacity-0 group-focus-within:opacity-100"></div>
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={mode === GenerationMode.INSTANT
                                ? "I have: some slightly stale bread, 2 eggs, hot sauce, and half a lemon..."
                                : "For my week, I have: 2kg rice, 10 eggs, frozen peas, chicken breast, and $20 budget..."}
                            className="w-full h-48 md:h-64 bg-stone-900/80 border border-stone-800 rounded-2xl p-6 text-lg text-white placeholder-stone-600 focus:outline-none focus:border-amber-350/50 focus:ring-1 focus:ring-amber-350/20 transition-all resize-none shadow-xl font-serif leading-relaxed relative z-10"
                            autoFocus
                        />
                        <div className="absolute bottom-4 right-4 text-xs text-stone-600 z-20 pointer-events-none">
                            CMD + Enter to submit
                        </div>
                    </div>
                </div>

                {/* Warning/Guide */}
                {input.length > 0 && input.length < 10 && (
                    <div className="mt-4 flex items-center gap-2 text-amber-500/80 text-xs animate-fade-in">
                        <AlertCircle size={12} />
                        <span>Give the Muse a bit more to work with...</span>
                    </div>
                )}

                <div className="mt-8 w-full flex justify-center">
                    <button
                        onClick={handleSubmit}
                        disabled={input.trim().length === 0}
                        className="group relative px-10 py-4 bg-stone-100 text-stone-950 rounded-full font-serif font-bold text-lg tracking-wide hover:bg-amber-350 disabled:opacity-50 disabled:hover:bg-stone-100 transition-all duration-300 flex items-center gap-3 shadow-lg hover:scale-105 hover:shadow-amber-900/20"
                    >
                        <Sparkles className="w-5 h-5 text-amber-600 group-hover:text-stone-900 transition-colors" />
                        <span>
                            {mode === GenerationMode.MEAL_PREP ? 'Generate Weekly Plan' : 'Invent Recipe'}
                        </span>
                    </button>
                </div>

            </div>
        </div>
    );
};

export default IngredientsInputPage;
