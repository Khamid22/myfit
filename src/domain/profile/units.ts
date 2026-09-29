import type { LengthUnit, WeightUnit } from '../models'

const KG_PER_LB = 0.45359237
const CM_PER_IN = 2.54

/** Everything is stored in kg / cm; these convert only for display and input. */
export const toDisplayWeight = (kg: number, u: WeightUnit) => (u === 'kg' ? kg : kg / KG_PER_LB)
export const fromDisplayWeight = (v: number, u: WeightUnit) => (u === 'kg' ? v : v * KG_PER_LB)
export const toDisplayLength = (cm: number, u: LengthUnit) => (u === 'cm' ? cm : cm / CM_PER_IN)
export const fromDisplayLength = (v: number, u: LengthUnit) => (u === 'cm' ? v : v * CM_PER_IN)
