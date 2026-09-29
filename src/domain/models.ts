import type { DayKey } from '../lib/dates'

/**
 * Every stored record carries sync metadata so a future backend
 * (FastAPI/PostgreSQL) can merge by `updatedAt` and honour tombstones.
 */
export interface BaseRecord {
  id: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export type Sex = 'male' | 'female'
export type Goal = 'lose' | 'maintain' | 'gain'
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very' | 'extra'
export type WeightUnit = 'kg' | 'lb'
export type LengthUnit = 'cm' | 'in'
export type ThemePref = 'dark' | 'light' | 'system'

export interface Targets {
  kcal: number
  protein: number
  carbs: number
  fat: number
  source: 'calculated' | 'manual'
}

export interface Profile extends BaseRecord {
  name: string
  birthYear: number
  sex: Sex
  heightCm: number
  startWeightKg: number
  goalWeightKg: number
  activity: ActivityLevel
  goal: Goal
  units: { weight: WeightUnit; length: LengthUnit }
  targets: Targets
  waterGoalMl: number
  theme: ThemePref
  startDate: DayKey
}

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack'
export type FoodUnit = 'g' | 'ml' | 'piece' | 'serving'

export interface Nutrients {
  kcal: number
  protein: number
  carbs: number
  fat: number
}

/** A reusable food. Nutrients are per `servingSize` of `unit`. */
export interface Food extends BaseRecord, Nutrients {
  name: string
  brand?: string
  servingSize: number
  unit: FoodUnit
  /** Weight in grams of one piece/serving, when known — enables "g" entry for pieces. */
  gramsPerUnit?: number
  favorite: boolean
  useCount: number
  lastUsedAt?: string
  lastQty?: number
  source: 'user' | 'usda' | 'estimate' | 'openfoodfacts'
  barcode?: string
}

export interface SavedMealItem {
  foodId: string
  qty: number
}

export interface SavedMeal extends BaseRecord {
  name: string
  items: SavedMealItem[]
  lastUsedAt?: string
}

/** A logged food. Nutrients are copied at log time so editing a Food never rewrites history. */
export interface FoodLog extends BaseRecord, Nutrients {
  date: DayKey
  meal: MealSlot
  foodId?: string
  name: string
  qty: number
  unit: FoodUnit
}

export interface WeightEntry extends BaseRecord {
  date: DayKey
  kg: number
  note?: string
}

export type MeasurementKey = 'waist' | 'chest' | 'arm' | 'hips' | 'thigh'

export interface Measurement extends BaseRecord {
  date: DayKey
  values: Partial<Record<MeasurementKey, number>> // cm
}

export type HabitKind = 'avoid' | 'do'
/** Habits can be completed automatically from other logs. */
export type HabitAuto = 'workout' | 'water' | 'walk'

export interface HabitDef extends BaseRecord {
  name: string
  kind: HabitKind
  icon: string
  order: number
  active: boolean
  auto?: HabitAuto
  /** Stable key for built-in habits used by analytics and the coach. */
  key?: 'fastfood' | 'cola' | 'energy' | 'workout' | 'walk' | 'water'
}

/** `done` = achieved (for avoid-habits: avoided). `slipped` = had it. No record = not recorded. */
export type HabitStatus = 'done' | 'slipped'

export interface HabitLog extends BaseRecord {
  date: DayKey
  habitId: string
  status: HabitStatus
}

export type ExerciseType = 'weighted' | 'reps' | 'timed'

export interface Exercise extends BaseRecord {
  name: string
  type: ExerciseType
}

export interface WorkoutTemplate extends BaseRecord {
  name: string
  exerciseIds: string[]
  /** Planned weekdays, 0 = Monday … 6 = Sunday. */
  weekdays: number[]
  order: number
}

export interface WorkoutSet {
  weightKg?: number
  reps?: number
  seconds?: number
  done?: boolean
}

export interface SessionExercise {
  exerciseId: string
  sets: WorkoutSet[]
  note?: string
}

export interface WorkoutSession extends BaseRecord {
  date: DayKey
  templateId?: string
  name: string
  /** `quick` = a single bodyweight log; it does not count as a planned workout. */
  kind: 'session' | 'quick'
  exercises: SessionExercise[]
  startedAt: string
  finishedAt?: string
  note?: string
}

export interface CardioEntry extends BaseRecord {
  date: DayKey
  activity: string
  minutes: number
  km?: number
  kmh?: number
  inclinePct?: number
  kcalEstimate?: number
  note?: string
}

export interface WaterLog extends BaseRecord {
  date: DayKey
  ml: number
}

export type PhotoPose = 'front' | 'side' | 'back'

export interface ProgressPhoto extends BaseRecord {
  date: DayKey
  pose: PhotoPose
  image: Blob
  thumb: Blob
  weightKg?: number
  note?: string
}

export interface MetaRow {
  key: string
  value: unknown
}
