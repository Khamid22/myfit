import { Plus, Scale } from 'lucide-react'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import type { WeightStats } from '../../domain/weight/weight'
import { formatDay, type DayKey } from '../../lib/dates'
import { Card } from '../../ui/primitives'

export function WeightCard({ stats, goalKg, hasToday, today }: { stats: WeightStats; goalKg: number; hasToday: boolean; today: DayKey }) {
  const { units } = useApp()
  const sheets = useSheets()
  return (
    <Card onClick={() => sheets.open({ type: 'weight', date: today })} className="!p-0">
      <div className="flex items-stretch">
        <div className="min-w-0 flex-1 p-4">
          <div className="flex items-center gap-1.5 text-[13px] font-medium text-muted">
            <Scale size={14} />
            {hasToday ? 'Today' : stats.currentDate ? `Last weigh-in · ${formatDay(stats.currentDate)}` : 'Weight'}
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="tabular text-[34px] leading-none font-bold tracking-tight">{units.weight(stats.current)}</span>
            <span className="text-[15px] text-muted">{units.w}</span>
          </div>
          <div className="mt-2 text-[13px] text-muted">
            Goal <span className="tabular font-semibold text-text">{units.weightU(goalKg)}</span>
          </div>
        </div>
        <div className="flex w-[42%] flex-col justify-center border-l border-line p-4">
          <div className="text-[12px] font-medium text-muted">7-day average</div>
          <div className="tabular mt-0.5 text-[22px] font-semibold tracking-tight text-accent-strong">
            {units.weight(stats.avg7)} <span className="text-[13px] font-normal text-muted">{units.w}</span>
          </div>
          {!hasToday && (
            <div className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-accent-strong">
              <Plus size={13} strokeWidth={2.6} /> Log today
            </div>
          )}
          {hasToday && stats.prevAvg7 != null && stats.avg7 != null && (
            <div className="mt-1 text-[12px] text-faint">{units.weightDelta(stats.avg7 - stats.prevAvg7)} vs last week</div>
          )}
        </div>
      </div>
    </Card>
  )
}
