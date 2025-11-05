import React, { useState, useEffect } from 'react';
import type { Meal } from '../types';
import { Icon } from '@iconify/react';
import { useLanguage } from '../App';
import { getMealImage } from '../services/geminiService';

export const RecipeModal: React.FC<{ meal: Meal; type: string; onClose: () => void }> = ({ meal, type, onClose }) => {
    const { language, t } = useLanguage();
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        if (meal?.name) {
            getMealImage(meal.name, language).then(url => {
                if (isMounted && url) {
                    setImageUrl(url);
                }
            });
        }
        return () => { isMounted = false; };
    }, [meal?.name, language]);

    if (!meal) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <div className="h-56 w-full">
                        {imageUrl ? (
                            <img src={imageUrl} alt={meal.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-slate-200 animate-pulse flex items-center justify-center">
                                <Icon icon="solar:cup-hot-bold-duotone" className="size-12 text-slate-400" />
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 backdrop-blur-sm transition-colors"
                        aria-label="Close recipe"
                    >
                        <Icon icon="solar:close-circle-bold-duotone" className="h-7 w-7"/>
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto flex-grow space-y-6">
                     <div>
                        <p className="text-sm font-semibold text-accent">{type}</p>
                        <h3 className="text-2xl font-bold font-heading text-foreground">{meal.name}</h3>
                        {meal.estimatedCost && (
                            <div className="mt-2" title={t('recipe.estimatedCostTooltip')}>
                                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-sm font-semibold">
                                    <Icon icon="solar:wallet-money-bold-duotone" className="size-5 text-green-600" />
                                    <span>{t('recipe.estimatedCost')}: <strong>{meal.estimatedCost}</strong></span>
                                </span>
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">{t('nutrition.modal.recipe.description')}</h4>
                        <p className="text-sm text-muted-foreground">{meal.description}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">{t('nutrition.modal.recipe.ingredients')}</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                            {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground mb-2">{t('nutrition.modal.recipe.instructions')}</h4>
                        <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                            {meal.instructions.map((step, i) => <li key={i}>{step}</li>)}
                        </ol>
                    </div>
                </div>
            </div>
        </div>
    );
};