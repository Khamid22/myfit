import { addDays, type DayKey } from '../../lib/dates'
import { mean } from '../../lib/format'
import type { WeightEntry } from '../models'

/** Mean of weigh-ins within the 7 days ending on `day` (inclusive). Missing days are skipped, not zero-filled. */
export function rollingAverage(entries: WeightEntry[], day: DayKey, window = 7): number | null {
  const from = addDays(day, -(window - 1))
  return mean(entries.filter((e) => e.date >= from && e.date <= day).map((e) => e.kg))
}

export interface TrendPoint {
  date: DayKey
  kg?: number
  avg: number | null
}

/** One point per calendar day from the first entry to `to`, with the rolling average. */
export function trendSeries(entries: WeightEntry[], from: DayKey, to: DayKey): TrendPoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const byDay = new Map(sorted.map((e) => [e.date, e.kg]))
  const out: TrendPoint[] = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    out.push({ date: d, kg: byDay.get(d), avg: rollingAverage(sorted, d) })
  }
  return out
}

export interface WeightStats {
  current: number | null
  currentDate: DayKey | null
  start: number | null
  lowest: number | null
  avg7: number | null
  prevAvg7: number | null
  change30: number | null
  totalChange: number | null
}

export function weightStats(entries: WeightEntry[], today: DayKey, startWeightKg?: number): WeightStats {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const last = sorted.at(-1)
  const start = startWeightKg ?? sorted[0]?.kg ?? null
  const avg7 = rollingAverage(sorted, today)
  const prevAvg7 = rollingAverage(sorted, addDays(today, -7))
  const avg30ago = rollingAverage(sorted, addDays(today, -30))
  const trendNow = avg7 ?? last?.kg ?? null
  return {
    current: last?.kg ?? null,
    currentDate: last?.date ?? null,
    start,
    lowest: sorted.length ? Math.min(...sorted.map((e) => e.kg)) : null,
    avg7,
    prevAvg7,
    change30: trendNow != null && avg30ago != null ? trendNow - avg30ago : null,
    totalChange: trendNow != null && start != null ? trendNow - start : null,
  }
}
