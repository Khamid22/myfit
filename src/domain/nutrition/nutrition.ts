import type { Food, FoodLog, MealSlot, Nutrients, SavedMeal, Targets } from '../models'

export const MEALS: { id: MealSlot; label: string }[] = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snacks' },
]

export const ZERO: Nutrients = { kcal: 0, protein: 0, carbs: 0, fat: 0 }

export function scale(food: Nutrients & { servingSize: number }, qty: number): Nutrients {
  const x = food.servingSize > 0 ? qty / food.servingSize : 0
  return { kcal: food.kcal * x, protein: food.protein * x, carbs: food.carbs * x, fat: food.fat * x }
}

export function sum(items: Nutrients[]): Nutrients {
  return items.reduce(
    (a, b) => ({ kcal: a.kcal + b.kcal, protein: a.protein + b.protein, carbs: a.carbs + b.carbs, fat: a.fat + b.fat }),
    { ...ZERO },
  )
}

export function mealTotals(meal: SavedMeal, foods: Map<string, Food>): Nutrients {
  return sum(
    meal.items.flatMap((it) => {
      const f = foods.get(it.foodId)
      return f ? [scale(f, it.qty)] : []
    }),
  )
}

export function byMeal(logs: FoodLog[]): Record<MealSlot, FoodLog[]> {
  const out: Record<MealSlot, FoodLog[]> = { breakfast: [], lunch: [], dinner: [], snack: [] }
  for (const l of logs) out[l.meal].push(l)
  return out
}

/** Suggest a meal slot from the time of day. */
export function mealForNow(d = new Date()): MealSlot {
  const h = d.getHours()
  if (h < 5) return 'snack'
  if (h < 11) return 'breakfast'
  if (h < 16) return 'lunch'
  if (h < 21) return 'dinner'
  return 'snack'
}

export interface CalorieStatus {
  target: number
  consumed: number
  remaining: number
  over: number
  ratio: number
}

export function calorieStatus(consumed: number, t: Targets): CalorieStatus {
  const remaining = t.kcal - consumed
  return {
    target: t.kcal,
    consumed,
    remaining: Math.max(0, remaining),
    over: Math.max(0, -remaining),
    ratio: t.kcal > 0 ? consumed / t.kcal : 0,
  }
}

export function unitLabel(unit: string, qty = 1): string {
  if (unit === 'piece') return qty === 1 ? 'piece' : 'pieces'
  if (unit === 'serving') return qty === 1 ? 'serving' : 'servings'
  return unit
}

export function describeServing(f: Pick<Food, 'servingSize' | 'unit'>): string {
  return `${f.servingSize} ${unitLabel(f.unit, f.servingSize)}`
}
