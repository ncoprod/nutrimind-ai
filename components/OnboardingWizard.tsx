import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import type { UserProfile, FoodItem } from '../types';
import { Icon } from '@iconify/react';
import { foodItemsPool as foodItemsPoolFR } from '../data/foodItems';
import { foodItemsPool as foodItemsPoolEN } from '../data/foodItems.en';
import { useLanguage } from '../App';

// --- New FoodSwiper Component ---
interface FoodSwiperProps {
  foodItems: FoodItem[];
  onComplete: (preferences: { likes: FoodItem[]; dislikes: FoodItem[] }) => void;
  onSkip: () => void;
}

const FoodSwiper: React.FC<FoodSwiperProps> = ({ foodItems, onComplete, onSkip }) => {
    const { t } = useLanguage();
    const [deck, setDeck] = useState(foodItems);
    const [history, setHistory] = useState<{item: FoodItem, choice: 'like' | 'dislike' | 'neutral'}[]>([]);
    const [dragState, setDragState] = useState({ x: 0, isDragging: false, startX: 0 });
    const [action, setAction] = useState<'like' | 'dislike' | 'neutral' | null>(null);

    useEffect(() => {
        setDeck(foodItems);
    }, [foodItems]);

    const activeCard = deck[deck.length - 1];

    const handleSwipe = useCallback((choice: 'like' | 'dislike' | 'neutral') => {
        if (!activeCard) return;
        setHistory(prev => [...prev, { item: activeCard, choice }]);
        setDeck(prev => prev.slice(0, -1));
    }, [activeCard]);

    useEffect(() => {
        if (deck.length === 0 && history.length > 0) {
            const likes = history.filter(h => h.choice === 'like').map(h => h.item);
            const dislikes = history.filter(h => h.choice === 'dislike').map(h => h.item);
            onComplete({ likes, dislikes });
        }
    }, [deck.length, history, onComplete]);
    
    const handleUndo = useCallback(() => {
        if (history.length === 0) return;
        const lastAction = history[history.length - 1];
        setDeck(prev => [...prev, lastAction.item]);
        setHistory(prev => prev.slice(0, -1));
    }, [history]);
    
    const triggerAction = useCallback((choice: 'like' | 'dislike' | 'neutral') => {
      setAction(choice);
      setTimeout(() => {
          handleSwipe(choice);
          setAction(null);
      }, 300);
    }, [handleSwipe]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!activeCard) return;
            if (e.key === 'ArrowLeft') triggerAction('dislike');
            if (e.key === 'ArrowRight') triggerAction('like');
            if (e.key === 'ArrowDown') triggerAction('neutral');
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') handleUndo();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeCard, triggerAction, handleUndo]);

    return (
        <div className="w-full flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
                <h2 className="text-2xl font-bold font-heading text-text-primary">{t('onboarding.swiper.title')}</h2>
                <p className="mt-1 text-text-secondary">{t('onboarding.swiper.subtitle')}</p>
            </div>

            <div className="relative w-full h-[450px] flex items-center justify-center">
                {deck.map((item, index) => {
                    const isTopCard = index === deck.length - 1;
                    const getTransform = () => {
                        if (!isTopCard) return `translateY(${(deck.length - 1 - index) * -8}px) scale(${1 - (deck.length - 1 - index) * 0.05})`;
                        if (action === 'like') return 'translateX(120%) rotate(15deg)';
                        if (action === 'dislike') return 'translateX(-120%) rotate(-15deg)';
                        if (action === 'neutral') return 'translateY(120%)';
                        return '';
                    };
                    return (
                        <div key={item.id} className="absolute w-full max-w-xs h-[420px] bg-card rounded-2xl shadow-xl border border-border transition-all duration-300 ease-in-out origin-bottom" style={{ transform: getTransform(), zIndex: index, filter: isTopCard ? 'none' : 'blur(1px)' }}>
                             <div className="relative h-3/5">
                                {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-t-2xl" />
                                ) : (
                                    <div className="w-full h-full bg-slate-200 animate-pulse rounded-t-2xl"></div>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <span className="absolute top-3 right-3 bg-primary/80 text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full backdrop-blur-sm">{item.category}</span>
                            </div>
                            <div className="p-4 flex flex-col h-2/5 justify-between">
                               <div>
                                  <h3 className="font-bold text-lg leading-tight truncate">{item.name}</h3>
                                  <p className="text-xs text-muted-foreground font-medium">{item.cuisineTypes.join(' • ')}</p>
                                  <div className="flex flex-wrap gap-1.5 mt-2">
                                      {item.mainIngredients.slice(0, 4).map(ing => <span key={ing} className="text-xs bg-slate-100 px-2 py-1 rounded-full">{ing}</span>)}
                                  </div>
                               </div>
                                <div className="text-xs text-muted-foreground font-semibold">
                                  {item.macros.calories} kcal • P: {item.macros.protein}g • G: {item.macros.carbs}g • L: {item.macros.fats}g
                                </div>
                            </div>
                        </div>
                    );
                })}
                {!activeCard && (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl">
                        <Icon icon="solar:cup-first-bold-duotone" className="size-16 mx-auto text-accent" />
                        <h3 className="text-xl font-bold mt-4">{t('onboarding.swiper.thankYou')}</h3>
                        <p className="text-muted-foreground mt-1">{t('onboarding.swiper.profileReady')}</p>
                    </div>
                )}
            </div>
            <div className="text-sm font-semibold text-muted-foreground">
                {history.length} / {foodItems.length}
            </div>
            <div className="flex items-center justify-center gap-4">
                <button onClick={() => triggerAction('dislike')} disabled={!activeCard || !!action} className="size-16 rounded-full bg-slate-100 border-2 border-red-200 text-red-500 flex items-center justify-center hover:scale-110 active:scale-100 transition-transform disabled:opacity-50"><Icon icon="solar:close-circle-bold-duotone" className="size-8" /></button>
                <button onClick={handleUndo} disabled={history.length === 0 || !!action} className="size-12 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-500 flex items-center justify-center hover:scale-110 active:scale-100 transition-transform disabled:opacity-50"><Icon icon="solar:undo-left-round-bold-duotone" className="size-6" /></button>
                <button onClick={() => triggerAction('neutral')} disabled={!activeCard || !!action} className="size-12 rounded-full bg-slate-100 border-2 border-slate-200 text-slate-500 flex items-center justify-center hover:scale-110 active:scale-100 transition-transform disabled:opacity-50"><Icon icon="solar:minus-circle-bold-duotone" className="size-6" /></button>
                <button onClick={() => triggerAction('like')} disabled={!activeCard || !!action} className="size-16 rounded-full bg-slate-100 border-2 border-green-200 text-green-500 flex items-center justify-center hover:scale-110 active:scale-100 transition-transform disabled:opacity-50"><Icon icon="solar:heart-bold-duotone" className="size-8" /></button>
            </div>
             <button onClick={onSkip} className="mt-2 text-sm text-muted-foreground hover:text-primary">{t('onboarding.swiper.skip')}</button>
        </div>
    );
};

// --- Original Wizard Component (Modified) ---
interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
}

