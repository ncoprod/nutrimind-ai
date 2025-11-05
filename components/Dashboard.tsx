import React, { useState, useMemo, useEffect } from 'react';
import type { UserProfile, WeeklyPlan, DailyPlan, Meal, TrackingEntry, WaterIntake, BodyMeasurement, NutritionalAlert } from '../types';
import { getMealImage } from '../services/geminiService';
import { Icon } from '@iconify/react';
import { Avatar } from './ui/Avatar';
import { useLanguage } from '../App';
import { RecipeModal } from './RecipeModal';
import WaterTracker from './WaterTracker';
import BodyMeasurements from './BodyMeasurements';
import NutritionalAlerts from './NutritionalAlerts';
import WeightTracker from './WeightTracker';
import ProgressCharts from './ProgressCharts';

interface DashboardProps {
  user: UserProfile;
  mealPlans: WeeklyPlan[];
  completedMeals: Record<string, string[]>;
  setCompletedMeals: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  waterIntake: WaterIntake[];
  setWaterIntake: React.Dispatch<React.SetStateAction<WaterIntake[]>>;
  bodyMeasurements: BodyMeasurement[];
  setBodyMeasurements: React.Dispatch<React.SetStateAction<BodyMeasurement[]>>;
  nutritionalAlerts: NutritionalAlert[];
  setNutritionalAlerts: React.Dispatch<React.SetStateAction<NutritionalAlert[]>>;
  setView: (view: 'dashboard' | 'profile' | 'nutrition' | 'settings' | 'activities') => void;
  isGeneratingPlan: boolean;
  onGeneratePlan: () => void;
}

