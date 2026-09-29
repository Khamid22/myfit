/**
 * Interfaces for integrations planned after V1. Nothing here is wired up yet;
 * they document the seams so features can be added without touching screens.
 */
import type { DayKey } from '../lib/dates'
import type { FoodCandidate } from './foodSearch'

export interface ApiClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body: unknown): Promise<T>
}

export interface AuthProvider {
  currentUser(): Promise<{ id: string; email: string } | null>
  signIn(): Promise<void>
  signOut(): Promise<void>
}

/** Pushes local changes (by `updatedAt`) and pulls remote ones; tombstones via `deletedAt`. */
export interface SyncEngine {
  sync(since?: string): Promise<{ pushed: number; pulled: number }>
}

export interface FoodRecognizer {
  recognize(photo: Blob): Promise<FoodCandidate[]>
}

export interface HealthSource {
  steps(day: DayKey): Promise<number | null>
  weightKg(day: DayKey): Promise<number | null>
}

export interface Notifier {
  schedule(opts: { id: string; at: Date; title: string; body: string }): Promise<void>
  cancel(id: string): Promise<void>
}
