import React, { useMemo } from 'react';
import { Icon } from '@iconify/react';
import type { UserProfile } from '../types';

interface WeightTrackerProps {
  user: UserProfile;
}

const WeightTracker: React.FC<WeightTrackerProps> = ({ user }) => {
  const units = (typeof window !== 'undefined' && (localStorage.getItem('nutrimind_units') as 'metric' | 'imperial')) || 'metric';
  const kgToLbs = (kg: number) => kg * 2.20462;

  const weightStats = useMemo(() => {
    // Utiliser directement les données du profil user
    const currentWeight = user.weight;
    const startWeight = user.startWeight;
    const goalWeight = user.goalWeight;
    
    // Adapter les calculs selon l'objectif
    const isGaining = user.goal === 'gain';
    const weightChange = isGaining 
      ? currentWeight - startWeight  // Prise de poids (positif = bon)
      : startWeight - currentWeight; // Perte de poids (positif = bon)
    
    const remainingWeight = isGaining
      ? goalWeight - currentWeight   // Reste à gagner (positif)
      : currentWeight - goalWeight;  // Reste à perdre (positif)
    
    const totalChange = Math.abs(goalWeight - startWeight);
    const progressPercent = totalChange > 0 
      ? Math.min(100, Math.max(0, (Math.abs(weightChange) / totalChange) * 100)) 
      : 0;

    // Déterminer la tendance basée sur la progression
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (user.goal === 'lose' && weightChange > 0) trend = 'decreasing';
    else if (user.goal === 'gain' && weightChange > 0) trend = 'increasing';

    return {
      currentWeight,
      startWeight,
      goalWeight,
      weightChange,
      remainingWeight,
      progressPercent,
      trend,
      isGaining,
    };
  }, [user]);

  const getTrendIcon = () => {
    switch (weightStats.trend) {
      case 'decreasing':
        return { icon: 'solar:arrow-down-bold', color: 'text-green-500', bg: 'bg-green-100', label: 'En baisse' };
      case 'increasing':
        return { icon: 'solar:arrow-up-bold', color: 'text-red-500', bg: 'bg-red-100', label: 'En hausse' };
      default:
        return { icon: 'solar:minus-square-bold', color: 'text-blue-500', bg: 'bg-blue-100', label: 'Stable' };
    }
  };

  const trendStyle = getTrendIcon();

  return (
    <div className="bg-card rounded-3xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Icon icon="solar:chart-bold-duotone" className="size-6 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold font-heading">Suivi du poids</h3>
            <p className="text-xs text-muted-foreground">Évolution et objectifs</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${trendStyle.bg}`}>
          <Icon icon={trendStyle.icon} className={`size-4 ${trendStyle.color}`} />
          <span className={`text-xs font-medium ${trendStyle.color}`}>{trendStyle.label}</span>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-3 rounded-xl bg-slate-50">
          <div className="text-xs text-muted-foreground mb-1">Départ</div>
          <div className="text-lg font-bold text-foreground">{(units === 'metric' ? weightStats.startWeight : kgToLbs(weightStats.startWeight)).toFixed(units === 'metric' ? 0 : 1)}</div>
          <div className="text-xs text-muted-foreground">{units === 'metric' ? 'kg' : 'lbs'}</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-primary/10">
          <div className="text-xs text-primary mb-1">Actuel</div>
          <div className="text-2xl font-bold text-primary">{(units === 'metric' ? weightStats.currentWeight : kgToLbs(weightStats.currentWeight)).toFixed(units === 'metric' ? 1 : 1)}</div>
          <div className="text-xs text-primary">{units === 'metric' ? 'kg' : 'lbs'}</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-green-50">
          <div className="text-xs text-green-600 mb-1">Objectif</div>
          <div className="text-lg font-bold text-green-600">{(units === 'metric' ? weightStats.goalWeight : kgToLbs(weightStats.goalWeight)).toFixed(units === 'metric' ? 0 : 1)}</div>
          <div className="text-xs text-green-600">{units === 'metric' ? 'kg' : 'lbs'}</div>
        </div>
      </div>

      {/* Progression */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-medium">Progression vers l'objectif</span>
          <span className="font-bold text-primary">{weightStats.progressPercent.toFixed(0)}%</span>
        </div>
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-accent to-green-400 rounded-full transition-all duration-500"
            style={{ width: `${weightStats.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Résumé */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-xl bg-green-50 border border-green-100">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:chart-2-bold-duotone" className="size-4 text-green-600" />
            <span className="text-xs font-medium text-green-600">
              {weightStats.isGaining ? 'Gagné' : 'Perdu'}
            </span>
          </div>
          <div className="text-xl font-bold text-green-600">
            {weightStats.weightChange > 0 && weightStats.isGaining ? '+' : weightStats.weightChange > 0 && !weightStats.isGaining ? '-' : ''}{(units === 'metric' ? Math.abs(weightStats.weightChange) : Math.abs(kgToLbs(weightStats.weightChange))).toFixed(1)} {units === 'metric' ? 'kg' : 'lbs'}
          </div>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2 mb-1">
            <Icon icon="solar:target-bold-duotone" className="size-4 text-blue-600" />
            <span className="text-xs font-medium text-blue-600">Restant</span>
          </div>
          <div className="text-xl font-bold text-blue-600">
            {weightStats.remainingWeight > 0 && weightStats.isGaining ? '+' : ''}{(units === 'metric' ? Math.abs(weightStats.remainingWeight) : Math.abs(kgToLbs(weightStats.remainingWeight))).toFixed(1)} {units === 'metric' ? 'kg' : 'lbs'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeightTracker;

