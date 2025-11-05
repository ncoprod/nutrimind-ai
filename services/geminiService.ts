import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile, WeeklyPlan, DailyPlan, Meal, FoodItem, CategorizedShoppingList } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper for delays to simulate thinking process
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mealSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Name of the meal" },
    type: { type: Type.STRING, description: "Type of meal (e.g., Petit-déjeuner, Déjeuner, Collation, Dîner)" },
    description: { type: Type.STRING, description: "Short description of the meal" },
    estimatedCost: { type: Type.STRING, description: "Estimated cost per person for the recipe in Euros, based on current prices in Paris, France. Example: '~5€'." },
    macros: {
      type: Type.OBJECT,
      properties: {
        calories: { type: Type.NUMBER, description: "Total calories" },
        protein: { type: Type.NUMBER, description: "Protein in grams" },
        carbohydrates: { type: Type.NUMBER, description: "Carbohydrates in grams" },
        fat: { type: Type.NUMBER, description: "Fat in grams" },
      },
      required: ['calories', 'protein', 'carbohydrates', 'fat'],
    },
    ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "List of ingredients with quantities" },
    instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step preparation instructions" },
  },
  required: ['name', 'type', 'description', 'macros', 'ingredients', 'instructions', 'estimatedCost'],
};

const dailyPlanSchema = {
    type: Type.OBJECT,
    properties: {
      dayOfWeek: { type: Type.STRING, description: "Day of the week (e.g., Lundi, Mardi)" },
      meals: {
        type: Type.ARRAY,
        description: "List of meals for the day.",
        items: mealSchema,
      },
      dailyTotals: {
        type: Type.OBJECT,
        properties: {
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbohydrates: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
        },
        required: ['calories', 'protein', 'carbohydrates', 'fat'],
      },
    },
    required: ['dayOfWeek', 'meals', 'dailyTotals'],
};


const weeklyPlanSchema = {
  type: Type.OBJECT,
  properties: {
    plan: {
      type: Type.ARRAY,
      description: "Nutritional plan for all 7 days of the week.",
      items: dailyPlanSchema,
    },
  },
  required: ['plan'],
};

const multipleMealsSchema = {
  type: Type.OBJECT,
  properties: {
    meals: {
      type: Type.ARRAY,
      description: "List of generated meals.",
      items: mealSchema,
    },
  },
  required: ['meals'],
};

const categorizedShoppingListSchema = {
  type: Type.OBJECT,
  properties: {
    shoppingList: {
      type: Type.ARRAY,
      description: "The categorized and consolidated shopping list.",
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, description: "Category of the items (e.g., Fruits & Vegetables, Meat & Fish)." },
          items: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the ingredient." },
                quantity: { type: Type.STRING, description: "Consolidated quantity of the ingredient." }
              },
              required: ['name', 'quantity']
            }
          }
        },
        required: ['category', 'items']
      }
    }
  },
  required: ['shoppingList']
};

