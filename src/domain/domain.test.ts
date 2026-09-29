import { describe, expect, it } from 'vitest'
import { bmrMifflin, calculatedTargets, estimateEnergy, macroTargets } from './profile/energy'
import { fromDisplayWeight, toDisplayWeight } from './profile/units'
import { calorieStatus, scale, sum } from './nutrition/nutrition'
import { rollingAverage, weightStats } from './weight/weight'
import { compareTopSets, plannedCount, topSet } from './workouts/workouts'
import { comparePeriods } from './habits/habits'
import { runRules } from './recommendations/engine'
import { RULES } from './recommendations/rules'
import type { CoachContext } from './recommendations/types'
import type { WeightEntry, WorkoutTemplate } from './models'
import { addDays, weekdayIndex } from '../lib/dates'

const w = (date: string, kg: number) => ({ id: date, createdAt: '', updatedAt: '', date, kg }) as WeightEntry

describe('energy', () => {
  it('matches Mifflin-St Jeor', () => {
    expect(bmrMifflin('male', 119, 180, 30)).toBeCloseTo(10 * 119 + 6.25 * 180 - 150 + 5)
    expect(bmrMifflin('female', 70, 165, 30)).toBeCloseTo(700 + 1031.25 - 150 - 161)
  })
  it('uses a moderate deficit, never more than 500 kcal', () => {
    const e = estimateEnergy({ sex: 'male', age: 30, heightCm: 180, weightKg: 119, activity: 'light', goal: 'lose', goalWeightKg: 100 })
    expect(e.maintenance - e.target).toBeLessThanOrEqual(510)
    expect(e.target).toBeGreaterThanOrEqual(1500)
  })
  it('respects the calorie floor', () => {
    const e = estimateEnergy({ sex: 'female', age: 60, heightCm: 150, weightKg: 45, activity: 'sedentary', goal: 'lose', goalWeightKg: 42 })
    expect(e.target).toBeGreaterThanOrEqual(Math.min(1200, e.maintenance - 10))
    expect(estimateEnergy({ sex: 'female', age: 30, heightCm: 160, weightKg: 60, activity: 'sedentary', goal: 'lose', goalWeightKg: 55 }).target).toBeGreaterThanOrEqual(1200)
  })
  it('macros add up to roughly the calorie target', () => {
    const m = macroTargets(2300, 'lose', 119, 100)
    expect(m.protein).toBe(160)
    expect(Math.abs(m.protein * 4 + m.carbs * 4 + m.fat * 9 - 2300)).toBeLessThan(40)
    expect(calculatedTargets({ sex: 'male', age: 30, heightCm: 180, weightKg: 119, activity: 'light', goal: 'lose', goalWeightKg: 100 }).source).toBe('calculated')
  })
})

describe('units', () => {
  it('round-trips pounds', () => {
    expect(toDisplayWeight(fromDisplayWeight(220, 'lb'), 'lb')).toBeCloseTo(220)
    expect(toDisplayWeight(100, 'lb')).toBeCloseTo(220.46, 1)
  })
})

describe('nutrition', () => {
  it('scales per serving and sums', () => {
    const chicken = { servingSize: 100, kcal: 165, protein: 31, carbs: 0, fat: 3.6 }
    const n = scale(chicken, 200)
    expect(n.kcal).toBe(330)
    expect(n.protein).toBe(62)
    expect(sum([n, n]).kcal).toBe(660)
  })
  it('reports over-target without negative remaining', () => {
    const s = calorieStatus(2570, { kcal: 2300, protein: 0, carbs: 0, fat: 0, source: 'manual' })
    expect(s.over).toBe(270)
    expect(s.remaining).toBe(0)
  })
})

describe('weight', () => {
  const entries = [w('2026-09-20', 120), w('2026-09-22', 119), w('2026-09-24', 118), w('2026-09-26', 119)]
  it('averages only the days that have weigh-ins', () => {
    expect(rollingAverage(entries, '2026-09-26')).toBeCloseTo((120 + 119 + 118 + 119) / 4)
    expect(rollingAverage(entries, '2026-09-19')).toBeNull()
  })
  it('never resets: start and lowest are preserved', () => {
    const s = weightStats([...entries, w('2026-09-30', 121)], '2026-09-30', 120)
    expect(s.start).toBe(120)
    expect(s.lowest).toBe(118)
    expect(s.current).toBe(121)
  })
})

describe('workouts', () => {
  it('compares top sets', () => {
    const prev = topSet([{ weightKg: 60, reps: 8 }], 'weighted')
    const cur = topSet([{ weightKg: 60, reps: 10 }, { weightKg: 65, reps: 8 }], 'weighted')
    expect(compareTopSets(prev, cur, 'weighted')?.text).toBe('+5 kg')
    expect(compareTopSets(topSet([{ reps: 5 }], 'reps'), topSet([{ reps: 7 }], 'reps'), 'reps')?.text).toBe('+2')
  })
  it('counts planned workouts from template weekdays', () => {
    const t = { weekdays: [0, 2, 4] } as WorkoutTemplate
    const monday = '2026-09-28'
    expect(weekdayIndex(monday)).toBe(0)
    expect(plannedCount([t], monday, addDays(monday, 13))).toBe(6)
  })
})

describe('habits', () => {
  it('compares periods without streak logic', () => {
    const c = comparePeriods(1, 4, true)
    expect(c.verdict).toBe('improving')
    expect(c.change).toBeCloseTo(-0.75)
  })
})

describe('coach rules', () => {
  const base: CoachContext = {
    today: '2026-09-30', hour: 19, kcal: 1500, kcalTarget: 2300, protein: 100, proteinTarget: 160,
    proteinDaysThisWeek: 3, avgKcalThisWeek: 2200, foodLoggedToday: true, todayWeight: 119, previousWeight: 118.4,
    avg7: 118.2, prevAvg7: 118.9, formatWeight: (kg) => `${kg.toFixed(1)} kg`, energyFreeRun: 3, energySlipsThis: 0,
    energySlipsPrev: 2, fastFoodSlipsThis: 1, fastFoodSlipsPrev: 4, colaSlipsThis: 0, colaSlipsPrev: 0, workoutsThisWeek: 3, plannedThisWeek: 3,
  }
  it('never says "you gained" and explains fluctuation', () => {
    const all = runRules(RULES, base, 'day', 99).map((r) => r.text)
    expect(all.join(' ')).not.toMatch(/you gained|streak|reset|start again/i)
    expect(all).toContain('Daily weight fluctuates. Your 7-day average is 118.2 kg — focus on the weekly trend.')
    expect(all).toContain('You still need approximately 60 g of protein today.')
    expect(all).toContain('3 days without energy drinks.')
  })
  it('is kind when over target', () => {
    const r = runRules(RULES, { ...base, kcal: 2570 }, 'day', 1)[0]
    expect(r.id).toBe('over-target')
    expect(r.text).toMatch(/That's okay/)
  })
  it('weekly observations', () => {
    const ids = runRules(RULES, base, 'week', 99).map((r) => r.id)
    expect(ids).toEqual(expect.arrayContaining(['week-trend-down', 'week-all-workouts', 'week-energy-down', 'week-fastfood-down']))
  })
})
