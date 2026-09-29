import type { HabitDef, HabitLog, HabitStatus } from '../../domain/models'
import type { DayKey } from '../../lib/dates'
import { nowIso } from '../../lib/ids'
import { db } from '../db'
import { repo, stamp } from './base'

const defs = repo<HabitDef>(() => db.habits)

export const habitRepo = {
  ...defs,
  async ordered() {
    return (await defs.all()).sort((a, b) => a.order - b.order)
  },
  async reorder(ids: string[]) {
    await db.transaction('rw', db.habits, async () => {
      for (const [order, id] of ids.entries()) await db.habits.update(id, { order, updatedAt: nowIso() })
    })
  },
}

export const habitLogRepo = {
  ...repo<HabitLog>(() => db.habitLogs),
  /** Set or clear the status for a habit on a day. Reuses the row so there is one per (day, habit). */
  async set(date: DayKey, habitId: string, status: HabitStatus | null) {
    const existing = await db.habitLogs.where('[date+habitId]').equals([date, habitId]).first()
    const now = nowIso()
    if (existing) {
      await db.habitLogs.put(
        status
          ? { ...existing, status, deletedAt: undefined, updatedAt: now }
          : { ...existing, deletedAt: now, updatedAt: now },
      )
    } else if (status) {
      await db.habitLogs.put(stamp<HabitLog>({ date, habitId, status }))
    }
  },
}
