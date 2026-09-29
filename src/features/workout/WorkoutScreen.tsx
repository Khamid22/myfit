import { ChevronRight, Footprints, Play, Plus, Settings2, Timer } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useSheets } from '../../app/sheets'
import { useExercises, useSessions, useTemplates } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { completedCount, exerciseHistory, plannedCount, primaryValue, templateForDay } from '../../domain/workouts/workouts'
import type { WorkoutTemplate } from '../../domain/models'
import { addDays, formatDay, startOfWeek } from '../../lib/dates'
import { sessionRepo } from '../../storage/repositories/workouts'
import { Page } from '../../ui/Page'
import { Button, Card, cx, IconButton, SectionTitle } from '../../ui/primitives'

export function WorkoutScreen() {
  const today = useToday()
  const templates = useTemplates()
  const sessions = useSessions()
  const exercises = useExercises()
  const sheets = useSheets()
  const navigate = useNavigate()
  const active = sessions.find((s) => s.kind === 'session' && !s.finishedAt)
  const planned = templateForDay(templates, today)
  const ws = startOfWeek(today)
  const weekDone = completedCount(sessions, ws, addDays(ws, 6))
  const weekPlanned = plannedCount(templates, ws, addDays(ws, 6))
  const recent = sessions
    .filter((s) => s.kind === 'session' && s.finishedAt)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))
    .slice(0, 4)
  const pushups = exercises.find((e) => e.name === 'Push-ups')
  const puHist = pushups ? exerciseHistory(sessions, pushups).map((h) => primaryValue(h.best, 'reps')) : []

  async function start(t: WorkoutTemplate | null) {
    const s = active ?? (await sessionRepo.start(t))
    navigate(`/workout/session/${s.id}`)
  }

  return (
    <Page
      title="Workout"
      eyebrow={`This week: ${weekDone}${weekPlanned ? ` of ${weekPlanned}` : ''} done`}
      action={<IconButton icon={Settings2} label="Edit templates" onClick={() => navigate('/workout/templates')} className="bg-surface text-text" />}
    >
      <div className="space-y-6">
        {active ? (
          <Card onClick={() => navigate(`/workout/session/${active.id}`)} className="border-accent/40">
            <div className="flex items-center gap-3">
              <Timer size={22} className="text-accent-strong" />
              <div className="flex-1">
                <div className="text-[13px] text-muted">In progress</div>
                <div className="text-[17px] font-semibold">{active.name}</div>
              </div>
              <span className="text-[15px] font-semibold text-accent-strong">Resume</span>
            </div>
          </Card>
        ) : (
          <section>
            <SectionTitle>Start a workout</SectionTitle>
            <div className="space-y-2">
              {[...templates].sort((a, b) => Number(b.id === planned?.id) - Number(a.id === planned?.id)).map((t) => (
                <button
                  key={t.id}
                  onClick={() => start(t)}
                  className={cx(
                    'press flex min-h-16 w-full items-center gap-3 rounded-[20px] border px-4 text-left',
                    t.id === planned?.id ? 'border-accent/50 bg-accent-soft' : 'border-line bg-surface',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold">{t.name}</span>
                    {t.id === planned?.id && <span className="block text-[12px] text-accent-strong">Planned for today</span>}
                  </span>
                  <Play size={18} className="text-accent-strong" />
                </button>
              ))}
              <button onClick={() => start(null)} className="press w-full rounded-2xl py-3 text-[15px] font-semibold text-accent-strong active:bg-accent-soft">
                Empty workout
              </button>
            </div>
          </section>
        )}

        {pushups && (
          <Card>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-[16px] font-semibold">Push-ups</div>
                <div className="text-[13px] text-muted">
                  {puHist.length ? (
                    <>
                      Best <span className="font-semibold text-text">{Math.max(...puHist)}</span> · last {puHist.at(-1)}
                    </>
                  ) : (
                    'Log your best set'
                  )}
                </div>
              </div>
              <Button size="sm" variant="primary" icon={Plus} onClick={() => sheets.open({ type: 'bodyweight', exerciseId: pushups.id, date: today })}>
                Log
              </Button>
            </div>
          </Card>
        )}

        <button onClick={() => sheets.open({ type: 'cardio', date: today })} className="press flex w-full items-center gap-3 rounded-2xl px-1 py-1 text-left">
          <Footprints size={18} className="text-carbs" />
          <span className="flex-1 text-[15px] font-medium">Log a walk or cardio</span>
          <ChevronRight size={18} className="text-faint" />
        </button>

        {recent.length > 0 && (
          <section>
            <SectionTitle>Recent</SectionTitle>
            <Card className="!py-1">
              {recent.map((s) => (
                <button key={s.id} onClick={() => navigate(`/workout/session/${s.id}`)} className="press flex min-h-13 w-full items-center gap-3 text-left">
                  <span className="flex-1 text-[15px] font-medium">{s.name}</span>
                  <span className="text-[13px] text-faint">{formatDay(s.date)}</span>
                  <ChevronRight size={16} className="text-faint" />
                </button>
              ))}
            </Card>
          </section>
        )}
      </div>
    </Page>
  )
}
