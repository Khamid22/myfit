import { addDays, daysBetween, type DayKey } from '../../lib/dates'
import { mean } from '../../lib/format'
import { avoidedRun, comparePeriods, habitCounts, indexLogs, type DaySignals, type LogIndex } from '../habits/habits'
import type {
  CardioEntry,
  FoodLog,
  HabitDef,
  HabitLog,
  Nutrients,
  Profile,
  WaterLog,
  WeightEntry,
  WorkoutSession,
  WorkoutTemplate,
} from '../models'
import { sum } from '../nutrition/nutrition'
import type { CoachContext } from '../recommendations/types'
import { completedCount, plannedCount } from '../workouts/workouts'

/** All data the analytics need. Pure input — no storage access. */
export interface Snapshot {
  profile: Profile
  foodLogs: FoodLog[]
  weights: WeightEntry[]
  habits: HabitDef[]
  habitLogs: HabitLog[]
  sessions: WorkoutSession[]
  templates: WorkoutTemplate[]
  cardio: CardioEntry[]
  water: WaterLog[]
}

const WALK_RE = /walk|treadmill|hike|steps/i

export function daySignals(s: Snapshot, days: DayKey[]): Map<DayKey, DaySignals> {
  const set = new Set(days)
  const out = new Map<DayKey, DaySignals>(days.map((d) => [d, { workout: false, water: false, walk: false }]))
  for (const w of s.sessions) if (set.has(w.date) && w.kind === 'session') out.get(w.date)!.workout = true
  for (const c of s.cardio) if (set.has(c.date) && WALK_RE.test(c.activity)) out.get(c.date)!.walk = true
  const water = new Map<DayKey, number>()
  for (const w of s.water) if (set.has(w.date)) water.set(w.date, (water.get(w.date) ?? 0) + w.ml)
  for (const [d, ml] of water) if (ml >= s.profile.waterGoalMl) out.get(d)!.water = true
  return out
}

export function dailyNutrition(logs: FoodLog[]): Map<DayKey, Nutrients> {
  const by = new Map<DayKey, FoodLog[]>()
  for (const l of logs) by.set(l.date, [...(by.get(l.date) ?? []), l])
  return new Map([...by].map(([d, ls]) => [d, sum(ls)]))
}

const habitByKey = (s: Snapshot, key: HabitDef['key']) => s.habits.find((h) => h.key === key)

interface PeriodHabitStats {
  slips: Record<'fastfood' | 'cola' | 'energy', number>
  done: Record<'fastfood' | 'cola' | 'energy' | 'walk' | 'water', number>
  completion: number // share of (habit × day) cells marked done, active habits only
}

function periodHabitStats(s: Snapshot, idx: LogIndex, days: DayKey[]): PeriodHabitStats {
  const sig = daySignals(s, days)
  const count = (key: HabitDef['key']) => {
    const h = habitByKey(s, key)
    return h ? habitCounts(h, idx, sig, days) : { done: 0, slipped: 0, days: days.length }
  }
  const active = s.habits.filter((h) => h.active)
  const totalDone = active.reduce((n, h) => n + habitCounts(h, idx, sig, days).done, 0)
  return {
    slips: { fastfood: count('fastfood').slipped, cola: count('cola').slipped, energy: count('energy').slipped },
    done: {
      fastfood: count('fastfood').done,
      cola: count('cola').done,
      energy: count('energy').done,
      walk: count('walk').done,
      water: count('water').done,
    },
    completion: active.length && days.length ? totalDone / (active.length * days.length) : 0,
  }
}

function proteinDays(s: Snapshot, days: DayKey[]): number {
  const daily = dailyNutrition(s.foodLogs.filter((l) => l.date >= days[0] && l.date <= days.at(-1)!))
  return days.filter((d) => (daily.get(d)?.protein ?? 0) >= s.profile.targets.protein).length
}

function avgKcal(s: Snapshot, days: DayKey[]): number | null {
  const daily = dailyNutrition(s.foodLogs.filter((l) => l.date >= days[0] && l.date <= days.at(-1)!))
  return mean(days.flatMap((d) => (daily.has(d) ? [daily.get(d)!.kcal] : [])))
}

const weightsIn = (s: Snapshot, days: DayKey[]) =>
  mean(s.weights.filter((w) => w.date >= days[0] && w.date <= days.at(-1)!).map((w) => w.kg))

export function buildCoachContext(
  s: Snapshot,
  today: DayKey,
  hour: number,
  formatWeight: CoachContext['formatWeight'],
  /** 'rolling' = last 7 days vs previous 7 (Today). 'calendar' = the week starting `weekStart` (weekly report). */
  period: { kind: 'rolling' } | { kind: 'calendar'; weekStart: DayKey } = { kind: 'rolling' },
): CoachContext {
  const thisDays =
    period.kind === 'rolling'
      ? daysBetween(addDays(today, -6), today)
      : daysBetween(period.weekStart, minDay(addDays(period.weekStart, 6), today))
  const prevStart = period.kind === 'rolling' ? addDays(today, -13) : addDays(period.weekStart, -7)
  const prevDays = daysBetween(prevStart, addDays(prevStart, 6))
  const idx = indexLogs(s.habitLogs)
  const cur = periodHabitStats(s, idx, thisDays)
  const prev = periodHabitStats(s, idx, prevDays)

  const todayLogs = s.foodLogs.filter((l) => l.date === today)
  const todayN = sum(todayLogs)
  const sortedW = [...s.weights].sort((a, b) => a.date.localeCompare(b.date))
  const todayEntry = sortedW.find((w) => w.date === today)
  const prevEntry = sortedW.filter((w) => w.date < today).at(-1)
  const energy = habitByKey(s, 'energy')

  return {
    today,
    hour,
    kcal: todayN.kcal,
    kcalTarget: s.profile.targets.kcal,
    protein: todayN.protein,
    proteinTarget: s.profile.targets.protein,
    proteinDaysThisWeek: proteinDays(s, thisDays),
    avgKcalThisWeek: avgKcal(s, thisDays),
    foodLoggedToday: todayLogs.length > 0,
    todayWeight: todayEntry?.kg ?? null,
    previousWeight: prevEntry?.kg ?? null,
    avg7: weightsIn(s, thisDays),
    prevAvg7: weightsIn(s, prevDays),
    formatWeight,
    energyFreeRun: energy ? avoidedRun(energy, idx, today, addDays) : 0,
    energySlipsThis: cur.slips.energy,
    energySlipsPrev: prev.slips.energy,
    fastFoodSlipsThis: cur.slips.fastfood,
    fastFoodSlipsPrev: prev.slips.fastfood,
    colaSlipsThis: cur.slips.cola,
    colaSlipsPrev: prev.slips.cola,
    workoutsThisWeek: completedCount(s.sessions, thisDays[0], thisDays.at(-1)!),
    plannedThisWeek: plannedCount(s.templates, thisDays[0], addDays(thisDays[0], 6)),
  }
}

