import React, { useState, useEffect, useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { NutritionalAlert, UserProfile, WeeklyPlan } from '../types';

interface NutritionalAlertsProps {
  alerts: NutritionalAlert[];
  onUpdateAlerts: (alerts: NutritionalAlert[]) => void;
  user: UserProfile;
  mealPlans: WeeklyPlan[];
  completedMeals: Record<string, string[]>;
}

const NutritionalAlerts: React.FC<NutritionalAlertsProps> = ({ 
  alerts, 
  onUpdateAlerts, 
  user,
  mealPlans,
  completedMeals 
}) => {
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);

  // Générer des alertes intelligentes basées sur les données
  const generateSmartAlerts = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const newAlerts: NutritionalAlert[] = [...alerts];

    if (!mealPlans || mealPlans.length === 0) return newAlerts;

    const latestPlan = mealPlans[mealPlans.length - 1];
    const todayDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
    const todaysPlan = latestPlan.plan[todayDayIndex];

    if (!todaysPlan) return newAlerts;

    const completedMealNames = completedMeals[today] || [];
    
    // Calculer les macros consommées aujourd'hui
    const consumed = todaysPlan.meals.reduce((acc, meal) => {
      if (meal && completedMealNames.includes(meal.name)) {
        acc.calories += meal.macros.calories;
        acc.protein += meal.macros.protein;
      }
      return acc;
    }, { calories: 0, protein: 0 });

    const goal = {
      calories: user.targetCalories,
      protein: Math.round((user.targetCalories * 0.3) / 4),
    };

    // Alerte 1: Objectif calorique presque atteint
    if (consumed.calories >= goal.calories * 0.9 && consumed.calories < goal.calories) {
      const alertId = `calories-near-goal-${today}`;
      if (!newAlerts.some(a => a.id === alertId)) {
        newAlerts.push({
          id: alertId,
          type: 'success',
          title: 'Objectif calorique presque atteint !',
          message: `Il vous reste ${(goal.calories - consumed.calories).toFixed(0)} calories à consommer aujourd'hui.`,
          date: today,
          isRead: false,
        });
      }
    }

    // Alerte 2: Dépassement calorique
    if (consumed.calories > goal.calories * 1.1) {
      const alertId = `calories-exceeded-${today}`;
      if (!newAlerts.some(a => a.id === alertId)) {
        newAlerts.push({
          id: alertId,
          type: 'warning',
          title: 'Objectif calorique dépassé',
          message: `Vous avez dépassé votre objectif de ${(consumed.calories - goal.calories).toFixed(0)} calories. Pensez à adapter vos prochains repas.`,
          date: today,
          isRead: false,
        });
      }
    }

    // Alerte 3: Protéines insuffisantes
    if (consumed.protein < goal.protein * 0.7 && completedMealNames.length >= 2) {
      const alertId = `protein-low-${today}`;
      if (!newAlerts.some(a => a.id === alertId)) {
        newAlerts.push({
          id: alertId,
          type: 'info',
          title: 'Apport en protéines faible',
          message: `Vous n'avez consommé que ${consumed.protein.toFixed(0)}g de protéines sur ${goal.protein}g. Privilégiez les sources de protéines pour vos prochains repas.`,
          date: today,
          isRead: false,
        });
      }
    }

    // Alerte 4: Pas de repas enregistré depuis longtemps
    const lastMealDate = Object.keys(completedMeals).sort().reverse()[0];
    if (lastMealDate && lastMealDate !== today) {
      const daysSinceLastMeal = Math.floor((new Date(today).getTime() - new Date(lastMealDate).getTime()) / (1000 * 60 * 60 * 24));
      if (daysSinceLastMeal > 1) {
        const alertId = `no-meals-recent-${today}`;
        if (!newAlerts.some(a => a.id === alertId)) {
          newAlerts.push({
            id: alertId,
            type: 'warning',
            title: 'Aucun repas enregistré récemment',
            message: `Vous n'avez pas enregistré de repas depuis ${daysSinceLastMeal} jour${daysSinceLastMeal > 1 ? 's' : ''}. Pensez à suivre votre alimentation régulièrement.`,
            date: today,
            isRead: false,
          });
        }
      }
    }

    // Alerte 5: Encouragement pour objectif atteint
    if (consumed.calories >= goal.calories * 0.95 && consumed.calories <= goal.calories * 1.05) {
      const alertId = `perfect-day-${today}`;
      if (!newAlerts.some(a => a.id === alertId)) {
        newAlerts.push({
          id: alertId,
          type: 'success',
          title: 'Journée parfaite ! 🎉',
          message: `Vous avez atteint votre objectif calorique de manière optimale. Continuez comme ça !`,
          date: today,
          isRead: false,
        });
      }
    }

    return newAlerts;
  }, [alerts, mealPlans, completedMeals, user]);

  useEffect(() => {
    // Mettre à jour les alertes si de nouvelles ont été générées
    if (generateSmartAlerts.length !== alerts.length) {
      onUpdateAlerts(generateSmartAlerts);
    }
  }, [generateSmartAlerts]);

  const handleMarkAsRead = (alertId: string) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    );
    onUpdateAlerts(updatedAlerts);
  };

  const handleDismiss = (alertId: string) => {
    const updatedAlerts = alerts.filter(alert => alert.id !== alertId);
    onUpdateAlerts(updatedAlerts);
  };

  const getAlertIcon = (type: NutritionalAlert['type']) => {
    switch (type) {
      case 'warning':
        return { icon: 'solar:danger-triangle-bold-duotone', color: 'text-yellow-500', bg: 'bg-yellow-50', border: 'border-yellow-200' };
      case 'info':
        return { icon: 'solar:info-circle-bold-duotone', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'success':
        return { icon: 'solar:check-circle-bold-duotone', color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200' };
      default:
        return { icon: 'solar:bell-bold-duotone', color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const recentAlerts = [...alerts]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  return (
    <div className="bg-card rounded-3xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-orange-100 flex items-center justify-center relative">
            <Icon icon="solar:notification-lines-remove-bold-duotone" className="size-6 text-orange-500" />
            {unreadAlerts.length > 0 && (
              <span className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                {unreadAlerts.length}
              </span>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold font-heading">Alertes nutritionnelles</h3>
            <p className="text-xs text-muted-foreground">
              {unreadAlerts.length > 0 
                ? `${unreadAlerts.length} nouvelle${unreadAlerts.length > 1 ? 's' : ''} alerte${unreadAlerts.length > 1 ? 's' : ''}`
                : 'Aucune nouvelle alerte'}
            </p>
          </div>
        </div>
      </div>

      {recentAlerts.length > 0 ? (
        <div className="space-y-2">
          {recentAlerts.map(alert => {
            const style = getAlertIcon(alert.type);
            const isExpanded = expandedAlertId === alert.id;

            return (
              <div
                key={alert.id}
                className={`p-3 rounded-xl border transition-all ${style.bg} ${style.border} ${!alert.isRead ? 'ring-2 ring-primary/20' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon icon={style.icon} className={`size-6 ${style.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold mb-1">{alert.title}</h4>
                        <p className={`text-xs text-muted-foreground ${isExpanded ? '' : 'line-clamp-2'}`}>
                          {alert.message}
                        </p>
                      </div>
                      <button
                        onClick={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground"
                      >
                        <Icon 
                          icon={isExpanded ? 'solar:alt-arrow-up-linear' : 'solar:alt-arrow-down-linear'} 
                          className="size-4" 
                        />
                      </button>
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-3 flex items-center gap-2">
                        {!alert.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(alert.id)}
                            className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                          >
                            Marquer comme lu
                          </button>
                        )}
                        <button
                          onClick={() => handleDismiss(alert.id)}
                          className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80 transition-colors"
                        >
                          Supprimer
                        </button>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {new Date(alert.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}

                    {!isExpanded && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {new Date(alert.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </span>
                        {!alert.isRead && (
                          <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                            Nouveau
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center">
          <Icon icon="solar:bell-off-bold-duotone" className="size-16 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Aucune alerte pour le moment</p>
          <p className="text-xs text-muted-foreground mt-1">Les alertes intelligentes apparaîtront ici</p>
        </div>
      )}

      {alerts.length > 5 && (
        <div className="mt-4 pt-4 border-t border-border text-center">
          <button className="text-sm text-primary font-semibold hover:underline">
            Voir toutes les alertes ({alerts.length})
          </button>
        </div>
      )}
    </div>
  );
};

export default NutritionalAlerts;

