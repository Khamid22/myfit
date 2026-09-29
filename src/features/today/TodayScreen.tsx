import { CalendarRange } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useMeta, useSnapshot } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { ruleCoach } from '../../domain/recommendations/engine'
import { buildCoachContext, daySignals, lastActiveDay } from '../../domain/progress/insights'
import { sum } from '../../domain/nutrition/nutrition'
import { weightStats } from '../../domain/weight/weight'
import { diffDays, formatDay, greeting } from '../../lib/dates'
import { Page } from '../../ui/Page'
import { IconButton } from '../../ui/primitives'
import { CaloriesCard } from './CaloriesCard'
import { CoachCard } from './CoachCard'
import { HabitsCard } from './HabitsCard'
import { QuickActions } from './QuickActions'
import { RecoveryCard } from './RecoveryCard'
import { WeightCard } from './WeightCard'
import type { Recommendation } from '../../domain/recommendations/types'

export function TodayScreen() {
  const { profile, units } = useApp()
  const today = useToday()
  const snap = useSnapshot(profile)
  const dismissedOn = useMeta<string>('recoveryDismissedOn')
  const navigate = useNavigate()

  const view = useMemo(() => {
    if (!snap) return null
    const todayLogs = snap.foodLogs.filter((l) => l.date === today)
    const totals = sum(todayLogs)
    const stats = weightStats(snap.weights, today, profile.startWeightKg)
    const signals = daySignals(snap, [today]).get(today)!
    const ctx = buildCoachContext(snap, today, new Date().getHours(), (kg) => units.weightU(kg))
    const tips = ruleCoach.recommend(ctx, 'day', 3) as Recommendation[]
    const lastBefore = lastActiveDay({
      foodLogs: snap.foodLogs.filter((r) => r.date < today),
      weights: snap.weights.filter((r) => r.date < today),
      habitLogs: snap.habitLogs.filter((r) => r.date < today),
      sessions: snap.sessions.filter((r) => r.date < today),
      water: snap.water.filter((r) => r.date < today),
      cardio: snap.cardio.filter((r) => r.date < today),
    })
    const gap = lastBefore ? diffDays(today, lastBefore) : 0
    return { totals, stats, signals, tips, gap, hasWeightToday: snap.weights.some((w) => w.date === today) }
  }, [snap, today, profile.startWeightKg, units])

  const showRecovery = !!view && view.gap >= 3 && dismissedOn !== today

  return (
    <Page
      eyebrow={formatDay(today, { weekday: 'long', month: 'long', day: 'numeric' })}
      title={`${greeting()}, ${profile.name.split(' ')[0]}`}
      action={<IconButton icon={CalendarRange} label="Weekly summary" onClick={() => navigate('/progress/week')} className="bg-surface text-text" />}
    >
      {view && snap && (
        <div className="space-y-4">
          {showRecovery && <RecoveryCard today={today} gap={view.gap} snap={snap} />}
          <WeightCard stats={view.stats} goalKg={profile.goalWeightKg} hasToday={view.hasWeightToday} today={today} />
          <CaloriesCard totals={view.totals} targets={profile.targets} today={today} />
          <QuickActions today={today} />
          <HabitsCard today={today} habits={snap.habits} logs={snap.habitLogs.filter((l) => l.date === today)} signals={view.signals} />
          <CoachCard tips={view.tips} />
        </div>
      )}
    </Page>
  )
}
