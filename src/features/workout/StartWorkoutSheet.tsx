import { Play, Plus } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useSheets } from '../../app/sheets'
import { useTemplates } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { templateForDay } from '../../domain/workouts/workouts'
import type { WorkoutTemplate } from '../../domain/models'
import { WEEKDAYS_SHORT } from '../../lib/dates'
import { sessionRepo } from '../../storage/repositories/workouts'
import { Sheet } from '../../ui/Sheet'
import { Button, cx } from '../../ui/primitives'

export function StartWorkoutSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const templates = useTemplates()
  const today = useToday()
  const navigate = useNavigate()
  const sheets = useSheets()
  const planned = templateForDay(templates, today)

  async function start(t: WorkoutTemplate | null) {
    const active = await sessionRepo.active()
    const s = active ?? (await sessionRepo.start(t))
    onClose()
    navigate(`/workout/session/${s.id}`)
  }

  return (
    <Sheet open={open} onClose={onClose} title="Start workout" subtitle="Pick a template — last time's numbers load automatically.">
      <div className="space-y-2 pb-2">
        {templates.map((t) => (
          <button
            key={t.id}
            onClick={() => start(t)}
            className={cx(
              'press flex min-h-16 w-full items-center gap-3 rounded-2xl border px-4 text-left',
              t.id === planned?.id ? 'border-accent/50 bg-accent-soft' : 'border-line bg-surface-2',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="text-[16px] font-semibold">{t.name}</div>
              <div className="text-[12px] text-muted">
                {t.id === planned?.id ? 'Planned for today · ' : ''}
                {t.weekdays.map((d) => WEEKDAYS_SHORT[d]).join(', ') || 'No fixed day'} · {t.exerciseIds.length} exercises
              </div>
            </div>
            <Play size={18} className="text-accent-strong" />
          </button>
        ))}
        <Button block icon={Plus} onClick={() => start(null)}>
          Empty workout
        </Button>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button variant="ghost" onClick={() => sheets.open({ type: 'bodyweight', date: today })}>
            Quick push-ups
          </Button>
          <Button variant="ghost" onClick={() => sheets.open({ type: 'cardio', date: today })}>
            Log cardio
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
