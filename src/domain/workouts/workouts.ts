import { daysBetween, weekdayIndex, type DayKey } from '../../lib/dates'
import type { Exercise, ExerciseType, WorkoutSession, WorkoutSet, WorkoutTemplate } from '../models'

export interface TopSet {
  weightKg: number
  reps: number
  seconds: number
}

const setValid = (s: WorkoutSet) => (s.reps ?? 0) > 0 || (s.seconds ?? 0) > 0

/** Best set: heaviest weight, then most reps (or longest hold for timed). */
export function topSet(sets: WorkoutSet[], type: ExerciseType): TopSet | null {
  const valid = sets.filter(setValid)
  if (!valid.length) return null
  const score = (s: WorkoutSet) =>
    type === 'weighted' ? (s.weightKg ?? 0) * 1000 + (s.reps ?? 0) : type === 'timed' ? (s.seconds ?? 0) : (s.reps ?? 0)
  const best = valid.reduce((a, b) => (score(b) > score(a) ? b : a))
  return { weightKg: best.weightKg ?? 0, reps: best.reps ?? 0, seconds: best.seconds ?? 0 }
}

export function formatSet(s: TopSet | WorkoutSet, type: ExerciseType, unit = 'kg', toUnit = (kg: number) => kg): string {
  if (type === 'timed') return `${s.seconds ?? 0} s`
  if (type === 'reps') return `${s.reps ?? 0} reps`
  return `${+toUnit(s.weightKg ?? 0).toFixed(1)} ${unit} × ${s.reps ?? 0}`
}

/** Most recent completed performance of an exercise before `beforeSessionId`/`beforeDate`. */
export function previousPerformance(
  sessions: WorkoutSession[],
  exerciseId: string,
  exclude?: string,
): { date: DayKey; sets: WorkoutSet[] } | null {
  const sorted = sessions
    .filter((s) => s.id !== exclude)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))
  for (const s of sorted) {
    const ex = s.exercises.find((e) => e.exerciseId === exerciseId)
    if (ex && ex.sets.some(setValid)) return { date: s.date, sets: ex.sets.filter(setValid) }
  }
  return null
}

export interface Delta {
  text: string
  tone: 'up' | 'same' | 'down'
}

export function compareTopSets(prev: TopSet | null, cur: TopSet | null, type: ExerciseType, unit = 'kg', toUnit = (kg: number) => kg): Delta | null {
  if (!prev || !cur) return null
  if (type === 'weighted') {
    const dw = toUnit(cur.weightKg) - toUnit(prev.weightKg)
    if (Math.abs(dw) >= 0.05) return { text: `${dw > 0 ? '+' : '−'}${+Math.abs(dw).toFixed(1)} ${unit}`, tone: dw > 0 ? 'up' : 'down' }
    const dr = cur.reps - prev.reps
    if (dr) return { text: `${dr > 0 ? '+' : '−'}${Math.abs(dr)} rep${Math.abs(dr) === 1 ? '' : 's'}`, tone: dr > 0 ? 'up' : 'down' }
    return { text: 'Matched', tone: 'same' }
  }
  const key = type === 'timed' ? 'seconds' : 'reps'
  const d = cur[key] - prev[key]
  if (!d) return { text: 'Matched', tone: 'same' }
  return { text: `${d > 0 ? '+' : '−'}${Math.abs(d)}${type === 'timed' ? ' s' : ''}`, tone: d > 0 ? 'up' : 'down' }
}

export interface ExerciseHistoryPoint {
  date: DayKey
  best: TopSet
}

/** Best set per day for one exercise, oldest first. */
export function exerciseHistory(sessions: WorkoutSession[], ex: Exercise): ExerciseHistoryPoint[] {
  const byDay = new Map<DayKey, TopSet>()
  for (const s of sessions) {
    for (const e of s.exercises) {
      if (e.exerciseId !== ex.id) continue
      const t = topSet(e.sets, ex.type)
      if (!t) continue
      const cur = byDay.get(s.date)
      const better = cur ? (topSet([cur, t], ex.type) ?? t) : t
      byDay.set(s.date, better)
    }
  }
  return [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, best]) => ({ date, best }))
}

export const primaryValue = (t: TopSet, type: ExerciseType) =>
  type === 'weighted' ? t.weightKg : type === 'timed' ? t.seconds : t.reps

/** Planned sessions in a date range, from template weekdays. */
export function plannedCount(templates: WorkoutTemplate[], from: DayKey, to: DayKey): number {
  const days = daysBetween(from, to)
  return days.reduce((n, d) => n + templates.filter((t) => t.weekdays.includes(weekdayIndex(d))).length, 0)
}

export function completedCount(sessions: WorkoutSession[], from: DayKey, to: DayKey): number {
  return sessions.filter((s) => s.kind === 'session' && s.finishedAt && s.date >= from && s.date <= to).length
}

export function templateForDay(templates: WorkoutTemplate[], day: DayKey): WorkoutTemplate | undefined {
  return templates.find((t) => t.weekdays.includes(weekdayIndex(day)))
}

export function sessionVolume(s: WorkoutSession): number {
  return s.exercises.reduce((v, e) => v + e.sets.reduce((a, st) => a + (st.weightKg ?? 0) * (st.reps ?? 0), 0), 0)
}
