import type { DayKey } from '../../lib/dates'
import type { HabitDef, HabitLog, HabitStatus } from '../models'

/** Facts from other logs that can complete a habit automatically. */
export interface DaySignals {
  workout: boolean
  water: boolean
  walk: boolean
}

export const NO_SIGNALS: DaySignals = { workout: false, water: false, walk: false }

export function resolveStatus(h: HabitDef, log: HabitLog | undefined, sig: DaySignals = NO_SIGNALS): HabitStatus | undefined {
  if (log) return log.status
  if (h.auto && sig[h.auto]) return 'done'
  return undefined
}

export type LogIndex = Map<string, HabitLog> // `${date}|${habitId}`
export const logKey = (date: DayKey, habitId: string) => `${date}|${habitId}`

export function indexLogs(logs: HabitLog[]): LogIndex {
  return new Map(logs.map((l) => [logKey(l.date, l.habitId), l]))
}

export interface HabitCounts {
  done: number
  slipped: number
  days: number
}

export function habitCounts(
  h: HabitDef,
  idx: LogIndex,
  signals: Map<DayKey, DaySignals>,
  days: DayKey[],
): HabitCounts {
  let done = 0
  let slipped = 0
  for (const d of days) {
    const s = resolveStatus(h, idx.get(logKey(d, h.id)), signals.get(d))
    if (s === 'done') done++
    if (s === 'slipped') slipped++
  }
  return { done, slipped, days: days.length }
}

export interface PeriodComparison {
  now: number
  prev: number
  /** Relative change, e.g. −0.75 for "4 → 1". Null when there's no baseline. */
  change: number | null
  verdict: 'improving' | 'steady' | 'higher' | 'lower'
}

/** Compare two periods. For "slip" counts lower is better; for completions higher is better. */
export function comparePeriods(now: number, prev: number, lowerIsBetter: boolean): PeriodComparison {
  const change = prev > 0 ? (now - prev) / prev : null
  let verdict: PeriodComparison['verdict'] = 'steady'
  if (now !== prev) {
    const better = lowerIsBetter ? now < prev : now > prev
    verdict = better ? 'improving' : lowerIsBetter ? 'higher' : 'lower'
  }
  return { now, prev, change, verdict }
}

/** Consecutive days (ending today or yesterday) where an avoid-habit was marked done. */
export function avoidedRun(h: HabitDef, idx: LogIndex, today: DayKey, addDays: (k: DayKey, n: number) => DayKey): number {
  let n = 0
  let d = idx.get(logKey(today, h.id))?.status === 'done' ? today : addDays(today, -1)
  while (idx.get(logKey(d, h.id))?.status === 'done') {
    n++
    d = addDays(d, -1)
  }
  return n
}
