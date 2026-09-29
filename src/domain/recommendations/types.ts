import type { DayKey } from '../../lib/dates'

export type Tone = 'good' | 'info' | 'calm'
export type Scope = 'day' | 'week'

export interface Recommendation {
  id: string
  text: string
  tone: Tone
}

/**
 * Everything a rule may look at. Built from local data by `buildCoachContext`.
 * A future AI coach receives the same context, so it can replace or extend the rules.
 */
export interface CoachContext {
  today: DayKey
  hour: number
  // nutrition
  kcal: number
  kcalTarget: number
  protein: number
  proteinTarget: number
  proteinDaysThisWeek: number
  avgKcalThisWeek: number | null
  foodLoggedToday: boolean
  // weight
  todayWeight: number | null
  previousWeight: number | null
  avg7: number | null
  prevAvg7: number | null
  formatWeight: (kg: number, signed?: boolean) => string
  // habits (slips = days the habit was recorded as "had one")
  energyFreeRun: number
  energySlipsThis: number
  energySlipsPrev: number
  fastFoodSlipsThis: number
  fastFoodSlipsPrev: number
  colaSlipsThis: number
  colaSlipsPrev: number
  // workouts
  workoutsThisWeek: number
  plannedThisWeek: number
}

export interface Rule {
  id: string
  scope: Scope
  tone: Tone
  when: (c: CoachContext) => boolean
  text: (c: CoachContext) => string
}

/** The contract a future AI coach implements. */
export interface RecommendationProvider {
  recommend(ctx: CoachContext, scope: Scope, max: number): Promise<Recommendation[]> | Recommendation[]
}
