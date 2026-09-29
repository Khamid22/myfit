import { Droplets, Dumbbell, Scale, Utensils, type LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useSheets } from '../../app/sheets'
import { useLiveQuery } from 'dexie-react-hooks'
import { sessionRepo } from '../../storage/repositories/workouts'
import type { DayKey } from '../../lib/dates'

export function QuickActions({ today }: { today: DayKey }) {
  const sheets = useSheets()
  const navigate = useNavigate()
  const active = useLiveQuery(() => sessionRepo.active(), [])
  const items: { label: string; icon: LucideIcon; color: string; run: () => void }[] = [
    { label: 'Food', icon: Utensils, color: 'var(--c-accent-strong)', run: () => sheets.open({ type: 'food', date: today }) },
    { label: 'Weight', icon: Scale, color: 'var(--c-protein)', run: () => sheets.open({ type: 'weight', date: today }) },
    {
      label: active ? 'Resume' : 'Workout',
      icon: Dumbbell,
      color: 'var(--c-fat)',
      run: () => (active ? navigate(`/workout/session/${active.id}`) : sheets.open({ type: 'startWorkout' })),
    },
    { label: 'Water', icon: Droplets, color: 'var(--c-carbs)', run: () => sheets.open({ type: 'water', date: today }) },
  ]
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {items.map(({ label, icon: Icon, color, run }) => (
        <button
          key={label}
          onClick={run}
          className="press flex h-[84px] flex-col items-center justify-center gap-2 rounded-[20px] border border-line bg-surface active:bg-surface-2"
        >
          <span className="relative grid h-9 w-9 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
            <Icon size={19} strokeWidth={2.2} />
          </span>
          <span className="text-[13px] font-semibold">
            {label === 'Resume' ? label : `+ ${label}`}
          </span>
        </button>
      ))}
    </div>
  )
}
