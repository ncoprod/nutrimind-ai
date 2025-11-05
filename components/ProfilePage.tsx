import React, { useState, useMemo, useEffect } from "react";
import type { UserProfile } from "../types";
import { Icon } from '@iconify/react';
import { Avatar } from './ui/Avatar';
import { useLanguage } from "../App";

const ProfilePage: React.FC<{
  user: UserProfile;
  onSave: (updatedProfile: UserProfile) => void;
  onRestartOnboarding?: () => void;
}> = ({ user, onSave, onRestartOnboarding }) => {
  const { language, t } = useLanguage();
  const [formData, setFormData] = useState(user);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [regimes, setRegimes] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");
  const [infoModal, setInfoModal] = useState<{ title: string; content: string } | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const units = (typeof window !== 'undefined' && (localStorage.getItem('nutrimind_units') as 'metric' | 'imperial')) || 'metric';

  const kgToLbs = (kg: number) => kg * 2.20462;
  const lbsToKg = (lbs: number) => lbs / 2.20462;
  const cmToIn = (cm: number) => cm / 2.54;
  const inToCm = (inch: number) => inch * 2.54;

  const toDisplay = (field: string, value: number) => {
    if (units === 'metric') return { value, unit: field === 'height' ? 'cm' : 'kg', step: field === 'height' ? 1 : 0.1 } as const;
    if (field === 'height') return { value: parseFloat(cmToIn(value).toFixed(0)), unit: 'in', step: 1 } as const;
    return { value: parseFloat(kgToLbs(value).toFixed(1)), unit: 'lbs', step: 0.1 } as const;
  };

  const fromDisplay = (field: string, value: number) => {
    if (units === 'metric') return value;
    if (field === 'height') return inToCm(value);
    return lbsToKg(value);
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

  const cookingLevels: {id: UserProfile['cookingLevel'], name: string}[] = useMemo(() => [
      {id: 'beginner', name: t('cookingLevel.beginner')},
      {id: 'intermediate', name: t('cookingLevel.intermediate')},
      {id: 'expert', name: t('cookingLevel.expert')},
  ], [t]);

  useEffect(() => {
    setFormData(user);
    const savedPrefs = user.preferences.split(',').map(p => p.trim().toLowerCase()).filter(Boolean);
    const savedRegimes = allRegimes.filter(r => savedPrefs.includes(r.id)).map(r => r.id);
    const savedAllergies = savedPrefs.filter(p => !allRegimes.some(r => r.id === p));
    setRegimes(savedRegimes);
    setAllergies(savedAllergies);
  }, [user, allRegimes]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const isNumber = type === 'number' || type === 'range';
    setFormData((prev) => ({
      ...prev,
      [name]: isNumber ? parseFloat(value) || 0 : value,
    }));
  };

  const handleStartEdit = (field: string, currentValue: number) => {
    setEditingField(field);
    setEditValue(currentValue.toString());
  };

  const handleSaveEdit = (field: string) => {
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue > 0) {
      setFormData((prev) => ({
        ...prev,
        [field]: fromDisplay(field, numValue),
      }));
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const EditableValue: React.FC<{ field: string; value: number; unit?: string; min?: number; max?: number; step?: number }> = ({ field, value, unit, min, max, step = 0.1 }) => {
    const display = toDisplay(field, value);
    if (editingField === field) {
      return (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSaveEdit(field)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSaveEdit(field);
            if (e.key === 'Escape') handleCancelEdit();
          }}
          min={min}
          max={max}
          step={display.step}
          autoFocus
          className="font-bold text-primary w-20 px-2 py-1 rounded border-2 border-primary focus:outline-none focus:ring-2 focus:ring-primary"
        />
      );
    }
    return (
      <span 
        className="font-bold text-primary cursor-pointer hover:text-primary/80 transition-all inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-primary/10 group"
        onClick={() => handleStartEdit(field, display.value)}
        title={t('profile.editHint')}
      >
        {display.value.toFixed(display.step === 1 ? 0 : 1)} {display.unit}
        <Icon icon="solar:pen-bold-duotone" className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
      </span>
    );
  };
  
  const handleToggleRegime = (regimeId: string) => {
    setRegimes(prev => 
      prev.includes(regimeId) ? prev.filter(r => r !== regimeId) : [...prev, regimeId]
    );
  };
  
  const handleAddAllergy = () => {
    if (newAllergy && !allergies.includes(newAllergy.toLowerCase())) {
        setAllergies(prev => [...prev, newAllergy.toLowerCase()]);
        setNewAllergy("");
    }
  };
  
  const handleRemoveAllergy = (allergyToRemove: string) => {
    setAllergies(prev => prev.filter(a => a !== allergyToRemove));
  };

  const { bmr, tdee, targetCalories, imc } = useMemo(() => {
    const { gender, age, height, weight, activityLevel, goal } = formData;
    let bmr = 10 * weight + 6.25 * height - 5 * age;
    bmr += gender === "male" ? 5 : -161;

    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };
    const tdee = bmr * activityMultipliers[activityLevel];

    let targetCalories = tdee;
    if (goal === "lose") {
      targetCalories -= 500;
    } else if (goal === "gain") {
      targetCalories += 300;
    }

    const imcValue = weight > 0 && height > 0 ? weight / (height / 100) ** 2 : 0;

    return { bmr, tdee, targetCalories, imc: imcValue };
  }, [formData]);
  
  const macros = useMemo(() => {
    const proteinG = Math.round((targetCalories * 0.3) / 4);
    const carbsG = Math.round((targetCalories * 0.4) / 4);
    const fatG = Math.round((targetCalories * 0.3) / 9);
    return { proteinG, carbsG, fatG };
  }, [targetCalories]);

  const handleSave = () => {
    setSaveState('saving');
    const updatedPreferences = [...regimes, ...allergies].join(',');
    const updatedProfile = {
      ...formData,
      bmr,
      tdee,
      targetCalories,
      preferences: updatedPreferences
    };
    
    setTimeout(() => {
        onSave(updatedProfile);
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
    }, 1000);
  };
  
  const imcStatus = useMemo(() => {
    if (imc < 18.5) return { label: t('profile.imc.underweight'), position: `${(imc / 18.5) * 25}%` };
    if (imc >= 18.5 && imc < 25) return { label: t('profile.imc.normal'), position: `${25 + ((imc - 18.5) / (25 - 18.5)) * 25}%` };
    if (imc >= 25 && imc < 30) return { label: t('profile.imc.overweight'), position: `${50 + ((imc - 25) / (30 - 25)) * 25}%` };
    return { label: t('profile.imc.obesity'), position: `${75 + Math.min(25, ((imc - 30) / 5) * 25)}%` };
  }, [imc, t]);


  const DonutChart = () => {
    return (
        <div className="size-40 relative">
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--protein)" strokeWidth="16" strokeDasharray={`75.4 251.2`} />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--carbs)" strokeWidth="16" strokeDasharray={`100.5 251.2`} strokeDashoffset="-75.4" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--fats)" strokeWidth="16" strokeDasharray={`75.4 251.2`} strokeDashoffset="-175.9" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                <div className="text-2xl font-bold">{targetCalories.toFixed(0)}</div>
                <div className="text-xs text-muted-foreground">kcal</div>
            </div>
        </div>
    );
  };

  const { progressPercent, kgLost } = useMemo(() => {
    const { startWeight, weight, goalWeight } = formData;
    const totalToChange = startWeight - goalWeight;
    const currentChange = startWeight - weight;
    const percent = totalToChange > 0 ? Math.min(100, Math.max(0, (currentChange / totalToChange) * 100)) : 0;
    return { progressPercent: percent, kgLost: currentChange };
  }, [formData]);
  
  const infoContent = useMemo(() => ({
    bmr: { title: t('onboarding.summary.bmrTitle'), content: t('onboarding.summary.bmrContent') }, 
    tdee: { title: t('onboarding.summary.tdeeTitle'), content: t('onboarding.summary.tdeeContent') }, 
    targetCalories: { title: t('onboarding.summary.targetCaloriesTitle'), content: t('onboarding.summary.targetCaloriesContent') }, 
    activityLevel: { title: t('onboarding.summary.activityLevelTitle'), content: t('onboarding.summary.activityLevelContent') }
  }), [t]);


  return (
    <div>
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
        <div className="bg-gradient-to-br from-primary to-[#FF7A62] p-6 lg:rounded-b-3xl">
            <h1 className="text-2xl font-bold font-heading text-white">{t('profile.title')}</h1>
        </div>
        <main className="flex-1 p-6 space-y-6 lg:-mt-12">
          <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold font-heading">{t('profile.physicalData.title')}</h2>
              <button onClick={handleSave} disabled={saveState === 'saving'} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium transition-all duration-300 w-48 justify-center disabled:bg-primary/50">
                {saveState === 'idle' && <Icon icon="solar:diskette-bold-duotone" className="size-5" />}
                {saveState === 'saving' && <Icon icon="solar:refresh-linear" className="animate-spin size-5" />}
                {saveState === 'saved' && <Icon icon="solar:check-read-bold-duotone" className="size-5" />}
                <span className="truncate">
                    {saveState === 'idle' ? t('profile.save.idle') : saveState === 'saving' ? t('profile.save.saving') : t('profile.save.saved')}
                </span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 rounded-lg bg-primary/5 flex items-center gap-4">
                        <label className="text-sm font-medium">{t('profile.gender')}</label>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-input border-0 text-foreground">
                            <option value="male">{t('gender.male')}</option>
                            <option value="female">{t('gender.female')}</option>
                        </select>
                    </div>
                     <div className="p-4 rounded-lg bg-primary/5 flex items-center gap-4">
                        <label className="text-sm font-medium">{t('profile.age')}</label>
                        <input type="number" name="age" value={formData.age} onChange={handleChange} className="w-full px-3 py-2 rounded-lg bg-input border-0 text-foreground" />
                        <span className="text-muted-foreground">{t('profile.ageUnit')}</span>
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5 col-span-1 md:col-span-2">
                        <label className="text-sm font-medium flex justify-between"><span>{t('profile.height')}</span> <EditableValue field="height" value={formData.height} min={140} max={220} step={1} /></label>
                        <input type="range" name="height" min="140" max="220" value={formData.height} onChange={handleChange} className="w-full mt-2" />
                    </div>
                     <div className="p-4 rounded-lg bg-primary/5 col-span-1 md:col-span-2">
                        <label className="text-sm font-medium flex justify-between"><span>{t('profile.currentWeight')}</span> <EditableValue field="weight" value={formData.weight} min={40} max={200} step={0.1} /></label>
                        <input type="range" name="weight" step="0.1" min="40" max="200" value={formData.weight} onChange={handleChange} className="w-full mt-2" />
                    </div>
                     <div className="p-4 rounded-lg bg-primary/5 col-span-1 md:col-span-2">
                         <h3 className="text-sm font-semibold mb-2">{t('profile.imc.title')}: <span className="font-bold text-primary">{imc.toFixed(1)}</span> - {imcStatus.label}</h3>
                        <div className="relative w-full h-2 bg-slate-200 rounded-full">
                            <div className="absolute h-full bg-gradient-to-r from-blue-400 via-green-400 to-red-400 rounded-full" style={{ width: '100%' }}></div>
                             <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white border-2 border-primary shadow" style={{ left: imcStatus.position }}></div>
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>18.5</span>
                            <span>25</span>
                            <span>30</span>
                        </div>
                    </div>
                </div>
                 <div className="lg:col-span-4 flex flex-col items-center justify-center gap-3 p-4 rounded-lg bg-primary/5">
                    <div className="size-32 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center relative p-1">
                      <Avatar name={user.name} className="size-full text-4xl" />
                      <button className="absolute bottom-0 right-0 size-10 rounded-full bg-card border-2 border-background shadow-lg flex items-center justify-center">
                        <Icon icon="solar:camera-bold-duotone" className="size-5 text-primary" />
                      </button>
                    </div>
                    <span className="text-sm text-muted-foreground">{t('profile.updatePhoto')}</span>
                </div>
            </div>
          </div>

           <div className="rounded-3xl bg-card border border-border shadow-lg p-6">
              <h2 className="text-2xl font-bold font-heading mb-6">{t('profile.metabolic.title')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div onClick={() => setInfoModal(infoContent.bmr)} className="rounded-2xl bg-primary/5 p-4 text-center cursor-pointer hover:bg-primary/10 hover:border-primary/50 border-2 border-transparent transition-all">
                      <div className="inline-flex items-center justify-center size-12 rounded-xl bg-red-100 text-red-500 mb-2"><Icon icon="solar:fire-bold-duotone" className="size-6" /></div>
                      <div className="text-3xl font-bold text-foreground">{bmr.toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">{t('profile.metabolic.bmr')}</div>
                  </div>
                  <div onClick={() => setInfoModal(infoContent.tdee)} className="rounded-2xl bg-primary/5 p-4 text-center cursor-pointer hover:bg-primary/10 hover:border-primary/50 border-2 border-transparent transition-all">
                       <div className="inline-flex items-center justify-center size-12 rounded-xl bg-yellow-100 text-yellow-500 mb-2"><Icon icon="solar:bolt-bold-duotone" className="size-6" /></div>
                      <div className="text-3xl font-bold text-foreground">{tdee.toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">{t('profile.metabolic.tdee')}</div>
                  </div>
                  <div onClick={() => setInfoModal(infoContent.targetCalories)} className="rounded-2xl bg-primary/5 p-4 text-center cursor-pointer hover:bg-primary/10 hover:border-primary/50 border-2 border-transparent transition-all">
                      <div className="inline-flex items-center justify-center size-12 rounded-xl bg-green-100 text-green-500 mb-2"><Icon icon="solar:target-bold-duotone" className="size-6" /></div>
                      <div className="text-3xl font-bold text-foreground">{targetCalories.toFixed(0)}</div>
                      <div className="text-sm text-muted-foreground">{t('profile.metabolic.target')}</div>
                  </div>
                   <div onClick={() => setInfoModal(infoContent.activityLevel)} className="rounded-2xl bg-primary/5 p-4 text-center cursor-pointer hover:bg-primary/10 hover:border-primary/50 border-2 border-transparent transition-all">
                       <div className="inline-flex items-center justify-center size-12 rounded-xl bg-blue-100 text-blue-500 mb-2"><Icon icon="solar:running-bold-duotone" className="size-6" /></div>
                      <div className="text-xl font-bold text-foreground capitalize mt-3">{t(`activityLevel.${formData.activityLevel}`)}</div>
                      <div className="text-sm text-muted-foreground">{t('profile.metabolic.activity')}</div>
                  </div>
              </div>
              <div className="rounded-2xl bg-primary/5 p-6 border border-primary/10">
                  <h3 className="text-lg font-semibold mb-4">{t('profile.macros.title')}</h3>
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                      <DonutChart />
                      <div className="flex-1 space-y-3 w-full max-w-sm">
                          <div className="flex items-center justify-between p-3 rounded-xl bg-protein/10">
                              <div className="flex items-center gap-3"><div className="size-4 rounded-full bg-protein" /><span className="font-medium">{t('profile.macros.protein')}</span></div>
                              <div className="text-right"><div className="font-bold">30%</div><div className="text-xs text-muted-foreground">{macros.proteinG}g</div></div>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-carbs/10">
                              <div className="flex items-center gap-3"><div className="size-4 rounded-full bg-carbs" /><span className="font-medium">{t('profile.macros.carbs')}</span></div>
                              <div className="text-right"><div className="font-bold">40%</div><div className="text-xs text-muted-foreground">{macros.carbsG}g</div></div>
                          </div>
                          <div className="flex items-center justify-between p-3 rounded-xl bg-fats/10">
                              <div className="flex items-center gap-3"><div className="size-4 rounded-full bg-fats" /><span className="font-medium">{t('profile.macros.fats')}</span></div>
                              <div className="text-right"><div className="font-bold">30%</div><div className="text-xs text-muted-foreground">{macros.fatG}g</div></div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
          
           <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
            <h2 className="text-2xl font-bold font-heading mb-6">{t('profile.goals.title')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="flex flex-col items-center"><div className="size-12 rounded-full bg-muted/20 flex items-center justify-center"><Icon icon="solar:flag-bold-duotone" className="size-6 text-muted-foreground" /></div><div className="w-0.5 h-16 bg-border" /></div>
                    <div className="flex-1 pb-4">
                        <div className="font-semibold">{t('profile.goals.startWeight')}</div>
                        <div className="text-2xl font-bold text-foreground">{formData.startWeight} kg</div>
                        <div className="text-sm text-muted-foreground">{new Date(formData.startDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-center"><div className="size-12 rounded-full bg-primary flex items-center justify-center"><Icon icon="solar:chart-2-bold-duotone" className="size-6 text-primary-foreground" /></div><div className="w-0.5 h-16 bg-border" /></div>
                    <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2"><div className="font-semibold">{t('profile.goals.currentWeight')}</div><span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">{t('profile.goals.status')}</span></div>
                        <div className="text-2xl font-bold text-primary">{formData.weight.toFixed(1)} kg</div>
                        <div className="text-sm text-muted-foreground">{t('profile.goals.today')}</div>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="flex flex-col items-center"><div className="size-12 rounded-full bg-gradient-to-br from-accent to-green-400 flex items-center justify-center"><Icon icon="solar:medal-star-bold-duotone" className="size-6 text-white" /></div></div>
                    <div className="flex-1">
                        <div className="font-semibold">{t('profile.goals.goalWeight')}</div>
                        <div className="text-2xl font-bold bg-gradient-to-r from-accent to-green-400 bg-clip-text text-transparent">
                            {editingField === 'goalWeight' ? (
                                <input
                                    type="number"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => handleSaveEdit('goalWeight')}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSaveEdit('goalWeight');
                                        if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                    min={40}
                                    max={200}
                                    step={0.1}
                                    autoFocus
                                    className="font-bold text-accent w-24 px-2 py-1 rounded border-2 border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            ) : (
                                <span 
                                    className="cursor-pointer hover:opacity-80 transition-all bg-gradient-to-r from-accent to-green-400 bg-clip-text text-transparent inline-flex items-center gap-2 px-2 py-1 rounded hover:bg-accent/10 group"
                                    onClick={() => handleStartEdit('goalWeight', formData.goalWeight)}
                                    title={t('profile.editHint')}
                                >
                                    {formData.goalWeight} kg
                                    <Icon icon="solar:pen-bold-duotone" className="size-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </span>
                            )}
                        </div>
                    </div>
                </div>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 p-6 border border-border">
                <h3 className="text-lg font-semibold mb-4">{t('profile.goals.progressTitle')}</h3>
                <div className="text-center mb-6">
                    <div className="text-6xl font-bold bg-gradient-to-r from-primary via-accent to-green-400 bg-clip-text text-transparent mb-2">
                        -{kgLost.toFixed(1)} kg
                    </div>
                    <p className="text-muted-foreground">{t('profile.goals.progressText').replace('{percent}', progressPercent.toFixed(0))}</p>
                </div>
                <div className="relative h-6 rounded-full bg-slate-100 overflow-hidden mb-6">
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-green-400 rounded-full" style={{ width: `${progressPercent}%` }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-semibold text-white mix-blend-plus-lighter">{progressPercent.toFixed(0)}%</span>
                    </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
            <h2 className="text-2xl font-bold font-heading mb-6">{t('profile.foodPreferences.title')}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('profile.foodPreferences.diets')}</h3>
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
                <h3 className="text-lg font-semibold mb-3">{t('profile.foodPreferences.allergies')}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  {allergies.map(allergy => (
                    <div key={allergy} className="px-4 py-2 rounded-xl bg-destructive/10 text-destructive font-medium flex items-center gap-2 capitalize">
                      {allergy}
                      <button onClick={() => handleRemoveAllergy(allergy)} className="size-5 rounded-full hover:bg-destructive/20 flex items-center justify-center">
                        <Icon icon="solar:close-circle-bold-duotone" className="size-4" />
                      </button>
                    </div>
                  ))}
                   <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={newAllergy}
                            onChange={(e) => setNewAllergy(e.target.value)}
                            placeholder={t('profile.foodPreferences.addAllergyPlaceholder')}
                            className="px-4 py-2 rounded-xl border-2 border-dashed border-border bg-transparent text-foreground focus:ring-primary focus:border-primary"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddAllergy()}
                        />
                        <button onClick={handleAddAllergy} className="px-4 py-2 rounded-xl border-2 border-dashed border-border text-muted-foreground font-medium flex items-center gap-2">
                          <Icon icon="solar:add-circle-bold-duotone" className="size-5" />
                          {t('profile.foodPreferences.addAllergyButton')}
                        </button>
                   </div>
                </div>
              </div>
              <div>
                  <h3 className="text-lg font-semibold mb-3">{t('profile.foodPreferences.notes')}</h3>
                  <textarea
                      name="notes"
                      value={formData.notes || ''}
                      onChange={handleChange}
                      rows={3} 
                      className="w-full p-3 rounded-lg bg-slate-50 border border-border focus:ring-primary focus:border-primary"
                      placeholder={t('profile.foodPreferences.notesPlaceholder')}
                  />
              </div>
               <div>
                  <h3 className="text-lg font-semibold mb-3">{t('profile.foodPreferences.remarks')}</h3>
                  <textarea
                      name="remarks"
                      value={formData.remarks || ''}
                      onChange={handleChange}
                      rows={3} 
                      className="w-full p-3 rounded-lg bg-slate-50 border border-border focus:ring-primary focus:border-primary"
                      placeholder={t('profile.foodPreferences.remarksPlaceholder')}
                  />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('onboarding.prep_time.title')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-primary/5">
                        <label className="text-sm font-medium flex justify-between"><span>{t('onboarding.prep_time.weekLunchLabel')}</span> <span className="font-bold text-primary">{formData.maxPrepTimeWeekLunch} {t('onboarding.prep_time.minutes')}</span></label>
                        <input type="range" name="maxPrepTimeWeekLunch" min="10" max="90" step="5" value={formData.maxPrepTimeWeekLunch} onChange={handleChange} className="w-full mt-2" />
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5">
                        <label className="text-sm font-medium flex justify-between"><span>{t('onboarding.prep_time.weekDinnerLabel')}</span> <span className="font-bold text-primary">{formData.maxPrepTimeWeekDinner} {t('onboarding.prep_time.minutes')}</span></label>
                        <input type="range" name="maxPrepTimeWeekDinner" min="10" max="90" step="5" value={formData.maxPrepTimeWeekDinner} onChange={handleChange} className="w-full mt-2" />
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5">
                        <label className="text-sm font-medium flex justify-between"><span>{t('onboarding.prep_time.weekendLunchLabel')}</span> <span className="font-bold text-primary">{formData.maxPrepTimeWeekendLunch} {t('onboarding.prep_time.minutes')}</span></label>
                        <input type="range" name="maxPrepTimeWeekendLunch" min="15" max="120" step="5" value={formData.maxPrepTimeWeekendLunch} onChange={handleChange} className="w-full mt-2" />
                    </div>
                    <div className="p-4 rounded-lg bg-primary/5">
                        <label className="text-sm font-medium flex justify-between"><span>{t('onboarding.prep_time.weekendDinnerLabel')}</span> <span className="font-bold text-primary">{formData.maxPrepTimeWeekendDinner} {t('onboarding.prep_time.minutes')}</span></label>
                        <input type="range" name="maxPrepTimeWeekendDinner" min="15" max="120" step="5" value={formData.maxPrepTimeWeekendDinner} onChange={handleChange} className="w-full mt-2" />
                    </div>
                </div>
              </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-3">{t('profile.foodPreferences.mealsPerDay')}</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">2</span>
                        <input type="range" name="mealsPerDay" min="2" max="6" value={formData.mealsPerDay} onChange={handleChange} className="w-full" />
                        <span className="text-xl font-bold text-primary">{formData.mealsPerDay}</span>
                        <span className="text-sm text-muted-foreground">6</span>
                    </div>
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-3">{t('profile.foodPreferences.budget')}</h3>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">5€</span>
                        <input type="range" name="dailyBudget" min="5" max="50" value={formData.dailyBudget} onChange={handleChange} className="w-full" />
                        <span className="text-xl font-bold text-primary">{formData.dailyBudget}€</span>
                        <span className="text-sm text-muted-foreground">50€</span>
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold mb-3">{t('profile.foodPreferences.cookingLevel')}</h3>
                    <div className="flex gap-2">
                        {cookingLevels.map(level => (
                            <button key={level.id} onClick={() => setFormData(prev => ({...prev, cookingLevel: level.id}))} className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors ${formData.cookingLevel === level.id ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-800'}`}>
                                <Icon icon="solar:star-bold-duotone" className={`size-5 transition-colors ${formData.cookingLevel === level.id ? 'text-primary-foreground' : 'text-muted-foreground'}`}/>
                                {level.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
          </div>

          {onRestartOnboarding && (
            <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
              <h2 className="text-2xl font-bold font-heading mb-4">{t('profile.restart.title')}</h2>
              <p className="text-sm text-muted-foreground mb-6">{t('profile.restart.description')}</p>
              <button 
                onClick={() => {
                  if (window.confirm(t('profile.restart.confirm'))) {
                    onRestartOnboarding();
                  }
                }}
                className="px-6 py-3 rounded-xl bg-destructive text-destructive-foreground font-semibold flex items-center gap-2 hover:bg-destructive/90 transition-colors"
              >
                <Icon icon="solar:refresh-bold-duotone" className="size-5" />
                {t('profile.restart.button')}
              </button>
            </div>
          )}
        </main>
    </div>
  );
};


export default ProfilePage;