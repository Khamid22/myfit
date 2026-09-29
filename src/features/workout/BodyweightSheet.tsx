import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useExercises, useSessions } from '../../hooks/data'
import { exerciseHistory, primaryValue } from '../../domain/workouts/workouts'
import type { DayKey } from '../../lib/dates'
import { sessionRepo } from '../../storage/repositories/workouts'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Button, Chip } from '../../ui/primitives'

/** Log the best set of a bodyweight exercise (push-ups, pull-ups, plank…) in a couple of taps. */
export function BodyweightSheet({ open, onClose, exerciseId, date }: { open: boolean; onClose: () => void; exerciseId?: string; date: DayKey }) {
  const exercises = useExercises().filter((e) => e.type !== 'weighted')
  const sessions = useSessions()
  const { toast } = useFeedback()
  const [id, setId] = useState<string | undefined>(exerciseId)
  const [value, setValue] = useState(0)
  const ex = exercises.find((e) => e.id === id) ?? exercises.find((e) => e.name === 'Push-ups') ?? exercises[0]
  const hist = ex ? exerciseHistory(sessions, ex) : []
  const vals = hist.map((h) => primaryValue(h.best, ex!.type))
  const best = vals.length ? Math.max(...vals) : null
  const latest = vals.at(-1)

  useEffect(() => {
    if (open) setId(exerciseId)
  }, [open, exerciseId])
  useEffect(() => {
    setValue(latest ?? (ex?.type === 'timed' ? 30 : 5))
  }, [ex?.id, open]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!ex) return null
  const timed = ex.type === 'timed'
  const stepBy = timed ? 5 : 1

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Log ${ex.name.toLowerCase()}`}
      subtitle={best != null ? `Personal best: ${best}${timed ? ' s' : ' reps'}` : 'Your first entry sets the baseline.'}
      footer={
        <Button
          variant="solid"
          size="lg"
          block
          disabled={value <= 0}
          onClick={async () => {
            await sessionRepo.quickLog(ex, [timed ? { seconds: value } : { reps: value }], date)
            onClose()
            toast(best != null && value > best ? `New best: ${value}${timed ? ' s' : ''}!` : 'Saved')
          }}
        >
          Save
        </Button>
      }
    >
      <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
        {exercises.map((e) => (
          <Chip key={e.id} active={e.id === ex.id} onClick={() => setId(e.id)}>
            {e.name}
          </Chip>
        ))}
      </div>
      <p className="mt-4 text-center text-[13px] text-muted">Your best set today</p>
      <div className="mt-2 flex items-center justify-center gap-5">
        <button onClick={() => setValue(Math.max(0, value - stepBy))} className="press grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-muted" aria-label="Less">
          <Minus size={24} />
        </button>
        <div className="w-[120px] text-center">
          <input
            inputMode="numeric"
            value={value || ''}
            onChange={(e) => setValue(parseInt(e.target.value.replace(/\D/g, '')) || 0)}
            className="tabular w-full bg-transparent text-center font-bold tracking-tight outline-none"
            style={{ fontSize: 64, lineHeight: 1 }}
            aria-label={timed ? 'Seconds' : 'Reps'}
          />
          <div className="text-[14px] text-muted">{timed ? 'seconds' : 'reps'}</div>
        </div>
        <button onClick={() => setValue(value + stepBy)} className="press grid h-16 w-16 place-items-center rounded-full bg-surface-2 text-muted" aria-label="More">
          <Plus size={24} />
        </button>
      </div>
      {best != null && value > best && <p className="mt-4 text-center text-[14px] font-semibold text-good">That's a new personal best</p>}
    </Sheet>
  )
}
