import { supabase } from './supabaseClient';
import type { UserProfile, WeeklyPlan, TrackingEntry, WaterIntake, BodyMeasurement, NutritionalAlert } from '../types';

// ============ USER PROFILE ============

export const saveUserProfile = async (userId: string, profile: UserProfile): Promise<{ error: Error | null }> => {
  try {
    console.log('🔄 [saveUserProfile] Saving profile for userId:', userId);
    console.log('🔄 [saveUserProfile] Profile data:', profile);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: userId,
        email: (await supabase.auth.getUser()).data.user?.email || '',
        first_name: profile.name.split(' ')[0] || '',
        last_name: profile.name.split(' ').slice(1).join(' ') || '',
        name: profile.name,
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        activity_level: profile.activityLevel,
        goal: profile.goal,
        preferences: profile.preferences,
        notes: profile.notes || '',
        remarks: profile.remarks || '',
        daily_budget: profile.dailyBudget,
        cooking_level: profile.cookingLevel,
        meals_per_day: profile.mealsPerDay,
        goal_weight: profile.goalWeight,
        goal_timeline: profile.goalTimeline,
        bmr: profile.bmr,
        tdee: profile.tdee,
        target_calories: profile.targetCalories,
        start_date: profile.startDate,
        start_weight: profile.startWeight,
        max_prep_time_week_lunch: profile.maxPrepTimeWeekLunch,
        max_prep_time_week_dinner: profile.maxPrepTimeWeekDinner,
        max_prep_time_weekend_lunch: profile.maxPrepTimeWeekendLunch,
        max_prep_time_weekend_dinner: profile.maxPrepTimeWeekendDinner,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (error) {
      console.error('❌ [saveUserProfile] Supabase error:', error);
      throw error;
    }
    
    console.log('✅ [saveUserProfile] Profile saved successfully:', data);
    return { error: null };
  } catch (error) {
    console.error('❌ [saveUserProfile] Error saving user profile:', error);
    return { error: error as Error };
  }
};

export const getUserProfile = async (userId: string): Promise<{ profile: UserProfile | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Utiliser maybeSingle() au lieu de single() pour gérer le cas où il n'y a pas de résultat

    if (error) throw error;
    if (!data) return { profile: null, error: null };

    const profile: UserProfile = {
      name: data.name,
      gender: data.gender,
      age: data.age,
      height: data.height,
      weight: data.weight,
      activityLevel: data.activity_level,
      goal: data.goal,
      preferences: data.preferences,
      notes: data.notes,
      remarks: data.remarks,
      dailyBudget: data.daily_budget,
      cookingLevel: data.cooking_level,
      mealsPerDay: data.meals_per_day,
      goalWeight: data.goal_weight,
      goalTimeline: data.goal_timeline,
      bmr: data.bmr,
      tdee: data.tdee,
      targetCalories: data.target_calories,
      startDate: data.start_date,
      startWeight: data.start_weight,
      maxPrepTimeWeekLunch: data.max_prep_time_week_lunch,
      maxPrepTimeWeekDinner: data.max_prep_time_week_dinner,
      maxPrepTimeWeekendLunch: data.max_prep_time_weekend_lunch,
      maxPrepTimeWeekendDinner: data.max_prep_time_weekend_dinner,
    };

    return { profile, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    // Si c'est une erreur "0 rows", ce n'est pas vraiment une erreur - l'utilisateur n'a juste pas encore de profil
    if ((error as any).code === 'PGRST116') {
      return { profile: null, error: null };
    }
    return { profile: null, error: error as Error };
  }
};

// ============ MEAL PLANS ============

export const saveMealPlans = async (userId: string, plans: WeeklyPlan[]): Promise<{ error: Error | null }> => {
  try {
    // Supprimer les anciens plans
    await supabase
      .from('meal_plans')
      .delete()
      .eq('user_id', userId);

    // Insérer les nouveaux plans
    const { error } = await supabase
      .from('meal_plans')
      .insert(
        plans.map(plan => ({
          user_id: userId,
          plan_data: plan,
        }))
      );

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error saving meal plans:', error);
    return { error: error as Error };
  }
};

