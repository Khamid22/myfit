import type { Exercise, ExerciseType, SessionExercise, WorkoutSession, WorkoutTemplate } from '../../domain/models'
import { todayKey, type DayKey } from '../../lib/dates'
import { nowIso } from '../../lib/ids'
import { db } from '../db'
import { alive, repo, stamp } from './base'

const exercises = repo<Exercise>(() => db.exercises)

export const exerciseRepo = {
  ...exercises,
  /** Find by name (case-insensitive) or create — lets templates be typed as plain lines. */
  async ensure(name: string, type: ExerciseType = guessType(name)): Promise<Exercise> {
    const clean = name.trim()
    const all = await exercises.all()
    const hit = all.find((e) => e.name.toLowerCase() === clean.toLowerCase())
    return hit ?? exercises.add({ name: clean, type })
  },
}

export function guessType(name: string): ExerciseType {
  if (/plank|hold|hang|wall sit/i.test(name)) return 'timed'
  if (/push-?up|pull-?up|chin-?up|dip|sit-?up|crunch|burpee|squat jump|air squat|lunge walk/i.test(name)) return 'reps'
  return 'weighted'
}

const templates = repo<WorkoutTemplate>(() => db.templates)
export const templateRepo = {
  ...templates,
  async ordered() {
    return (await templates.all()).sort((a, b) => a.order - b.order)
  },
}

const sessions = repo<WorkoutSession>(() => db.sessions)

export const sessionRepo = {
  ...sessions,
  async active(): Promise<WorkoutSession | undefined> {
    return (await db.sessions.toArray()).find((s) => alive(s) && s.kind === 'session' && !s.finishedAt)
  },
  async start(t: WorkoutTemplate | null, name = 'Custom workout', date: DayKey = todayKey()): Promise<WorkoutSession> {
    const rec = stamp<WorkoutSession>({
      date,
      templateId: t?.id,
      name: t?.name ?? name,
      kind: 'session',
      exercises: (t?.exerciseIds ?? []).map((exerciseId) => ({ exerciseId, sets: [{}] })),
      startedAt: nowIso(),
    })
    await db.sessions.put(rec)
    return rec
  },
  setExercises: (id: string, exercises: SessionExercise[]) => sessions.update(id, { exercises }),
  finish: (id: string) => sessions.update(id, { finishedAt: nowIso() }),
  /** Discarding an unfinished session removes it entirely — it never counted. */
  discard: (id: string) => db.sessions.delete(id),
  /** A single bodyweight entry (e.g. push-ups) outside a full session. */
  async quickLog(ex: Exercise, sets: SessionExercise['sets'], date: DayKey = todayKey()) {
    const now = nowIso()
    await db.sessions.put(
      stamp<WorkoutSession>({ date, name: ex.name, kind: 'quick', exercises: [{ exerciseId: ex.id, sets }], startedAt: now, finishedAt: now }),
    )
  },
}
