import { ArrowDownRight, ArrowUpRight, Camera, ChevronRight, Minus, Plus, CalendarRange } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import { useExercises, useMeasurements, usePhotos, useSnapshot } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { consistency, type ConsistencyReport } from '../../domain/progress/insights'
import { trendSeries, weightStats } from '../../domain/weight/weight'
import { exerciseHistory, formatSet, primaryValue } from '../../domain/workouts/workouts'
import { MEASUREMENTS } from '../../domain/progress/measurements'
import { addDays, formatDay } from '../../lib/dates'
import { signed } from '../../lib/format'
import { Page } from '../../ui/Page'
import { ProgressLine, WeightTrendChart } from '../../ui/charts'
import { Card, Chip, cx, Empty, SectionTitle, Segmented, Stat } from '../../ui/primitives'
import { PhotoThumb } from '../photos/PhotoThumb'

const RANGES = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '3M' },
  { value: '180', label: '6M' },
  { value: 'all', label: 'All' },
] as const
type Range = (typeof RANGES)[number]['value']


export function ProgressScreen() {
  const { profile, units } = useApp()
  const today = useToday()
  const snap = useSnapshot(profile)
  const sheets = useSheets()
  const navigate = useNavigate()
  const [range, setRange] = useState<Range>('30')

  const weights = snap?.weights ?? []
  const stats = weightStats(weights, today, profile.startWeightKg)
  const chart = useMemo(() => {
    if (!weights.length) return []
    const first = [...weights].sort((a, b) => a.date.localeCompare(b.date))[0].date
    const from = range === 'all' ? first : [addDays(today, -(Number(range) - 1)), first].sort().at(-1)!
    return trendSeries(weights, from, today).map((p) => ({
      date: p.date,
      weight: p.kg != null ? units.toW(p.kg) : undefined,
      avg: p.avg != null ? units.toW(p.avg) : undefined,
    }))
  }, [weights, range, today, units])

  const cons = snap ? consistency(snap, today) : null
  const toGoal = stats.avg7 != null ? stats.avg7 - profile.goalWeightKg : null
  const journey = stats.start != null && stats.avg7 != null ? Math.abs(stats.start - stats.avg7) / Math.max(0.1, Math.abs(stats.start - profile.goalWeightKg)) : 0

  return (
    <Page title="Progress" action={<Chip onClick={() => navigate('/progress/week')} className="flex items-center gap-1.5"><CalendarRange size={15} /> Your week</Chip>}>
      <div className="space-y-6">
        <section>
          <SectionTitle>Body</SectionTitle>
          <Card>
            <div className="grid grid-cols-3 gap-x-3 gap-y-4">
              <Stat label="Current" value={units.weight(stats.current)} unit={units.w} />
              <Stat label="7-day avg" value={<span className="text-accent-strong">{units.weight(stats.avg7)}</span>} unit={units.w} />
              <Stat label="Goal" value={units.weight(profile.goalWeightKg)} unit={units.w} />
              <Stat label="Starting" value={units.weight(stats.start)} unit={units.w} sub={formatDay(profile.startDate)} />
              <Stat label="Lowest" value={units.weight(stats.lowest)} unit={units.w} />
              <Stat label="Total change" value={stats.totalChange != null ? signed(units.toW(stats.totalChange)) : '—'} unit={units.w} sub={stats.change30 != null ? `30 days ${units.weightDelta(stats.change30)}` : undefined} />
            </div>
            {toGoal != null && profile.goal !== 'maintain' && (
              <div className="mt-4 border-t border-line pt-3">
                <div className="mb-1.5 flex justify-between text-[12px] text-muted">
                  <span>Journey to goal</span>
                  <span className="tabular">{Math.abs(toGoal) < 0.05 ? 'At goal' : `${units.weightU(Math.abs(toGoal))} to go`}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full rounded-full bg-good" style={{ width: `${Math.min(100, Math.max(2, journey * 100))}%` }} />
                </div>
              </div>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              <button onClick={() => sheets.open({ type: 'weight', date: today })} className="press flex h-9 items-center gap-1 rounded-full bg-accent-soft pr-3.5 pl-2.5 text-[14px] font-semibold text-accent-strong">
                <Plus size={16} strokeWidth={2.5} /> Weight
              </button>
            }
          >
            Weight trend
          </SectionTitle>
          <Card>
            <Segmented size="sm" options={RANGES.map((r) => ({ ...r }))} value={range} onChange={setRange} className="mb-3" />
            {chart.length ? (
              <WeightTrendChart data={chart} unit={units.w} goal={units.toW(profile.goalWeightKg)} />
            ) : (
              <Empty title="No weigh-ins yet" />
            )}
            <div className="mt-2 flex flex-wrap items-center gap-4 px-1 text-[12px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded bg-accent" /> 7-day average</span>
              <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-faint" /> Daily weigh-ins</span>
              <span className="flex items-center gap-1.5"><span className="h-0 w-4 border-t border-dashed border-good" /> Goal</span>
            </div>
            <p className="mt-3 px-1 text-[12px] leading-snug text-faint">Daily weight moves with water, salt and sleep. The average line shows what's really happening.</p>
          </Card>
        </section>

        {cons && (
          <section>
            <SectionTitle>Consistency · last 7 days vs previous 7</SectionTitle>
            <Card className="!py-2">
              <div className="flex min-h-14 items-center justify-between border-b border-line">
                <span className="text-[15px] font-medium">Planned workouts · 4 weeks</span>
                <span className="tabular text-[15px] font-semibold">
                  {cons.workouts4w.done} <span className="font-normal text-muted">/ {cons.workouts4w.planned || '—'}</span>
                </span>
              </div>
              {cons.rows.map((r) => (
                <ConsistencyRow key={r.label} r={r} />
              ))}
            </Card>
          </section>
        )}

        <StrengthSection />

        <MeasurementsSection onLog={() => sheets.open({ type: 'measure' })} />

        <PhotosTeaser onOpen={() => navigate('/progress/photos')} />
      </div>
    </Page>
  )
}

function ConsistencyRow({ r }: { r: ConsistencyReport }) {
  const good = r.verdict === 'improving'
  const Icon = r.verdict === 'steady' ? Minus : r.now < r.prev ? ArrowDownRight : ArrowUpRight
  const label =
    r.verdict === 'steady' ? 'Same' : r.change != null ? `${Math.round(Math.abs(r.change) * 100)}%` : good ? 'Improving' : 'Up'
  return (
    <div className="flex min-h-14 items-center gap-3 border-b border-line last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-medium">{r.label}</div>
        <div className="tabular text-[12px] text-muted">
          This week {r.now}
          {r.unit === '%' ? '%' : ''} · Last week {r.prev}
          {r.unit === '%' ? '%' : ''}
        </div>
      </div>
      <span
        className={cx(
          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold',
          good ? 'bg-good-soft text-good' : 'bg-surface-2 text-muted',
        )}
      >
        <Icon size={13} strokeWidth={2.6} />
        {label}
      </span>
    </div>
  )
}

function StrengthSection() {
  const { units } = useApp()
  const { profile } = useApp()
  const snap = useSnapshot(profile)
  const exercises = useExercises()
  const sessions = snap?.sessions ?? []
  const withHistory = exercises
    .map((e) => ({ e, hist: exerciseHistory(sessions, e) }))
    .filter((x) => x.hist.length > 0)
    .sort((a, b) => b.hist.length - a.hist.length)
  const [sel, setSel] = useState<string | null>(null)
  const current = withHistory.find((x) => x.e.id === sel) ?? withHistory.find((x) => x.e.name === 'Bench Press') ?? withHistory[0]

  return (
    <section>
      <SectionTitle>Strength</SectionTitle>
      <Card>
        {!current ? (
          <Empty title="No lifts logged yet">Finish a workout and your best sets will chart here.</Empty>
        ) : (
          <>
            <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
              {withHistory.map(({ e }) => (
                <Chip key={e.id} active={e.id === current.e.id} onClick={() => setSel(e.id)}>
                  {e.name}
                </Chip>
              ))}
            </div>
            {(() => {
              const { e, hist } = current
              const first = hist[0]
              const last = hist.at(-1)!
              const conv = e.type === 'weighted' ? units.toW : (v: number) => v
              const d = conv(primaryValue(last.best, e.type)) - conv(primaryValue(first.best, e.type))
              return (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="First" value={formatSet(first.best, e.type, units.w, units.toW)} sub={formatDay(first.date)} />
                    <Stat label="Latest" value={formatSet(last.best, e.type, units.w, units.toW)} sub={formatDay(last.date)} />
                    <Stat
                      label="Change"
                      value={<span className={d > 0 ? 'text-good' : ''}>{hist.length > 1 ? signed(d, e.type === 'weighted' ? 1 : 0) : '—'}</span>}
                      unit={hist.length > 1 ? (e.type === 'weighted' ? units.w : e.type === 'timed' ? 's' : 'reps') : undefined}
                    />
                  </div>
                  <ProgressLine
                    height={130}
                    data={hist.map((h) => ({ date: h.date, value: +conv(primaryValue(h.best, e.type)).toFixed(1) }))}
                    format={(v) => (e.type === 'weighted' ? `${v} ${units.w}` : e.type === 'timed' ? `${v} s` : `${v} reps`)}
                  />
                </>
              )
            })()}
          </>
        )}
      </Card>
    </section>
  )
}

function MeasurementsSection({ onLog }: { onLog: () => void }) {
  const { units } = useApp()
  const list = useMeasurements()
  return (
    <section>
      <SectionTitle
        action={
          <button onClick={onLog} className="press flex h-9 items-center gap-1 rounded-full bg-accent-soft pr-3.5 pl-2.5 text-[14px] font-semibold text-accent-strong">
            <Plus size={16} strokeWidth={2.5} /> Log
          </button>
        }
      >
        Body measurements
      </SectionTitle>
      <Card className="!py-1.5">
        {MEASUREMENTS.map(({ key, label }) => {
          const vals = list.filter((m) => m.values[key] != null)
          const first = vals[0]
          const last = vals.at(-1)
          const d = first && last && first !== last ? last.values[key]! - first.values[key]! : null
          return (
            <div key={key} className="flex min-h-13 items-center gap-3 border-b border-line py-2.5 last:border-0">
              <span className="flex-1 text-[15px] font-medium">{label}</span>
              {last ? (
                <>
                  {d != null && <span className={cx('tabular text-[13px]', d < 0 ? 'text-good' : 'text-muted')}>{signed(units.toL(d))}</span>}
                  <span className="tabular w-[84px] text-right text-[15px] font-semibold">
                    {units.length(last.values[key])} <span className="text-[12px] font-normal text-muted">{units.l}</span>
                  </span>
                </>
              ) : (
                <span className="text-[13px] text-faint">—</span>
              )}
            </div>
          )
        })}
      </Card>
      {list.length > 0 && <p className="mt-2 px-1 text-[12px] text-faint">Last measured {formatDay(list.at(-1)!.date)}. Changes are since your first measurement.</p>}
    </section>
  )
}

function PhotosTeaser({ onOpen }: { onOpen: () => void }) {
  const photos = usePhotos()
  const recent = [...photos].reverse().slice(0, 4)
  return (
    <section>
      <SectionTitle>Progress photos</SectionTitle>
      <Card onClick={onOpen}>
        {recent.length ? (
          <div className="flex items-center gap-2">
            <div className="grid flex-1 grid-cols-4 gap-2">
              {recent.map((p) => (
                <PhotoThumb key={p.id} photo={p} className="aspect-[3/4] rounded-xl" />
              ))}
            </div>
            <ChevronRight className="text-faint" />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-2 text-muted">
              <Camera size={20} />
            </span>
            <div className="flex-1">
              <div className="text-[15px] font-semibold">Add your first photo</div>
              <div className="text-[13px] text-muted">Private — stored only on this device.</div>
            </div>
            <ChevronRight className="text-faint" />
          </div>
        )}
      </Card>
    </section>
  )
}
