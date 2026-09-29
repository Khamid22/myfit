/** A calendar day in the user's local time, formatted "YYYY-MM-DD". */
export type DayKey = string

const pad = (n: number) => String(n).padStart(2, '0')

export function dayKey(d: Date = new Date()): DayKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Noon avoids DST edge cases when doing day arithmetic. */
export function parseDay(k: DayKey): Date {
  return new Date(`${k}T12:00:00`)
}

export function todayKey(): DayKey {
  return dayKey(new Date())
}

export function addDays(k: DayKey, n: number): DayKey {
  const d = parseDay(k)
  d.setDate(d.getDate() + n)
  return dayKey(d)
}

/** Whole days from b to a (a − b). */
export function diffDays(a: DayKey, b: DayKey): number {
  return Math.round((parseDay(a).getTime() - parseDay(b).getTime()) / 86_400_000)
}

/** 0 = Monday … 6 = Sunday. */
export function weekdayIndex(k: DayKey): number {
  return (parseDay(k).getDay() + 6) % 7
}

export function startOfWeek(k: DayKey): DayKey {
  return addDays(k, -weekdayIndex(k))
}

/** Inclusive list of days from `from` to `to`. */
export function daysBetween(from: DayKey, to: DayKey): DayKey[] {
  const out: DayKey[] = []
  for (let k = from; k <= to; k = addDays(k, 1)) out.push(k)
  return out
}

export function formatDay(k: DayKey, opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }): string {
  return parseDay(k).toLocaleDateString('en-US', opts)
}

export function relativeDayLabel(k: DayKey, today: DayKey = todayKey()): string {
  const d = diffDays(today, k)
  if (d === 0) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d === -1) return 'Tomorrow'
  return formatDay(k, { weekday: 'short', month: 'short', day: 'numeric' })
}

export function greeting(date = new Date()): string {
  const h = date.getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
