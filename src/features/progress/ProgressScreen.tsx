import { Camera, CalendarRange, ChevronRight, Dumbbell, Plus, Ruler } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import { useSnapshot } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { consistency } from '../../domain/progress/insights'
import { trendSeries, weightStats } from '../../domain/weight/weight'
import { addDays } from '../../lib/dates'
import { signed } from '../../lib/format'
import { Page } from '../../ui/Page'
import { WeightTrendChart } from '../../ui/charts'
import { Card, cx, Empty, IconButton, SectionTitle, Segmented } from '../../ui/primitives'

type Range = '30' | '90' | 'all'

/** "Am I losing weight? Am I more consistent than last week?" — and links to everything else. */
export function ProgressScreen() {
  const { profile, units } = useApp()
  const today = useToday()
  const snap = useSnapshot(profile)
  const sheets = useSheets()
  const navigate = useNavigate()
  const [range, setRange] = useState<Range>('30')

  const weights = useMemo(() => snap?.weights ?? [], [snap])
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

  const trend = stats.avg7 ?? stats.current
  const toGoal = trend != null ? Math.abs(trend - profile.goalWeightKg) : null
  const rows = snap ? consistency(snap, today).rows : []
  const pick = (label: string) => rows.find((r) => r.label === label)

  return (
    <Page title="Progress" action={<IconButton icon={Plus} label="Log weight" onClick={() => sheets.open({ type: 'weight', date: today })} className="bg-accent-soft text-accent-strong" />}>
      <div className="space-y-6">
        <Card>
          <div className="grid grid-cols-3 gap-3">
            <Big label="Trend weight" value={units.weight(trend)} unit={units.w} accent />
            <Big label="Since start" value={stats.totalChange != null ? signed(units.toW(stats.totalChange)) : '—'} unit={units.w} />
            <Big label="To goal" value={toGoal != null ? units.weight(toGoal) : '—'} unit={units.w} />
          </div>
          <div className="mt-4">
            {chart.length ? <WeightTrendChart data={chart} unit={units.w} goal={units.toW(profile.goalWeightKg)} height={200} /> : <Empty title="No weigh-ins yet" />}
          </div>
          <Segmented
            size="sm"
            className="mt-3"
            value={range}
            onChange={setRange}
            options={[
              { value: '30', label: 'Month' },
              { value: '90', label: '3 months' },
              { value: 'all', label: 'All' },
            ]}
          />
          <p className="mt-3 text-[12px] leading-snug text-faint">The line is your 7-day average; dots are single weigh-ins. Daily ups and downs are normal.</p>
        </Card>

        <section>
          <SectionTitle>This week vs last week</SectionTitle>
          <Card className="!py-1">
            <Compare label="Workouts" now={pick('Workouts')?.now} prev={pick('Workouts')?.prev} better="more" />
            <Compare label="Fast food days" now={pick('Fast food')?.now} prev={pick('Fast food')?.prev} better="less" />
            <Compare label="Energy drink days" now={pick('Energy drinks')?.now} prev={pick('Energy drinks')?.prev} better="less" />
          </Card>
        </section>

        <section>
          <SectionTitle>More</SectionTitle>
          <Card className="!py-1">
            <LinkRow icon={CalendarRange} label="Weekly report" onClick={() => navigate('/progress/week')} />
            <LinkRow icon={Dumbbell} label="Strength" onClick={() => navigate('/progress/strength')} />
            <LinkRow icon={Ruler} label="Body measurements" onClick={() => navigate('/progress/measurements')} />
            <LinkRow icon={Camera} label="Progress photos" onClick={() => navigate('/progress/photos')} />
          </Card>
        </section>
      </div>
    </Page>
  )
}

function Big({ label, value, unit, accent }: { label: string; value: string; unit: string; accent?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[12px] text-muted">{label}</div>
      <div className={cx('tabular mt-0.5 text-[22px] font-bold tracking-tight', accent && 'text-accent-strong')}>
        {value}
        {value !== '—' && <span className="ml-1 text-[12px] font-normal text-muted">{unit}</span>}
      </div>
    </div>
  )
}

function Compare({ label, now = 0, prev = 0, better }: { label: string; now?: number; prev?: number; better: 'more' | 'less' }) {
  const improving = better === 'more' ? now > prev : now < prev
  return (
    <div className="flex min-h-13 items-center gap-3 border-b border-line last:border-0">
      <span className="flex-1 text-[15px]">{label}</span>
      <span className="tabular text-[13px] text-faint">last week {prev}</span>
      <span className={cx('tabular w-8 text-right text-[18px] font-bold', improving && 'text-good')}>{now}</span>
    </div>
  )
}

function LinkRow({ icon: Icon, label, onClick }: { icon: typeof Ruler; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="press flex min-h-13 w-full items-center gap-3 border-b border-line text-left last:border-0">
      <Icon size={18} className="text-muted" />
      <span className="flex-1 text-[15px] font-medium">{label}</span>
      <ChevronRight size={18} className="text-faint" />
    </button>
  )
}