const createPrompt = (user: UserProfile, language: 'fr' | 'en', customPrompt?: string): string => {
  if (language === 'en') {
    return `
      Role: You are NutriMIND, an expert AI nutritional coach. Your mission is to create a detailed and personalized weekly meal plan.

      User Context:
      - Gender: ${user.gender}
      - Age: ${user.age} years
      - Height: ${user.height} cm
      - Weight: ${user.weight} kg
      - Activity Level: ${user.activityLevel}
      - Goal: ${user.goal}
      - Meals per day: ${user.mealsPerDay}
      - Basal Metabolic Rate (BMR): ${user.bmr.toFixed(0)} calories
      - Total Daily Energy Expenditure (TDEE): ${user.tdee.toFixed(0)} calories
      - Daily Caloric Target: ${user.targetCalories.toFixed(0)} calories
      - Daily Meal Budget: ~€${user.dailyBudget}
      - Cooking Skill: ${user.cookingLevel}
      - Max preparation time (weekday lunch): ${user.maxPrepTimeWeekLunch} minutes
      - Max preparation time (weekday dinner): ${user.maxPrepTimeWeekDinner} minutes
      - Max preparation time (weekend lunch): ${user.maxPrepTimeWeekendLunch} minutes
      - Max preparation time (weekend dinner): ${user.maxPrepTimeWeekendDinner} minutes
      - Preferences/Allergies: ${user.preferences || 'None'}
      - Likes and dislikes: ${user.notes || 'None'}
      - Specific remarks/constraints: ${user.remarks || 'None'}
      ${customPrompt ? `- User instruction: ${customPrompt}` : ''}

      Task:
      Generate a varied and balanced meal plan for 7 days.
      - Each day must include exactly ${user.mealsPerDay} meals.
      - Adhere strictly to the maximum preparation times provided. Specifically, respect the different times for weekday lunch, weekday dinner, weekend lunch and weekend dinner.
      - Take into account the user's specific remarks and constraints (e.g., needing a lunch box for a specific day).
      - Appropriately name the meal types (e.g., Breakfast, Lunch, Dinner, Snack). If there are multiple snacks, number them (Snack 1, Snack 2).
      - The total daily calorie count must be very close to the target of ${user.targetCalories.toFixed(0)} calories.
      - For each meal, provide the name, type, a description, an estimated cost per person (estimatedCost) based on current prices in Paris, France, ingredients with quantities, preparation instructions, and a precise macronutrient breakdown (calories, protein, carbohydrates, fat).
      - Calculate and provide the total macronutrients for each day.
      - Consider the budget, cooking level, and likes/dislikes for the complexity and cost of ingredients.
      - The plan must start with Monday. The days of the week must be in English (Monday, Tuesday, etc.).

      Output Format:
      You MUST return the response as a valid JSON object that strictly conforms to the provided schema. Do not include any text, explanations, or markdown formatting outside the JSON object.
    `;
  }
  return `
    Role: Tu es NutriMIND, un coach nutritionnel expert en IA. Ta mission est de créer un plan de repas hebdomadaire détaillé et personnalisé.

    Contexte Utilisateur:
    - Sexe: ${user.gender}
    - Âge: ${user.age} ans
    - Taille: ${user.height} cm
    - Poids: ${user.weight} kg
    - Niveau d'activité: ${user.activityLevel}
    - Objectif: ${user.goal}
    - Repas par jour: ${user.mealsPerDay}
    - Métabolisme de base (BMR): ${user.bmr.toFixed(0)} calories
    - Dépense énergétique journalière (TDEE): ${user.tdee.toFixed(0)} calories
    - Objectif calorique quotidien: ${user.targetCalories.toFixed(0)} calories
    - Budget repas journalier: ~${user.dailyBudget} euros
    - Niveau de cuisine: ${user.cookingLevel}
    - Temps de préparation max (déjeuner semaine): ${user.maxPrepTimeWeekLunch} minutes
    - Temps de préparation max (dîner semaine): ${user.maxPrepTimeWeekDinner} minutes
    - Temps de préparation max (déjeuner weekend): ${user.maxPrepTimeWeekendLunch} minutes
    - Temps de préparation max (dîner weekend): ${user.maxPrepTimeWeekendDinner} minutes
    - Préférences/Allergies: ${user.preferences || 'Aucune'}
    - Goûts et aversions: ${user.notes || 'Aucun'}
    - Remarques/contraintes spécifiques: ${user.remarks || 'Aucune'}
    ${customPrompt ? `- Instruction utilisateur: ${customPrompt}` : ''}

    Tâche:
    Génère un plan de repas varié et équilibré pour 7 jours.
    - Chaque jour doit contenir exactement ${user.mealsPerDay} repas.
    - Respecte impérativement les temps de préparation maximums. Respecte spécifiquement les différents temps pour le déjeuner de semaine, le dîner de semaine, le déjeuner du week-end et le dîner du week-end.
    - Tiens compte des remarques et contraintes spécifiques de l'utilisateur (par ex: besoin d'une lunch box pour un jour précis).
    - Nomme les repas de façon appropriée (ex: Petit-déjeuner, Déjeuner, Dîner, Collation). S'il y a plusieurs collations, numérote-les (Collation 1, Collation 2).
    - Le total calorique de chaque jour doit être très proche de l'objectif de ${user.targetCalories.toFixed(0)} calories.
    - Pour chaque repas, fournis le nom, le type, une description, une estimation du coût par personne (estimatedCost) basée sur les prix actuels à Paris, France, les ingrédients avec quantités, les instructions de préparation, et une répartition précise des macronutriments (calories, protéines, glucides, lipides).
    - Calcule et fournis le total des macronutriments pour chaque journée.
    - Tiens compte du budget, du niveau de cuisine et des goûts/aversions pour la complexité et le coût des ingrédients.
    - Le plan doit commencer par Lundi. Les jours de la semaine doivent être en français (Lundi, Mardi, etc.).

    Format de Sortie:
    Tu DOIS retourner la réponse sous forme d'un objet JSON valide qui se conforme strictement au schéma fourni. N'inclus aucun texte, explication ou formatage markdown en dehors de l'objet JSON.
  `;
};

