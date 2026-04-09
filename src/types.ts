export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  createdAt: number;
  macroGoals?: MacroGoals;
  bodyMetrics?: BodyMetrics;
  nutritionalPlan?: NutritionalPlan;
}

export interface BodyMetrics {
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  height?: number;
  updatedAt: number;
}

export interface BodyMetricsHistory {
  id: string;
  userId: string;
  weight: number;
  bodyFat?: number;
  muscleMass?: number;
  date: string; // ISO string
  createdAt: number;
}

export interface NutritionalPlan {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  advice?: string;
  extractedAt: number;
}

export interface MacroGoals {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // ISO string
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  meals: Meal[];
  waterIntake: number; // in ml
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  macros: {
    protein: number;
    carbs: number;
    fats: number;
    calories: number;
  };
  imageUrl?: string;
}

export interface StrengthRecord {
  id: string;
  userId: string;
  exercise: 'Squat' | 'Bench Press' | 'Deadlift';
  weight: number;
  date: string;
}
