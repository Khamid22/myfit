import { Droplets, Plus, Scale, Settings, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import { useMeta, useSnapshot } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { ruleCoach } from '../../domain/recommendations/engine'
import { buildCoachContext, daySignals, lastActiveDay } from '../../domain/progress/insights'
import { calorieStatus, sum } from '../../domain/nutrition/nutrition'
import { weightStats } from '../../domain/weight/weight'
import type { Recommendation } from '../../domain/recommendations/types'
import { diffDays, formatDay, greeting } from '../../lib/dates'
import { int } from '../../lib/format'
import { waterRepo } from '../../storage/repositories/body'
import { db } from '../../storage/db'
import { useFeedback } from '../../ui/feedback'
import { Page } from '../../ui/Page'
import { Bar } from '../../ui/progress'
import { Button, Card, IconButton } from '../../ui/primitives'
import { HabitsCard } from './HabitsCard'
import { RecoveryCard } from './RecoveryCard'

/** Answers "how am I doing today?" at a glance: calories left, protein, weight, habits. */
export function TodayScreen() {
  const { profile, units } = useApp()
  const today = useToday()
  const snap = useSnapshot(profile)
  const dismissedOn = useMeta<string>('recoveryDismissedOn')
  const navigate = useNavigate()
  const sheets = useSheets()
  const { toast } = useFeedback()

  const view = useMemo(() => {
    if (!snap) return null
    const totals = sum(snap.foodLogs.filter((l) => l.date === today))
    const stats = weightStats(snap.weights, today, profile.startWeightKg)
    const signals = daySignals(snap, [today]).get(today)!
    const ctx = buildCoachContext(snap, today, new Date().getHours(), (kg) => units.weightU(kg))
    const tip = (ruleCoach.recommend(ctx, 'day', 1) as Recommendation[])[0]
    const before = (r: { date: string }) => r.date < today
    const lastBefore = lastActiveDay({
      foodLogs: snap.foodLogs.filter(before),
      weights: snap.weights.filter(before),
      habitLogs: snap.habitLogs.filter(before),
      sessions: snap.sessions.filter(before),
      water: snap.water.filter(before),
      cardio: snap.cardio.filter(before),
    })
    const waterMl = snap.water.filter((w) => w.date === today).reduce((n, w) => n + w.ml, 0)
    return {
      totals,
      stats,
      signals,
      tip,
      waterMl,
      gap: lastBefore ? diffDays(today, lastBefore) : 0,
      weighedToday: snap.weights.some((w) => w.date === today),
    }
  }, [snap, today, profile.startWeightKg, units])

  if (!view || !snap) return <Page>{null}</Page>

  const cal = calorieStatus(view.totals.kcal, profile.targets)
  const over = cal.over > 0
  const showRecovery = view.gap >= 3 && dismissedOn !== today

  async function addWater() {
    const rec = await waterRepo.addMl(today, 250)
    toast('+250 ml water', { label: 'Undo', run: () => void db.water.delete(rec.id) })
  }

  return (
    <Page
      eyebrow={formatDay(today, { weekday: 'long', month: 'long', day: 'numeric' })}
      title={`${greeting()}, ${profile.name.split(' ')[0]}`}
      action={<IconButton icon={Settings} label="Settings" onClick={() => navigate('/settings')} className="bg-surface text-text" />}
    >
      <div className="space-y-4">
        {showRecovery && <RecoveryCard today={today} gap={view.gap} snap={snap} />}

        <Card onClick={() => navigate('/food')}>
          <div className="flex items-baseline gap-2">
            <span className="tabular text-[44px] leading-none font-bold tracking-tight">{int(over ? cal.over : cal.remaining)}</span>
            <span className="text-[16px] text-muted">{over ? 'kcal over today' : 'kcal left today'}</span>
          </div>
          <Bar value={cal.ratio} height={10} className="mt-4" color={over ? 'var(--c-warn)' : 'var(--c-accent)'} />
          <div className="tabular mt-2 flex justify-between text-[13px] text-muted">
            <span>{int(cal.consumed)} eaten</span>
            <span>goal {int(cal.target)}</span>
          </div>
          {over && <p className="mt-3 text-[14px] leading-snug text-muted">That's okay — no need to skip meals tomorrow. Just return to your normal target.</p>}
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-3.5">
            <span className="text-[14px] text-muted">Protein</span>
            <Bar value={profile.targets.protein ? view.totals.protein / profile.targets.protein : 0} height={6} color="var(--c-protein)" className="flex-1" />
            <span className="tabular text-[14px] font-semibold">
              {int(view.totals.protein)}
              <span className="font-normal text-muted"> / {profile.targets.protein} g</span>
            </span>
          </div>
        </Card>

        <Button variant="solid" size="lg" block icon={Plus} onClick={() => sheets.open({ type: 'food', date: today })}>
          Add food
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Tile
            icon={Scale}
            color="var(--c-protein)"
            label={view.weighedToday ? 'Weight' : 'Log weight'}
            value={units.weight(view.stats.current)}
            unit={units.w}
            sub={view.stats.avg7 != null ? `trend ${units.weight(view.stats.avg7)}` : undefined}
            onClick={() => sheets.open({ type: 'weight', date: today })}
          />
          <Tile
            icon={Droplets}
            color="var(--c-carbs)"
            label="Water · tap +250"
            value={String(+(view.waterMl / 1000).toFixed(2))}
            unit="L"
            sub={`of ${(profile.waterGoalMl / 1000).toFixed(1)} L`}
            onClick={addWater}
          />
        </div>

        <HabitsCard today={today} habits={snap.habits} logs={snap.habitLogs.filter((l) => l.date === today)} signals={view.signals} />

        {view.tip && (
          <p className="flex gap-2.5 px-2 text-[14px] leading-relaxed text-muted">
            <Sparkles size={16} className="mt-0.5 shrink-0 text-accent-strong" />
            {view.tip.text}
          </p>
        )}
      </div>
    </Page>
  )
}

function Tile({
  icon: Icon,
  color,
  label,
  value,
  unit,
  sub,
  onClick,
}: {
  icon: typeof Scale
  color: string
  label: string
  value: string
  unit: string
  sub?: string
  onClick: () => void
}) {
  return (
    <Card onClick={onClick} className="!p-3.5">
      <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
        <Icon size={15} style={{ color }} />
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="tabular text-[26px] leading-none font-bold tracking-tight">{value}</span>
        <span className="text-[13px] text-muted">{unit}</span>
      </div>
      {sub && <div className="tabular mt-1 text-[12px] text-faint">{sub}</div>}
    </Card>
  )
}
