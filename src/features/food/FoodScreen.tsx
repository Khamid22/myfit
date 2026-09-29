import { BookOpen, ChevronLeft, ChevronRight, Copy, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import { useFoodLogs } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { byMeal, calorieStatus, MEALS, sum } from '../../domain/nutrition/nutrition'
import type { FoodLog } from '../../domain/models'
import { addDays, relativeDayLabel } from '../../lib/dates'
import { int, num } from '../../lib/format'
import { foodLogRepo } from '../../storage/repositories/food'
import { useFeedback } from '../../ui/feedback'
import { Page } from '../../ui/Page'
import { Bar, MacroBar } from '../../ui/progress'
import { Card, IconButton } from '../../ui/primitives'
import { EntrySheet } from './EntrySheet'
import { unitLabel } from '../../domain/nutrition/nutrition'

export function FoodScreen() {
  const { profile } = useApp()
  const today = useToday()
  const [date, setDate] = useState(today)
  const logs = useFoodLogs(date)
  const yesterdayLogs = useFoodLogs(addDays(date, -1))
  const sheets = useSheets()
  const navigate = useNavigate()
  const { toast } = useFeedback()
  const [editing, setEditing] = useState<FoodLog | null>(null)
  const totals = sum(logs)
  const s = calorieStatus(totals.kcal, profile.targets)
  const grouped = byMeal(logs)
  const yGrouped = byMeal(yesterdayLogs)

  return (
    <Page
      title="Food"
      action={<IconButton icon={BookOpen} label="My Foods & Meals" onClick={() => navigate('/food/library')} className="bg-surface text-text" />}
    >
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-surface p-1">
        <IconButton icon={ChevronLeft} label="Previous day" onClick={() => setDate(addDays(date, -1))} />
        <button className="text-[15px] font-semibold" onClick={() => setDate(today)}>
          {relativeDayLabel(date, today)}
        </button>
        <IconButton icon={ChevronRight} label="Next day" disabled={date >= today} onClick={() => setDate(addDays(date, 1))} className="disabled:opacity-30" />
      </div>

      <Card className="mb-5">
        <div className="flex items-baseline justify-between">
          <div className="text-[13px] font-medium text-muted">Calories</div>
          <div className="text-[13px] font-medium" style={{ color: s.over ? 'var(--c-warn)' : 'var(--c-muted)' }}>
            {s.over ? `+${int(s.over)} kcal` : `${int(s.remaining)} remaining`}
          </div>
        </div>
        <div className="tabular mt-0.5 text-[28px] font-bold tracking-tight">
          {int(s.consumed)} <span className="text-[16px] font-normal text-muted">/ {int(s.target)} kcal</span>
        </div>
        <Bar value={s.ratio} className="mt-3" height={10} color={s.over ? 'var(--c-warn)' : 'var(--c-accent)'} />
        {s.over > 0 && (
          <p className="mt-3 text-[13px] leading-snug text-muted">
            You're slightly above today's target. No need to skip meals tomorrow — simply return to your normal target.
          </p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <MacroBar label="Protein" value={totals.protein} target={profile.targets.protein} color="var(--c-protein)" />
          <MacroBar label="Carbs" value={totals.carbs} target={profile.targets.carbs} color="var(--c-carbs)" />
          <MacroBar label="Fat" value={totals.fat} target={profile.targets.fat} color="var(--c-fat)" />
        </div>
      </Card>

      <div className="space-y-3">
        {MEALS.map((m) => {
          const items = grouped[m.id]
          const kcal = sum(items).kcal
          const ySame = yGrouped[m.id]
          return (
            <Card key={m.id} className="!px-3 !py-2">
              <div className="flex min-h-11 items-center justify-between px-1">
                <div>
                  <span className="text-[16px] font-semibold">{m.label}</span>
                  {kcal > 0 && <span className="tabular ml-2 text-[14px] text-muted">{int(kcal)} kcal</span>}
                </div>
                <button
                  onClick={() => sheets.open({ type: 'food', date, meal: m.id })}
                  className="press flex h-9 items-center gap-1 rounded-full bg-accent-soft pr-3.5 pl-2.5 text-[14px] font-semibold text-accent-strong"
                >
                  <Plus size={16} strokeWidth={2.5} /> Add
                </button>
              </div>
              {items.map((l) => (
                <button key={l.id} onClick={() => setEditing(l)} className="press flex min-h-12 w-full items-center gap-3 rounded-xl px-1 text-left active:bg-surface-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px]">{l.name}</div>
                    <div className="tabular text-[12px] text-muted">
                      {num(l.qty)} {unitLabel(l.unit, l.qty)} · P {num(l.protein, 0)} · C {num(l.carbs, 0)} · F {num(l.fat, 0)}
                    </div>
                  </div>
                  <div className="tabular text-[15px] font-medium">{int(l.kcal)}</div>
                </button>
              ))}
              {!items.length && ySame.length > 0 && (
                <button
                  onClick={async () => {
                    const n = await foodLogRepo.copyDay(addDays(date, -1), date, m.id)
                    toast(`Copied ${n} item${n === 1 ? '' : 's'} from yesterday`)
                  }}
                  className="press mb-1 flex min-h-10 items-center gap-2 rounded-xl px-1 text-[13px] font-medium text-muted"
                >
                  <Copy size={14} /> Same as yesterday ({int(sum(ySame).kcal)} kcal)
                </button>
              )}
            </Card>
          )
        })}
      </div>
      <EntrySheet entry={editing} onClose={() => setEditing(null)} />
    </Page>
  )
}
