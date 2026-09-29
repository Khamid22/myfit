import { Check, Settings2 } from 'lucide-react'
import { useNavigate } from 'react-router'
import { resolveStatus, type DaySignals } from '../../domain/habits/habits'
import type { HabitDef, HabitLog, HabitStatus } from '../../domain/models'
import type { DayKey } from '../../lib/dates'
import { habitLogRepo } from '../../storage/repositories/habits'
import { habitIcon } from '../../ui/icons'
import { Card, cx, IconButton, SectionTitle } from '../../ui/primitives'

export function HabitsCard({
  today,
  habits,
  logs,
  signals,
}: {
  today: DayKey
  habits: HabitDef[]
  logs: HabitLog[]
  signals: DaySignals
}) {
  const navigate = useNavigate()
  const active = habits.filter((h) => h.active)
  const status = (h: HabitDef) => resolveStatus(h, logs.find((l) => l.habitId === h.id), signals)
  const done = active.filter((h) => status(h) === 'done').length

  return (
    <section>
      <SectionTitle action={<IconButton icon={Settings2} label="Edit habits" size={18} onClick={() => navigate('/profile/habits')} className="-mr-2 h-9 w-9" />}>
        Today's habits
      </SectionTitle>
      <Card className="!px-2 !py-1.5">
        <div className="flex items-center justify-between px-2 pt-1.5 pb-1">
          <span className="text-[13px] text-muted">
            <span className="tabular font-semibold text-text">{done}</span> / {active.length} completed
          </span>
          <div className="flex gap-1">
            {active.map((h) => (
              <span key={h.id} className={cx('h-1.5 w-4 rounded-full', status(h) === 'done' ? 'bg-good' : 'bg-surface-2')} />
            ))}
          </div>
        </div>
        {active.map((h) => (
          <HabitRow
            key={h.id}
            habit={h}
            status={status(h)}
            explicit={logs.some((l) => l.habitId === h.id)}
            onSet={(s) => habitLogRepo.set(today, h.id, s)}
          />
        ))}
      </Card>
    </section>
  )
}

export function HabitRow({
  habit: h,
  status,
  explicit,
  onSet,
}: {
  habit: HabitDef
  status: HabitStatus | undefined
  explicit: boolean
  onSet: (s: HabitStatus | null) => void
}) {
  const Icon = habitIcon(h.icon)
  const done = status === 'done'
  const slipped = status === 'slipped'
  const sub = slipped
    ? "Had one today — that's okay"
    : done && !explicit && h.auto
      ? h.auto === 'workout'
        ? 'Completed from your workout log'
        : h.auto === 'water'
          ? 'Water goal reached'
          : 'Completed from your walk'
      : null

  const toggle = () => onSet(done && explicit ? null : 'done')
  return (
    <div className="flex items-center gap-1">
      <button onClick={toggle} className="press flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 text-left active:bg-surface-2">
        <span
          className={cx(
            'grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors',
            done ? 'bg-good-soft text-good' : slipped ? 'bg-warn-soft text-warn' : 'bg-surface-2 text-muted',
          )}
        >
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={cx('block truncate text-[15px] font-medium', slipped && 'text-muted')}>{h.name}</span>
          {sub && <span className="block truncate text-[12px] text-muted">{sub}</span>}
        </span>
      </button>
      {h.kind === 'avoid' && !done && (
        <button
          onClick={() => onSet(slipped ? null : 'slipped')}
          className={cx('press h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold', slipped ? 'text-muted' : 'bg-surface-2 text-muted')}
        >
          {slipped ? 'Undo' : 'Had one'}
        </button>
      )}
      <button onClick={toggle} aria-label={`${h.name} ${done ? 'done' : 'not done'}`} className="press grid h-11 w-11 shrink-0 place-items-center">
        <span className={cx('grid h-7 w-7 place-items-center rounded-full border-2 transition-all', done ? 'animate-pop border-good bg-good text-bg' : 'border-line-strong')}>
          {done && <Check size={16} strokeWidth={3} />}
        </span>
      </button>
    </div>
  )
}
