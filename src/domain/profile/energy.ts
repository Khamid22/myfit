import type { ActivityLevel, Goal, Sex, Targets } from '../models'

export const ACTIVITY_LEVELS: { id: ActivityLevel; label: string; hint: string; factor: number }[] = [
  { id: 'sedentary', label: 'Sedentary', hint: 'Desk job, little exercise', factor: 1.2 },
  { id: 'light', label: 'Lightly active', hint: 'Exercise 1–3 days a week', factor: 1.375 },
  { id: 'moderate', label: 'Moderately active', hint: 'Exercise 3–5 days a week', factor: 1.55 },
  { id: 'very', label: 'Very active', hint: 'Hard exercise 6–7 days a week', factor: 1.725 },
  { id: 'extra', label: 'Extremely active', hint: 'Physical job plus training', factor: 1.9 },
]

export interface EnergyInput {
  sex: Sex
  age: number
  heightCm: number
  weightKg: number
  activity: ActivityLevel
  goal: Goal
  goalWeightKg: number
}

export interface EnergyEstimate {
  bmr: number
  maintenance: number
  target: number
  adjustment: number
  floorApplied: boolean
}

/** Mifflin–St Jeor resting energy expenditure. */
export function bmrMifflin(sex: Sex, weightKg: number, heightCm: number, age: number): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161)
}

const roundTo = (n: number, step: number) => Math.round(n / step) * step

/**
 * Evidence-based starting estimate. The deficit is moderate
 * (the smaller of 500 kcal and 20 % of maintenance), and never
 * below a sensible floor — no crash diets.
 */
export function estimateEnergy(i: EnergyInput): EnergyEstimate {
  const factor = ACTIVITY_LEVELS.find((a) => a.id === i.activity)?.factor ?? 1.375
  const bmr = bmrMifflin(i.sex, i.weightKg, i.heightCm, i.age)
  const maintenance = bmr * factor
  let adjustment = 0
  if (i.goal === 'lose') adjustment = -Math.min(500, maintenance * 0.2)
  if (i.goal === 'gain') adjustment = Math.min(300, maintenance * 0.1)
  let target = maintenance + adjustment
  const floor = i.sex === 'male' ? 1500 : 1200
  // Never below the floor; if maintenance itself is under it, don't diet below maintenance.
  const minimum = Math.min(floor, maintenance)
  const floorApplied = target < minimum
  if (floorApplied) target = minimum
  return {
    bmr: Math.round(bmr),
    maintenance: roundTo(maintenance, 10),
    target: roundTo(target, 10),
    adjustment: Math.round(adjustment),
    floorApplied,
  }
}

/**
 * Protein ≈ 1.6 g/kg of a reference weight (goal weight when losing, which
 * avoids inflated targets at higher body weights), fat ≈ 27 % of energy,
 * carbohydrates fill the rest.
 */
export function macroTargets(kcal: number, goal: Goal, weightKg: number, goalWeightKg: number) {
  const ref = goal === 'lose' ? Math.min(weightKg, goalWeightKg) : weightKg
  const protein = roundTo(Math.min(1.6 * ref, 220), 5)
  const fat = roundTo((kcal * 0.27) / 9, 5)
  const carbs = Math.max(0, roundTo((kcal - protein * 4 - fat * 9) / 4, 5))
  return { protein, carbs, fat }
}

export function calculatedTargets(i: EnergyInput): Targets {
  const e = estimateEnergy(i)
  return { kcal: e.target, ...macroTargets(e.target, i.goal, i.weightKg, i.goalWeightKg), source: 'calculated' }
}
