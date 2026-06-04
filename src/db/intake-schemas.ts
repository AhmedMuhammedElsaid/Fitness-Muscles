import { z } from 'zod';

export const basicInfoSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  gender: z.string().min(1, 'Gender is required'),
  city: z.string(),
  country: z.string(),
});

export const bodyMetricsSchema = z.object({
  heightCm: z.coerce.number().positive('Height must be positive').optional(),
  weightKg: z.coerce.number().positive('Weight must be positive').optional(),
  targetWeightKg: z.coerce.number().positive('Target weight must be positive').optional(),
});

export const fitnessGoalsSchema = z.object({
  primaryGoal: z.string().min(1, 'Select a goal'),
  workoutTypes: z.array(z.string()).min(1, 'Select at least one workout type'),
});

export const healthRestrictionsSchema = z.object({
  hasMedicalConditions: z.boolean(),
  medicalConditions: z.string().optional(),
  hasInjuries: z.boolean(),
  injuries: z.string().optional(),
  hasFoodAllergies: z.boolean(),
  foodAllergies: z.string().optional(),
});

export const nutritionSchema = z.object({
  dietaryPreference: z.string().optional(),
});

export const workoutPrefsSchema = z.object({
  preferredDays: z.array(z.string()).min(1, 'Select at least one day'),
  preferredTimeOfDay: z.string().optional(),
});

export type BasicInfoData = z.infer<typeof basicInfoSchema>;
export type BodyMetricsData = z.infer<typeof bodyMetricsSchema>;
export type FitnessGoalsData = z.infer<typeof fitnessGoalsSchema>;
export type HealthRestrictionsData = z.infer<typeof healthRestrictionsSchema>;
export type NutritionData = z.infer<typeof nutritionSchema>;
export type WorkoutPrefsData = z.infer<typeof workoutPrefsSchema>;