const MealCard: React.FC<{ 
    meal: Meal; 
    type: string; 
    isCompleted: boolean;
    onToggleCompleted: () => void;
    onSelectMeal: () => void;
}> = ({ meal, type, isCompleted, onToggleCompleted, onSelectMeal }) => {
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [imageStatus, setImageStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
    const { language } = useLanguage();

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
        return () => { isMounted = false; };
    }, [meal.name, language]);

    return (
        <div className="flex items-center gap-3">
             <div className="relative flex items-center" onClick={(e) => { e.stopPropagation(); onToggleCompleted(); }}>
                  <input type="checkbox" id={`dashboard-checkbox-${type}-${meal.name}`} checked={isCompleted} onChange={()=>{}} className="peer h-8 w-8 cursor-pointer appearance-none rounded-lg border-2 border-border bg-slate-100 checked:bg-primary" aria-label={`Mark ${type} as completed`} />
                  <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary-foreground opacity-0 transition-opacity peer-checked:opacity-100">
                     <Icon icon="solar:check-circle-bold-duotone" className="size-4" />
                  </div>
                   <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground transition-opacity peer-checked:opacity-0">
                     <Icon icon="solar:check-circle-bold-duotone" className="size-4" />
                  </div>
            </div>
            <button onClick={onSelectMeal} className="flex flex-1 items-center gap-3 min-w-0 text-left">
                <div className="size-12 rounded-xl bg-muted/20 flex items-center justify-center flex-shrink-0">
                    {imageStatus === 'loaded' && imageUrl ? (
                        <img alt={meal.name} src={imageUrl} className="size-full rounded-xl object-cover" />
                    ) : (
                        imageStatus === 'loading' ?
                        <Icon icon="solar:refresh-linear" className="size-6 text-muted animate-spin" />
                        : <Icon icon="solar:cup-hot-bold-duotone" className="size-6 text-muted" />
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm mb-0.5 truncate">{meal.name}</h4>
                    <p className="text-xs text-muted-foreground mb-1">{type}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-primary">{meal.macros.calories.toFixed(0)} cal</span>
                        <span className="text-xs text-muted-foreground">{meal.macros.protein.toFixed(0)}g protein</span>
                    </div>
                </div>
            </button>
        </div>
    );
};


const Dashboard: React.FC<DashboardProps> = ({ 
  user, 
  mealPlans, 
  completedMeals, 
  setCompletedMeals, 
  waterIntake,
  setWaterIntake,
  bodyMeasurements,
  setBodyMeasurements,
  nutritionalAlerts,
  setNutritionalAlerts,
  setView, 
  isGeneratingPlan, 
  onGeneratePlan 
}) => {
    const { t } = useLanguage();
    const [selectedMeal, setSelectedMeal] = useState<{meal: Meal, type: string} | null>(null);

    const toLocalKey = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const todaysData = useMemo(() => {
        if (!mealPlans || mealPlans.length === 0) return null;

        const today = new Date();
        // Map today to a week/day index based on real calendar from user.startDate
        const start = new Date(user.startDate);
        start.setHours(0,0,0,0);
        const dayLocal = new Date(today);
        dayLocal.setHours(0,0,0,0);
        const diffDays = Math.floor((dayLocal.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const weekIdx = Math.max(0, Math.floor(diffDays / 7));

        // Convert today's weekday to array index (0=Monday, 1=Tuesday, ..., 6=Sunday)
        const todayWeekday = today.getDay();
        const dayIdx = todayWeekday === 0 ? 6 : todayWeekday - 1;
        
        // Trouver le plan pour cette semaine spécifique
        const weekPlan = mealPlans.find(plan => plan.weekNumber === weekIdx);
        const todaysPlan = weekPlan?.plan?.[dayIdx];
        
        if (!todaysPlan) return null;

        const todayDateString = toLocalKey(today);
        const todayIso = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];
        const completedMealNames = completedMeals[todayDateString] || completedMeals[todayIso] || [];

        const consumed = todaysPlan.meals.reduce((acc, meal) => {
            if (meal && completedMealNames.includes(meal.name)) {
                acc.calories += meal.macros.calories;
                acc.protein += meal.macros.protein;
                acc.carbs += meal.macros.carbohydrates;
                acc.fat += meal.macros.fat;
            }
            return acc;
        }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

        // Use user's precise target calories for goal, not the AI-generated daily total which can have a margin of error.
        const goal = {
            calories: user.targetCalories,
            protein: Math.round((user.targetCalories * 0.3) / 4),
            carbs: Math.round((user.targetCalories * 0.4) / 4),
            fat: Math.round((user.targetCalories * 0.3) / 9),
        };
        
        const caloriesLeft = goal.calories - consumed.calories;
        const calorieProgress = goal.calories > 0 ? (consumed.calories / goal.calories) * 100 : 0;

        return {
            todayDateString,
            todaysPlan,
            consumed,
            goal,
            caloriesLeft,
            calorieProgress,
        };
    }, [user, mealPlans, completedMeals]);

    const handleToggleMeal = (mealName: string) => {
      if (!todaysData) return;
      const { todayDateString } = todaysData;
      setCompletedMeals(prev => {
          const dayMeals = prev[todayDateString] || [];
          const newDayMeals = dayMeals.includes(mealName)
              ? dayMeals.filter(m => m !== mealName)
              : [...dayMeals, mealName];
          return { ...prev, [todayDateString]: newDayMeals };
      });
    };

    if (!todaysData) {
        return (
            <div className="flex flex-col h-screen items-center justify-center bg-background p-6 text-center">
                <h1 className="text-2xl font-bold font-heading text-foreground mb-2">{t('dashboard.welcome.title').replace('{name}', user.name)}</h1>
                <p className="text-muted-foreground mb-6">{t('dashboard.welcome.subtitle')}</p>
                <button 
                    onClick={onGeneratePlan}
                    disabled={isGeneratingPlan}
                    className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
                >
                    {isGeneratingPlan ? t('dashboard.welcome.button.generating') : t('dashboard.welcome.button.generate')}
                </button>
            </div>
        );
    }
    
    const { todayDateString, todaysPlan, consumed, goal, caloriesLeft, calorieProgress } = todaysData;
    const todayHuman = new Date();
    const todayHumanStr = todayHuman.toLocaleDateString(undefined, { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' });
    const circumference = 2 * Math.PI * 28; // New radius is 28
    const calorieProgressCircle = circumference * (1 - Math.min(100, calorieProgress) / 100);
    
	return (
        <>
        {selectedMeal && <RecipeModal meal={selectedMeal.meal} type={selectedMeal.type} onClose={() => setSelectedMeal(null)} />}
		<div className="flex flex-col min-h-screen bg-background">
			<div className="bg-gradient-to-br from-primary to-[#FF7A62] px-6 pt-6 pb-8">
				<div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Avatar name={user.name} className="size-14 border-2 border-white shadow-lg text-xl" />
						<div>
							<p className="text-sm text-white/80">{t('dashboard.greeting')}</p>
                            <h1 className="text-xl font-bold font-heading text-white">{user.name}</h1>
                            <p className="text-xs text-white/80 capitalize">{todayHumanStr}</p>
						</div>
					</div>
					<button className="size-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
						<Icon icon="solar:bell-bing-bold-duotone" className="size-6 text-white" />
					</button>
				</div>
                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-5">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm text-white/80 mb-1">{t('dashboard.caloriesLeft')}</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-3xl font-bold font-heading text-white">{caloriesLeft.toFixed(0)}</h2>
                                <span className="text-lg text-white/80">kcal</span>
                            </div>
                        </div>
                        <div className="relative size-16 flex-shrink-0">
                            <svg className="size-16 -rotate-90">
                                <circle r="28" cx="32" cy="32" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="6" />
                                <circle r="28" cx="32" cy="32" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={calorieProgressCircle} />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-sm font-bold text-white">{Math.floor(calorieProgress)}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20 flex items-center gap-4 text-sm">
                        <div className="text-center flex-1">
                            <p className="text-white/70 mb-1">{t('dashboard.goal')}</p>
                            <p className="font-semibold text-white">{goal.calories.toFixed(0)}</p>
                        </div>
                        <div className="h-8 w-px bg-white/20" />
                        <div className="text-center flex-1">
                            <p className="text-white/70 mb-1">{t('dashboard.consumed')}</p>
                            <p className="font-semibold text-white">{consumed.calories.toFixed(0)}</p>
                        </div>
                    </div>
                </div>
			</div>
			<div className="flex-1 overflow-y-auto px-6 -mt-4">
				<div className="bg-card rounded-3xl shadow-lg p-5 mb-4">
					<h3 className="text-base font-semibold font-heading mb-4">{t('dashboard.macros.title')}</h3>
					<div className="space-y-4">
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Icon icon="solar:poultry-bold-duotone" className="size-5 text-protein" />
									<span className="text-sm font-medium">{t('dashboard.macros.protein')}</span>
								</div>
								<span className="text-sm font-bold">{consumed.protein.toFixed(0)}g <span className="text-muted-foreground font-normal">/ {goal.protein.toFixed(0)}g</span></span>
							</div>
							<div className="h-2 bg-muted/20 rounded-full overflow-hidden">
								<div style={{width: `${goal.protein > 0 ? (consumed.protein / goal.protein) * 100 : 0}%`}} className="h-full bg-protein rounded-full" />
							</div>
						</div>
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Icon icon="solar:麵包-bold-duotone" className="size-5 text-carbs" />
									<span className="text-sm font-medium">{t('dashboard.macros.carbs')}</span>
								</div>
								<span className="text-sm font-bold">{consumed.carbs.toFixed(0)}g <span className="text-muted-foreground font-normal">/ {goal.carbs.toFixed(0)}g</span></span>
							</div>
							<div className="h-2 bg-muted/20 rounded-full overflow-hidden">
								<div style={{width: `${goal.carbs > 0 ? (consumed.carbs / goal.carbs) * 100 : 0}%`}} className="h-full bg-carbs rounded-full" />
							</div>
						</div>
						<div>
							<div className="flex items-center justify-between mb-2">
								<div className="flex items-center gap-2">
									<Icon icon="solar:avocado-bold-duotone" className="size-5 text-fats" />
									<span className="text-sm font-medium">{t('dashboard.macros.fats')}</span>
								</div>
								<span className="text-sm font-bold">{consumed.fat.toFixed(0)}g <span className="text-muted-foreground font-normal">/ {goal.fat.toFixed(0)}g</span></span>
							</div>
							<div className="h-2 bg-muted/20 rounded-full overflow-hidden">
								<div style={{width: `${goal.fat > 0 ? (consumed.fat / goal.fat) * 100 : 0}%`}} className="h-full bg-fats rounded-full" />
							</div>
						</div>
					</div>
				</div>
				<div className="bg-card rounded-3xl shadow-lg p-5 mb-4">
					<div className="flex items-center justify-between mb-4">
						<h3 className="text-base font-semibold font-heading">{t('dashboard.meals.title')}</h3>
						<button onClick={() => setView('nutrition')} className="text-sm text-primary font-semibold">{t('dashboard.meals.viewAll')}</button>
					</div>
					<div className="space-y-3">
                        {todaysPlan.meals.map((meal, index) => {
                            if (!meal) return null;
                            const isCompleted = (completedMeals[todayDateString] || []).includes(meal.name);
                            return (
                                <MealCard 
                                    key={`${meal.name}-${index}`} 
                                    meal={meal} 
                                    type={meal.type} 
                                    isCompleted={isCompleted}
                                    onToggleCompleted={() => handleToggleMeal(meal.name)}
                                    onSelectMeal={() => setSelectedMeal({ meal, type: meal.type })}
                                />
                            );
                        })}
					</div>
				</div>

				{/* Hydratation */}
				<div className="mb-4">
					<WaterTracker waterData={waterIntake} onUpdateWater={setWaterIntake} />
				</div>

				{/* Grid 50/50 pour Suivi du poids et Mesures corporelles */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
					<WeightTracker user={user} />
					<BodyMeasurements measurements={bodyMeasurements} onUpdateMeasurements={setBodyMeasurements} />
				</div>

				{/* Alertes nutritionnelles */}
				<NutritionalAlerts 
					alerts={nutritionalAlerts}
					onUpdateAlerts={setNutritionalAlerts}
					user={user}
					mealPlans={mealPlans}
					completedMeals={completedMeals}
				/>

				{/* Graphiques de progression */}
				<div className="mt-4">
					<ProgressCharts 
						user={user}
						mealPlans={mealPlans}
						completedMeals={completedMeals}
					/>
				</div>
			</div>
			<button className="fixed bottom-28 lg:bottom-8 right-6 size-16 rounded-full bg-primary shadow-xl flex items-center justify-center active:scale-95 transition-transform" onClick={() => setView('nutrition')}>
				<Icon icon="solar:add-circle-bold-duotone" className="size-10 text-primary-foreground" />
			</button>
		</div>
        </>
	);
};

export default Dashboard;