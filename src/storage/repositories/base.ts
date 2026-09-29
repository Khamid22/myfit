import type { Table } from 'dexie'
import type { BaseRecord } from '../../domain/models'
import { nowIso, uid } from '../../lib/ids'

export type NewRecord<T extends BaseRecord> = Omit<T, keyof BaseRecord> & Partial<Pick<T, 'id'>>

export function stamp<T extends BaseRecord>(data: NewRecord<T>): T {
  const now = nowIso()
  return { ...data, id: data.id ?? uid(), createdAt: now, updatedAt: now } as T
}

export const alive = <T extends BaseRecord>(r: T | undefined): r is T => !!r && !r.deletedAt

/**
 * Generic repository over a Dexie table. Deletes are soft (tombstones)
 * so a future sync layer can propagate them.
 */
export function repo<T extends BaseRecord>(table: () => Table<T, string>) {
  return {
    async all(): Promise<T[]> {
      return (await table().toArray()).filter(alive)
    },
    async byDate(date: string): Promise<T[]> {
      return (await table().where('date').equals(date).toArray()).filter(alive)
    },
    async between(from: string, to: string): Promise<T[]> {
      return (await table().where('date').between(from, to, true, true).toArray()).filter(alive)
    },
    async get(id: string): Promise<T | undefined> {
      const r = await table().get(id)
      return alive(r) ? r : undefined
    },
    async add(data: NewRecord<T>): Promise<T> {
      const rec = stamp<T>(data)
      await table().put(rec)
      return rec
    },
    async update(id: string, patch: Partial<T>): Promise<void> {
      const cur = await table().get(id)
      if (!cur) return
      await table().put({ ...cur, ...patch, updatedAt: nowIso() })
    },
    async remove(id: string): Promise<void> {
      const cur = await table().get(id)
      if (!cur) return
      const now = nowIso()
      await table().put({ ...cur, deletedAt: now, updatedAt: now })
    },
  }
}
