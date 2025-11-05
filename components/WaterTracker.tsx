import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import type { WaterIntake } from '../types';

interface WaterTrackerProps {
  waterData: WaterIntake[];
  onUpdateWater: (data: WaterIntake[]) => void;
}

const WaterTracker: React.FC<WaterTrackerProps> = ({ waterData, onUpdateWater }) => {
  const today = new Date().toISOString().split('T')[0];
  const todayData = waterData.find(w => w.date === today);
  
  const [amount, setAmount] = useState(todayData?.amount || 0);
  const [goal, setGoal] = useState(todayData?.goal || 2000); // Default 2L
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal);

  useEffect(() => {
    if (todayData) {
      setAmount(todayData.amount);
      setGoal(todayData.goal);
    }
  }, [todayData]);

  const handleAmountChange = (newAmount: number) => {
    setAmount(newAmount);
    saveWaterData(newAmount, goal);
  };

  const handleQuickAdd = (ml: number) => {
    const newAmount = Math.min(amount + ml, goal * 1.5); // Max 150% of goal
    handleAmountChange(newAmount);
  };

  const handleGoalSave = () => {
    setGoal(tempGoal);
    setIsEditingGoal(false);
    saveWaterData(amount, tempGoal);
  };

  const saveWaterData = (newAmount: number, newGoal: number) => {
    const updatedData = waterData.filter(w => w.date !== today);
    updatedData.push({ date: today, amount: newAmount, goal: newGoal });
    onUpdateWater(updatedData);
  };

  const percentage = Math.min(100, (amount / goal) * 100);
  const glassCount = Math.floor(amount / 250); // 1 verre = 250ml
  const goalInLiters = (goal / 1000).toFixed(1);
  const amountInLiters = (amount / 1000).toFixed(2);

  return (
    <div className="bg-card rounded-3xl shadow-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-xl bg-blue-100 flex items-center justify-center">
            <Icon icon="solar:waterdrop-bold-duotone" className="size-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-base font-semibold font-heading">Hydratation</h3>
            <p className="text-xs text-muted-foreground">{glassCount} verres aujourd'hui</p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsEditingGoal(true);
            setTempGoal(goal);
          }}
          className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline"
        >
          <Icon icon="solar:settings-bold-duotone" className="size-4" />
          Objectif
        </button>
      </div>

      {/* Modal d'édition de l'objectif */}
      {isEditingGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsEditingGoal(false)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold font-heading mb-4">Modifier l'objectif</h3>
            <div className="mb-4">
              <label className="text-sm font-medium flex justify-between mb-2">
                <span>Objectif quotidien</span>
                <span className="font-bold text-primary">{(tempGoal / 1000).toFixed(1)} L</span>
              </label>
              <input
                type="range"
                min="1000"
                max="5000"
                step="250"
                value={tempGoal}
                onChange={(e) => setTempGoal(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1L</span>
                <span>3L</span>
                <span>5L</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsEditingGoal(false)}
                className="flex-1 px-4 py-2 rounded-xl bg-muted text-foreground font-semibold"
              >
                Annuler
              </button>
              <button
                onClick={handleGoalSave}
                className="flex-1 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Indicateur visuel avec bouteilles */}
      <div className="relative mb-6">
        <div className="flex items-end justify-center gap-1 h-32 mb-2">
          {[...Array(8)].map((_, i) => {
            const fillPercentage = Math.max(0, Math.min(100, ((amount - (i * goal / 8)) / (goal / 8)) * 100));
            return (
              <div key={i} className="flex-1 relative">
                <div className="h-full bg-slate-100 rounded-t-lg relative overflow-hidden">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-400 to-blue-300 transition-all duration-500 rounded-t-lg"
                    style={{ height: `${fillPercentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
            {amountInLiters}L
          </div>
          <div className="text-sm text-muted-foreground">sur {goalInLiters}L</div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="mb-4">
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>0%</span>
          <span className="font-bold text-primary">{percentage.toFixed(0)}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Slider tactile */}
      <div className="mb-4">
        <label className="text-sm font-medium flex justify-between mb-2">
          <span>Ajuster la quantité</span>
          <span className="font-bold text-primary">{amount} ml</span>
        </label>
        <input
          type="range"
          min="0"
          max={goal * 1.5}
          step="50"
          value={amount}
          onChange={(e) => handleAmountChange(parseInt(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Boutons d'ajout rapide */}
      <div className="flex gap-2">
        <button
          onClick={() => handleQuickAdd(250)}
          className="flex-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 font-medium text-sm flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors active:scale-95"
        >
          <Icon icon="solar:cup-bold-duotone" className="size-5" />
          +250ml
        </button>
        <button
          onClick={() => handleQuickAdd(500)}
          className="flex-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 font-medium text-sm flex items-center justify-center gap-1 hover:bg-blue-100 transition-colors active:scale-95"
        >
          <Icon icon="solar:bottle-bold-duotone" className="size-5" />
          +500ml
        </button>
        <button
          onClick={() => handleAmountChange(0)}
          className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 font-medium text-sm flex items-center justify-center hover:bg-slate-200 transition-colors active:scale-95"
        >
          <Icon icon="solar:refresh-bold-duotone" className="size-5" />
        </button>
      </div>

      {/* Message d'encouragement */}
      {percentage >= 100 && (
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-green-50 to-blue-50 border border-green-200">
          <div className="flex items-center gap-2">
            <Icon icon="solar:cup-star-bold-duotone" className="size-6 text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-700">Objectif atteint ! 🎉</p>
              <p className="text-xs text-green-600">Excellente hydratation aujourd'hui</p>
            </div>
          </div>
        </div>
      )}
      {percentage < 50 && percentage > 0 && (
        <div className="mt-4 p-3 rounded-xl bg-yellow-50 border border-yellow-200">
          <div className="flex items-center gap-2">
            <Icon icon="solar:danger-triangle-bold-duotone" className="size-6 text-yellow-500" />
            <div>
              <p className="text-sm font-semibold text-yellow-700">Pensez à boire !</p>
              <p className="text-xs text-yellow-600">Il vous reste {((goal - amount) / 1000).toFixed(1)}L à boire</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterTracker;

