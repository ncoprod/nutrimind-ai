import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';
import type { UserProfile, WeeklyPlan, TrackingEntry, WaterIntake, BodyMeasurement, NutritionalAlert, Activity } from './types';
import OnboardingWizard from './components/OnboardingWizard';
import Dashboard from './components/Dashboard';
import ProfilePage from './components/ProfilePage';
import SettingsPage from './components/SettingsPage';
import NutritionPage from './components/NutritionPage';
import ActivitiesPage from './components/ActivitiesPage';
import { generateMealPlan } from './services/geminiService';
import GeneratingPlanModal from './components/GeneratingPlanModal';
import Layout from './components/Layout';
import { translations, Translation } from './locales/translations';
import { NutriMindLogo } from './components/ui/NutriMindLogo';
import { getCurrentUser, onAuthStateChange, signOut } from './services/authService';
import OnlineStatusIndicator from './components/OnlineStatusIndicator';
import AuthModal from './components/AuthModal';
import { syncAllDataToSupabase, loadAllDataFromSupabase } from './services/databaseService';
import type { User } from '@supabase/supabase-js';

// --- Language Context ---
type Language = 'fr' | 'en';
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof Translation) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const savedLang = localStorage.getItem('nutrimind_language') as Language | null;
    if (savedLang && ['fr', 'en'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
    
    // Nettoyer l'ancien cache d'images du localStorage (une seule fois)
    const cacheCleanedKey = 'nutrimind_cache_cleaned_v2';
    if (!localStorage.getItem(cacheCleanedKey)) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nutrimind_image_cache_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        localStorage.setItem(cacheCleanedKey, 'true');
        console.log(`🧹 Cleaned ${keysToRemove.length} old image cache entries from localStorage`);
      } catch (e) {
        console.warn('Could not clean old image cache:', e);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nutrimind_language', lang);
  };
  
  const t = useMemo(() => (key: keyof Translation): string => {
    return translations[language][key] || translations['fr'][key] || key;
  }, [language]);

  const value = { language, setLanguage, t };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};


