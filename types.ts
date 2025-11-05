export interface UserProfile {
  name: string;
  gender: 'male' | 'female';
  age: number;
  height: number; // in cm
  weight: number; // in kg
  startWeight: number; // in kg
  goalWeight: number; // in kg
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'lose' | 'maintain' | 'gain';
  preferences: string; // Comma-separated string of preferences/allergies
  notes?: string; // Free text for tastes, dislikes, etc.
  remarks?: string; // Free text for specific constraints
  dailyBudget: number; // in Euros
  cookingLevel: 'beginner' | 'intermediate' | 'expert';
  mealsPerDay: number;
  bmr: number;
  tdee: number;
  targetCalories: number;
  goalTimeline: number; // in weeks
  startDate: string; // YYYY-MM-DD
  maxPrepTimeWeekLunch: number; // in minutes
  maxPrepTimeWeekDinner: number; // in minutes
  maxPrepTimeWeekendLunch: number; // in minutes
  maxPrepTimeWeekendDinner: number; // in minutes
}

export interface MacroNutrients {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export interface Meal {
  name: string;
  type: string;
  description: string;
  macros: MacroNutrients;
  ingredients: string[];
  instructions: string[];
  estimatedCost?: string;
}

export interface DailyPlan {
  dayOfWeek: 'Lundi' | 'Mardi' | 'Mercredi' | 'Jeudi' | 'Vendredi' | 'Samedi' | 'Dimanche';
  meals: Meal[];
  dailyTotals: MacroNutrients;
}

export interface WeeklyPlan {
  weekNumber: number; // Numéro de semaine depuis la date de début
  plan: DailyPlan[];
}

export interface TrackingEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface FoodItem {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  cuisineTypes: string[];
  mainIngredients: string[];
  tags: string[];
  macros: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

export interface ShoppingListItem {
  name: string;
  quantity: string;
}

export interface CategorizedShoppingList {
  category: string;
  items: ShoppingListItem[];
}

export interface WaterIntake {
  date: string; // YYYY-MM-DD
  amount: number; // in ml
  goal: number; // in ml
}

export interface BodyMeasurement {
  date: string; // YYYY-MM-DD
  weight?: number; // in kg
  waist?: number; // in cm
  hips?: number; // in cm
  chest?: number; // in cm
  arms?: number; // in cm
  thighs?: number; // in cm
  bodyFat?: number; // percentage
}

export interface NutritionalAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  date: string; // YYYY-MM-DD
  isRead: boolean;
}

export interface Activity {
  id: string;
  date: string; // YYYY-MM-DD
  type: string; // 'running', 'cycling', 'walking', 'gym', 'swimming', 'yoga', 'other'
  duration: number; // in minutes
  caloriesBurned: number;
  notes?: string;
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  units: 'metric' | 'imperial';
  language: 'fr' | 'en';
}