export const generateMealPlan = async (user: UserProfile, language: 'fr' | 'en', onProgress: (message: string) => void, weekNumber: number, customPrompt?: string): Promise<WeeklyPlan> => {
  const goalTranslations = {
    fr: { lose: 'Perdre du poids', maintain: 'Maintenir le poids', gain: 'Prendre du poids' },
    en: { lose: 'Lose weight', maintain: 'Maintain weight', gain: 'Gain weight' }
  };

  const thinkingMessages = {
    fr: [
      `Analyse du profil : ${user.age} ans, ${user.weight} kg, ${user.height} cm.`,
      `Calcul des besoins pour un objectif de "${goalTranslations.fr[user.goal]}".`,
      `Ciblage de ${user.targetCalories.toFixed(0)} calories par jour.`,
      `Lancement de la génération du plan...`
    ],
    en: [
      `Analyzing profile: ${user.age} years, ${user.weight} kg, ${user.height} cm.`,
      `Calculating needs for a "${goalTranslations.en[user.goal]}" goal.`,
      `Targeting ${user.targetCalories.toFixed(0)} calories per day.`,
      `Starting plan generation...`
    ]
  };

  for (const message of thinkingMessages[language]) {
    onProgress(message);
    await sleep(1500);
  }
  
  const prompt = createPrompt(user, language, customPrompt);
  let accumulatedJson = '';
  const reportedDays = new Set<string>();
  
  try {
    console.log('🔄 [generateMealPlan] Starting API call to Gemini...');
    console.log('🔄 [generateMealPlan] Model:', 'gemini-2.5-flash-lite-preview-09-2025');
    
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-2.5-flash-lite-preview-09-2025',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: weeklyPlanSchema,
      },
    });
    
    console.log('✅ [generateMealPlan] API call successful, processing stream...');

    for await (const chunk of responseStream) {
        const text = chunk.text;
        accumulatedJson += text;

        const dayMatches = [...accumulatedJson.matchAll(/"dayOfWeek":\s*"([^"]+)"/g)];
        const lastDayFound = dayMatches.length > 0 ? dayMatches[dayMatches.length - 1][1] : '';

        if (lastDayFound && !reportedDays.has(lastDayFound)) {
            await sleep(500); // Add a delay to slow down the updates
            onProgress(language === 'fr' ? `Organisation du ${lastDayFound}...` : `Organizing ${lastDayFound}...`);
            reportedDays.add(lastDayFound);
        }
    }
    
    console.log('🔍 [generateMealPlan] Raw JSON response:', accumulatedJson.substring(0, 500));
    
    const parsedPlan = JSON.parse(accumulatedJson) as Omit<WeeklyPlan, 'weekNumber'>;
    
    console.log('🔍 [generateMealPlan] Parsed plan structure:', {
      hasPlan: !!parsedPlan,
      isArray: Array.isArray(parsedPlan.plan),
      length: parsedPlan.plan?.length
    });
    
    if (!parsedPlan || !Array.isArray(parsedPlan.plan) || parsedPlan.plan.length !== 7) {
      console.error('❌ [generateMealPlan] Invalid structure. Received:', parsedPlan);
      throw new Error("Invalid meal plan structure received from API.");
    }

    // Ajouter le numéro de semaine au plan
    const weeklyPlan: WeeklyPlan = {
      weekNumber,
      plan: parsedPlan.plan
    };

    return weeklyPlan;
  } catch (error) {
    console.error("❌ [generateMealPlan] Error generating meal plan:", error);
    
    // Afficher plus de détails sur l'erreur
    if (error instanceof Error) {
      console.error("❌ [generateMealPlan] Error message:", error.message);
      console.error("❌ [generateMealPlan] Error stack:", error.stack);
    }
    
    const errorMessage = language === 'fr' 
        ? "La génération du plan a échoué. L'IA est peut-être occupée ou une erreur est survenue. Veuillez réessayer." 
        : "Failed to generate meal plan. The AI might be busy or an error occurred. Please try again.";
    throw new Error(errorMessage);
  }
};


interface RegenerationOptions {
  prompt: string;
  budget?: number;
  cookingLevel?: UserProfile['cookingLevel'];
  maxPrepTime?: number;
}