// --- Language Selector Screen ---
const LanguageSelector: React.FC<{ onLanguageSelect: (needsAuth: boolean) => void }> = ({ onLanguageSelect }) => {
    const { setLanguage } = useLanguage();
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const handleSelect = async (lang: Language) => {
        setLanguage(lang);
        setIsLoadingUser(true);
        
        // Check if user is already authenticated
        const user = await getCurrentUser();
        
        // Notify parent if auth is needed
        onLanguageSelect(!user);
        setIsLoadingUser(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
            <div className="w-full max-w-sm bg-card rounded-2xl shadow-xl p-8 text-center">
                <NutriMindLogo className="size-12 mx-auto" />
                <h1 className="mt-4 text-2xl font-bold font-heading text-primary">NutriMIND</h1>
                <p className="mt-4 text-slate-600">Choisissez votre langue / Choose your language</p>
                <div className="mt-8 space-y-4">
                    <button 
                        onClick={() => handleSelect('fr')} 
                        disabled={isLoadingUser}
                        className="w-full px-6 py-3 text-lg font-semibold text-white bg-primary rounded-lg hover:bg-primary/90 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Français 🇫🇷
                    </button>
                    <button 
                        onClick={() => handleSelect('en')}
                        disabled={isLoadingUser}
                        className="w-full px-6 py-3 text-lg font-semibold text-white bg-secondary rounded-lg hover:bg-secondary/90 transition-transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        English 🇬🇧
                    </button>
                </div>
            </div>
        </div>
    );
};


const AppContent: React.FC = () => {
  const { language, t } = useLanguage();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [mealPlans, setMealPlans] = useState<WeeklyPlan[]>([]);
  const [trackingData, setTrackingData] = useState<TrackingEntry[]>([]);
  const [completedMeals, setCompletedMeals] = useState<Record<string, string[]>>({});
  const [waterIntake, setWaterIntake] = useState<WaterIntake[]>([]);
  const [bodyMeasurements, setBodyMeasurements] = useState<BodyMeasurement[]>([]);
  const [nutritionalAlerts, setNutritionalAlerts] = useState<NutritionalAlert[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [view, setView] = useState<'loading' | 'onboarding' | 'dashboard' | 'profile' | 'nutrition' | 'settings' | 'activities'>('loading');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [generationProgress, setGenerationProgress] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [showLanguageSelector, setShowLanguageSelector] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showStartAuth, setShowStartAuth] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Check language preference - Always start with language selection
  useEffect(() => {
    const savedLang = localStorage.getItem('nutrimind_language');
    if (!savedLang) {
        setShowLanguageSelector(true);
        setIsLoadingAuth(false); // No need to load auth if no language selected
    }
  }, []);

  // Initialize auth and listen for auth state changes
  useEffect(() => {
    // Don't initialize auth until language is selected
    const savedLang = localStorage.getItem('nutrimind_language');
    if (!savedLang) return;

    const initAuth = async () => {
      const user = await getCurrentUser();
      setAuthUser(user);
      setIsLoadingAuth(false);
      // Si pas connecté, afficher l'auth
      if (!user) {
        setShowStartAuth(true);
      }
    };

    initAuth();

    const { data: authListener } = onAuthStateChange(async (event, session) => {
      setAuthUser(session?.user || null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // User just signed in, load their data from Supabase
        await loadUserDataFromSupabase(session.user.id);
        setShowStartAuth(false);
      } else if (event === 'SIGNED_OUT') {
        // User signed out, clear data
        setUserProfile(null);
        setMealPlans([]);
        setTrackingData([]);
        setCompletedMeals({});
        setWaterIntake([]);
        setBodyMeasurements([]);
        setNutritionalAlerts([]);
        setActivities([]);
        setView('onboarding');
        // Proposer l'auth à nouveau
        const savedLang = localStorage.getItem('nutrimind_language');
        if (savedLang) setShowStartAuth(true);
      }
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Load data when authentication is ready
  useEffect(() => {
    if (showLanguageSelector || isLoadingAuth) return;

    const loadData = async () => {
      if (authUser) {
        // User is authenticated, load from Supabase
        await loadUserDataFromSupabase(authUser.id);
      } else {
        // No auth user, try localStorage for backward compatibility
        try {
          const savedProfile = localStorage.getItem('nutrimind_user_profile');
          if (savedProfile) {
            let profile = JSON.parse(savedProfile);
            
            // Add default values for new fields
            profile = {
              ...{
                remarks: '',
                maxPrepTimeWeekLunch: 30,
                maxPrepTimeWeekDinner: 45,
                maxPrepTimeWeekendLunch: 60,
                maxPrepTimeWeekendDinner: 60,
              },
              ...profile,
            };
            
            setUserProfile(profile);
            const savedPlans = localStorage.getItem('nutrimind_meal_plans');
            if (savedPlans) setMealPlans(JSON.parse(savedPlans));
            const savedTracking = localStorage.getItem('nutrimind_tracking_data');
            if (savedTracking) setTrackingData(JSON.parse(savedTracking));
            const savedCompleted = localStorage.getItem('nutrimind_completed_meals');
            if (savedCompleted) setCompletedMeals(JSON.parse(savedCompleted));
            const savedActivities = localStorage.getItem('nutrimind_activities');
            if (savedActivities) setActivities(JSON.parse(savedActivities));
            setView('dashboard');
          } else {
            setView('onboarding');
          }
        } catch (error) {
          console.error("Failed to load data from localStorage", error);
          setView('onboarding');
        }
      }
    };

    loadData();
  }, [showLanguageSelector, isLoadingAuth, authUser]);

  // Sync data to Supabase when it changes (if user is authenticated)
  useEffect(() => {
    const syncData = async () => {
      if (authUser && userProfile) {
        setIsSyncing(true);
        await syncAllDataToSupabase(
          authUser.id, 
          userProfile, 
          mealPlans, 
          trackingData, 
          completedMeals,
          waterIntake,
          bodyMeasurements,
          nutritionalAlerts
        );
        setLastSyncTime(new Date());
        setIsSyncing(false);
      }
    };

    // Debounce sync to avoid too many writes
    const timeoutId = setTimeout(syncData, 1000);
    return () => clearTimeout(timeoutId);
  }, [authUser, userProfile, mealPlans, trackingData, completedMeals, waterIntake, bodyMeasurements, nutritionalAlerts]);

  // Persist activities to localStorage when offline/non-auth
  useEffect(() => {
    if (!authUser) {
      try {
        localStorage.setItem('nutrimind_activities', JSON.stringify(activities));
      } catch {}
    }
  }, [activities, authUser]);

  // Force sync function
  const handleForceSync = async () => {
    if (authUser && userProfile && !isSyncing) {
      setIsSyncing(true);
      await syncAllDataToSupabase(
        authUser.id, 
        userProfile, 
        mealPlans, 
        trackingData, 
        completedMeals,
        waterIntake,
        bodyMeasurements,
        nutritionalAlerts
      );
      setLastSyncTime(new Date());
      setIsSyncing(false);
    }
  };

  // Helper function to load user data from Supabase
  const loadUserDataFromSupabase = async (userId: string) => {
    try {
      const { 
        profile, 
        mealPlans: plans, 
        trackingData: tracking, 
        completedMeals: completed,
        waterIntake: water,
        bodyMeasurements: measurements,
        nutritionalAlerts: alerts,
        error 
      } = await loadAllDataFromSupabase(userId);
      
      if (error) {
        console.error('Error loading data from Supabase:', error);
        setView('onboarding');
        return;
      }

      if (profile) {
        setUserProfile(profile);
        setMealPlans(plans);
        setTrackingData(tracking);
        setCompletedMeals(completed);
        setWaterIntake(water);
        setBodyMeasurements(measurements);
        setNutritionalAlerts(alerts);
        setView('dashboard');
      } else {
        setView('onboarding');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setView('onboarding');
    }
  };

  const handleProfileUpdate = (profile: UserProfile) => {
    setUserProfile(profile);
  };
  
  const handleOnboardingComplete = async (profile: UserProfile) => {
    console.log('🎯 [handleOnboardingComplete] Called with userId:', authUser?.id);
    console.log('🎯 [handleOnboardingComplete] Profile:', profile);
    
    setUserProfile(profile);
    setMealPlans([]);
    setTrackingData([{ date: profile.startDate, weight: profile.startWeight }]);
    setCompletedMeals({});
    
    // Sync the new profile to Supabase
    if (authUser?.id) {
      console.log('🔄 [handleOnboardingComplete] Syncing to Supabase...');
      const { error } = await syncAllDataToSupabase(
        authUser.id,
        profile,
        [],
        [{ date: profile.startDate, weight: profile.startWeight }],
        {},
        [],
        [],
        []
      );
      
      if (error) {
        console.error('❌ [handleOnboardingComplete] Error syncing onboarding data to Supabase:', error);
        alert(`Erreur de synchronisation: ${error.message}`);
      } else {
        console.log('✅ [handleOnboardingComplete] Data synced successfully!');
      }
    } else {
      console.warn('⚠️ [handleOnboardingComplete] No userId provided!');
    }
    
    setView('dashboard');
  };
  
  const handleGenerateInitialPlan = async () => {
    if (!userProfile) return;
    setIsGeneratingPlan(true);
    setGenerationError(null);
    setGenerationProgress('');
    try {
      // Générer le plan pour la semaine 0 (première semaine)
      const plan = await generateMealPlan(userProfile, language, setGenerationProgress, 0);
      setMealPlans([plan]);
    } catch (e: any) {
      console.error("Failed to generate initial plan", e);
      setGenerationError(e.message || 'An unknown error occurred.');
      // Keep the modal open for a few seconds to show the error
      setTimeout(() => {
          setIsGeneratingPlan(false);
      }, 4000);
      return; // Stop execution here
    }
    setIsGeneratingPlan(false);
  };


  const handleLogout = async () => {
    if (authUser) {
      await signOut();
    }
    
    setUserProfile(null);
    setMealPlans([]);
    setTrackingData([]);
    setCompletedMeals({});
    setWaterIntake([]);
    setBodyMeasurements([]);
    setNutritionalAlerts([]);
    setActivities([]);
    
    try {
      localStorage.removeItem('nutrimind_user_profile');
      localStorage.removeItem('nutrimind_meal_plans');
      localStorage.removeItem('nutrimind_tracking_data');
      localStorage.removeItem('nutrimind_completed_meals');
      localStorage.removeItem('nutrimind_activities');
      Object.keys(localStorage).forEach(key => {
          if (key.startsWith('nutrimind_image_cache_')) {
              localStorage.removeItem(key);
          }
      });
    } catch (error) {
        console.error("Failed to clear localStorage", error);
    }
    
    setView('onboarding');
  };
  
  const renderView = () => {
    // 1. Language selection first
    if (showLanguageSelector) {
        return <LanguageSelector onLanguageSelect={(needsAuth) => {
          setShowLanguageSelector(false);
          if (needsAuth) {
            setShowStartAuth(true);
          }
          setIsLoadingAuth(false);
        }} />;
    }

    // 2. Auth if not authenticated (after language selected)
    if (!authUser && showStartAuth) {
      return (
        <>
          <AuthModal
            isOpen={true}
            onClose={() => {}}
            onAuthSuccess={async () => {
              // Le listener d'auth chargera les données
              setShowStartAuth(false);
            }}
          />
          <div className="flex items-center justify-center min-h-screen">
            <h1 className="text-3xl font-heading text-primary animate-pulse">NutriMIND</h1>
          </div>
        </>
      );
    }

    // 3. Loading state
    if (view === 'loading' || isLoadingAuth) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <h1 className="text-3xl font-heading text-primary animate-pulse">NutriMIND</h1>
        </div>
      );
    }
    
    // 4. Onboarding if no profile
    if (view === 'onboarding' || !userProfile) {
      return <OnboardingWizard onComplete={handleOnboardingComplete} />;
    }

    let pageComponent;
    switch (view) {
      case 'dashboard':
        pageComponent = (
            <Dashboard 
              user={userProfile} 
              mealPlans={mealPlans}
              completedMeals={completedMeals}
              setCompletedMeals={setCompletedMeals}
              waterIntake={waterIntake}
              setWaterIntake={setWaterIntake}
              bodyMeasurements={bodyMeasurements}
              setBodyMeasurements={setBodyMeasurements}
              nutritionalAlerts={nutritionalAlerts}
              setNutritionalAlerts={setNutritionalAlerts}
              setView={setView}
              isGeneratingPlan={isGeneratingPlan}
              onGeneratePlan={handleGenerateInitialPlan}
            />
        );
        break;
       case 'profile':
        pageComponent = <ProfilePage user={userProfile} onSave={handleProfileUpdate} onRestartOnboarding={() => {
          setUserProfile(null);
          setMealPlans([]);
          setTrackingData([]);
          setCompletedMeals({});
          setWaterIntake([]);
          setBodyMeasurements([]);
          setNutritionalAlerts([]);
          setView('onboarding');
        }} />;
        break;
      case 'nutrition':
        pageComponent = (
            <NutritionPage 
              user={userProfile} 
              mealPlans={mealPlans} 
              setMealPlans={setMealPlans}
              completedMeals={completedMeals}
              setCompletedMeals={setCompletedMeals}
            />
        );
        break;
      case 'settings':
        pageComponent = <SettingsPage 
          onLogout={handleLogout}
          userProfile={userProfile}
          mealPlans={mealPlans}
          trackingData={trackingData}
          completedMeals={completedMeals}
          waterIntake={waterIntake}
          bodyMeasurements={bodyMeasurements}
          nutritionalAlerts={nutritionalAlerts}
          activities={activities}
        />;
        break;
      case 'activities':
        pageComponent = <ActivitiesPage 
          activities={activities}
          setActivities={setActivities}
        />;
        break;
      default:
        pageComponent = (
            <Dashboard 
              user={userProfile} 
              mealPlans={mealPlans}
              completedMeals={completedMeals}
              setCompletedMeals={setCompletedMeals}
              waterIntake={waterIntake}
              setWaterIntake={setWaterIntake}
              bodyMeasurements={bodyMeasurements}
              setBodyMeasurements={setBodyMeasurements}
              nutritionalAlerts={nutritionalAlerts}
              setNutritionalAlerts={setNutritionalAlerts}
              setView={setView}
              isGeneratingPlan={isGeneratingPlan}
              onGeneratePlan={handleGenerateInitialPlan}
            />
        );
    }

    return (
      <>
        <Layout currentView={view} setView={setView}>
          {pageComponent}
        </Layout>
        {isGeneratingPlan && <GeneratingPlanModal progressMessage={generationProgress} error={generationError} />}
        {authUser && <OnlineStatusIndicator lastSyncTime={lastSyncTime} isSyncing={isSyncing} onForceSync={handleForceSync} />}
      </>
    );
  };

  return <>{renderView()}</>;
};

const App: React.FC = () => (
  <LanguageProvider>
    <AppContent />
  </LanguageProvider>
);


export default App;