import { scale } from '../../domain/nutrition/nutrition'
import type { Food, FoodLog, MealSlot, SavedMeal } from '../../domain/models'
import type { DayKey } from '../../lib/dates'
import { nowIso } from '../../lib/ids'
import { db } from '../db'
import { repo, stamp, type NewRecord } from './base'

const base = repo<Food>(() => db.foods)

export const foodsRepo = {
  ...base,
  create: (f: Omit<NewRecord<Food>, 'favorite' | 'useCount'> & Partial<Pick<Food, 'favorite' | 'useCount'>>) =>
    base.add({ favorite: false, useCount: 0, ...f }),
  async toggleFavorite(id: string) {
    const f = await base.get(id)
    if (f) await base.update(id, { favorite: !f.favorite })
  },
  async markUsed(id: string, qty: number) {
    const f = await db.foods.get(id)
    if (f) await db.foods.put({ ...f, useCount: f.useCount + 1, lastUsedAt: nowIso(), lastQty: qty })
  },
}

export const mealsRepo = repo<SavedMeal>(() => db.meals)

const logs = repo<FoodLog>(() => db.foodLogs)

export const foodLogRepo = {
  ...logs,
  async logFood(food: Food, qty: number, date: DayKey, meal: MealSlot) {
    const rec = stamp<FoodLog>({ date, meal, foodId: food.id, name: food.name, qty, unit: food.unit, ...scale(food, qty) })
    await db.transaction('rw', db.foodLogs, db.foods, async () => {
      await db.foodLogs.put(rec)
      await foodsRepo.markUsed(food.id, qty)
    })
    return rec.id
  },
  async logMeal(meal: SavedMeal, date: DayKey, slot: MealSlot) {
    const foods = await db.foods.bulkGet(meal.items.map((i) => i.foodId))
    await db.transaction('rw', db.foodLogs, db.foods, db.meals, async () => {
      for (const [i, item] of meal.items.entries()) {
        const f = foods[i]
        if (!f || f.deletedAt) continue
        await db.foodLogs.put(
          stamp<FoodLog>({ date, meal: slot, foodId: f.id, name: f.name, qty: item.qty, unit: f.unit, ...scale(f, item.qty) }),
        )
        await foodsRepo.markUsed(f.id, item.qty)
      }
      await db.meals.update(meal.id, { lastUsedAt: nowIso() })
    })
  },
  async copyDay(from: DayKey, to: DayKey, meal?: MealSlot) {
    const src = (await logs.byDate(from)).filter((l) => !meal || l.meal === meal)
    await db.foodLogs.bulkPut(
      src.map(({ id: _id, createdAt: _c, updatedAt: _u, ...rest }) => stamp<FoodLog>({ ...rest, date: to })),
    )
    return src.length
  },
}
