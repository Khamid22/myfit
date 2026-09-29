import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import type { Snapshot } from '../domain/progress/insights'
import { toDisplayLength, toDisplayWeight } from '../domain/profile/units'
import type { Profile } from '../domain/models'
import type { DayKey } from '../lib/dates'
import { db } from '../storage/db'
import { alive } from '../storage/repositories/base'
import { PROFILE_ID } from '../storage/repositories/profile'
import { signed } from '../lib/format'

/** Live reads from IndexedDB. Components re-render automatically when data changes. */

const live = <T,>(rows: T[]) => rows.filter((r) => alive(r as never))

export const useProfile = () => useLiveQuery(() => db.profile.get(PROFILE_ID).then((p) => p ?? null), [])

export const useFoods = () => useLiveQuery(async () => live(await db.foods.toArray()), [], [])
export const useMeals = () => useLiveQuery(async () => live(await db.meals.toArray()), [], [])
export const useFoodLogs = (date: DayKey) =>
  useLiveQuery(async () => live(await db.foodLogs.where('date').equals(date).toArray()), [date], [])
export const useWeights = () =>
  useLiveQuery(async () => live(await db.weights.orderBy('date').toArray()), [], [])
export const useMeasurements = () =>
  useLiveQuery(async () => live(await db.measurements.orderBy('date').toArray()), [], [])
export const useHabits = () =>
  useLiveQuery(async () => live(await db.habits.orderBy('order').toArray()), [], [])
export const useHabitLogs = (date: DayKey) =>
  useLiveQuery(async () => live(await db.habitLogs.where('date').equals(date).toArray()), [date], [])
export const useExercises = () => useLiveQuery(async () => live(await db.exercises.toArray()), [], [])
export const useTemplates = () =>
  useLiveQuery(async () => live(await db.templates.orderBy('order').toArray()), [], [])
export const useSessions = () => useLiveQuery(async () => live(await db.sessions.toArray()), [], [])
export const useCardio = () => useLiveQuery(async () => live(await db.cardio.orderBy('date').toArray()), [], [])
export const useWaterMl = (date: DayKey) =>
  useLiveQuery(
    async () => live(await db.water.where('date').equals(date).toArray()).reduce((n, w) => n + w.ml, 0),
    [date],
    0,
  )
export const usePhotos = () => useLiveQuery(() => db.photos.orderBy('date').toArray(), [], [])
export const useMeta = <T,>(key: string) => useLiveQuery(async () => (await db.meta.get(key))?.value as T | undefined, [key])

/** Everything the analytics need, in one live query. */
export function useSnapshot(profile: Profile | null | undefined): Snapshot | undefined {
  return useLiveQuery(async () => {
    if (!profile) return undefined
    const [foodLogs, weights, habits, habitLogs, sessions, templates, cardio, water] = await Promise.all([
      db.foodLogs.toArray(),
      db.weights.toArray(),
      db.habits.orderBy('order').toArray(),
      db.habitLogs.toArray(),
      db.sessions.toArray(),
      db.templates.toArray(),
      db.cardio.toArray(),
      db.water.toArray(),
    ])
    return {
      profile,
      foodLogs: live(foodLogs),
      weights: live(weights),
      habits: live(habits),
      habitLogs: live(habitLogs),
      sessions: live(sessions),
      templates: live(templates),
      cardio: live(cardio),
      water: live(water),
    }
  }, [profile])
}

/** Unit-aware formatters bound to the profile's preferences. */
export function useUnits(profile: Profile | null | undefined) {
  const wu = profile?.units.weight ?? 'kg'
  const lu = profile?.units.length ?? 'cm'
  return useMemo(
    () => ({
      w: wu,
      l: lu,
      weight: (kg: number | null | undefined, digits = 1) =>
        kg == null ? '—' : toDisplayWeight(kg, wu).toFixed(digits),
      weightU: (kg: number | null | undefined, digits = 1) =>
        kg == null ? '—' : `${toDisplayWeight(kg, wu).toFixed(digits)} ${wu}`,
      weightDelta: (kg: number | null | undefined) => (kg == null ? '—' : `${signed(toDisplayWeight(kg, wu))} ${wu}`),
      toW: (kg: number) => toDisplayWeight(kg, wu),
      length: (cm: number | null | undefined) => (cm == null ? '—' : toDisplayLength(cm, lu).toFixed(1)),
      toL: (cm: number) => toDisplayLength(cm, lu),
    }),
    [wu, lu],
  )
}
