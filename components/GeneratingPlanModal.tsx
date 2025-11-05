import React from 'react';
import { Icon } from '@iconify/react';
import { NutriMindLogo } from './ui/NutriMindLogo';
import { useLanguage } from '../App';

interface GeneratingPlanModalProps {
    progressMessage: string;
    error: string | null;
}

const GeneratingPlanModal: React.FC<GeneratingPlanModalProps> = ({ progressMessage, error }) => {
    const { t } = useLanguage();

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 text-center text-white shadow-2xl flex flex-col items-center">
                <NutriMindLogo className="size-16" />
                <h2 className="text-2xl font-bold font-heading mt-4">{t('generatingPlan.title')}</h2>
                <p className="mt-2 text-white/80">{t('generatingPlan.subtitle')}</p>
                <div className="relative mt-8">
                    {!error ? (
                        <>
                            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-75 animate-pulse"></div>
                            <div className="relative size-20 bg-slate-800/50 rounded-full flex items-center justify-center">
                                <Icon icon="solar:brain-bold-duotone" className="size-10 text-primary" />
                            </div>
                        </>
                    ) : (
                         <div className="relative size-20 bg-red-500/50 border-2 border-red-400 rounded-full flex items-center justify-center">
                            <Icon icon="solar:danger-bold-duotone" className="size-10 text-white" />
                        </div>
                    )}
                </div>
                
                <div className="h-16 mt-6 flex items-center justify-center w-full">
                    {error ? (
                        <div className="text-red-300 animate-fade-in text-sm">
                            <p className="font-semibold mb-1">Erreur de génération</p>
                            <p>{error}</p>
                        </div>
                    ) : (
                         <p key={progressMessage} className="text-white/90 animate-fade-in">
                            {progressMessage}
                        </p>
                    )}
                </div>
                
                <style>{`
                    .animate-fade-in {
                        animation: fadeIn 0.5s ease-in-out;
                    }
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(10px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default GeneratingPlanModal;