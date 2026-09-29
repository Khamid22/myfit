import { int } from '../../lib/format'
import type { Rule } from './types'

/**
 * Deterministic coaching rules — plain data, checked in order.
 * Wording principle: no guilt, no streak loss, no "you gained".
 */
export const RULES: Rule[] = [
  // ——— Day ———
  {
    id: 'over-target',
    scope: 'day',
    tone: 'calm',
    when: (c) => c.kcal > c.kcalTarget,
    text: (c) =>
      `You're ${int(c.kcal - c.kcalTarget)} kcal above today's target. That's okay — no need to skip meals tomorrow. Simply return to your normal target.`,
  },
  {
    id: 'close-to-target',
    scope: 'day',
    tone: 'info',
    when: (c) => c.kcal > 0 && c.kcal <= c.kcalTarget && c.kcalTarget - c.kcal < 400,
    text: () => `You're close to today's calorie target. Consider a lighter meal.`,
  },
  {
    id: 'protein-gap',
    scope: 'day',
    tone: 'info',
    when: (c) => c.hour >= 15 && c.foodLoggedToday && c.proteinTarget - c.protein >= 25,
    text: (c) => `You still need approximately ${int(c.proteinTarget - c.protein)} g of protein today.`,
  },
  {
    id: 'protein-hit',
    scope: 'day',
    tone: 'good',
    when: (c) => c.proteinTarget > 0 && c.protein >= c.proteinTarget,
    text: () => `Protein target reached today.`,
  },
  {
    id: 'weight-fluctuation',
    scope: 'day',
    tone: 'calm',
    when: (c) => c.todayWeight != null && c.previousWeight != null && c.todayWeight > c.previousWeight && c.avg7 != null,
    text: (c) => `Daily weight fluctuates. Your 7-day average is ${c.formatWeight(c.avg7!)} — focus on the weekly trend.`,
  },
  {
    id: 'trend-down',
    scope: 'day',
    tone: 'good',
    when: (c) => c.avg7 != null && c.prevAvg7 != null && c.avg7 < c.prevAvg7 - 0.05,
    text: (c) => `Your 7-day average is ${c.formatWeight(c.prevAvg7! - c.avg7!)} lower than a week ago.`,
  },
  {
    id: 'energy-free-run',
    scope: 'day',
    tone: 'good',
    when: (c) => c.energyFreeRun >= 2,
    text: (c) => `${c.energyFreeRun} days without energy drinks.`,
  },
  {
    id: 'energy-up',
    scope: 'day',
    tone: 'info',
    when: (c) => c.energySlipsThis >= 2 && c.energySlipsThis > c.energySlipsPrev,
    text: () => `Energy drink consumption increased this week.`,
  },
  {
    id: 'fast-food-improving',
    scope: 'day',
    tone: 'good',
    when: (c) => c.fastFoodSlipsThis < c.fastFoodSlipsPrev,
    text: () => `Fast food frequency is improving.`,
  },
  {
    id: 'room-for-dinner',
    scope: 'day',
    tone: 'info',
    when: (c) => c.hour >= 14 && c.hour < 21 && c.kcalTarget - c.kcal > 600,
    text: () => `You have enough calories left for a normal dinner.`,
  },
  {
    id: 'first-log',
    scope: 'day',
    tone: 'info',
    when: (c) => !c.foodLoggedToday,
    text: () => `A quick entry beats a perfect one. Log your next meal when you're ready.`,
  },

  // ——— Week ———
  {
    id: 'week-trend-down',
    scope: 'week',
    tone: 'good',
    when: (c) => c.avg7 != null && c.prevAvg7 != null && c.avg7 < c.prevAvg7 - 0.05,
    text: () => `Your weekly weight trend decreased.`,
  },
  {
    id: 'week-trend-up',
    scope: 'week',
    tone: 'calm',
    when: (c) => c.avg7 != null && c.prevAvg7 != null && c.avg7 > c.prevAvg7 + 0.05,
    text: (c) =>
      `Your weekly average is ${c.formatWeight(c.avg7! - c.prevAvg7!)} higher. Short-term changes are normal — the long-term trend is what counts.`,
  },
  {
    id: 'week-trend-steady',
    scope: 'week',
    tone: 'info',
    when: (c) => c.avg7 != null && c.prevAvg7 != null && Math.abs(c.avg7 - c.prevAvg7) <= 0.05,
    text: () => `Your weekly weight trend held steady.`,
  },
  {
    id: 'week-all-workouts',
    scope: 'week',
    tone: 'good',
    when: (c) => c.plannedThisWeek > 0 && c.workoutsThisWeek >= c.plannedThisWeek,
    text: () => `You completed all planned workouts.`,
  },
  {
    id: 'week-some-workouts',
    scope: 'week',
    tone: 'info',
    when: (c) => c.plannedThisWeek > 0 && c.workoutsThisWeek > 0 && c.workoutsThisWeek < c.plannedThisWeek,
    text: (c) => `You completed ${c.workoutsThisWeek} of ${c.plannedThisWeek} planned workouts. Every session counts.`,
  },
  {
    id: 'week-energy-down',
    scope: 'week',
    tone: 'good',
    when: (c) => c.energySlipsThis < c.energySlipsPrev,
    text: () => `Energy drink consumption decreased compared with last week.`,
  },
  {
    id: 'week-energy-up',
    scope: 'week',
    tone: 'info',
    when: (c) => c.energySlipsThis > c.energySlipsPrev,
    text: () => `Energy drink consumption increased compared with last week.`,
  },
  {
    id: 'week-fastfood-down',
    scope: 'week',
    tone: 'good',
    when: (c) => c.fastFoodSlipsThis < c.fastFoodSlipsPrev,
    text: (c) => `Fast food days went from ${c.fastFoodSlipsPrev} to ${c.fastFoodSlipsThis}.`,
  },
  {
    id: 'week-cola-down',
    scope: 'week',
    tone: 'good',
    when: (c) => c.colaSlipsThis < c.colaSlipsPrev,
    text: () => `Cola consumption decreased compared with last week.`,
  },
  {
    id: 'week-protein',
    scope: 'week',
    tone: 'info',
    when: (c) => c.avgKcalThisWeek != null,
    text: (c) => `Protein target reached on ${c.proteinDaysThisWeek} of 7 days.`,
  },
]