export const regenerateMeal = async (user: UserProfile, language: 'fr' | 'en', currentDay: DailyPlan, mealToReplace: Meal, options: RegenerationOptions): Promise<Meal> => {
    const otherMeals = currentDay.meals.filter(m => m && m.name !== mealToReplace.name);
    const caloriesFromOtherMeals = otherMeals.reduce((sum, meal) => sum + (meal?.macros.calories || 0), 0);
    const targetCaloriesForMeal = user.targetCalories - caloriesFromOtherMeals;

    const prompt = language === 'en' ? `
        Role: Expert nutritional coach.
        Context: A user wants to replace a meal in their day.
        User Profile: Gender: ${user.gender}, Age: ${user.age}, Goal: ${user.goal}, Preferences/Allergies: ${user.preferences}, Likes/Dislikes: ${user.notes || 'None'}.
        Preferences for this request: Budget: ~€${options.budget || user.dailyBudget}, Cooking Skill: ${options.cookingLevel || user.cookingLevel}.
        ${options.maxPrepTime ? `- Max preparation time for this meal: ${options.maxPrepTime} minutes.` : ''}
        Current Day:
        - Existing meals: ${otherMeals.map(m => m.name).join(', ')}
        - Calories already consumed: ${caloriesFromOtherMeals.toFixed(0)}
        - Daily caloric target: ${user.targetCalories.toFixed(0)}
        Meal to replace: ${mealToReplace.type} - "${mealToReplace.name}"
        User's instruction: "${options.prompt || "I don't like this dish, suggest something else."}"

        Task: Generate ONE new meal of type "${mealToReplace.type}" to replace the old one.
        - The new meal must be consistent with the user's profile and preferences for this request.
        - Aim for around ${targetCaloriesForMeal.toFixed(0)} calories for this meal.
        - Provide all details: name, type, description, estimated cost per person (based on Paris prices), macros, ingredients, instructions.

        Output Format: Respond with a single, valid JSON object, conforming to the provided meal schema. No extra text.
    ` : `
        Role: Coach nutritionnel expert.
        Contexte: Un utilisateur veut remplacer un repas de sa journée.
        Profil utilisateur: Sexe: ${user.gender}, Âge: ${user.age}, Objectif: ${user.goal}, Préférences/Allergies: ${user.preferences}, Goûts/Aversions: ${user.notes || 'Aucun'}.
        Préférences pour cette demande: Budget: ~${options.budget || user.dailyBudget}€, Niveau Cuisine: ${options.cookingLevel || user.cookingLevel}.
        ${options.maxPrepTime ? `- Temps de préparation max pour ce repas: ${options.maxPrepTime} minutes.` : ''}
        Journée actuelle:
        - Repas existants: ${otherMeals.map(m => m.name).join(', ')}
        - Calories déjà consommées: ${caloriesFromOtherMeals.toFixed(0)}
        - Objectif calorique journalier: ${user.targetCalories.toFixed(0)}
        Repas à remplacer: ${mealToReplace.type} - "${mealToReplace.name}"
        Instruction de l'utilisateur: "${options.prompt || "Je n'aime pas ce plat, propose-moi autre chose."}"

        Tâche: Génère UN SEUL nouveau repas de type "${mealToReplace.type}" pour remplacer l'ancien.
        - Le nouveau repas doit être cohérent avec le profil et les préférences de l'utilisateur pour cette demande.
        - Vise des calories autour de ${targetCaloriesForMeal.toFixed(0)} pour ce repas.
        - Fournis tous les détails: nom, type, description, coût estimé par personne (basé sur les prix à Paris), macros, ingrédients, instructions.

        Format de Sortie: Réponds avec un objet JSON unique et valide, conforme au schéma de repas fourni. Pas de texte supplémentaire.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: mealSchema,
            },
        });
        const jsonText = response.text;
        return JSON.parse(jsonText) as Meal;
    } catch (error) {
        console.error("Error regenerating meal:", error);
        throw new Error("Failed to regenerate meal.");
    }
};

export const generateSingleMeal = async (user: UserProfile, language: 'fr' | 'en', currentDay: DailyPlan, options: RegenerationOptions): Promise<Meal> => {
    const existingMeals = currentDay.meals;
    const caloriesFromOtherMeals = existingMeals.reduce((sum, meal) => sum + (meal?.macros.calories || 0), 0);
    const targetCaloriesForMeal = user.targetCalories - caloriesFromOtherMeals;

    const prompt = language === 'en' ? `
        Role: Expert nutritional coach.
        Context: A user wants to add a new meal to their day. The current day already has ${existingMeals.length} meals.
        User Profile: Gender: ${user.gender}, Age: ${user.age}, Goal: ${user.goal}, Preferences/Allergies: ${user.preferences}, Likes/Dislikes: ${user.notes || 'None'}.
        Preferences for this request: Budget: ~€${options.budget || user.dailyBudget}, Cooking Skill: ${options.cookingLevel || user.cookingLevel}.
        ${options.maxPrepTime ? `- Max preparation time for this meal: ${options.maxPrepTime} minutes.` : ''}
        Current Day:
        - Existing meals: ${existingMeals.map(m => m.name).join(', ')}
        - Calories already consumed: ${caloriesFromOtherMeals.toFixed(0)}
        - Daily caloric target: ${user.targetCalories.toFixed(0)}
        User's instruction for the new meal: "${options.prompt || "Suggest a light snack or a small meal."}"

        Task: Generate ONE new meal. It could be a snack or a small meal. Give it an appropriate type (e.g., "Snack", "Late Snack").
        - The new meal must be consistent with the user's profile and preferences.
        - Aim for around ${Math.max(100, targetCaloriesForMeal).toFixed(0)} calories for this meal. A negative target means the user is over their goal, so generate a very light snack (around 100-150 kcal).
        - Provide all details: name, type, description, estimated cost per person (based on Paris prices), macros, ingredients, instructions.

        Output Format: Respond with a single, valid JSON object, conforming to the provided meal schema. No extra text.
    ` : `
        Role: Coach nutritionnel expert.
        Contexte: Un utilisateur veut ajouter un repas à sa journée. La journée contient déjà ${existingMeals.length} repas.
        Profil utilisateur: Sexe: ${user.gender}, Âge: ${user.age}, Objectif: ${user.goal}, Préférences/Allergies: ${user.preferences}, Goûts/Aversions: ${user.notes || 'Aucun'}.
        Préférences pour cette demande: Budget: ~${options.budget || user.dailyBudget}€, Niveau Cuisine: ${options.cookingLevel || user.cookingLevel}.
        ${options.maxPrepTime ? `- Temps de préparation max pour ce repas: ${options.maxPrepTime} minutes.` : ''}
        Journée actuelle:
        - Repas existants: ${existingMeals.map(m => m.name).join(', ')}
        - Calories déjà consommées: ${caloriesFromOtherMeals.toFixed(0)}
        - Objectif calorique journalier: ${user.targetCalories.toFixed(0)}
        Instruction de l'utilisateur pour le nouveau repas: "${options.prompt || "Propose une collation ou un petit repas léger."}"

        Tâche: Génère UN SEUL nouveau repas. Ce pourrait être une collation ou un petit repas. Donne-lui un type approprié (ex: "Collation", "Goûter").
        - Le nouveau repas doit être cohérent avec le profil et les préférences de l'utilisateur.
        - Vise des calories autour de ${Math.max(100, targetCaloriesForMeal).toFixed(0)}. Un objectif négatif signifie un dépassement, génère alors une collation très légère (100-150 kcal).
        - Fournis tous les détails: nom, type, description, coût estimé par personne (basé sur les prix à Paris), macros, ingrédients, instructions.

        Format de Sortie: Réponds avec un objet JSON unique et valide, conforme au schéma de repas fourni. Pas de texte supplémentaire.
    `;
     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: mealSchema,
            },
        });
        const jsonText = response.text;
        return JSON.parse(jsonText) as Meal;
    } catch (error) {
        console.error("Error generating single meal:", error);
        throw new Error("Failed to generate a new meal.");
    }
};

export const completeDailyPlan = async (user: UserProfile, language: 'fr' | 'en', currentDay: DailyPlan, options: { prompt: string; budget?: number; cookingLevel?: UserProfile['cookingLevel']; mealsToAdd?: string; maxPrepTime?: number; }): Promise<Meal[]> => {
    const existingMeals = currentDay.meals;
    const caloriesConsumed = existingMeals.reduce((sum, meal) => sum + (meal?.macros.calories || 0), 0);
    const calorieDeficit = user.targetCalories - caloriesConsumed;
    
    if (calorieDeficit <= 0) {
        return [];
    }

    const mealsToAddInstruction = options.mealsToAdd 
        ? language === 'en' ? `Generate exactly ${options.mealsToAdd} meal(s).` : `Génère exactement ${options.mealsToAdd} repas.`
        : language === 'en' ? 'You decide the optimal number of meals to add (e.g., one larger meal or a couple of snacks).' : 'Tu décides du nombre optimal de repas à ajouter (par exemple, un repas plus conséquent ou plusieurs collations).';

    const prompt = language === 'en' ? `
        Role: Expert nutritional coach.
        Context: A user needs to add meals to their day to meet their caloric target.
        User Profile: Gender: ${user.gender}, Age: ${user.age}, Goal: ${user.goal}, Preferences/Allergies: ${user.preferences}, Likes/Dislikes: ${user.notes || 'None'}.
        Preferences for this request: Budget: ~€${options.budget || user.dailyBudget}, Cooking Skill: ${options.cookingLevel || user.cookingLevel}.
        ${options.maxPrepTime ? `- Max preparation time for these meals: ${options.maxPrepTime} minutes.` : ''}
        Current Day's Summary:
        - Existing meals: ${existingMeals.map(m => m.name).join(', ')}
        - Calories already consumed: ${caloriesConsumed.toFixed(0)}
        - Daily caloric target: ${user.targetCalories.toFixed(0)}
        - Calorie deficit to fill: ${calorieDeficit.toFixed(0)} calories.
        User's instruction: "${options.prompt || "Suggest something to complete my day."}"

        Task: Generate one or more new meals to fill the calorie deficit of ${calorieDeficit.toFixed(0)} calories.
        - ${mealsToAddInstruction}
        - The total calories of the new meal(s) should be very close to the deficit.
        - The new meal(s) must be consistent with the user's profile and preferences.
        - For each meal, provide all details: name, type, description, estimated cost per person (based on Paris prices), macros, ingredients, instructions.

        Output Format: Respond with a single, valid JSON object, conforming to the provided schema containing a "meals" array. No extra text.
    ` : `
        Role: Coach nutritionnel expert.
        Contexte: Un utilisateur a besoin d'ajouter des repas à sa journée pour atteindre son objectif calorique.
        Profil utilisateur: Sexe: ${user.gender}, Âge: ${user.age}, Objectif: ${user.goal}, Préférences/Allergies: ${user.preferences}, Goûts/Aversions: ${user.notes || 'Aucun'}.
        Préférences pour cette demande: Budget: ~${options.budget || user.dailyBudget}€, Niveau Cuisine: ${options.cookingLevel || user.cookingLevel}.
        ${options.maxPrepTime ? `- Temps de préparation max pour ces repas: ${options.maxPrepTime} minutes.` : ''}
        Résumé de la journée actuelle:
        - Repas existants: ${existingMeals.map(m => m.name).join(', ')}
        - Calories déjà consommées: ${caloriesConsumed.toFixed(0)}
        - Objectif calorique journalier: ${user.targetCalories.toFixed(0)}
        - Déficit calorique à combler: ${calorieDeficit.toFixed(0)} calories.
        Instruction de l'utilisateur: "${options.prompt || "Suggère quelque chose pour compléter ma journée."}"

        Tâche: Génère un ou plusieurs nouveaux repas pour combler le déficit calorique de ${calorieDeficit.toFixed(0)} calories.
        - ${mealsToAddInstruction}
        - Le total calorique du ou des nouveaux repas doit être très proche du déficit.
        - Le ou les nouveaux repas doivent être cohérents avec le profil et les préférences de l'utilisateur.
        - Pour chaque repas, fournis tous les détails: nom, type, description, coût estimé par personne (basé sur les prix à Paris), macros, ingrédients, instructions.

        Format de Sortie: Réponds avec un objet JSON unique et valide, conforme au schéma fourni contenant une liste "meals". Pas de texte supplémentaire.
    `;

     try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: multipleMealsSchema,
            },
        });
        const jsonText = response.text;
        const result = JSON.parse(jsonText) as { meals: Meal[] };
        return result.meals || [];
    } catch (error) {
        console.error("Error completing daily plan:", error);
        throw new Error("Failed to generate meals to complete the day.");
    }
};

export const regenerateDay = async (user: UserProfile, language: 'fr' | 'en', dayOfWeek: string, options: RegenerationOptions): Promise<DailyPlan> => {
    const prompt = language === 'en' ? `
        Role: Expert nutritional coach.
        Context: A user wants to regenerate an entire day's plan.
        User Profile: Gender: ${user.gender}, Age: ${user.age}, Height: ${user.height}cm, Weight: ${user.weight}kg, Goal: ${user.goal}, Meals per day: ${user.mealsPerDay}, Preferences/Allergies: ${user.preferences}, Likes/Dislikes: ${user.notes || 'None'}.
        Daily caloric target: ${user.targetCalories.toFixed(0)} calories.
        Preferences for this request: Budget: ~€${options.budget || user.dailyBudget}, Cooking Skill: ${options.cookingLevel || user.cookingLevel}.
        ${options.maxPrepTime ? `- Max preparation time for these meals: ${options.maxPrepTime} minutes.` : ''}
        User instruction: "${options.prompt || "I want completely different meals for this day."}"

        Task: Generate a complete and detailed meal plan for ONE SINGLE day: ${dayOfWeek}.
        - The plan must include exactly ${user.mealsPerDay} meals.
        - For each meal, include all details: name, type, description, estimated cost per person (based on Paris prices), macros, ingredients, and instructions.
        - The total calorie count must be very close to ${user.targetCalories.toFixed(0)}.
        - Calculate the total macros for the day.
        - Consider the budget, cooking level, and likes/dislikes.

        Output Format: Respond with a single, valid JSON object, conforming to the provided daily plan schema. No extra text.
    ` : `
        Role: Coach nutritionnel expert.
        Contexte: Un utilisateur veut régénérer le plan d'une journée entière.
        Profil utilisateur: Sexe: ${user.gender}, Âge: ${user.age}, Taille: ${user.height}cm, Poids: ${user.weight}kg, Objectif: ${user.goal}, Repas par jour: ${user.mealsPerDay}, Préférences/Allergies: ${user.preferences}, Goûts/Aversions: ${user.notes || 'Aucun'}.
        Objectif calorique journalier: ${user.targetCalories.toFixed(0)} calories.
        Préférences pour cette demande: Budget: ~${options.budget || user.dailyBudget}€, Niveau Cuisine: ${options.cookingLevel || user.cookingLevel}.
        ${options.maxPrepTime ? `- Temps de préparation max pour ces repas: ${options.maxPrepTime} minutes.` : ''}
        Instruction de l'utilisateur: "${options.prompt || "Je veux des repas complètement différents pour cette journée."}"

        Tâche: Génère un plan de repas complet et détaillé pour UN SEUL jour: ${dayOfWeek}.
        - Le plan doit inclure exactement ${user.mealsPerDay} repas.
        - Pour chaque repas, inclus tous les détails : nom, type, description, coût estimé par personne (basé sur les prix à Paris), macros, ingrédients et instructions.
        - Le total calorique doit être très proche de ${user.targetCalories.toFixed(0)}.
        - Calcule le total des macros pour la journée.
        - Tiens compte du budget, du niveau de cuisine et des goûts/aversions.

        Format de Sortie: Réponds avec un objet JSON unique et valide, conforme au schéma de plan journalier fourni. Pas de texte supplémentaire.
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: dailyPlanSchema,
            },
        });
        const jsonText = response.text;
        return JSON.parse(jsonText) as DailyPlan;
    } catch (error) {
        console.error("Error regenerating day:", error);
        throw new Error("Failed to regenerate day plan.");
    }
};

