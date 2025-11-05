import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile, WeeklyPlan, DailyPlan, Meal, CategorizedShoppingList } from '../types';
import { generateMealPlan, getMealImage, regenerateDay, regenerateMeal, generateSingleMeal, completeDailyPlan, generateShoppingList } from '../services/geminiService';
import { Icon } from '@iconify/react';
import { useLanguage } from '../App';
import { RecipeModal } from './RecipeModal';

const ShoppingListModal: React.FC<{
    show: boolean;
    onClose: () => void;
    plan: WeeklyPlan | undefined;
}> = ({ show, onClose, plan }) => {
    const { t } = useLanguage();
    const [view, setView] = useState<'category' | 'recipe'>('category');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [listData, setListData] = useState<CategorizedShoppingList[] | null>(null);
    const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
    const { language } = useLanguage();

    const handleGenerateCategorizedList = async () => {
        if (!plan) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await generateShoppingList(plan, language);
            setListData(data);
        } catch (err: any) {
            setError(err.message || t('nutrition.modal.shopping.error'));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if (show && view === 'category' && !listData && !isLoading && !error) {
            handleGenerateCategorizedList();
        }

        if (!show) {
          setTimeout(() => {
            setListData(null);
            setCheckedItems(new Set());
            setView('category');
            setError(null);
            setIsLoading(false);
          }, 300);
        }
    }, [show, view, listData, isLoading, error]);


    const handleToggleItem = (itemIdentifier: string) => {
        setCheckedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemIdentifier)) {
                newSet.delete(itemIdentifier);
            } else {
                newSet.add(itemIdentifier);
            }
            return newSet;
        });
    };

    const handleReset = () => setCheckedItems(new Set());

    const getShoppingListText = (forPrint: boolean) => {
        let text = `${t('nutrition.modal.shopping.textTitle')}\n================================\n\n`;
        if (view === 'category' && listData) {
            listData.forEach(category => {
                text += `--- ${category.category} ---\n`;
                category.items.forEach(item => {
                    const identifier = `${category.category}-${item.name}`;
                    text += `${forPrint ? (checkedItems.has(identifier) ? '[x]' : '[ ]') : '-'} ${item.quantity} ${item.name}\n`;
                });
                text += '\n';
            });
        } else if (view === 'recipe' && plan) {
             plan.plan.forEach(day => {
                text += `--- ${day.dayOfWeek} ---\n`;
                day.meals.forEach((meal) => {
                    if (meal) {
                        text += `\n[${meal.name}]\n`;
                        meal.ingredients.forEach(ing => {
                            text += `- ${ing}\n`;
                        });
                    }
                });
                text += '\n';
            });
        }
        return text;
    };
    
    const handleCopy = () => {
        navigator.clipboard.writeText(getShoppingListText(true));
    };
    
    const handlePrint = () => {
        const text = getShoppingListText(true);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(`<pre style="font-family: sans-serif; white-space: pre-wrap;">${text}</pre>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    const categoryIcons: { [key: string]: string } = {
        'Fruits & Légumes': 'solar:leaf-bold-duotone',
        'Viandes & Poissons': 'solar:meat-bold-duotone',
        'Produits Laitiers & Œufs': 'solar:milk-bottle-bold-duotone',
        'Épicerie Salée': 'solar:jar-of-jam-bold-duotone',
        'Épicerie Sucrée': 'solar:cookie-bold-duotone',
        'Boulangerie': 'solar:croissant-bold-duotone',
        'Boissons': 'solar:cup-hot-bold-duotone',
        'Surgelés': 'solar:fridge-bold-duotone',
        // English keys
        'Fruits & Vegetables': 'solar:leaf-bold-duotone',
        'Meat & Fish': 'solar:meat-bold-duotone',
        'Dairy & Eggs': 'solar:milk-bottle-bold-duotone',
        'Pantry': 'solar:jar-of-jam-bold-duotone',
        'Bakery': 'solar:croissant-bold-duotone',
        'Beverages': 'solar:cup-hot-bold-duotone',
        'Frozen': 'solar:fridge-bold-duotone',
    };

    const renderContent = () => {
        if (view === 'recipe') {
            return <pre className="whitespace-pre-wrap font-sans text-sm">{getShoppingListText(false)}</pre>
        }

        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-64">
                    <Icon icon="solar:cart-large-4-bold-duotone" className="size-16 text-primary animate-pulse" />
                    <p className="mt-4 text-muted-foreground">{t('nutrition.modal.shopping.generating')}</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <Icon icon="solar:danger-bold-duotone" className="size-16 text-destructive" />
                    <p className="mt-4 text-destructive">{error}</p>
                    <button 
                        onClick={handleGenerateCategorizedList} 
                        className="mt-6 px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:scale-105 transition-transform"
                    >
                        {t('common.retry')}
                    </button>
                </div>
            );
        }

        if (listData && listData.length > 0) {
            return (
                <div className="space-y-4">
                    {listData.map((category) => (
                        <div key={category.category}>
                            <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                                <Icon icon={categoryIcons[category.category] || 'solar:box-bold-duotone'} className="size-5 text-primary" />
                                {category.category}
                            </h4>
                            <ul className="space-y-2">
                                {category.items.map((item) => {
                                    const identifier = `${category.category}-${item.name}`;
                                    const isChecked = checkedItems.has(identifier);
                                    return (
                                        <li key={identifier} onClick={() => handleToggleItem(identifier)} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isChecked ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
                                            <div className={`size-5 rounded-md flex items-center justify-center border-2 ${isChecked ? 'bg-primary border-primary' : 'bg-white border-border'}`}>
                                                {isChecked && <Icon icon="solar:check-read-bold" className="size-3 text-white" />}
                                            </div>
                                            <span className={`flex-1 ${isChecked ? 'line-through text-muted-foreground' : ''}`}>
                                                {item.name}
                                            </span>
                                            <span className={`font-medium text-sm ${isChecked ? 'line-through text-muted-foreground' : 'text-primary'}`}>{item.quantity}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </div>
            );
        }

        return (
             <div className="flex flex-col items-center justify-center h-64 text-center">
                <Icon icon="solar:box-minimalistic-bold-duotone" className="size-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-bold">Liste Vide</h3>
                <p className="mt-2 max-w-sm text-muted-foreground text-sm">
                    Aucun ingrédient à afficher. Votre plan de repas est peut-être vide.
                </p>
            </div>
        );
    };
    
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
                    <h3 className="text-lg font-bold font-heading text-foreground">{t('nutrition.modal.shopping.title')}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100"><Icon icon="solar:close-circle-bold-duotone" className="h-6 w-6 text-muted-foreground"/></button>
                </div>
                <div className="p-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center justify-between">
                         <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                            <button onClick={() => setView('category')} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${view === 'category' ? 'bg-primary text-primary-foreground shadow' : 'text-slate-600'}`}>{t('nutrition.modal.shopping.byCategory')}</button>
                            <button onClick={() => setView('recipe')} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${view === 'recipe' ? 'bg-primary text-primary-foreground shadow' : 'text-slate-600'}`}>{t('nutrition.modal.shopping.byRecipe')}</button>
                        </div>
                        {view === 'category' && listData && (
                            <button onClick={handleReset} className="px-3 py-1.5 text-sm font-semibold text-primary flex items-center gap-2">
                                <Icon icon="solar:refresh-bold-duotone" className="h-4 w-4"/>
                                {t('nutrition.modal.shopping.reset')}
                            </button>
                        )}
                    </div>
                </div>
                <div className="p-6 overflow-y-auto flex-grow">
                    {renderContent()}
                </div>
                <div className="p-4 border-t border-border flex justify-end gap-3 flex-shrink-0">
                    <button onClick={handleCopy} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300 flex items-center gap-2">
                        <Icon icon="solar:clipboard-text-bold-duotone" className="h-4 w-4" />
                        {t('nutrition.modal.shopping.copy')}
                    </button>
                    <button onClick={handlePrint} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
                        <Icon icon="solar:printer-minimalistic-bold-duotone" className="h-4 w-4" />
                        {t('nutrition.modal.shopping.print')}
                    </button>
                </div>
            </div>
        </div>
    );
};

interface RegenerationModalProps {
    show: boolean;
    onClose: () => void;
    onGenerate: (options: { prompt: string; budget?: number; cookingLevel?: UserProfile['cookingLevel']; mealsToAdd?: string; maxPrepTime?: number; }) => void;
    title: string;
    subtitle: string;
    isLoading: boolean;
    user: UserProfile;
    regenerationType: 'meal' | 'day' | 'week' | 'add' | 'complete_day' | null;
}

const RegenerationModal: React.FC<RegenerationModalProps> = ({ show, onClose, onGenerate, title, subtitle, isLoading, user, regenerationType }) => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState('');
    const [budget, setBudget] = useState(user.dailyBudget);
    const [cookingLevel, setCookingLevel] = useState(user.cookingLevel);
    const [mealsToAdd, setMealsToAdd] = useState('');
    const [maxPrepTime, setMaxPrepTime] = useState(user.maxPrepTimeWeekDinner);

    const cookingLevels = useMemo(() => (
        ['beginner', 'intermediate', 'expert'] as const
    ), []);

    useEffect(() => {
        if(show) {
            setPrompt('');
            setBudget(user.dailyBudget);
            setCookingLevel(user.cookingLevel);
            setMealsToAdd('');
            setMaxPrepTime(user.maxPrepTimeWeekDinner);
        }
    }, [show, user]);

    if (!show) return null;

    const handleGenerate = () => {
        onGenerate({
            prompt,
            budget: budget !== user.dailyBudget ? budget : undefined,
            cookingLevel: cookingLevel !== user.cookingLevel ? cookingLevel : undefined,
            mealsToAdd: mealsToAdd || undefined,
            maxPrepTime: maxPrepTime !== user.maxPrepTimeWeekDinner ? maxPrepTime : undefined,
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold font-heading text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">{subtitle}</p>
                <div className="space-y-4">
                    <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t('nutrition.modal.regen.placeholder')} className="w-full h-20 p-2 rounded-lg bg-input border border-border focus:ring-primary focus:border-primary" />
                    {regenerationType === 'complete_day' && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground">{t('nutrition.modal.complete.mealsToAddLabel')}</label>
                            <input type="number" min="1" max="5" value={mealsToAdd} onChange={e => setMealsToAdd(e.target.value)} placeholder={t('nutrition.modal.complete.mealsToAddPlaceholder')} className="w-full mt-1 p-2 rounded-lg bg-input border border-border focus:ring-primary focus:border-primary" />
                        </div>
                    )}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground flex justify-between">{t('onboarding.prep_time.prepTimeLabel')} <span>{maxPrepTime} {t('onboarding.prep_time.minutes')}</span></label>
                        <input type="range" min="10" max="120" step="5" value={maxPrepTime} onChange={e => setMaxPrepTime(Number(e.target.value))} className="w-full mt-1" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground flex justify-between">{t('nutrition.modal.regen.budget')} <span>{budget}€</span></label>
                        <input type="range" min="5" max="50" value={budget} onChange={e => setBudget(Number(e.target.value))} className="w-full mt-1" />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">{t('nutrition.modal.regen.cookingLevel')}</label>
                         <div className="flex gap-2 mt-2">
                            {cookingLevels.map(level => (
                                <button key={level} onClick={() => setCookingLevel(level)} className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${cookingLevel === level ? 'bg-primary text-primary-foreground' : 'bg-slate-200 text-slate-800 hover:bg-slate-300'}`}>
                                    {t(`cookingLevel.${level}`)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-200 text-slate-800 hover:bg-slate-300">{t('nutrition.modal.regen.cancel')}</button>
                    <button onClick={handleGenerate} disabled={isLoading} className="px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center gap-2 w-40 disabled:opacity-50">
                        {isLoading ? (
                          <Icon icon="solar:refresh-linear" className="animate-spin h-5 w-5" />
                        ) : (
                          <>
                            <Icon icon="solar:refresh-cw-bold-duotone" className="h-5 w-5" />
                            {t('nutrition.modal.regen.submit')}
                          </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface NutritionPageProps {
  user: UserProfile;
  mealPlans: WeeklyPlan[];
  setMealPlans: React.Dispatch<React.SetStateAction<WeeklyPlan[]>>;
  completedMeals: Record<string, string[]>;
  setCompletedMeals: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
}

const NutritionPage: React.FC<NutritionPageProps> = ({ user, mealPlans, setMealPlans, completedMeals, setCompletedMeals }) => {
  const { language, t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  // Same date key generation as Dashboard
  const toLocalKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Calculate current week index based on startDate (same as Dashboard)
  const currentWeekIndexFromDate = useMemo(() => {
    if (!user.startDate || mealPlans.length === 0) return 0;
    const start = new Date(user.startDate);
    start.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.floor(diffDays / 7));
  }, [user.startDate, mealPlans.length]);

  const [currentWeekIndex, setCurrentWeekIndex] = useState(currentWeekIndexFromDate);
  
  const today = new Date();
  const todayDayIndex = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const [selectedDay, setSelectedDay] = useState(todayDayIndex);

  const [isRegenModalOpen, setIsRegenModalOpen] = useState(false);
  const [regenerationTarget, setRegenerationTarget] = useState<{type: 'meal' | 'day' | 'week' | 'add' | 'complete_day', dayIndex?: number, mealIndex?: number} | null>(null);
  const [regenerationIsLoading, setRegenerationIsLoading] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<{meal: Meal, type: string} | null>(null);
  const [isShoppingListOpen, setIsShoppingListOpen] = useState(false);

  const weekDays = useMemo(() => [
    t('weekdays.monday'), t('weekdays.tuesday'), t('weekdays.wednesday'),
    t('weekdays.thursday'), t('weekdays.friday'), t('weekdays.saturday'), t('weekdays.sunday')
  ], [t]);

  useEffect(() => {
     if (mealPlans.length > 0) {
        // Map today to real calendar week based on user.startDate
        const start = new Date(user.startDate + 'T00:00:00');
        const today = new Date();
        const diffDays = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const weekIdx = Math.max(0, Math.floor(diffDays / 7));
        setCurrentWeekIndex(weekIdx);
        setSelectedDay(todayDayIndex);
     }
  }, [mealPlans.length, todayDayIndex, user.startDate]);

  // Trouver le plan correspondant au numéro de semaine actuel
  const currentWeeklyPlan = useMemo(() => {
    // Vérifier si un plan existe exactement pour cette semaine
    for (const plan of mealPlans) {
      if (Number(plan.weekNumber) === Number(currentWeekIndex)) {
        return plan;
      }
    }
    // Aucun plan trouvé pour cette semaine
    return undefined;
  }, [mealPlans, currentWeekIndex]);

  const currentPlan = useMemo(() => currentWeeklyPlan?.plan, [currentWeeklyPlan]);
  // La semaine est "future" si elle n'a pas de plan OU si le plan n'a pas de contenu valide
  const isFutureWeek = !currentWeeklyPlan || !currentWeeklyPlan.plan || currentWeeklyPlan.plan.length === 0 || currentWeeklyPlan.plan.every(day => !day || !day.meals || day.meals.length === 0);
  const displayDay = useMemo(() => currentPlan?.[selectedDay], [currentPlan, selectedDay]);

  const handleGeneratePlan = async (type: 'next_week' | 'current_week', customPrompt: string) => {
    setIsLoading(true);
    try {
      // Calculer le numéro de semaine à générer
      const weekNumberToGenerate = type === 'next_week' ? currentWeekIndex + 1 : currentWeekIndex;
      
      // FIX: Added a no-op function for the onProgress callback to match the function signature.
      const plan = await generateMealPlan(user, language, () => {}, weekNumberToGenerate, customPrompt);
      
      // Vérifier si un plan existe déjà pour cette semaine
      const existingPlanIndex = mealPlans.findIndex(p => p.weekNumber === weekNumberToGenerate);
      
      if (existingPlanIndex >= 0) {
        // Remplacer le plan existant
        setMealPlans(prev => {
          const newPlans = [...prev];
          newPlans[existingPlanIndex] = plan;
          return newPlans;
        });
      } else {
        // Ajouter le nouveau plan et trier par weekNumber
        setMealPlans(prev => [...prev, plan].sort((a, b) => a.weekNumber - b.weekNumber));
      }
      
      // Si on génère la semaine suivante, y naviguer
      if (type === 'next_week') {
        setCurrentWeekIndex(weekNumberToGenerate);
        setSelectedDay(0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsRegenModalOpen(false);
    }
  };
  
   const handleRegeneration = async (options: { prompt: string; budget?: number; cookingLevel?: UserProfile['cookingLevel']; mealsToAdd?: string; maxPrepTime?: number; }) => {
    if (regenerationTarget === null || regenerationTarget.dayIndex === undefined || !currentWeeklyPlan) return;

    setRegenerationIsLoading(true);
    const { type, dayIndex, mealIndex } = regenerationTarget;

    try {
        const currentDayPlan = currentWeeklyPlan.plan[dayIndex];

        if (type === 'meal' && mealIndex !== undefined) {
            const mealToReplace = currentDayPlan.meals[mealIndex];
            if (!mealToReplace) throw new Error("Meal to replace not found");
            
            const newMeal = await regenerateMeal(user, language, currentDayPlan, mealToReplace, options);
            
            setMealPlans(prev => {
                const newPlans = JSON.parse(JSON.stringify(prev));
                const planIndex = newPlans.findIndex(p => p.weekNumber === currentWeekIndex);
                if (planIndex < 0) return prev;
                const day = newPlans[planIndex].plan[dayIndex];
                day.meals[mealIndex] = newMeal;
                day.dailyTotals = day.meals.reduce((totals:any, meal:any) => {
                    totals.calories += meal.macros.calories;
                    totals.protein += meal.macros.protein;
                    totals.carbohydrates += meal.macros.carbohydrates;
                    totals.fat += meal.macros.fat;
                    return totals;
                }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
                return newPlans;
            });

        } else if (type === 'day') {
            const newDayPlan = await regenerateDay(user, language, weekDays[dayIndex], options);
            setMealPlans(prev => {
                const newPlans = JSON.parse(JSON.stringify(prev));
                const planIndex = newPlans.findIndex(p => p.weekNumber === currentWeekIndex);
                if (planIndex < 0) return prev;
                newPlans[planIndex].plan[dayIndex] = newDayPlan;
                return newPlans;
            });
        } else if (type === 'add') {
             const newMeal = await generateSingleMeal(user, language, currentDayPlan, options);
             setMealPlans(prev => {
                const newPlans = JSON.parse(JSON.stringify(prev));
                const planIndex = newPlans.findIndex(p => p.weekNumber === currentWeekIndex);
                if (planIndex < 0) return prev;
                const day = newPlans[planIndex].plan[dayIndex];
                day.meals.push(newMeal);
                day.dailyTotals = day.meals.reduce((totals:any, meal:any) => {
                    totals.calories += meal.macros.calories;
                    totals.protein += meal.macros.protein;
                    totals.carbohydrates += meal.macros.carbohydrates;
                    totals.fat += meal.macros.fat;
                    return totals;
                }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
                return newPlans;
            });
        } else if (type === 'complete_day') {
             const newMeals = await completeDailyPlan(user, language, currentDayPlan, options);
             setMealPlans(prev => {
                const newPlans = JSON.parse(JSON.stringify(prev));
                const planIndex = newPlans.findIndex(p => p.weekNumber === currentWeekIndex);
                if (planIndex < 0) return prev;
                const day = newPlans[planIndex].plan[dayIndex];
                day.meals.push(...newMeals);
                day.dailyTotals = day.meals.reduce((totals:any, meal:any) => {
                    totals.calories += meal.macros.calories;
                    totals.protein += meal.macros.protein;
                    totals.carbohydrates += meal.macros.carbohydrates;
                    totals.fat += meal.macros.fat;
                    return totals;
                }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
                return newPlans;
            });
        }
    } catch (error) {
        console.error("Regeneration failed:", error);
    } finally {
        setRegenerationIsLoading(false);
        setIsRegenModalOpen(false);
        setRegenerationTarget(null);
    }
  };


  const openRegenerationModal = (target: {type: 'meal' | 'day' | 'week' | 'add' | 'complete_day', dayIndex?: number, mealIndex?: number}) => {
      setRegenerationTarget(target);
      setIsRegenModalOpen(true);
  };
  
  const handleRemoveMeal = (dayIndex: number, mealIndex: number) => {
      setMealPlans(prev => {
        const newPlans = JSON.parse(JSON.stringify(prev));
        const planIndex = newPlans.findIndex(p => p.weekNumber === currentWeekIndex);
        if (planIndex < 0) return prev;
        const day = newPlans[planIndex].plan[dayIndex];
        day.meals.splice(mealIndex, 1);
        day.dailyTotals = day.meals.reduce((totals:any, meal:any) => {
            totals.calories += meal.macros.calories;
            totals.protein += meal.macros.protein;
            totals.carbohydrates += meal.macros.carbohydrates;
            totals.fat += meal.macros.fat;
            return totals;
        }, { calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
        return newPlans;
    });
  }

  const getDateStringForDay = (weekIdx: number, dayIdx: number): string => {
    const weekStartDate = new Date(user.startDate);
    weekStartDate.setHours(0,0,0,0);
    weekStartDate.setDate(weekStartDate.getDate() + weekIdx * 7 + dayIdx);
    return toLocalKey(weekStartDate);
  };

  // Same logic as Dashboard to get completed meals for a date
  const getCompletedMealsForDate = (dateStr: string): string[] => {
    const isoKey = new Date(dateStr + 'T00:00:00').toISOString().split('T')[0];
    return completedMeals[dateStr] || completedMeals[isoKey] || [];
  };

  // Get the date key for the currently selected day/week, using direct calculation for today
  const getSelectedDateKey = (): string => {
    const today = new Date();
    const todayKey = toLocalKey(today);

    // If we're on the current week and current day, use the same key as Dashboard
    if (currentWeekIndex === currentWeekIndexFromDate && selectedDay === todayDayIndex) {
      return todayKey;
    }

    // Otherwise, use the calculated date
    return getDateStringForDay(currentWeekIndex, selectedDay);
  };

  const handleToggleMeal = (dayIndex: number, mealName: string) => {
    // Use the same date key as Dashboard for the currently selected day
    const dateStr = dayIndex === selectedDay
        ? getSelectedDateKey()
        : getDateStringForDay(currentWeekIndex, dayIndex);
    setCompletedMeals(prev => {
        const dayMeals = prev[dateStr] || [];
        const newDayMeals = dayMeals.includes(mealName)
            ? dayMeals.filter(m => m !== mealName)
            : [...dayMeals, mealName];
        return { ...prev, [dateStr]: newDayMeals };
    });
  };

  const getCompletedCaloriesForDay = (dayIndex: number): number => {
    // Use the same date key as Dashboard for the currently selected day
    const dateStr = dayIndex === selectedDay
        ? getSelectedDateKey()
        : getDateStringForDay(currentWeekIndex, dayIndex);
    const completedMealNames = getCompletedMealsForDate(dateStr);
    const dayPlan = currentWeeklyPlan?.plan[dayIndex];
    if (!dayPlan) return 0;

    return dayPlan.meals.reduce((total, meal) => {
        if (completedMealNames.includes(meal.name)) {
            return total + meal.macros.calories;
        }
        return total;
    }, 0);
  };
  
  const MacroBar: React.FC<{value: number, total: number, color: string}> = ({value, total, color}) => (
      <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{width: `${total > 0 ? (value/total) * 100 : 0}%`}} />
      </div>
  );

  const MealCard: React.FC<{ meal: Meal, isCompleted: boolean, onToggleCompleted: () => void, onRemove: () => void, onRegenerate: () => void }> = ({ meal, isCompleted, onToggleCompleted, onRemove, onRegenerate }) => {
     const [imageUrl, setImageUrl] = useState<string | null>(null);
     const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

     useEffect(() => {
        let isMounted = true;
        setImageStatus('loading');
        getMealImage(meal.name, language).then(url => {
            if (isMounted) {
              if (url) {
                setImageUrl(url);
                setImageStatus('loaded');
              } else {
                setImageStatus('error');
              }
            }
        });
        return () => { isMounted = false };
     }, [meal.name, language]);

      return (
          <div className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border shadow-sm p-4 hover:shadow-md transition-all group">
            <div className="flex gap-4">
              <button onClick={() => setSelectedMeal({meal, type: meal.type})} className="size-24 rounded-xl overflow-hidden flex-shrink-0 border-2 border-primary/20">
                 <div className="size-full bg-slate-100 flex items-center justify-center">
                    {imageStatus === 'loaded' && imageUrl ? (
                        <img src={imageUrl} alt={meal.name} className="size-full object-cover" />
                    ) : (
                        imageStatus === 'loading' ? 
                        <Icon icon="solar:refresh-linear" className="size-8 text-primary animate-spin"/> :
                        <Icon icon="solar:cup-hot-bold-duotone" className="size-8 text-muted"/>
                    )}
                </div>
              </button>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                    <button onClick={() => setSelectedMeal({meal, type: meal.type})} className="text-left">
                        <p className="text-sm font-semibold text-accent">{meal.type}</p>
                        <h3 className="font-bold leading-tight">{meal.name}</h3>
                         <div className="w-16 h-1 bg-primary/20 rounded-full mt-1.5 group-hover:bg-primary/50 transition-colors">
                            <div className="w-1/2 h-full bg-primary rounded-full" />
                        </div>
                    </button>
                    <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                        {meal.macros.calories.toFixed(0)} kcal
                    </span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
                <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-protein w-16">Protéines</span>
                    <MacroBar value={meal.macros.protein * 4} total={meal.macros.calories} color="bg-protein" />
                    <span className="font-medium">{meal.macros.protein.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-carbs w-16">Glucides</span>
                    <MacroBar value={meal.macros.carbohydrates * 4} total={meal.macros.calories} color="bg-carbs" />
                    <span className="font-medium">{meal.macros.carbohydrates.toFixed(0)}g</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                    <span className="font-semibold text-fats w-16">Lipides</span>
                    <MacroBar value={meal.macros.fat * 9} total={meal.macros.calories} color="bg-fats" />
                    <span className="font-medium">{meal.macros.fat.toFixed(0)}g</span>
                </div>
            </div>
            <div className="flex items-center justify-end gap-2 mt-4">
                 <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="size-9 rounded-full bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors">
                    <Icon icon="solar:trash-bin-trash-bold-duotone" className="size-5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onRegenerate(); }} className="size-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <Icon icon="solar:refresh-cw-bold-duotone" className="size-5 text-slate-700" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onToggleCompleted(); }} className={`size-10 rounded-full flex items-center justify-center transition-all ${isCompleted ? 'bg-accent text-accent-foreground' : 'bg-slate-100 text-slate-500 hover:bg-accent/20'}`}>
                    <Icon icon="solar:check-read-bold" className="size-6" />
                </button>
            </div>
          </div>
      );
  };

  const consumedCaloriesForSelectedDay = useMemo(() => getCompletedCaloriesForDay(selectedDay), [selectedDay, completedMeals, mealPlans, currentWeekIndex]);
  const totalCaloriesForSelectedDay = displayDay?.dailyTotals.calories || 0;
  const calorieProgress = totalCaloriesForSelectedDay > 0 ? (consumedCaloriesForSelectedDay / totalCaloriesForSelectedDay) * 100 : 0;
  const isBelowTarget = displayDay && totalCaloriesForSelectedDay < user.targetCalories * 0.9;
  
  return (
    <>
      {selectedMeal && <RecipeModal meal={selectedMeal.meal} type={selectedMeal.type} onClose={() => setSelectedMeal(null)} />}
      <RegenerationModal 
        show={isRegenModalOpen}
        onClose={() => setIsRegenModalOpen(false)}
        onGenerate={handleRegeneration}
        title={
            regenerationTarget?.type === 'meal' ? t('nutrition.modal.regen.title.meal').replace('{mealType}', currentPlan?.[regenerationTarget.dayIndex!]?.meals[regenerationTarget.mealIndex!]?.type || '') :
            regenerationTarget?.type === 'day' ? t('nutrition.modal.regen.title.day').replace('{day}', weekDays[regenerationTarget.dayIndex!]) :
            regenerationTarget?.type === 'add' ? t('nutrition.modal.add.title') :
            regenerationTarget?.type === 'complete_day' ? t('nutrition.completeIntake.button') :
            t('nutrition.modal.regen.title.week').replace('{week}', String(currentWeekIndex + 1))
        }
        subtitle={
            regenerationTarget?.type === 'add' ? t('nutrition.modal.add.subtitle') :
            regenerationTarget?.type === 'complete_day' ? t('nutrition.modal.complete.subtitle') :
            t('nutrition.modal.regen.subtitle')
        }
        isLoading={regenerationIsLoading}
        user={user}
        regenerationType={regenerationTarget?.type || null}
      />
      <ShoppingListModal show={isShoppingListOpen} onClose={() => setIsShoppingListOpen(false)} plan={currentWeeklyPlan} />

    <div className="lg:flex">
      <aside className="hidden lg:block w-72 p-6 border-r border-border">
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentWeekIndex(p => Math.max(0, p-1))} disabled={currentWeekIndex === 0} className="size-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors disabled:opacity-50">
                    <Icon icon="solar:alt-arrow-left-linear" className="size-5" />
                </button>
                <div className="text-center">
                    <div className="text-sm font-semibold">{(() => { const ws = new Date(user.startDate); ws.setDate(ws.getDate() + currentWeekIndex * 7); const d = ws; const target = new Date(d); const day = (target.getDay() + 6) % 7; target.setDate(target.getDate() - day + 3); const jan4 = new Date(target.getFullYear(), 0, 4); const jan4Day = (jan4.getDay() + 6) % 7; const week1 = new Date(jan4); week1.setDate(jan4.getDate() - jan4Day); const week = 1 + Math.round((target.getTime() - week1.getTime()) / (7 * 86400000)); return `${t('nutrition.week')} ${week}`; })()}</div>
                </div>
                <button onClick={() => setCurrentWeekIndex(p => p+1)} className="size-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                    <Icon icon="solar:alt-arrow-right-linear" className="size-5" />
                </button>
            </div>
            <div className="space-y-2">
                {!currentWeeklyPlan || !currentPlan || currentPlan.length === 0 || !currentPlan.some(day => day && day.meals && day.meals.length > 0 && day.meals.some(meal => meal && meal.name)) ? (
                    <div className="p-4 rounded-xl border-2 bg-card border-dashed border-border text-center">
                        <p className="text-sm text-muted-foreground mb-2">{t('nutrition.nextWeek.subtitle')}</p>
                        <button onClick={() => handleGeneratePlan('current_week', '')} disabled={isLoading} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50">
                            {isLoading ? <Icon icon="solar:refresh-linear" className="animate-spin size-5" /> : t('nutrition.nextWeek.button')}
                        </button>
                    </div>
                ) : (
                    currentPlan.map((day, index) => {
                        const consumedCalories = getCompletedCaloriesForDay(index);
                        return (
                            <div
                                key={index}
                                onClick={() => setSelectedDay(index)}
                                className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${selectedDay === index ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-105' : 'bg-card border-border hover:border-primary/50'}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold">{weekDays[index]}</span>
                                    <Icon icon="solar:check-read-bold-duotone" className={`size-5 transition-colors ${selectedDay === index ? 'text-primary-foreground/80' : 'text-green-500'}`} />
                                </div>
                                <div className="text-lg font-bold">{consumedCalories.toFixed(0)} kcal</div>
                                <div className="text-xs opacity-80">/ {day.dailyTotals.calories.toFixed(0)} kcal</div>
                            </div>
                        )
                    })
                )}
            </div>
        </div>
      </aside>
      
      <main className="flex-1">
        <div className="lg:hidden p-4 bg-card border-b border-border sticky top-0 z-10">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentWeekIndex(p => Math.max(0, p - 1))} disabled={currentWeekIndex === 0} className="p-2 rounded-full bg-slate-100 disabled:opacity-50"><Icon icon="solar:alt-arrow-left-linear" className="size-5"/></button>
                <span className="font-semibold text-sm">{(() => { const ws = new Date(user.startDate); ws.setDate(ws.getDate() + currentWeekIndex * 7); const d = ws; const target = new Date(d); const day = (target.getDay() + 6) % 7; target.setDate(target.getDate() - day + 3); const jan4 = new Date(target.getFullYear(), 0, 4); const jan4Day = (jan4.getDay() + 6) % 7; const week1 = new Date(jan4); week1.setDate(jan4.getDate() - jan4Day); const week = 1 + Math.round((target.getTime() - week1.getTime()) / (7 * 86400000)); return `${t('nutrition.week')} ${week}`; })()}</span>
                <button onClick={() => setCurrentWeekIndex(p => p + 1)} className="p-2 rounded-full bg-slate-100"><Icon icon="solar:alt-arrow-right-linear" className="size-5"/></button>
            </div>
            <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-2">
                {!currentWeeklyPlan || !currentPlan || currentPlan.length === 0 || !currentPlan.some(day => day && day.meals && day.meals.length > 0 && day.meals.some(meal => meal && meal.name)) ? (
                    <div className="flex-1 text-center py-2">
                        <button onClick={() => handleGeneratePlan('current_week', '')} disabled={isLoading} className="px-4 py-2 rounded-full text-sm font-semibold bg-primary text-primary-foreground">
                            {isLoading ? <Icon icon="solar:refresh-linear" className="animate-spin size-4" /> : t('nutrition.nextWeek.button')}
                        </button>
                    </div>
                ) : (
                    weekDays.map((day, index) => (
                        <button key={index} onClick={() => setSelectedDay(index)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap ${selectedDay === index ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-700'}`}>
                            {day}
                        </button>
                    ))
                )}
            </div>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <h2 className="text-xl font-bold font-heading">{t('nutrition.planFor').replace('{day}', weekDays[selectedDay])}
                {!isFutureWeek && (
                    <span className="ml-2 text-sm text-muted-foreground font-normal">
                        {(() => { const ds = getDateStringForDay(currentWeekIndex, selectedDay); const d = new Date(ds); return d.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' }); })()}
                    </span>
                )}
              </h2>
              {!isFutureWeek ? (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => openRegenerationModal({ type: 'add', dayIndex: selectedDay })} className="px-3 py-2 text-sm rounded-xl bg-slate-100 text-slate-800 font-medium flex items-center gap-2 hover:bg-slate-200 transition-colors">
                    <Icon icon="solar:add-circle-bold-duotone" className="size-4" />
                    {t('nutrition.addMeal')}
                  </button>
                  <button onClick={() => openRegenerationModal({ type: 'day', dayIndex: selectedDay })} className="px-3 py-2 text-sm rounded-xl bg-slate-100 text-slate-800 font-medium flex items-center gap-2 hover:bg-slate-200 transition-colors">
                    <Icon icon="solar:refresh-cw-bold-duotone" className="size-4" />
                    {t('nutrition.regenerateDay')}
                  </button>
                  <button onClick={() => setIsShoppingListOpen(true)} className="px-3 py-2 text-sm rounded-xl bg-accent text-accent-foreground font-medium flex items-center gap-2 hover:bg-accent/90 transition-colors">
                    <Icon icon="solar:cart-large-minimalistic-bold-duotone" className="size-4" />
                    {t('nutrition.shoppingList')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => handleGeneratePlan('current_week', '')} disabled={isLoading} className="px-4 py-2 text-sm rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {isLoading ? <Icon icon="solar:refresh-linear" className="animate-spin size-5" /> : t('nutrition.nextWeek.button')}
                  </button>
                </div>
              )}
            </div>
             {!isFutureWeek && displayDay && (
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex justify-between items-baseline mb-2">
                        <div>
                            <span className="text-sm text-muted-foreground">{t('dashboard.consumed')}</span>
                            <p className="text-2xl font-bold text-primary">{consumedCaloriesForSelectedDay.toFixed(0)} <span className="text-lg">kcal</span></p>
                        </div>
                        <div className="text-right">
                             <span className="text-sm text-muted-foreground">{t('dashboard.goal')}</span>
                            <p className="text-lg font-semibold text-foreground">/ {totalCaloriesForSelectedDay.toFixed(0)} kcal</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${calorieProgress}%` }}></div>
                    </div>

                    {isBelowTarget && (
                         <div className="mt-4 text-center">
                            <div className="text-sm text-amber-600 bg-amber-100 p-3 rounded-lg flex items-center gap-3">
                                <Icon icon="solar:danger-triangle-bold-duotone" className="size-5 flex-shrink-0" />
                                <span>{t('nutrition.completeIntake.info').replace('{diff}', (user.targetCalories - totalCaloriesForSelectedDay).toFixed(0))}</span>
                            </div>
                            <button onClick={() => openRegenerationModal({ type: 'complete_day', dayIndex: selectedDay })} className="mt-3 px-4 py-2 text-sm rounded-xl bg-secondary text-secondary-foreground font-medium flex items-center gap-2 hover:bg-secondary/90 transition-colors mx-auto">
                                <Icon icon="solar:sparkle-bold-duotone" className="size-5" />
                                {t('nutrition.completeIntake.button')}
                            </button>
                         </div>
                    )}
                </div>
            )}
          </div>
          <div className="space-y-4">
            {/* Forcer l'affichage du bouton de génération si aucun plan valide n'existe pour cette semaine */}
            {!currentWeeklyPlan || !currentPlan || !currentPlan[selectedDay] || !currentPlan[selectedDay].meals || currentPlan[selectedDay].meals.length === 0 || !currentPlan[selectedDay].meals.some(meal => meal && meal.name) ? (
                <div className="text-center text-muted-foreground pt-10">
                    <Icon icon="solar:calendar-bold-duotone" className="size-10 mx-auto text-primary mb-3" />
                    <p className="mb-4">{t('nutrition.nextWeek.subtitle')}</p>
                    <button onClick={() => handleGeneratePlan('current_week', '')} disabled={isLoading} className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50">
                        {isLoading ? <Icon icon="solar:refresh-linear" className="animate-spin size-5" /> : t('nutrition.nextWeek.button')}
                    </button>
                </div>
            ) : (
              <>
                {currentPlan[selectedDay].meals.map((meal, index) => {
                   if (!meal) return null;
                   const dateStr = getSelectedDateKey();
                   const isCompleted = getCompletedMealsForDate(dateStr).includes(meal.name);
                   return (
                     <MealCard
                        key={`${meal.name}-${index}`}
                        meal={meal}
                        isCompleted={isCompleted}
                        onToggleCompleted={() => handleToggleMeal(selectedDay, meal.name)}
                        onRemove={() => handleRemoveMeal(selectedDay, index)}
                        onRegenerate={() => openRegenerationModal({type: 'meal', dayIndex: selectedDay, mealIndex: index})}
                     />
                   )
                })}
              </>
            )}
          </div>
        </div>
        <div className="p-6">
            <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{t('nutrition.nextWeek.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('nutrition.nextWeek.subtitle')}</p>
              </div>
              <button onClick={() => handleGeneratePlan('next_week', '')} disabled={isLoading} className="px-4 py-3 w-full sm:w-auto text-sm rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50">
                {isLoading ? <Icon icon="solar:refresh-linear" className="animate-spin size-5"/> : <Icon icon="solar:calendar-add-bold-duotone" className="size-5" />}
                {t('nutrition.nextWeek.button')}
              </button>
            </div>
        </div>
      </main>
    </div>
    </>
  );
};

export default NutritionPage;