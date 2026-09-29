import { blobToDataUrl, dataUrlToBlob } from '../../lib/image'
import { todayKey } from '../../lib/dates'
import type { ProgressPhoto } from '../../domain/models'
import { DATA_TABLES, db, type DataTable } from '../db'
import { metaRepo } from '../repositories/profile'

export const BACKUP_FORMAT = 'myfit-backup'
export const BACKUP_VERSION = 1

export interface Backup {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: string
  tables: Partial<Record<DataTable, unknown[]>>
}

export interface PhotoBackup {
  format: 'myfit-photos'
  version: number
  exportedAt: string
  photos: (Omit<ProgressPhoto, 'image' | 'thumb'> & { image: string; thumb: string })[]
}

export async function exportData(): Promise<Backup> {
  const tables: Backup['tables'] = {}
  for (const t of DATA_TABLES) tables[t] = await db.table(t).toArray()
  await metaRepo.set('lastBackupAt', new Date().toISOString())
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables }
}

export function parseBackup(text: string): Backup {
  const data = JSON.parse(text) as Backup
  if (data?.format !== BACKUP_FORMAT || typeof data.tables !== 'object') throw new Error('This file is not a MyFit backup.')
  if (data.version > BACKUP_VERSION) throw new Error('This backup was made by a newer version of MyFit.')
  return data
}

export function summarize(b: Backup): string {
  const c = (t: DataTable) => b.tables[t]?.length ?? 0
  return `${c('weights')} weigh-ins, ${c('foodLogs')} food entries, ${c('sessions')} workouts, ${c('habitLogs')} habit records — exported ${new Date(b.exportedAt).toLocaleDateString()}.`
}

/** Replaces all non-photo data with the backup. */
export async function importData(b: Backup): Promise<void> {
  await db.transaction('rw', DATA_TABLES.map((t) => db.table(t)), async () => {
    for (const t of DATA_TABLES) {
      await db.table(t).clear()
      const rows = b.tables[t]
      if (rows?.length) await db.table(t).bulkPut(rows)
    }
  })
}

export async function exportPhotos(): Promise<PhotoBackup> {
  const photos = await db.photos.toArray()
  return {
    format: 'myfit-photos',
    version: 1,
    exportedAt: new Date().toISOString(),
    photos: await Promise.all(
      photos.map(async (p) => ({ ...p, image: await blobToDataUrl(p.image), thumb: await blobToDataUrl(p.thumb) })),
    ),
  }
}

/** Merges photos from a photo backup (existing photos are kept). */
export async function importPhotos(text: string): Promise<number> {
  const data = JSON.parse(text) as PhotoBackup
  if (data?.format !== 'myfit-photos') throw new Error('This file is not a MyFit photo backup.')
  const rows = await Promise.all(
    data.photos.map(async (p) => ({ ...p, image: await dataUrlToBlob(p.image), thumb: await dataUrlToBlob(p.thumb) })),
  )
  await db.photos.bulkPut(rows)
  return rows.length
}

export async function deleteEverything(): Promise<void> {
  await db.delete()
  try {
    localStorage.clear()
  } catch {
    /* ignore */
  }
}

/** Save a file: uses the share sheet on iPhone (→ "Save to Files"), falls back to a download. */
export async function saveJsonFile(obj: unknown, name: string): Promise<void> {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' })
  const file = new File([blob], name, { type: 'application/json' })
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] }) && /iPhone|iPad|iPod/.test(navigator.userAgent)) {
    try {
      await nav.share({ files: [file], title: name })
      return
    } catch (e) {
      if ((e as Error).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const backupFileName = (kind: 'data' | 'photos') => `myfit-${kind}-${todayKey()}.json`