export const generateShoppingList = async (plan: WeeklyPlan, language: 'fr' | 'en'): Promise<CategorizedShoppingList[]> => {
    const allIngredients = plan.plan.flatMap(day => day.meals.flatMap(meal => meal ? meal.ingredients : [])).filter(Boolean);
    
    if (allIngredients.length === 0) {
        return [];
    }

    const prompt = language === 'en' ? `
        Role: You are an intelligent shopping assistant. Here is a list of ingredients for a full week, extracted from a meal plan. Your task is to consolidate and organize it.
        1. Merge identical ingredients by summing their quantities (e.g., '1 onion' and '2 onions' becomes '3 onions'). Be smart about units (e.g., 200g + 300g = 500g).
        2. Categorize each consolidated ingredient into a relevant supermarket aisle (e.g., 'Fruits & Vegetables', 'Meat & Fish', 'Dairy & Eggs', 'Pantry', 'Bakery', 'Beverages', 'Frozen').
        3. Return the result as a valid JSON object matching the provided schema, which is an array of category objects. Do not include any text outside the JSON object.
        
        Ingredients list:
        ${allIngredients.join('\n')}
    ` : `
        Role: Tu es un assistant de courses intelligent. Voici une liste d'ingrédients pour une semaine complète, extraite d'un plan de repas. Ta tâche est de la consolider et de l'organiser.
        1. Fusionne les ingrédients identiques en additionnant leurs quantités (ex: '1 oignon' et '2 oignons' devient '3 oignons'). Sois malin avec les unités (ex: 200g + 300g = 500g).
        2. Catégorise chaque ingrédient consolidé dans un rayon de supermarché pertinent (ex: 'Fruits & Légumes', 'Viandes & Poissons', 'Produits Laitiers & Œufs', 'Épicerie Salée', 'Épicerie Sucrée', 'Boulangerie', 'Boissons', 'Surgelés').
        3. Retourne le résultat sous forme d'un objet JSON valide respectant le schéma fourni, qui est un objet contenant une liste de catégories. N'inclus aucun texte en dehors de l'objet JSON.

        Liste d'ingrédients:
        ${allIngredients.join('\n')}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-lite-preview-09-2025',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: categorizedShoppingListSchema,
            },
        });
        const jsonText = response.text;
        const result = JSON.parse(jsonText) as { shoppingList: CategorizedShoppingList[] };
        return result.shoppingList || [];
    } catch (error) {
        console.error("Error generating shopping list:", error);
        throw new Error(language === 'fr' ? "Impossible de générer la liste de courses." : "Failed to generate shopping list.");
    }
};


// --- Rate-limited Image Generation with Persistent IndexedDB Cache ---

const normalizeMealNameForKey = (name: string): string => {
  return name.trim().toLowerCase().replace(/\s+/g, '_');
};

// Image par défaut/placeholder quand la génération échoue
const DEFAULT_MEAL_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTgiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7wn42dIFJlcGFzPC90ZXh0Pjwvc3ZnPg==';

// Cache en mémoire pour la session en cours (rapide)
const imageCache = new Map<string, string>();

// File d'attente pour les requêtes en attente
const pendingRequests = new Map<string, Promise<string>>();

// ============ IndexedDB pour Cache Persistant ============

const DB_NAME = 'NutriMindImageCache';
const DB_VERSION = 1;
const STORE_NAME = 'mealImages';

let dbInstance: IDBDatabase | null = null;

const initDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('❌ Error opening IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('✅ IndexedDB initialized successfully');
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        console.log('✅ IndexedDB object store created');
      }
    };
  });
};

const saveImageToDB = async (key: string, imageUrl: string): Promise<void> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put({ key, imageUrl, timestamp: Date.now() });
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error('❌ Error saving image to IndexedDB:', error);
  }
};

const getImageFromDB = async (key: string): Promise<string | null> => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.imageUrl) {
          console.log(`✅ Image loaded from IndexedDB cache: ${key}`);
          resolve(result.imageUrl);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error('❌ Error getting image from IndexedDB:', request.error);
        resolve(null);
      };
    });
  } catch (error) {
    console.error('❌ Error accessing IndexedDB:', error);
    return null;
  }
};

const REQUEST_DELAY = 1500; // 1.5 seconde entre les requêtes

type RequestQueueItem = {
  mealName: string;
  language: 'fr' | 'en';
  resolve: (url: string) => void;
  reject: (error: Error) => void;
};

const requestQueue: RequestQueueItem[] = [];
let isProcessingQueue = false;

const generateImageForMeal = async (mealName: string, language: 'fr' | 'en'): Promise<string> => {
    const imagePrompt = language === 'en' 
        ? `Photorealistic image of a plate of ${mealName}, professional food photography, delicious looking`
        : `Image photoréaliste d'une assiette de ${mealName}, photographie culinaire professionnelle, aspect délicieux`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: imagePrompt }],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            const imageUrl = `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            return imageUrl;
        } else {
            console.warn(`⚠️ No image data returned for "${mealName}", using default image`);
            return DEFAULT_MEAL_IMAGE;
        }
    } catch (error) {
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('RESOURCE_EXHAUSTED'))) {
            console.warn(`⚠️ Quota exceeded for "${mealName}". Using default image.`);
        } else {
            console.warn(`⚠️ Error generating image for "${mealName}":`, error, '. Using default image.');
        }
        return DEFAULT_MEAL_IMAGE;
    }
};

