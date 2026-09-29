import Dexie, { type Table } from 'dexie'
import type {
  CardioEntry,
  Exercise,
  Food,
  FoodLog,
  HabitDef,
  HabitLog,
  Measurement,
  MetaRow,
  Profile,
  ProgressPhoto,
  SavedMeal,
  WaterLog,
  WeightEntry,
  WorkoutSession,
  WorkoutTemplate,
} from '../domain/models'

export class MyFitDB extends Dexie {
  profile!: Table<Profile, string>
  foods!: Table<Food, string>
  meals!: Table<SavedMeal, string>
  foodLogs!: Table<FoodLog, string>
  weights!: Table<WeightEntry, string>
  measurements!: Table<Measurement, string>
  habits!: Table<HabitDef, string>
  habitLogs!: Table<HabitLog, string>
  exercises!: Table<Exercise, string>
  templates!: Table<WorkoutTemplate, string>
  sessions!: Table<WorkoutSession, string>
  cardio!: Table<CardioEntry, string>
  water!: Table<WaterLog, string>
  photos!: Table<ProgressPhoto, string>
  meta!: Table<MetaRow, string>

  constructor() {
    super('myfit')
    this.version(1).stores({
      profile: 'id',
      foods: 'id, name, lastUsedAt',
      meals: 'id, name',
      foodLogs: 'id, date',
      weights: 'id, date',
      measurements: 'id, date',
      habits: 'id, order',
      habitLogs: 'id, date, [date+habitId]',
      exercises: 'id, name',
      templates: 'id, order',
      sessions: 'id, date',
      cardio: 'id, date',
      water: 'id, date',
      photos: 'id, date, pose',
      meta: 'key',
    })
    // v2: shorter starter food name.
    this.version(2).upgrade((tx) =>
      tx
        .table('foods')
        .toCollection()
        .modify((f: Food) => {
          if (f.name === 'Protein shake (1 scoop whey + water)') f.name = 'Protein shake'
        }),
    )
  }
}

export const db = new MyFitDB()

/** Tables exported to / imported from JSON backups (photos are handled separately). */
export const DATA_TABLES = [
  'profile',
  'foods',
  'meals',
  'foodLogs',
  'weights',
  'measurements',
  'habits',
  'habitLogs',
  'exercises',
  'templates',
  'sessions',
  'cardio',
  'water',
  'meta',
] as const

export type DataTable = (typeof DATA_TABLES)[number]

/** Ask the browser not to evict our data (important on iOS). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
