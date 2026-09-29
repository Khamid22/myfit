import { Check } from 'lucide-react'
import { resolveStatus, type DaySignals } from '../../domain/habits/habits'
import type { HabitDef, HabitLog, HabitStatus } from '../../domain/models'
import type { DayKey } from '../../lib/dates'
import { habitLogRepo } from '../../storage/repositories/habits'
import { habitIcon } from '../../ui/icons'
import { useFeedback } from '../../ui/feedback'
import { useLongPress } from '../../ui/useLongPress'
import { Card, cx, SectionTitle } from '../../ui/primitives'

/** A plain checklist: tap to tick. Long-press an "avoid" habit to record "had one". */
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
  const active = habits.filter((h) => h.active)
  const status = (h: HabitDef) => resolveStatus(h, logs.find((l) => l.habitId === h.id), signals)
  const done = active.filter((h) => status(h) === 'done').length

  return (
    <section>
      <SectionTitle
        action={
          <span className="text-[13px] text-muted">
            <span className="tabular font-semibold text-text">{done}</span> of {active.length}
          </span>
        }
      >
        Habits
      </SectionTitle>
      <Card className="!px-1.5 !py-1">
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
  const { toast } = useFeedback()
  const Icon = habitIcon(h.icon)
  const done = status === 'done'
  const slipped = status === 'slipped'
  const press = useLongPress(
    () => onSet(done && explicit ? null : slipped ? null : 'done'),
    h.kind === 'avoid'
      ? () => {
          onSet(slipped ? null : 'slipped')
          if (!slipped) toast("Noted — that's okay")
        }
      : undefined,
  )

  return (
    <button
      {...press}
      className="press flex min-h-[54px] w-full items-center gap-3 rounded-2xl px-2.5 text-left select-none [-webkit-touch-callout:none] active:bg-surface-2"
    >
      <Icon size={19} strokeWidth={2} className={cx('shrink-0', done ? 'text-good' : slipped ? 'text-warn' : 'text-faint')} />
      <span className={cx('min-w-0 flex-1 truncate text-[16px]', slipped && 'text-muted')}>
        {h.name}
        {slipped && <span className="ml-2 text-[13px] text-warn">had one</span>}
      </span>
      <span
        className={cx(
          'grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-all',
          done ? 'animate-pop border-good bg-good text-bg' : 'border-line-strong',
        )}
      >
        {done && <Check size={16} strokeWidth={3} />}
      </span>
    </button>
  )
}
