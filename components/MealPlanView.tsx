import React, { useState } from 'react';
import { ArrowLeft, Calendar, ShoppingCart, ChevronDown, ChevronUp, Clock, ChefHat } from 'lucide-react';
import { MealPlan, DayPlan, RecipeSummary } from '../types';

interface MealPlanViewProps {
    plan: MealPlan;
    onBack: () => void;
}

const MealPlanView: React.FC<MealPlanViewProps> = ({ plan, onBack }) => {
    const [activeTab, setActiveTab] = useState<'plan' | 'shopping'>('plan');
    const [expandedDay, setExpandedDay] = useState<string | null>(plan.days[0]?.day || null);

    const toggleDay = (day: string) => {
        setExpandedDay(expandedDay === day ? null : day);
    };

    return (
        <div className="h-full w-full bg-stone-950 flex flex-col text-stone-100 animate-fade-in overflow-hidden">

            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-stone-800 bg-stone-900/50 backdrop-blur-md z-20">
                <button
                    onClick={onBack}
                    className="p-2 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex flex-col items-center">
                    <h1 className="text-sm font-serif font-bold tracking-wider uppercase text-amber-350">Weekly Plan</h1>
                    <span className="text-xs text-stone-500">{plan.title}</span>
                </div>
                <div className="w-10"></div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-stone-800 bg-stone-900">
                <button
                    onClick={() => setActiveTab('plan')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'plan' ? 'text-amber-350 border-b-2 border-amber-350 bg-stone-800/50' : 'text-stone-500 hover:text-stone-300'
                        }`}
                >
                    <Calendar size={14} />
                    Schedule
                </button>
                <button
                    onClick={() => setActiveTab('shopping')}
                    className={`flex-1 py-4 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'shopping' ? 'text-amber-350 border-b-2 border-amber-350 bg-stone-800/50' : 'text-stone-500 hover:text-stone-300'
                        }`}
                >
                    <ShoppingCart size={14} />
                    Shopping List
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-hide">

                {activeTab === 'plan' && (
                    <div className="space-y-4 max-w-2xl mx-auto">
                        <div className="p-4 bg-stone-900 rounded-xl border border-stone-800 mb-6">
                            <p className="text-stone-400 text-sm italic leading-relaxed">"{plan.description}"</p>
                        </div>

                        {plan.days.map((dayPlan, index) => (
                            <div key={index} className="bg-stone-900 rounded-2xl border border-stone-800 overflow-hidden transition-all duration-300">
                                <button
                                    onClick={() => toggleDay(dayPlan.day)}
                                    className="w-full p-4 flex items-center justify-between bg-stone-800/50 hover:bg-stone-800 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-8 h-8 rounded-full bg-stone-700 flex items-center justify-center text-xs font-bold text-amber-350 border border-stone-600">
                                            {index + 1}
                                        </span>
                                        <span className="font-serif text-lg font-medium text-white">{dayPlan.day}</span>
                                    </div>
                                    {expandedDay === dayPlan.day ? <ChevronUp size={20} className="text-stone-500" /> : <ChevronDown size={20} className="text-stone-500" />}
                                </button>

                                {/* Meals Accordion */}
                                <div className={`transition-all duration-300 overflow-hidden ${expandedDay === dayPlan.day ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                    <div className="p-4 space-y-3">
                                        {dayPlan.meals.map((meal, mIndex) => (
                                            <div key={mIndex} className="p-3 bg-black/20 rounded-xl border border-stone-800/50 hover:border-amber-900/50 transition-colors group">
                                                <div className="flex items-start justify-between mb-1">
                                                    <span className="text-[10px] uppercase tracking-widest text-amber-500/80 font-bold bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-900/30">
                                                        {meal.type}
                                                    </span>
                                                    <div className="flex items-center gap-1 text-stone-500 text-xs">
                                                        <Clock size={12} />
                                                        <span>{meal.recipe.prepTime}</span>
                                                    </div>
                                                </div>
                                                <h3 className="font-serif text-lg text-white mb-1 group-hover:text-amber-350 transition-colors">{meal.recipe.title}</h3>
                                                <p className="text-xs text-stone-400 leading-relaxed">{meal.recipe.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'shopping' && (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <div className="bg-stone-900 rounded-2xl p-6 border border-stone-800">
                            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-stone-800">
                                <ShoppingCart className="text-amber-350" />
                                <h2 className="text-xl font-serif text-white">Consolidated Shopping List</h2>
                            </div>

                            <ul className="space-y-3">
                                {plan.shoppingList.map((item, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-stone-300 group">
                                        <div className="w-5 h-5 rounded-full border border-stone-600 flex items-center justify-center group-hover:border-amber-500 transition-colors cursor-pointer">
                                            <div className="w-3 h-3 rounded-full bg-amber-500 opacity-0 group-hover:opacity-20 transition-opacity"></div>
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-8 p-4 bg-amber-900/10 rounded-xl border border-amber-900/30">
                                <p className="text-xs text-amber-500/80 text-center">
                                    Tip: Check your pantry first! This list assumes you need everything.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default MealPlanView;