export const getMealPlans = async (userId: string): Promise<{ plans: WeeklyPlan[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('meal_plans')
      .select('plan_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: true }); // Ordre ascendant pour la migration

    if (error) throw error;
    const plans = data?.map((item, index) => {
      const plan = item.plan_data as WeeklyPlan;
      // Migration : ajouter weekNumber aux anciens plans qui n'en ont pas
      if (plan.weekNumber === undefined) {
        plan.weekNumber = index; // Utiliser l'index comme weekNumber
      }
      return plan;
    }) || [];
    
    // Trier les plans par weekNumber (ascendant) pour garantir l'ordre correct
    plans.sort((a, b) => a.weekNumber - b.weekNumber);
    
    return { plans, error: null };
  } catch (error) {
    console.error('Error getting meal plans:', error);
    return { plans: [], error: error as Error };
  }
};

// ============ TRACKING DATA ============

export const saveTrackingData = async (userId: string, entries: TrackingEntry[]): Promise<{ error: Error | null }> => {
  try {
    // Supprimer les anciennes entrées
    await supabase
      .from('tracking_entries')
      .delete()
      .eq('user_id', userId);

    // Insérer les nouvelles entrées
    const { error } = await supabase
      .from('tracking_entries')
      .insert(
        entries.map(entry => ({
          user_id: userId,
          date: entry.date,
          weight: entry.weight,
        }))
      );

    if (error) throw error;
    return { error: null };
  } catch (error) {
    console.error('Error saving tracking data:', error);
    return { error: error as Error };
  }
};

export const getTrackingData = async (userId: string): Promise<{ entries: TrackingEntry[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('tracking_entries')
      .select('date, weight')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    const entries = data?.map(item => ({ date: item.date, weight: item.weight })) || [];
    return { entries, error: null };
  } catch (error) {
    console.error('Error getting tracking data:', error);
    return { entries: [], error: error as Error };
  }
};

// ============ COMPLETED MEALS ============

export const saveCompletedMeals = async (
  userId: string,
  completedMeals: Record<string, string[]>
): Promise<{ error: Error | null }> => {
  try {
    // Supprimer les anciennes entrées
    await supabase
      .from('completed_meals')
      .delete()
      .eq('user_id', userId);

    // Insérer les nouvelles entrées
    const entries = Object.entries(completedMeals).map(([planId, mealIds]) => ({
      user_id: userId,
      plan_id: planId,
      meal_ids: mealIds,
    }));

    if (entries.length > 0) {
      const { error } = await supabase
        .from('completed_meals')
        .insert(entries);

      if (error) throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error saving completed meals:', error);
    return { error: error as Error };
  }
};

export const getCompletedMeals = async (userId: string): Promise<{ completedMeals: Record<string, string[]>; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('completed_meals')
      .select('plan_id, meal_ids')
      .eq('user_id', userId);

    if (error) throw error;
    
    const completedMeals: Record<string, string[]> = {};
    data?.forEach(item => {
      completedMeals[item.plan_id] = item.meal_ids;
    });

    return { completedMeals, error: null };
  } catch (error) {
    console.error('Error getting completed meals:', error);
    return { completedMeals: {}, error: error as Error };
  }
};

// ============ WATER INTAKE ============

export const saveWaterIntake = async (userId: string, waterData: WaterIntake[]): Promise<{ error: Error | null }> => {
  try {
    // Supprimer les anciennes entrées
    await supabase
      .from('water_intake')
      .delete()
      .eq('user_id', userId);

    // Insérer les nouvelles entrées
    if (waterData.length > 0) {
      const { error } = await supabase
        .from('water_intake')
        .insert(
          waterData.map(entry => ({
            user_id: userId,
            date: entry.date,
            amount: entry.amount,
            goal: entry.goal,
          }))
        );

      if (error) throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error saving water intake:', error);
    return { error: error as Error };
  }
};

export const getWaterIntake = async (userId: string): Promise<{ waterData: WaterIntake[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('water_intake')
      .select('date, amount, goal')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    const waterData = data?.map(item => ({ date: item.date, amount: item.amount, goal: item.goal })) || [];
    return { waterData, error: null };
  } catch (error) {
    console.error('Error getting water intake:', error);
    return { waterData: [], error: error as Error };
  }
};

// ============ BODY MEASUREMENTS ============

export const saveBodyMeasurements = async (userId: string, measurements: BodyMeasurement[]): Promise<{ error: Error | null }> => {
  try {
    // Supprimer les anciennes entrées
    await supabase
      .from('body_measurements')
      .delete()
      .eq('user_id', userId);

    // Insérer les nouvelles entrées
    if (measurements.length > 0) {
      const { error } = await supabase
        .from('body_measurements')
        .insert(
          measurements.map(entry => ({
            user_id: userId,
            date: entry.date,
            weight: entry.weight,
            waist: entry.waist,
            hips: entry.hips,
            chest: entry.chest,
            arms: entry.arms,
            thighs: entry.thighs,
            body_fat: entry.bodyFat,
          }))
        );

      if (error) throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error saving body measurements:', error);
    return { error: error as Error };
  }
};

export const getBodyMeasurements = async (userId: string): Promise<{ measurements: BodyMeasurement[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('body_measurements')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });

    if (error) throw error;
    const measurements = data?.map(item => ({
      date: item.date,
      weight: item.weight,
      waist: item.waist,
      hips: item.hips,
      chest: item.chest,
      arms: item.arms,
      thighs: item.thighs,
      bodyFat: item.body_fat,
    })) || [];
    return { measurements, error: null };
  } catch (error) {
    console.error('Error getting body measurements:', error);
    return { measurements: [], error: error as Error };
  }
};

// ============ NUTRITIONAL ALERTS ============

export const saveNutritionalAlerts = async (userId: string, alerts: NutritionalAlert[]): Promise<{ error: Error | null }> => {
  try {
    // Supprimer les anciennes entrées
    await supabase
      .from('nutritional_alerts')
      .delete()
      .eq('user_id', userId);

    // Insérer les nouvelles entrées
    if (alerts.length > 0) {
      const { error } = await supabase
        .from('nutritional_alerts')
        .insert(
          alerts.map(alert => ({
            user_id: userId,
            alert_id: alert.id,
            type: alert.type,
            title: alert.title,
            message: alert.message,
            date: alert.date,
            is_read: alert.isRead,
          }))
        );

      if (error) throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error saving nutritional alerts:', error);
    return { error: error as Error };
  }
};

export const getNutritionalAlerts = async (userId: string): Promise<{ alerts: NutritionalAlert[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('nutritional_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    const alerts = data?.map(item => ({
      id: item.alert_id,
      type: item.type,
      title: item.title,
      message: item.message,
      date: item.date,
      isRead: item.is_read,
    })) || [];
    return { alerts, error: null };
  } catch (error) {
    console.error('Error getting nutritional alerts:', error);
    return { alerts: [], error: error as Error };
  }
};

