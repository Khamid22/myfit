import { ArrowRight, Check } from 'lucide-react'
import { useSheets } from '../../app/sheets'
import type { Snapshot } from '../../domain/progress/insights'
import type { DayKey } from '../../lib/dates'
import { metaRepo } from '../../storage/repositories/profile'
import { Button, cx } from '../../ui/primitives'

/** Shown after a few quiet days. Nothing is reset — the user simply continues. */
export function RecoveryCard({ today, gap, snap }: { today: DayKey; gap: number; snap: Snapshot }) {
  const sheets = useSheets()
  const items = [
    { label: "Record today's weight", done: snap.weights.some((w) => w.date === today), run: () => sheets.open({ type: 'weight', date: today }) },
    { label: 'Log your next meal', done: snap.foodLogs.some((l) => l.date === today), run: () => sheets.open({ type: 'food', date: today }) },
  ]
  return (
    <section className="animate-rise rounded-[24px] border border-accent/30 bg-[radial-gradient(120%_100%_at_0%_0%,var(--c-accent-soft),transparent_60%)] bg-surface p-5">
      <div className="text-[12px] font-semibold tracking-[0.1em] text-accent-strong uppercase">Welcome back</div>
      <h2 className="mt-1.5 text-[21px] leading-snug font-bold tracking-tight">Your previous progress is still here.</h2>
      <p className="mt-1 text-[14px] text-muted">{gap} days away changes nothing that came before. Let's continue today.</p>
      <div className="mt-3">
        {items.map((it) => (
          <button key={it.label} onClick={it.run} className="press flex min-h-12 w-full items-center gap-3 rounded-xl text-left">
            <span className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2', it.done ? 'border-good bg-good text-bg' : 'border-line-strong')}>
              {it.done && <Check size={14} strokeWidth={3} />}
            </span>
            <span className={cx('text-[15px]', it.done && 'text-muted line-through')}>{it.label}</span>
          </button>
        ))}
      </div>
      <Button variant="primary" block className="mt-3" onClick={() => metaRepo.set('recoveryDismissedOn', today)}>
        Continue journey <ArrowRight size={18} />
      </Button>
    </section>
  )
}
