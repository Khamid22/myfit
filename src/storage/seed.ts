import { FOOD_DATABASE, STARTER_FOODS } from '../data/foodDatabase'
import type { Exercise, Food, HabitDef, SavedMeal, WorkoutTemplate } from '../domain/models'
import { db } from './db'
import { stamp } from './repositories/base'
import type { ExerciseType } from '../domain/models'

export const DEFAULT_HABITS: Omit<HabitDef, 'id' | 'createdAt' | 'updatedAt'>[] = [
  { name: 'No Fast Food', kind: 'avoid', icon: 'hamburger', order: 0, active: true, key: 'fastfood' },
  { name: 'No Cola', kind: 'avoid', icon: 'cup-soda', order: 1, active: true, key: 'cola' },
  { name: 'No Energy Drink', kind: 'avoid', icon: 'zap', order: 2, active: true, key: 'energy' },
  { name: 'Workout', kind: 'do', icon: 'dumbbell', order: 3, active: true, auto: 'workout', key: 'workout' },
  { name: 'Walking / Steps', kind: 'do', icon: 'footprints', order: 4, active: true, auto: 'walk', key: 'walk' },
  { name: 'Water Goal', kind: 'do', icon: 'droplets', order: 5, active: true, auto: 'water', key: 'water' },
]

const EXERCISES: [string, ExerciseType][] = [
  ['Bench Press', 'weighted'],
  ['Incline Dumbbell Press', 'weighted'],
  ['Chest Fly', 'weighted'],
  ['Triceps Pushdown', 'weighted'],
  ['Lat Pulldown', 'weighted'],
  ['Seated Cable Row', 'weighted'],
  ['Dumbbell Row', 'weighted'],
  ['Biceps Curl', 'weighted'],
  ['Squat', 'weighted'],
  ['Leg Press', 'weighted'],
  ['Romanian Deadlift', 'weighted'],
  ['Overhead Press', 'weighted'],
  ['Lateral Raise', 'weighted'],
  ['Push-ups', 'reps'],
  ['Pull-ups', 'reps'],
  ['Plank', 'timed'],
]

const TEMPLATES: [string, number[], string[]][] = [
  ['Chest + Triceps', [0], ['Bench Press', 'Incline Dumbbell Press', 'Chest Fly', 'Triceps Pushdown', 'Push-ups']],
  ['Back + Biceps', [2], ['Lat Pulldown', 'Seated Cable Row', 'Dumbbell Row', 'Biceps Curl', 'Pull-ups']],
  ['Legs + Shoulders', [4], ['Squat', 'Leg Press', 'Romanian Deadlift', 'Overhead Press', 'Lateral Raise', 'Plank']],
]

/** Starter content created once, at the end of onboarding. No fake history. */
export async function seedStarterContent() {
  await db.transaction('rw', [db.foods, db.meals, db.habits, db.exercises, db.templates], async () => {
    if ((await db.habits.count()) === 0) await db.habits.bulkPut(DEFAULT_HABITS.map((h) => stamp<HabitDef>(h)))

    if ((await db.foods.count()) === 0) {
      const foods = STARTER_FOODS.flatMap((key) => {
        const c = FOOD_DATABASE.find((f) => f.key === key)
        return c
          ? [
              stamp<Food>({
                name: c.name.replace(', cooked', '').replace(', large', '').replace(', medium', '').replace(', 2%', ''),
                servingSize: c.size,
                unit: c.unit,
                gramsPerUnit: c.g,
                kcal: c.kcal,
                protein: c.protein,
                carbs: c.carbs,
                fat: c.fat,
                favorite: false,
                useCount: 0,
                source: c.src,
              }),
            ]
          : []
      })
      await db.foods.bulkPut(foods)
      const find = (prefix: string) => foods.find((f) => f.name.startsWith(prefix))!
      await db.meals.put(
        stamp<SavedMeal>({
          name: 'Usual Breakfast',
          items: [
            { foodId: find('Egg').id, qty: 3 },
            { foodId: find('Greek yogurt').id, qty: 150 },
            { foodId: find('Banana').id, qty: 1 },
          ],
        }),
      )
    }

    if ((await db.exercises.count()) === 0) {
      const ex = EXERCISES.map(([name, type]) => stamp<Exercise>({ name, type }))
      await db.exercises.bulkPut(ex)
      const id = (n: string) => ex.find((e) => e.name === n)!.id
      await db.templates.bulkPut(
        TEMPLATES.map(([name, weekdays, list], order) =>
          stamp<WorkoutTemplate>({ name, weekdays, exerciseIds: list.map(id), order }),
        ),
      )
    }
  })
}