// ============ SYNC ALL DATA ============

export const syncAllDataToSupabase = async (
  userId: string,
  profile: UserProfile,
  mealPlans: WeeklyPlan[],
  trackingData: TrackingEntry[],
  completedMeals: Record<string, string[]>,
  waterIntake?: WaterIntake[],
  bodyMeasurements?: BodyMeasurement[],
  nutritionalAlerts?: NutritionalAlert[]
): Promise<{ error: Error | null }> => {
  try {
    console.log('🔄 [syncAllDataToSupabase] Starting sync for userId:', userId);
    console.log('🔄 [syncAllDataToSupabase] Data to sync:', {
      profile: !!profile,
      mealPlans: mealPlans.length,
      trackingData: trackingData.length,
      completedMeals: Object.keys(completedMeals).length,
      waterIntake: waterIntake?.length || 0,
      bodyMeasurements: bodyMeasurements?.length || 0,
      nutritionalAlerts: nutritionalAlerts?.length || 0,
    });
    
    // Sauvegarder toutes les données en parallèle
    const results = await Promise.all([
      saveUserProfile(userId, profile),
      saveMealPlans(userId, mealPlans),
      saveTrackingData(userId, trackingData),
      saveCompletedMeals(userId, completedMeals),
      waterIntake ? saveWaterIntake(userId, waterIntake) : Promise.resolve({ error: null }),
      bodyMeasurements ? saveBodyMeasurements(userId, bodyMeasurements) : Promise.resolve({ error: null }),
      nutritionalAlerts ? saveNutritionalAlerts(userId, nutritionalAlerts) : Promise.resolve({ error: null }),
    ]);

    console.log('🔄 [syncAllDataToSupabase] Results:', results);

    // Vérifier s'il y a des erreurs
    const errors = results.filter(r => r.error !== null);
    if (errors.length > 0) {
      console.error('❌ [syncAllDataToSupabase] Errors found:', errors);
      throw errors[0].error;
    }

    console.log('✅ [syncAllDataToSupabase] All data synced successfully!');
    return { error: null };
  } catch (error) {
    console.error('❌ [syncAllDataToSupabase] Error syncing data to Supabase:', error);
    return { error: error as Error };
  }
};

export const loadAllDataFromSupabase = async (userId: string): Promise<{
  profile: UserProfile | null;
  mealPlans: WeeklyPlan[];
  trackingData: TrackingEntry[];
  completedMeals: Record<string, string[]>;
  waterIntake: WaterIntake[];
  bodyMeasurements: BodyMeasurement[];
  nutritionalAlerts: NutritionalAlert[];
  error: Error | null;
}> => {
  try {
    // Charger toutes les données en parallèle
    const [profileResult, plansResult, trackingResult, completedResult, waterResult, measurementsResult, alertsResult] = await Promise.all([
      getUserProfile(userId),
      getMealPlans(userId),
      getTrackingData(userId),
      getCompletedMeals(userId),
      getWaterIntake(userId),
      getBodyMeasurements(userId),
      getNutritionalAlerts(userId),
    ]);

    // Vérifier s'il y a des erreurs
    if (profileResult.error) throw profileResult.error;
    if (plansResult.error) throw plansResult.error;
    if (trackingResult.error) throw trackingResult.error;
    if (completedResult.error) throw completedResult.error;
    if (waterResult.error) throw waterResult.error;
    if (measurementsResult.error) throw measurementsResult.error;
    if (alertsResult.error) throw alertsResult.error;

    return {
      profile: profileResult.profile,
      mealPlans: plansResult.plans,
      trackingData: trackingResult.entries,
      completedMeals: completedResult.completedMeals,
      waterIntake: waterResult.waterData,
      bodyMeasurements: measurementsResult.measurements,
      nutritionalAlerts: alertsResult.alerts,
      error: null,
    };
  } catch (error) {
    console.error('Error loading data from Supabase:', error);
    return {
      profile: null,
      mealPlans: [],
      trackingData: [],
      completedMeals: {},
      waterIntake: [],
      bodyMeasurements: [],
      nutritionalAlerts: [],
      error: error as Error,
    };
  }
};