const minDay = (a: DayKey, b: DayKey) => (a < b ? a : b)

export interface WeeklySummary {
  weekStart: DayKey
  weekEnd: DayKey
  daysElapsed: number
  avgWeight: number | null
  prevAvgWeight: number | null
  avgKcal: number | null
  kcalTarget: number
  proteinDays: number
  workouts: number
  plannedWorkouts: number
  fastFoodDays: number
  prevFastFoodDays: number
  energyDays: number
  prevEnergyDays: number
  colaDays: number
  walkDays: number
  waterDays: number
  habitCompletion: number
}

export function weeklySummary(s: Snapshot, weekStart: DayKey, today: DayKey): WeeklySummary {
  const weekEnd = addDays(weekStart, 6)
  const days = daysBetween(weekStart, minDay(weekEnd, today))
  const prevDays = daysBetween(addDays(weekStart, -7), addDays(weekStart, -1))
  const idx = indexLogs(s.habitLogs)
  const cur = periodHabitStats(s, idx, days)
  const prev = periodHabitStats(s, idx, prevDays)
  return {
    weekStart,
    weekEnd,
    daysElapsed: days.length,
    avgWeight: weightsIn(s, days),
    prevAvgWeight: weightsIn(s, prevDays),
    avgKcal: avgKcal(s, days),
    kcalTarget: s.profile.targets.kcal,
    proteinDays: proteinDays(s, days),
    workouts: completedCount(s.sessions, weekStart, weekEnd),
    plannedWorkouts: plannedCount(s.templates, weekStart, weekEnd),
    fastFoodDays: cur.slips.fastfood,
    prevFastFoodDays: prev.slips.fastfood,
    energyDays: cur.slips.energy,
    prevEnergyDays: prev.slips.energy,
    colaDays: cur.slips.cola,
    walkDays: cur.done.walk,
    waterDays: cur.done.water,
    habitCompletion: cur.completion,
  }
}

export interface ConsistencyReport {
  label: string
  now: number
  prev: number
  unit: string
  lowerIsBetter: boolean
  verdict: ReturnType<typeof comparePeriods>['verdict']
  change: number | null
}

/** Last 7 days vs the 7 before — no streaks, just a fair comparison. */
export function consistency(s: Snapshot, today: DayKey): { rows: ConsistencyReport[]; workouts4w: { done: number; planned: number } } {
  const cur = daysBetween(addDays(today, -6), today)
  const prv = daysBetween(addDays(today, -13), addDays(today, -7))
  const idx = indexLogs(s.habitLogs)
  const a = periodHabitStats(s, idx, cur)
  const b = periodHabitStats(s, idx, prv)
  const row = (label: string, now: number, prev: number, unit: string, lowerIsBetter: boolean): ConsistencyReport => ({
    label,
    unit,
    lowerIsBetter,
    ...comparePeriods(now, prev, lowerIsBetter),
  })
  const w = (d: DayKey[]) => completedCount(s.sessions, d[0], d.at(-1)!)
  const rows = [
    row('Workouts', w(cur), w(prv), 'sessions', false),
    row('Habit completion', Math.round(a.completion * 100), Math.round(b.completion * 100), '%', false),
    row('Fast food', a.slips.fastfood, b.slips.fastfood, 'days', true),
    row('Energy drinks', a.slips.energy, b.slips.energy, 'days', true),
    row('Cola', a.slips.cola, b.slips.cola, 'days', true),
    row('Fast-food-free', a.done.fastfood, b.done.fastfood, 'days', false),
    row('Energy-drink-free', a.done.energy, b.done.energy, 'days', false),
    row('Cola-free', a.done.cola, b.done.cola, 'days', false),
  ]
  const from4 = addDays(today, -27)
  return {
    rows,
    workouts4w: { done: completedCount(s.sessions, from4, today), planned: plannedCount(s.templates, from4, today) },
  }
}

/** The most recent day with any record — used for Recovery mode. */
export function lastActiveDay(s: Pick<Snapshot, 'foodLogs' | 'weights' | 'habitLogs' | 'sessions' | 'water' | 'cardio'>): DayKey | null {
  let last: DayKey | null = null
  const all = [s.foodLogs, s.weights, s.habitLogs, s.sessions, s.water, s.cardio] as { date: DayKey }[][]
  for (const list of all) for (const r of list) if (!last || r.date > last) last = r.date
  return last
}
