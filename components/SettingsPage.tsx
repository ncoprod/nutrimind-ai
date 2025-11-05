import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useLanguage } from '../App';
import type { UserProfile, WeeklyPlan, TrackingEntry, WaterIntake, BodyMeasurement, NutritionalAlert, Activity } from '../types';

interface SettingsPageProps {
  onLogout: () => void;
  userProfile: UserProfile | null;
  mealPlans: WeeklyPlan[];
  trackingData: TrackingEntry[];
  completedMeals: Record<string, string[]>;
  waterIntake: WaterIntake[];
  bodyMeasurements: BodyMeasurement[];
  nutritionalAlerts: NutritionalAlert[];
  activities: Activity[];
}

const SettingsPage: React.FC<SettingsPageProps> = ({ 
  onLogout, 
  userProfile,
  mealPlans,
  trackingData,
  completedMeals,
  waterIntake,
  bodyMeasurements,
  nutritionalAlerts,
  activities
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [units, setUnits] = useState<'metric' | 'imperial'>(
    localStorage.getItem('nutrimind_units') as 'metric' | 'imperial' || 'metric'
  );
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    localStorage.getItem('nutrimind_theme') as 'light' | 'dark' | 'system' || 'system'
  );

  const handleLanguageChange = (newLang: 'fr' | 'en') => {
    setLanguage(newLang);
  };

  const handleUnitsChange = (newUnits: 'metric' | 'imperial') => {
    setUnits(newUnits);
    localStorage.setItem('nutrimind_units', newUnits);
  };

  // Apply theme on mount and when updated
  useEffect(() => {
    applyTheme(theme);
    // System theme listener when in system mode
    let media: MediaQueryList | null = null;
    const handleSystemChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') {
        if (e.matches) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
      }
    };
    if (window && 'matchMedia' in window) {
      media = window.matchMedia('(prefers-color-scheme: dark)');
      media.addEventListener?.('change', handleSystemChange);
    }
    return () => {
      media?.removeEventListener?.('change', handleSystemChange);
    };
  }, []);

  const applyTheme = (t: 'light' | 'dark' | 'system') => {
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (t === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('nutrimind_theme', newTheme);
    applyTheme(newTheme);
  };

  const handleExportData = () => {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      userProfile,
      mealPlans,
      trackingData,
      completedMeals,
      waterIntake,
      bodyMeasurements,
      nutritionalAlerts,
      activities,
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `nutrimind-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="bg-gradient-to-br from-primary to-[#FF7A62] p-6 lg:rounded-b-3xl">
        <h1 className="text-2xl font-bold font-heading text-white">{t('settings.title')}</h1>
      </div>

      <main className="flex-1 p-6 space-y-6 lg:-mt-12 max-w-4xl mx-auto">
        {/* Préférences */}
        <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
          <h2 className="text-2xl font-bold font-heading mb-6">{t('settings.preferences')}</h2>
          
          {/* Langue */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Icon icon="solar:global-bold-duotone" className="inline size-5 mr-2" />
              {t('settings.language')}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleLanguageChange('fr')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  language === 'fr'
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🇫🇷 Français
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  language === 'en'
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Thème */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-3">
              <Icon icon="solar:palette-2-bold-duotone" className="inline size-5 mr-2" />
              {t('settings.theme')}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  theme === 'light'
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon icon="solar:sun-bold-duotone" className="size-5" />
                {t('settings.theme.light')}
              </button>
              <button
                onClick={() => handleThemeChange('dark')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon icon="solar:moon-bold-duotone" className="size-5" />
                {t('settings.theme.dark')}
              </button>
              <button
                onClick={() => handleThemeChange('system')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  theme === 'system'
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon icon="solar:laptop-minimalistic-bold-duotone" className="size-5" />
                {t('settings.theme.system')}
              </button>
            </div>
          </div>

          {/* Unités */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              <Icon icon="solar:ruler-angular-bold-duotone" className="inline size-5 mr-2" />
              {t('settings.units')}
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => handleUnitsChange('metric')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  units === 'metric'
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('settings.units.metric')}
              </button>
              <button
                onClick={() => handleUnitsChange('imperial')}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-all ${
                  units === 'imperial'
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t('settings.units.imperial')}
              </button>
            </div>
          </div>
        </div>

        {/* Données */}
        <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
          <h2 className="text-2xl font-bold font-heading mb-4">{t('settings.data')}</h2>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-primary/5">
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">{t('settings.export')}</h3>
              <p className="text-sm text-muted-foreground">{t('settings.export.description')}</p>
            </div>
            <button
              onClick={handleExportData}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Icon icon="solar:download-bold-duotone" className="size-5" />
              {t('settings.export.button')}
            </button>
          </div>
        </div>

        {/* Compte */}
        <div className="rounded-3xl bg-card/80 backdrop-blur-xl border border-border shadow-lg p-6">
          <h2 className="text-2xl font-bold font-heading mb-4">{t('settings.account')}</h2>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-semibold"
          >
            <Icon icon="solar:logout-3-bold-duotone" className="size-5" />
            {t('settings.logout')}
          </button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {t('settings.logout.confirm')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
