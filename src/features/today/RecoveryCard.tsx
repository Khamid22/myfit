import { ArrowRight, Check } from 'lucide-react'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import { daySignals, type Snapshot } from '../../domain/progress/insights'
import type { DayKey } from '../../lib/dates'
import { habitLogRepo } from '../../storage/repositories/habits'
import { metaRepo } from '../../storage/repositories/profile'
import { waterRepo } from '../../storage/repositories/body'
import { Button, cx } from '../../ui/primitives'
import { weightStats } from '../../domain/weight/weight'

/** Shown after a few quiet days. Nothing is reset — the user simply continues. */
export function RecoveryCard({ today, gap, snap }: { today: DayKey; gap: number; snap: Snapshot }) {
  const { profile, units } = useApp()
  const sheets = useSheets()
  const sig = daySignals(snap, [today]).get(today)!
  const habit = (key: string) => snap.habits.find((h) => h.key === key)
  const logged = (key: string) => {
    const h = habit(key)
    return !!h && snap.habitLogs.some((l) => l.date === today && l.habitId === h.id && l.status === 'done')
  }
  const toggle = (key: string) => {
    const h = habit(key)
    if (h) void habitLogRepo.set(today, h.id, logged(key) ? null : 'done')
  }
  const stats = weightStats(snap.weights, today, profile.startWeightKg)
  const waterToday = snap.water.some((w) => w.date === today)

  const items = [
    { label: "Record today's weight", done: snap.weights.some((w) => w.date === today), run: () => sheets.open({ type: 'weight', date: today }) },
    { label: 'Drink a glass of water', done: waterToday, run: () => void waterRepo.addMl(today, 250) },
    { label: 'Log your next meal', done: snap.foodLogs.some((l) => l.date === today), run: () => sheets.open({ type: 'food', date: today }) },
    { label: 'Take a walk', done: logged('walk') || sig.walk, run: () => toggle('walk') },
    { label: 'Avoid energy drinks today', done: logged('energy'), run: () => toggle('energy') },
  ]

  return (
    <section className="animate-rise overflow-hidden rounded-[24px] border border-accent/30 bg-[radial-gradient(120%_100%_at_0%_0%,var(--c-accent-soft),transparent_60%)] bg-surface p-5">
      <div className="text-[12px] font-semibold tracking-[0.1em] text-accent-strong uppercase">Welcome back</div>
      <h2 className="mt-1.5 text-[22px] leading-snug font-bold tracking-tight">Your previous progress is still here.</h2>
      <p className="mt-1 text-[14px] text-muted">
        {gap} days away changes nothing that came before
        {stats.lowest != null && <> — you started at {units.weightU(stats.start)}, lowest {units.weightU(stats.lowest)}</>}. Let's continue today.
      </p>
      <div className="mt-4 space-y-1">
        {items.map((it) => (
          <button key={it.label} onClick={it.run} className="press flex min-h-12 w-full items-center gap-3 rounded-xl px-1 text-left active:bg-surface-2">
            <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2', it.done ? 'border-good bg-good text-bg' : 'border-line-strong')}>
              {it.done && <Check size={14} strokeWidth={3} />}
            </span>
            <span className={cx('text-[15px]', it.done && 'text-muted line-through decoration-line-strong')}>{it.label}</span>
          </button>
        ))}
      </div>
      <Button variant="solid" block className="mt-4" onClick={() => metaRepo.set('recoveryDismissedOn', today)}>
        Continue journey <ArrowRight size={18} />
      </Button>
    </section>
  )
}