const processQueue = async () => {
    if (requestQueue.length === 0) {
        isProcessingQueue = false;
        return;
    }

    isProcessingQueue = true;
    const { mealName, language, resolve, reject } = requestQueue.shift()!;
    const cacheKey = normalizeMealNameForKey(mealName);

    try {
        console.log(`🎨 Generating new image for "${mealName}"...`);
        const imageUrl = await generateImageForMeal(mealName, language);
        
        // Stocker dans le cache en mémoire ET IndexedDB
        imageCache.set(cacheKey, imageUrl);
        await saveImageToDB(cacheKey, imageUrl);
        
        console.log(`✅ Image cached for "${mealName}"`);
        resolve(imageUrl);
    } catch (error) {
        console.error(`❌ Error processing image for "${mealName}":`, error);
        // En cas d'erreur, utiliser l'image par défaut
        imageCache.set(cacheKey, DEFAULT_MEAL_IMAGE);
        await saveImageToDB(cacheKey, DEFAULT_MEAL_IMAGE);
        resolve(DEFAULT_MEAL_IMAGE);
    } finally {
        // Nettoyer la requête en attente
        pendingRequests.delete(cacheKey);
    }

    setTimeout(processQueue, REQUEST_DELAY);
};

export const getMealImage = async (mealName: string, language: 'fr' | 'en'): Promise<string> => {
    const cacheKey = normalizeMealNameForKey(mealName);
    
    // 1. Vérifier le cache en mémoire (le plus rapide)
    const cachedImage = imageCache.get(cacheKey);
    if (cachedImage) {
        console.log(`⚡ Image loaded from memory cache: ${mealName}`);
        return Promise.resolve(cachedImage);
    }
    
    // 2. Vérifier IndexedDB (persistant)
    const dbImage = await getImageFromDB(cacheKey);
    if (dbImage) {
        // Mettre en cache mémoire pour les prochaines fois
        imageCache.set(cacheKey, dbImage);
        return Promise.resolve(dbImage);
    }
    
    // 3. Vérifier si une requête est déjà en cours pour ce repas
    const pendingRequest = pendingRequests.get(cacheKey);
    if (pendingRequest) {
        console.log(`⏳ Image request already pending: ${mealName}`);
        return pendingRequest;
    }
    
    // 4. Créer une nouvelle requête pour générer l'image
    const requestPromise = new Promise<string>((resolve, reject) => {
        requestQueue.push({ mealName, language, resolve, reject });
        if (!isProcessingQueue) {
            processQueue();
        }
    });
    
    // 5. Stocker la promesse pour éviter les doublons
    pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
};

// Fonction utilitaire pour voir combien d'images sont en cache
export const getImageCacheStats = () => {
    return {
        cachedImages: imageCache.size,
        pendingRequests: pendingRequests.size,
        queueLength: requestQueue.length
    };
};

// Fonction pour nettoyer le cache si nécessaire (utile pour le debug)
export const clearImageCache = async () => {
    imageCache.clear();
    pendingRequests.clear();
    
    try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
        
        return new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log('🧹 Image cache cleared (memory + IndexedDB)');
                resolve();
            };
            transaction.onerror = () => reject(transaction.error);
        });
    } catch (error) {
        console.error('❌ Error clearing IndexedDB cache:', error);
    }
};