type GoalFeedback = {
    status: 'healthy' | 'ambitious' | 'unrealistic';
    message: string;
    suggestion?: {
      text: string;
      value: number; // The suggested timeline in weeks
    };
};

interface CustomSelectInputProps {
    name: string;
    value: string;
    onChange: (e: { target: { name: string; value: string; } } | React.ChangeEvent<HTMLInputElement>) => void;
    label?: string;
    unit?: string;
    min: number;
    max: number;
    step: number;
    className: string;
    containerClassName?: string;
}

export const CustomSelectInput: React.FC<CustomSelectInputProps> = ({ name, value, onChange, label = '', unit = '', min, max, step, className, containerClassName = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const options = useMemo(() => {
        const opts = [];
        for (let i = min; i <= max; i = parseFloat((i + step).toFixed(2))) {
            opts.push(i);
        }
        return opts;
    }, [min, max, step]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        setIsOpen(false);
    };

    const handleOptionClick = (optionValue: number) => {
        const syntheticEvent = {
            target: { name, value: String(optionValue) },
        };
        onChange(syntheticEvent);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${containerClassName || ''}`} ref={wrapperRef}>
            {label && <label className="block text-sm font-medium text-text-secondary">{label} {unit && `(${unit})`}</label>}
            <div className="relative" onClick={() => setIsOpen(prev => !prev)}>
                <input
                    type="number"
                    name={name}
                    value={value}
                    onChange={handleInputChange}
                    className={`${className} cursor-pointer w-full`}
                    placeholder=" "
                    autoComplete="off"
                    step={step}
                />
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                    <svg className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>
            
            <div
                className={`absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 origin-top transform transition-all duration-200 ease-out ${
                    isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
                }`}
            >
                <ul className="overflow-y-auto max-h-48 py-1 no-scrollbar">
                    {options.map(option => (
                        <li
                            key={option}
                            className="px-4 py-2 text-sm text-gray-700 hover:bg-primary hover:text-white cursor-pointer"
                            onMouseDown={(e) => {
                                e.preventDefault();
                                handleOptionClick(option);
                            }}
                        >
                            {option}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};


const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const { language, t } = useLanguage();
  const steps = useMemo(() => [
    { id: 'welcome', title: t('onboarding.steps.welcome') },
    { id: 'physio', title: t('onboarding.steps.physio') },
    { id: 'activity', title: t('onboarding.steps.activity') },
    { id: 'goal', title: t('onboarding.steps.goal') },
    { id: 'preferences', title: t('onboarding.steps.preferences') },
    { id: 'prep_time', title: t('onboarding.steps.prep_time') },
    { id: 'food_swiper', title: t('onboarding.steps.food_swiper') },
    { id: 'summary', title: t('onboarding.steps.summary') },
  ], [t]);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    gender: 'male' as 'male' | 'female',
    age: '25',
    height: '175',
    weight: '70',
    activityLevel: 'moderate' as UserProfile['activityLevel'],
    goal: 'lose' as 'lose' | 'maintain' | 'gain',
    preferences: '', // For allergies
    notes: '', // For swiper results
    remarks: '',
    dailyBudget: '15',
    cookingLevel: 'intermediate' as UserProfile['cookingLevel'],
    mealsPerDay: '4',
    goalWeight: '65',
    goalTimeline: '12',
    maxPrepTimeWeekLunch: '30',
    maxPrepTimeWeekDinner: '45',
    maxPrepTimeWeekendLunch: '60',
    maxPrepTimeWeekendDinner: '60',
  });
  const [goalFeedback, setGoalFeedback] = useState<GoalFeedback | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null);
  const [swiperItems, setSwiperItems] = useState<FoodItem[]>([]);
  const [regimes, setRegimes] = useState<string[]>([]);
  // Auth déplacée au niveau App après choix de langue

  useEffect(() => {
    if (steps[currentStep].id === 'food_swiper' && swiperItems.length === 0) {
        const foodItemsPool = language === 'en' ? foodItemsPoolEN : foodItemsPoolFR;
        const shuffled = [...foodItemsPool].sort(() => 0.5 - Math.random());
        setSwiperItems(shuffled.slice(0, 15));
    }
  }, [currentStep, swiperItems.length, language]);


  const inputClasses = "mt-1 block w-full rounded-lg border border-border shadow-sm focus:border-primary focus:ring-primary bg-slate-50 text-text-primary";

  const handleChange = (e: { target: { name: string; value: string; } } | React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const calculateMetabolism = () => {
    const { gender, activityLevel, goal } = formData;
    const age = parseFloat(formData.age) || 0;
    const height = parseFloat(formData.height) || 0;
    const weight = parseFloat(formData.weight) || 0;

    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += (gender === 'male' ? 5 : -161);

    const activityMultipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9 };
    const tdee = bmr * activityMultipliers[activityLevel];

    let targetCalories = tdee;
    if (goal === 'lose') targetCalories -= 500;
    else if (goal === 'gain') targetCalories += 300;

    return { bmr, tdee, targetCalories };
  };

  const analyzeGoal = useCallback((currentFormData = formData) => {
        const weight = parseFloat(currentFormData.weight) || 0;
        const goalWeight = parseFloat(currentFormData.goalWeight) || 0;
        const goalTimeline = parseFloat(currentFormData.goalTimeline) || 0;
        const goal = currentFormData.goal;

        if (goal === 'maintain' || goalTimeline <= 0 || weight === 0 || goalWeight === 0) {
            setGoalFeedback(null);
            return;
        }

        const weightToChange = Math.abs(weight - goalWeight);
        const weeklyChange = weightToChange / goalTimeline;

        let status: GoalFeedback['status'] = 'healthy';
        let message = '';
        let suggestion;

        if (goal === 'lose') {
            const maxHealthyWeeklyLoss = 1; 
            if (weeklyChange > maxHealthyWeeklyLoss) {
                status = 'unrealistic';
                message = t('onboarding.goal.feedback.lose.unrealistic');
                const suggestedWeeks = Math.ceil(weightToChange / 0.5);
                suggestion = { text: t('onboarding.goal.feedback.lose.suggestion').replace('{weeks}', String(suggestedWeeks)), value: suggestedWeeks };
            } else if (weeklyChange > 0.7) {
                status = 'ambitious'; message = t('onboarding.goal.feedback.lose.ambitious');
            } else {
                status = 'healthy'; message = t('onboarding.goal.feedback.lose.healthy').replace('{change}', weeklyChange.toFixed(2));
            }
        } else if (goal === 'gain') {
            if (weeklyChange > 0.7) {
                status = 'unrealistic'; message = t('onboarding.goal.feedback.gain.unrealistic');
                const suggestedWeeks = Math.ceil(weightToChange / 0.25);
                suggestion = { text: t('onboarding.goal.feedback.gain.suggestion').replace('{weeks}', String(suggestedWeeks)), value: suggestedWeeks };
            } else if (weeklyChange > 0.4) {
                status = 'ambitious'; message = t('onboarding.goal.feedback.gain.ambitious');
            } else {
                status = 'healthy'; message = t('onboarding.goal.feedback.gain.healthy').replace('{change}', weeklyChange.toFixed(2));
            }
        }
        setGoalFeedback({ status, message, suggestion });
  }, [formData, t]);
  
  const [metabolism, setMetabolism] = useState({ bmr: 0, tdee: 0, targetCalories: 0 });

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      if (steps[currentStep].id === 'goal') analyzeGoal();
      if (steps[currentStep].id === 'food_swiper') setMetabolism(calculateMetabolism());
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

  const handleAcceptSuggestion = (suggestedTimeline: number) => {
      const newFormData = { ...formData, goalTimeline: suggestedTimeline.toString() };
      setFormData(newFormData);
      analyzeGoal(newFormData);
      setMetabolism(calculateMetabolism());
  };

  const handleSubmit = () => {
    const allergies = formData.preferences.split(',').map(p => p.trim()).filter(Boolean);
    const finalPreferences = [...regimes, ...allergies].join(',');

    const finalProfile: UserProfile = {
      name: formData.name,
      gender: formData.gender,
      age: parseFloat(formData.age) || 0,
      height: parseFloat(formData.height) || 0,
      weight: parseFloat(formData.weight) || 0,
      activityLevel: formData.activityLevel,
      goal: formData.goal,
      preferences: finalPreferences,
      notes: formData.notes,
      remarks: formData.remarks,
      dailyBudget: parseFloat(formData.dailyBudget) || 15,
      cookingLevel: formData.cookingLevel,
      mealsPerDay: parseInt(formData.mealsPerDay, 10) || 4,
      goalWeight: parseFloat(formData.goalWeight) || 0,
      goalTimeline: parseFloat(formData.goalTimeline) || 0,
      ...calculateMetabolism(),
      startDate: new Date().toISOString().split('T')[0],
      startWeight: parseFloat(formData.weight) || 0,
      maxPrepTimeWeekLunch: parseFloat(formData.maxPrepTimeWeekLunch) || 30,
      maxPrepTimeWeekDinner: parseFloat(formData.maxPrepTimeWeekDinner) || 45,
      maxPrepTimeWeekendLunch: parseFloat(formData.maxPrepTimeWeekendLunch) || 60,
      maxPrepTimeWeekendDinner: parseFloat(formData.maxPrepTimeWeekendDinner) || 60,
    };
    
    // App gère la synchro via authUser existant
    onComplete(finalProfile);
  };
  
  
    const handleSwiperComplete = (swiperResult: { likes: FoodItem[], dislikes: FoodItem[] }) => {
        const processItems = (items: FoodItem[]) => {
            const ingredients = new Set<string>();
            const cuisines = new Set<string>();
            items.forEach(item => {
                item.mainIngredients.forEach(i => ingredients.add(i.toLowerCase()));
                item.cuisineTypes.forEach(c => cuisines.add(c.toLowerCase()));
            });
            return { ingredients, cuisines };
        };

        const { ingredients: likedIngredients, cuisines: likedCuisines } = processItems(swiperResult.likes);
        const { ingredients: dislikedIngredients, cuisines: dislikedCuisines } = processItems(swiperResult.dislikes);

        let notes = '';
        if (language === 'en') {
            if (likedIngredients.size > 0) notes += `Likes ingredients like: ${Array.from(likedIngredients).join(', ')}. `;
            if (likedCuisines.size > 0) notes += `Favorite cuisines: ${Array.from(likedCuisines).join(', ')}. `;
            if (dislikedIngredients.size > 0) notes += `Dislikes ingredients like: ${Array.from(dislikedIngredients).join(', ')}. `;
        } else {
            if (likedIngredients.size > 0) notes += `Aime les ingrédients comme: ${Array.from(likedIngredients).join(', ')}. `;
            if (likedCuisines.size > 0) notes += `Cuisines préférées: ${Array.from(likedCuisines).join(', ')}. `;
            if (dislikedIngredients.size > 0) notes += `N'aime pas les ingrédients comme: ${Array.from(dislikedIngredients).join(', ')}. `;
        }
        
        setFormData(prev => ({ ...prev, notes: notes.trim() }));
        nextStep();
    };

    const handleSwiperSkip = () => {
        setFormData(prev => ({ ...prev, notes: t('onboarding.swiper.skippedNote') }));
        nextStep();
    };
  
    const allRegimes = useMemo(() => [
        { id: 'végétarien', name: t('diets.vegetarian'), icon: 'solar:leaf-bold-duotone' },
        { id: 'vegan', name: t('diets.vegan'), icon: 'solar:seedling-bold-duotone' },
        { id: 'pescétarien', name: t('diets.pescetarian'), icon: 'solar:fish-bold-duotone' },
        { id: 'sans gluten', name: t('diets.gluten_free'), icon: 'solar:sushi-bold-duotone' },
        { id: 'sans lactose', name: t('diets.lactose_free'), icon: 'solar:milk-bottle-bold-duotone' },
        { id: 'halal', name: t('diets.halal'), icon: 'solar:moon-stars-bold-duotone' },
        { id: 'casher', name: t('diets.casher'), icon: 'solar:star-of-david-bold-duotone' },
        { id: 'keto', name: t('diets.keto'), icon: 'solar:fire-bold-duotone' },
        { id: 'paléo', name: t('diets.paleo'), icon: 'solar:bone-bold-duotone' },
        { id: 'méditerranéen', name: t('diets.mediterranean'), icon: 'solar:olive-bold-duotone' },
    ], [t]);

    const handleToggleRegime = (regimeId: string) => {
        setRegimes(prev => 
        prev.includes(regimeId) ? prev.filter(r => r !== regimeId) : [...prev, regimeId]
        );
    };

  const renderStepContent = () => {
    const stepId = steps[currentStep].id;
    switch (stepId) {
      case 'welcome':
        return (
          <div className="text-center min-h-[350px] flex flex-col justify-center">
            <h2 className="text-2xl font-bold font-heading text-text-primary">{t('onboarding.welcome.title')}</h2>
            <p className="mt-4 text-text-secondary">{t('onboarding.welcome.subtitle')}</p>
          </div>
        );
      case 'physio':
        return (
          <div className="space-y-4 min-h-[350px]">
            <div>
              <label className="block text-sm font-medium text-text-secondary">{t('onboarding.physio.name')}</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClasses}/>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary">{t('onboarding.physio.gender')}</label>
              <select name="gender" value={formData.gender} onChange={handleChange} className={inputClasses}>
                <option value="male">{t('gender.male')}</option>
                <option value="female">{t('gender.female')}</option>
              </select>
            </div>
            <CustomSelectInput name="age" value={formData.age} onChange={handleChange} label={t('onboarding.physio.age')} unit={t('onboarding.physio.ageUnit')} min={16} max={99} step={1} className={inputClasses} />
            <CustomSelectInput name="height" value={formData.height} onChange={handleChange} label={t('onboarding.physio.height')} unit="cm" min={140} max={220} step={1} className={inputClasses} />
            <CustomSelectInput name="weight" value={formData.weight} onChange={handleChange} label={t('onboarding.physio.weight')} unit="kg" min={40} max={200} step={0.5} className={inputClasses} />
          </div>
        );
      case 'activity':
        return (
          <div className="space-y-4 min-h-[350px]">
            <label className="block text-sm font-medium text-text-secondary">{t('onboarding.activity.question')}</label>
            <select name="activityLevel" value={formData.activityLevel} onChange={handleChange} className={inputClasses}>
              <option value="sedentary">{t('activityLevel.sedentary')}</option>
              <option value="light">{t('activityLevel.light')}</option>
              <option value="moderate">{t('activityLevel.moderate')}</option>
              <option value="active">{t('activityLevel.active')}</option>
              <option value="very_active">{t('activityLevel.very_active')}</option>
            </select>
          </div>
        );
      case 'goal':
        return (
          <div className="space-y-6 min-h-[350px]">
            <div>
              <label className="block text-sm font-medium text-text-secondary">{t('onboarding.goal.mainGoal')}</label>
              <select name="goal" value={formData.goal} onChange={handleChange} className={inputClasses}>
                <option value="lose">{t('goal.lose')}</option>
                <option value="maintain">{t('goal.maintain')}</option>
                <option value="gain">{t('goal.gain')}</option>
              </select>
            </div>
             <CustomSelectInput name="goalWeight" value={formData.goalWeight} onChange={handleChange} label={t('onboarding.goal.goalWeight')} unit="kg" min={40} max={200} step={0.5} className={inputClasses} />
            <CustomSelectInput name="goalTimeline" value={formData.goalTimeline} onChange={handleChange} label={t('onboarding.goal.goalTimeline')} unit={t('onboarding.goal.goalTimelineUnit')} min={1} max={52} step={1} className={inputClasses} />
            <CustomSelectInput name="mealsPerDay" value={formData.mealsPerDay} onChange={handleChange} label={t('onboarding.goal.mealsPerDay')} unit={t('onboarding.goal.mealsPerDayUnit')} min={2} max={6} step={1} className={inputClasses} />
             <CustomSelectInput name="dailyBudget" value={formData.dailyBudget} onChange={handleChange} label={t('onboarding.goal.dailyBudget')} unit="€" min={5} max={50} step={1} className={inputClasses} />
            <div>
              <label className="block text-sm font-medium text-text-secondary">{t('onboarding.goal.cookingLevel')}</label>
              <select name="cookingLevel" value={formData.cookingLevel} onChange={handleChange} className={inputClasses}>
                <option value="beginner">{t('cookingLevel.beginner')}</option>
                <option value="intermediate">{t('cookingLevel.intermediate')}</option>
                <option value="expert">{t('cookingLevel.expert')}</option>
              </select>
            </div>
          </div>
        );
        case 'preferences':
        return (
            <div className="space-y-6 w-full min-h-[350px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-heading text-text-primary">{t('onboarding.preferences.title')}</h2>
                    <p className="mt-1 text-text-secondary">{t('onboarding.preferences.subtitle')}</p>
                </div>
                <div>
                    <h3 className="text-base font-semibold mb-3">{t('profile.foodPreferences.diets')}</h3>
                    <div className="flex flex-wrap gap-2">
                    {allRegimes.map(regime => (
                        <button key={regime.id} onClick={() => handleToggleRegime(regime.id)} className={`px-4 py-2 rounded-xl font-medium flex items-center gap-2 transition-colors ${regimes.includes(regime.id) ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-800'}`}>
                            <Icon icon={regime.icon} className="size-5" />
                            {regime.name}
                        </button>
                    ))}
                    </div>
                </div>
                <div>
                    <label className="block text-base font-semibold">{t('onboarding.goal.allergies')}</label>
                    <textarea name="preferences" value={formData.preferences} onChange={handleChange} rows={2} className={inputClasses} placeholder={t('onboarding.goal.allergiesPlaceholder')}></textarea>
                </div>
                <div>
                    <label className="block text-base font-semibold">{t('onboarding.preferences.remarksLabel')}</label>
                    <textarea name="remarks" value={formData.remarks} onChange={handleChange} rows={3} className={inputClasses} placeholder={t('onboarding.preferences.remarksPlaceholder')}></textarea>
                </div>
            </div>
        );
        case 'prep_time':
        return (
            <div className="space-y-6 w-full min-h-[350px]">
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-heading text-text-primary">{t('onboarding.prep_time.title')}</h2>
                    <p className="mt-1 text-text-secondary">{t('onboarding.prep_time.subtitle')}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5">
                        <label className="text-sm font-medium flex justify-between">
                            <span>{t('onboarding.prep_time.weekLunchLabel')}</span>
                            <span className="font-bold text-primary">{formData.maxPrepTimeWeekLunch} {t('onboarding.prep_time.minutes')}</span>
                        </label>
                        <input type="range" name="maxPrepTimeWeekLunch" min="10" max="90" step="5" value={formData.maxPrepTimeWeekLunch} onChange={handleChange} className="w-full mt-2" />
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5">
                        <label className="text-sm font-medium flex justify-between">
                            <span>{t('onboarding.prep_time.weekDinnerLabel')}</span>
                            <span className="font-bold text-primary">{formData.maxPrepTimeWeekDinner} {t('onboarding.prep_time.minutes')}</span>
                        </label>
                        <input type="range" name="maxPrepTimeWeekDinner" min="10" max="90" step="5" value={formData.maxPrepTimeWeekDinner} onChange={handleChange} className="w-full mt-2" />
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5">
                        <label className="text-sm font-medium flex justify-between">
                            <span>{t('onboarding.prep_time.weekendLunchLabel')}</span>
                            <span className="font-bold text-primary">{formData.maxPrepTimeWeekendLunch} {t('onboarding.prep_time.minutes')}</span>
                        </label>
                        <input type="range" name="maxPrepTimeWeekendLunch" min="15" max="120" step="5" value={formData.maxPrepTimeWeekendLunch} onChange={handleChange} className="w-full mt-2" />
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5">
                        <label className="text-sm font-medium flex justify-between">
                            <span>{t('onboarding.prep_time.weekendDinnerLabel')}</span>
                            <span className="font-bold text-primary">{formData.maxPrepTimeWeekendDinner} {t('onboarding.prep_time.minutes')}</span>
                        </label>
                        <input type="range" name="maxPrepTimeWeekendDinner" min="15" max="120" step="5" value={formData.maxPrepTimeWeekendDinner} onChange={handleChange} className="w-full mt-2" />
                    </div>
                </div>
            </div>
        );
      case 'food_swiper':
          if (swiperItems.length === 0) {
              return (
                  <div className="text-center min-h-[450px] flex flex-col justify-center items-center">
                      <Icon icon="solar:cup-hot-bold-duotone" className="size-16 mx-auto text-primary animate-pulse" />
                      <h2 className="text-xl font-bold mt-4">{t('onboarding.swiper.loading')}</h2>
                  </div>
              );
          }
          return <FoodSwiper foodItems={swiperItems} onComplete={handleSwiperComplete} onSkip={handleSwiperSkip} />;
      case 'summary':
        const feedbackColors = {
            healthy: 'bg-green-100 border-green-400 text-green-700',
            ambitious: 'bg-yellow-100 border-yellow-400 text-yellow-700',
            unrealistic: 'bg-red-100 border-red-400 text-red-700',
        };
        const infoContent = { bmr: { title: t('onboarding.summary.bmrTitle'), content: t('onboarding.summary.bmrContent') }, tdee: { title: t('onboarding.summary.tdeeTitle'), content: t('onboarding.summary.tdeeContent') }, targetCalories: { title: t('onboarding.summary.targetCaloriesTitle'), content: t('onboarding.summary.targetCaloriesContent') }, activityLevel: { title: t('onboarding.summary.activityLevelTitle'), content: t('onboarding.summary.activityLevelContent') } };
        const activityLevelLabels: Record<UserProfile['activityLevel'], string> = { sedentary: t('activityLevel.sedentary'), light: t('activityLevel.light'), moderate: t('activityLevel.moderate'), active: t('activityLevel.active'), very_active: t('activityLevel.very_active') };

        return (
            <div className="text-center space-y-4 w-full min-h-[350px]">
                <h2 className="text-2xl font-bold font-heading text-text-primary">{t('onboarding.summary.title')}</h2>
                {goalFeedback && (
                    <div className={`border-l-4 p-4 rounded-md ${feedbackColors[goalFeedback.status]}`} role="alert">
                        <p className="font-bold">{goalFeedback.message}</p>
                        {goalFeedback.suggestion && 
                        <div className="mt-2 text-left">
                            <p className="text-sm">{goalFeedback.suggestion.text}</p>
                            <button onClick={() => handleAcceptSuggestion(goalFeedback.suggestion!.value)} className="mt-2 text-sm font-semibold bg-white border border-current px-3 py-1 rounded-md hover:bg-slate-50">{t('onboarding.summary.adjustButton')}</button>
                        </div>}
                    </div>
                )}
                <div className="space-y-3 w-full max-w-sm mx-auto pt-4">
                    <div onClick={() => setInfoModal(infoContent.bmr)} className="flex items-center p-3 rounded-xl bg-slate-50 border border-border cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors">
                        <div className="size-10 rounded-lg bg-red-100 flex items-center justify-center mr-3"><Icon icon="solar:fire-bold-duotone" className="size-6 text-red-500" /></div>
                        <div className="flex-1 text-left"><p className="text-sm font-medium">{t('onboarding.summary.bmrLabel')}</p></div>
                        <p className="text-xl font-bold text-primary">{metabolism.bmr.toFixed(0)}</p>
                    </div>
                    <div onClick={() => setInfoModal(infoContent.tdee)} className="flex items-center p-3 rounded-xl bg-slate-50 border border-border cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors">
                         <div className="size-10 rounded-lg bg-yellow-100 flex items-center justify-center mr-3"><Icon icon="solar:bolt-bold-duotone" className="size-6 text-yellow-500" /></div>
                        <div className="flex-1 text-left"><p className="text-sm font-medium">{t('onboarding.summary.tdeeLabel')}</p></div>
                        <p className="text-xl font-bold text-primary">{metabolism.tdee.toFixed(0)}</p>
                    </div>
                     <div onClick={() => setInfoModal(infoContent.targetCalories)} className="flex items-center p-3 rounded-xl bg-slate-50 border border-border cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors">
                        <div className="size-10 rounded-lg bg-green-100 flex items-center justify-center mr-3"><Icon icon="solar:target-bold-duotone" className="size-6 text-green-500" /></div>
                        <div className="flex-1 text-left"><p className="text-sm font-medium">{t('onboarding.summary.targetCaloriesLabel')}</p></div>
                        <p className="text-xl font-bold text-accent">{metabolism.targetCalories.toFixed(0)}</p>
                    </div>
                    <div onClick={() => setInfoModal(infoContent.activityLevel)} className="flex items-center p-3 rounded-xl bg-slate-50 border border-border cursor-pointer hover:bg-primary/10 hover:border-primary/50 transition-colors">
                        <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3"><Icon icon="solar:running-bold-duotone" className="size-6 text-blue-500" /></div>
                        <div className="flex-1 text-left"><p className="text-sm font-medium">{t('onboarding.summary.activityLevelLabel')}</p></div>
                        <p className="text-lg font-bold text-secondary capitalize">{activityLevelLabels[formData.activityLevel]}</p>
                    </div>
                </div>
                <p className="text-sm text-slate-500 pt-4">{t('onboarding.summary.confirmation')}</p>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
    {infoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setInfoModal(null)}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold font-heading text-foreground">{infoModal.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">{infoModal.content}</p>
                <button onClick={() => setInfoModal(null)} className="w-full px-4 py-2 text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                    {t('common.gotIt')}
                </button>
            </div>
        </div>
    )}
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
      <div className="w-full max-w-2xl bg-card rounded-2xl shadow-xl p-8 space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold font-heading text-primary">NutriMIND</h1>
          <p className="text-center text-slate-500">{t('common.step')} {currentStep + 1} {t('common.of')} {steps.length} - {steps[currentStep].title}</p>
          <div className="w-full bg-slate-200 rounded-full h-2.5 mt-4">
            <div className="bg-primary h-2.5 rounded-full transition-all duration-500" style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}></div>
          </div>
        </div>
        
        <div key={currentStep} className="animate-step-in flex items-center justify-center">
            {renderStepContent()}
        </div>

        <div className="flex justify-between items-center">
          <button onClick={prevStep} disabled={currentStep === 0} className="px-6 py-2 text-sm font-medium text-slate-700 bg-slate-200 rounded-lg disabled:opacity-50 flex items-center gap-2">
            <Icon icon="solar:arrow-left-linear" className="size-5" />
            {t('common.previous')}
          </button>
          {currentStep < steps.length - 1 ? (
            <button onClick={nextStep} className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 flex items-center gap-2">
              {t('common.next')}
              <Icon icon="solar:arrow-right-linear" className="size-5" />
            </button>
          ) : (
            <button 
              onClick={handleSubmit} 
              disabled={goalFeedback?.status === 'unrealistic'}
              className="px-6 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {t('common.finish')}
              <Icon icon="solar:rocket-2-bold-duotone" className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default OnboardingWizard;