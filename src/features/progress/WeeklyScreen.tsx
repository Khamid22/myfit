import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useSnapshot } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { buildCoachContext, weeklySummary } from '../../domain/progress/insights'
import { runRules } from '../../domain/recommendations/engine'
import { RULES } from '../../domain/recommendations/rules'
import { addDays, formatDay, startOfWeek } from '../../lib/dates'
import { int } from '../../lib/format'
import { Page } from '../../ui/Page'
import { Card, cx, IconButton } from '../../ui/primitives'
import { CoachCard } from '../today/CoachCard'

/** Deterministic weekly report — calendar week, Monday to Sunday. */
export function WeeklyScreen() {
  const { profile, units } = useApp()
  const today = useToday()
  const navigate = useNavigate()
  const snap = useSnapshot(profile)
  const thisWeek = startOfWeek(today)
  const [ws, setWs] = useState(thisWeek)

  const data = useMemo(() => {
    if (!snap) return null
    const end = addDays(ws, 6) < today ? addDays(ws, 6) : today
    const s = weeklySummary(snap, ws, today)
    const ctx = buildCoachContext(snap, end, 23, (kg) => units.weightU(kg), { kind: 'calendar', weekStart: ws })
    return { s, notes: runRules(RULES, ctx, 'week', 6) }
  }, [snap, ws, today, units])

  const isCurrent = ws === thisWeek
  const s = data?.s

  return (
    <Page
      title="Your week"
      eyebrow={
        <button onClick={() => navigate(-1)} className="-ml-1 flex items-center gap-1 text-accent-strong">
          <ArrowLeft size={16} /> Back
        </button>
      }
    >
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-surface p-1">
        <IconButton icon={ChevronLeft} label="Previous week" onClick={() => setWs(addDays(ws, -7))} />
        <div className="text-center">
          <div className="text-[15px] font-semibold">{isCurrent ? 'This week' : ws === addDays(thisWeek, -7) ? 'Last week' : 'Week of'}</div>
          <div className="text-[12px] text-muted">
            {formatDay(ws)} – {formatDay(addDays(ws, 6))}
          </div>
        </div>
        <IconButton icon={ChevronRight} label="Next week" disabled={isCurrent} onClick={() => setWs(addDays(ws, 7))} className="disabled:opacity-30" />
      </div>

      {s && (
        <div className="space-y-4">
          <Card>
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Average weight" value={units.weight(s.avgWeight)} unit={units.w} />
              <Metric label="Previous week" value={units.weight(s.prevAvgWeight)} unit={units.w} />
              <Metric
                label="Change"
                value={s.avgWeight != null && s.prevAvgWeight != null ? units.weightDelta(s.avgWeight - s.prevAvgWeight).replace(` ${units.w}`, '') : '—'}
                unit={units.w}
                tone={s.avgWeight != null && s.prevAvgWeight != null && (profile.goal === 'lose' ? s.avgWeight < s.prevAvgWeight : profile.goal === 'gain' ? s.avgWeight > s.prevAvgWeight : false) ? 'good' : undefined}
              />
            </div>
          </Card>

          <Card className="!py-1.5">
            <Row label="Average calories" value={s.avgKcal != null ? `${int(s.avgKcal)} kcal/day` : '—'} sub={`Target ${int(s.kcalTarget)}`} />
            <Row label="Protein target reached" value={`${s.proteinDays} / ${s.daysElapsed} days`} />
            <Row label="Workouts" value={`${s.workouts} / ${s.plannedWorkouts || '—'}`} sub="completed / planned" good={s.plannedWorkouts > 0 && s.workouts >= s.plannedWorkouts} />
            <Row label="Fast food" value={`${s.fastFoodDays} day${s.fastFoodDays === 1 ? '' : 's'}`} sub={`Previous week ${s.prevFastFoodDays}`} good={s.fastFoodDays < s.prevFastFoodDays} />
            <Row label="Energy drinks" value={`${s.energyDays} day${s.energyDays === 1 ? '' : 's'}`} sub={`Previous week ${s.prevEnergyDays}`} good={s.energyDays < s.prevEnergyDays} />
            <Row label="Cola" value={`${s.colaDays} day${s.colaDays === 1 ? '' : 's'}`} />
            <Row label="Walking goal" value={`${s.walkDays} / ${s.daysElapsed} days`} />
            <Row label="Water goal" value={`${s.waterDays} / ${s.daysElapsed} days`} />
            <Row label="Habit completion" value={`${Math.round(s.habitCompletion * 100)}%`} />
          </Card>
          {isCurrent && <p className="px-1 text-[12px] text-faint">This week is still in progress — {s.daysElapsed} of 7 days so far. Habit slips count only days you marked “Had one”.</p>}

          <CoachCard title="Observations" tips={data!.notes} />
        </div>
      )}
    </Page>
  )
}

function Metric({ label, value, unit, tone }: { label: string; value: string; unit: string; tone?: 'good' }) {
  return (
    <div>
      <div className="text-[12px] text-muted">{label}</div>
      <div className={cx('tabular mt-0.5 text-[22px] font-bold tracking-tight', tone === 'good' && 'text-good')}>
        {value}
        <span className="ml-1 text-[12px] font-normal text-muted">{value !== '—' ? unit : ''}</span>
      </div>
    </div>
  )
}

function Row({ label, value, sub, good }: { label: string; value: string; sub?: string; good?: boolean }) {
  return (
    <div className="flex min-h-13 items-center gap-3 border-b border-line py-2 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-[15px]">{label}</div>
        {sub && <div className="text-[12px] text-faint">{sub}</div>}
      </div>
      <div className={cx('tabular text-[15px] font-semibold', good && 'text-good')}>{value}</div>
    </div>
  )
}
