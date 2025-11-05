import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { UserProfile, WeeklyPlan } from '../types';
import { useLanguage } from '../App';

interface ProgressChartsProps {
  user: UserProfile;
  mealPlans: WeeklyPlan[];
  completedMeals: Record<string, string[]>;
}

const ProgressCharts: React.FC<ProgressChartsProps> = ({ user, mealPlans, completedMeals }) => {
  const { t, language } = useLanguage();

  // Calculer les calories consommées pour les 7 derniers jours
  const toLocalKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const fromKey = (key: string) => {
    const [y, m, d] = key.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  };

  const last7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date();
      dt.setHours(0,0,0,0);
      dt.setDate(dt.getDate() - i);
      days.push(toLocalKey(dt));
    }
    return days;
  }, []);

  // Helper: find day plan based on startDate and list of weekly plans
  const getDayPlanForDate = (dateStr: string) => {
    if (!user.startDate || mealPlans.length === 0) return null;
    const start = new Date(user.startDate + 'T00:00:00');
    const target = new Date(dateStr + 'T00:00:00');
    const diffDays = Math.floor((target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return null;
    const weekIdx = Math.floor(diffDays / 7);

    // Convert target date's weekday to array index (0=Monday, 1=Tuesday, ..., 6=Sunday)
    const targetWeekday = target.getDay();
    const dayIdx = targetWeekday === 0 ? 6 : targetWeekday - 1;
    
    // Trouver le plan pour cette semaine spécifique par weekNumber
    const weekPlan = mealPlans.find(plan => plan.weekNumber === weekIdx);
    if (!weekPlan?.plan?.[dayIdx]) return null;
    return weekPlan.plan[dayIdx];
  };

  const getCompletedForDate = (dateKey: string): string[] => {
    const isoKey = new Date(fromKey(dateKey)).toISOString().split('T')[0];
    return (completedMeals[dateKey] || completedMeals[isoKey] || []);
  };

  const caloriesData = useMemo(() => {
    return last7Days.map(date => {
      const completedMealNames = getCompletedForDate(date);
      const dayPlan = getDayPlanForDate(date);
      let totalCalories = 0;
      if (dayPlan) {
        dayPlan.meals.forEach(meal => {
          if (completedMealNames.includes(meal.name)) {
            totalCalories += meal.macros.calories;
          }
        });
      }
      const labelDate = fromKey(date);
      return {
        date,
        calories: totalCalories,
        dayName: labelDate.toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { weekday: 'short' }),
      };
    });
  }, [last7Days, completedMeals, mealPlans, user.startDate, language]);

  const maxCalories = Math.max(...caloriesData.map(d => d.calories), user.targetCalories);

  // Calculer le streak
  const streak = useMemo(() => {
    let count = 0;
    // from today backward 365 days max
    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const dateStrLocal = toLocalKey(d);
      const isoKey = d.toISOString().split('T')[0];
      const mealsForDay = completedMeals[dateStrLocal] || completedMeals[isoKey] || [];
      if (mealsForDay.length === 0 && i !== 0) break;
      const dayPlan = getDayPlanForDate(dateStrLocal);
      if (!dayPlan) break;
      let total = 0;
      dayPlan.meals.forEach(meal => {
        if (mealsForDay.includes(meal.name)) total += meal.macros.calories;
      });
      if (total >= user.targetCalories * 0.8 && total <= user.targetCalories * 1.2) {
        count++;
      } else if (i !== 0) {
        break;
      } else {
        // today not yet complete -> streak 0
        break;
      }
    }
    return count;
  }, [completedMeals, mealPlans, user.targetCalories, user.startDate]);

  // Calculer les moyennes de macros sur 7 jours
  const macrosAverage = useMemo(() => {
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;
    let daysCount = 0;

    last7Days.forEach(date => {
      const completedMealNames = getCompletedForDate(date);
      const dayPlan = getDayPlanForDate(date);
      if (completedMealNames.length > 0 && dayPlan) {
        daysCount++;
        dayPlan.meals.forEach(meal => {
          if (completedMealNames.includes(meal.name)) {
            totalProtein += meal.macros.protein;
            totalCarbs += meal.macros.carbohydrates;
            totalFats += meal.macros.fat;
          }
        });
      }
    });

    return daysCount > 0
      ? {
          protein: Math.round(totalProtein / daysCount),
          carbs: Math.round(totalCarbs / daysCount),
          fats: Math.round(totalFats / daysCount),
        }
      : { protein: 0, carbs: 0, fats: 0 };
  }, [last7Days, completedMeals, mealPlans, user.startDate]);

  return (
    <div className="space-y-4">
      {/* Streak */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-500 to-pink-500 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Icon icon="solar:fire-bold" className="size-6" />
              <h3 className="font-bold text-lg">Streak</h3>
            </div>
            <p className="text-white/90 text-sm">Jours consécutifs d'objectifs atteints</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{streak}</div>
            <div className="text-sm text-white/90">jours</div>
          </div>
        </div>
      </div>

      {/* Graphique des calories sur 7 jours */}
      <div className="rounded-2xl bg-card border border-border shadow-lg p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Icon icon="solar:chart-bold-duotone" className="size-5 text-primary" />
          {language === 'fr' ? 'Calories sur 7 jours' : 'Calories over last 7 days'}
        </h3>
        <div className="space-y-2">
          {caloriesData.map((day, index) => (
            <div key={day.date} className="flex items-center gap-3">
              <div className="w-12 text-xs font-medium text-muted-foreground">{day.dayName}</div>
              <div className="flex-1 relative">
                <div className="h-8 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full rounded-lg transition-all ${
                      day.calories >= user.targetCalories * 0.9 && day.calories <= user.targetCalories * 1.1
                        ? 'bg-gradient-to-r from-primary to-accent'
                        : day.calories < user.targetCalories * 0.9
                        ? 'bg-slate-300'
                        : 'bg-red-400'
                    }`}
                    style={{ width: `${Math.min(100, (day.calories / maxCalories) * 100)}%` }}
                  />
                </div>
                {/* Ligne de l'objectif */}
                {user.targetCalories <= maxCalories && (
                  <div
                    className="absolute top-0 h-full w-0.5 bg-primary/50"
                    style={{ left: `${(user.targetCalories / maxCalories) * 100}%` }}
                  />
                )}
              </div>
              <div className="w-20 text-right">
                <span className="text-sm font-bold">{day.calories}</span>
                <span className="text-xs text-muted-foreground"> kcal</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-primary to-accent" />
            <span>{language === 'fr' ? 'Objectif atteint' : 'Target met'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-slate-300" />
            <span>{language === 'fr' ? 'Below' : 'Below'}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-400" />
            <span>{language === 'fr' ? 'Above' : 'Above'}</span>
          </div>
        </div>
      </div>

      {/* Moyennes des macros sur 7 jours */}
      <div className="rounded-2xl bg-card border border-border shadow-lg p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Icon icon="solar:pie-chart-bold-duotone" className="size-5 text-primary" />
          {language === 'fr' ? 'Macros moyennes (7j)' : 'Average macros (7d)'}
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-protein/10 flex items-center justify-center">
                <Icon icon="solar:bone-bold-duotone" className="size-5 text-protein" />
              </div>
              <div>
                <p className="text-sm font-medium">{language === 'fr' ? 'Protéines' : 'Protein'}</p>
                <p className="text-xs text-muted-foreground">{macrosAverage.protein}g/{language === 'fr' ? 'jour' : 'day'}</p>
              </div>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-protein rounded-full"
                  style={{ width: `${Math.min(100, (macrosAverage.protein / 200) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-carbs/10 flex items-center justify-center">
                <Icon icon="solar:wheat-bold-duotone" className="size-5 text-carbs" />
              </div>
              <div>
                <p className="text-sm font-medium">{language === 'fr' ? 'Glucides' : 'Carbs'}</p>
                <p className="text-xs text-muted-foreground">{macrosAverage.carbs}g/{language === 'fr' ? 'jour' : 'day'}</p>
              </div>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-carbs rounded-full"
                  style={{ width: `${Math.min(100, (macrosAverage.carbs / 300) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-fats/10 flex items-center justify-center">
                <Icon icon="solar:oil-bold-duotone" className="size-5 text-fats" />
              </div>
              <div>
                <p className="text-sm font-medium">{language === 'fr' ? 'Lipides' : 'Fats'}</p>
                <p className="text-xs text-muted-foreground">{macrosAverage.fats}g/{language === 'fr' ? 'jour' : 'day'}</p>
              </div>
            </div>
            <div className="flex-1 mx-4">
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-fats rounded-full"
                  style={{ width: `${Math.min(100, (macrosAverage.fats / 100) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;

