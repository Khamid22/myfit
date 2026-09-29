import type { Profile } from '../../domain/models'
import { nowIso } from '../../lib/ids'
import { db } from '../db'

export const PROFILE_ID = 'me'

export const profileRepo = {
  get: () => db.profile.get(PROFILE_ID),
  async save(p: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = nowIso()
    await db.profile.put({ ...p, id: PROFILE_ID, createdAt: now, updatedAt: now })
  },
  async update(patch: Partial<Profile>) {
    const cur = await db.profile.get(PROFILE_ID)
    if (cur) await db.profile.put({ ...cur, ...patch, updatedAt: nowIso() })
  },
}

export const metaRepo = {
  async get<T>(key: string): Promise<T | undefined> {
    return (await db.meta.get(key))?.value as T | undefined
  },
  set: (key: string, value: unknown) => db.meta.put({ key, value }),
}
