import type { CardioEntry, Measurement, ProgressPhoto, WaterLog, WeightEntry } from '../../domain/models'
import type { DayKey } from '../../lib/dates'
import { nowIso } from '../../lib/ids'
import { db } from '../db'
import { alive, repo, stamp } from './base'

const weights = repo<WeightEntry>(() => db.weights)

export const weightRepo = {
  ...weights,
  /** One weigh-in per day: saving again replaces that day's entry. Nothing else changes. */
  async setForDay(date: DayKey, kg: number, note?: string) {
    const existing = (await db.weights.where('date').equals(date).toArray()).find(alive)
    if (existing) await db.weights.put({ ...existing, kg, note: note ?? existing.note, updatedAt: nowIso() })
    else await db.weights.put(stamp<WeightEntry>({ date, kg, note }))
  },
}

export const measurementRepo = repo<Measurement>(() => db.measurements)
export const cardioRepo = repo<CardioEntry>(() => db.cardio)

const water = repo<WaterLog>(() => db.water)
export const waterRepo = {
  ...water,
  addMl: (date: DayKey, ml: number) => water.add({ date, ml }),
  async undoLast(date: DayKey) {
    const list = (await water.byDate(date)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    const last = list.at(-1)
    if (last) await water.remove(last.id)
  },
}

export const photoRepo = {
  all: () => db.photos.orderBy('date').toArray(),
  add: (p: Omit<ProgressPhoto, 'id' | 'createdAt' | 'updatedAt'>) => db.photos.put(stamp<ProgressPhoto>(p)),
  /** Photos are hard-deleted: keeping the image blob as a tombstone would defeat the point. */
  remove: (id: string) => db.photos.delete(id),
  update: (id: string, patch: Partial<ProgressPhoto>) => db.photos.update(id, { ...patch, updatedAt: nowIso() }),
}
