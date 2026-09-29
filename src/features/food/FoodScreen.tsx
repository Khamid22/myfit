import { BookOpen, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import { useFoodLogs } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { byMeal, calorieStatus, MEALS, sum, unitLabel } from '../../domain/nutrition/nutrition'
import type { FoodLog } from '../../domain/models'
import { addDays, relativeDayLabel } from '../../lib/dates'
import { int, num } from '../../lib/format'
import { Page } from '../../ui/Page'
import { Bar } from '../../ui/progress'
import { Card, IconButton } from '../../ui/primitives'
import { EntrySheet } from './EntrySheet'

export function FoodScreen() {
  const { profile } = useApp()
  const today = useToday()
  const [date, setDate] = useState(today)
  const logs = useFoodLogs(date)
  const sheets = useSheets()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<FoodLog | null>(null)
  const totals = sum(logs)
  const s = calorieStatus(totals.kcal, profile.targets)
  const grouped = byMeal(logs)

  return (
    <Page title="Food" action={<IconButton icon={BookOpen} label="My foods & meals" onClick={() => navigate('/food/library')} className="bg-surface text-text" />}>
      <div className="-mt-2 mb-4 flex items-center justify-between">
        <IconButton icon={ChevronLeft} label="Previous day" onClick={() => setDate(addDays(date, -1))} className="-ml-2" />
        <button className="text-[15px] font-semibold" onClick={() => setDate(today)}>
          {relativeDayLabel(date, today)}
        </button>
        <IconButton icon={ChevronRight} label="Next day" disabled={date >= today} onClick={() => setDate(addDays(date, 1))} className="-mr-2 disabled:opacity-30" />
      </div>

      <Card className="mb-4">
        <div className="flex items-baseline justify-between">
          <span className="tabular text-[26px] font-bold tracking-tight">
            {int(s.consumed)} <span className="text-[15px] font-normal text-muted">/ {int(s.target)} kcal</span>
          </span>
          <span className="text-[14px]" style={{ color: s.over ? 'var(--c-warn)' : 'var(--c-muted)' }}>
            {s.over ? `+${int(s.over)} over` : `${int(s.remaining)} left`}
          </span>
        </div>
        <Bar value={s.ratio} className="mt-3" height={8} color={s.over ? 'var(--c-warn)' : 'var(--c-accent)'} />
        <p className="tabular mt-3 text-[13px] text-muted">
          Protein <span className="font-semibold text-text">{int(totals.protein)}</span> / {profile.targets.protein} g · Carbs {int(totals.carbs)} g · Fat {int(totals.fat)} g
        </p>
      </Card>

      <div className="space-y-3">
        {MEALS.map((m) => {
          const items = grouped[m.id]
          return (
            <Card key={m.id} className="!px-3 !py-2">
              <button onClick={() => sheets.open({ type: 'food', date, meal: m.id })} className="press flex min-h-12 w-full items-center justify-between px-1">
                <span className="text-[16px] font-semibold">
                  {m.label}
                  {items.length > 0 && <span className="tabular ml-2 text-[14px] font-normal text-muted">{int(sum(items).kcal)} kcal</span>}
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-accent-soft text-accent-strong">
                  <Plus size={18} strokeWidth={2.5} />
                </span>
              </button>
              {items.map((l) => (
                <button key={l.id} onClick={() => setEditing(l)} className="press flex min-h-11 w-full items-center gap-3 rounded-xl px-1 text-left active:bg-surface-2">
                  <span className="min-w-0 flex-1 truncate text-[15px]">
                    {l.name} <span className="text-[13px] text-faint">{num(l.qty)} {unitLabel(l.unit, l.qty)}</span>
                  </span>
                  <span className="tabular text-[15px] text-muted">{int(l.kcal)}</span>
                </button>
              ))}
            </Card>
          )
        })}
      </div>
      <p className="mt-4 px-1 text-center text-[12px] text-faint">Tap an item to change the amount or remove it.</p>
      <EntrySheet entry={editing} onClose={() => setEditing(null)} />
    </Page>
  )
}
