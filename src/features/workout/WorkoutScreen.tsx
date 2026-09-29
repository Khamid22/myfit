import { ChevronRight, Dumbbell, Footprints, Play, Plus, Settings2, Timer } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useSheets } from '../../app/sheets'
import { useCardio, useExercises, useSessions, useTemplates } from '../../hooks/data'
import { useToday } from '../../hooks/useToday'
import { completedCount, exerciseHistory, plannedCount, primaryValue, templateForDay } from '../../domain/workouts/workouts'
import type { Exercise, WorkoutTemplate } from '../../domain/models'
import { formatDay, relativeDayLabel, startOfWeek, addDays, WEEKDAYS_SHORT } from '../../lib/dates'
import { num } from '../../lib/format'
import { sessionRepo } from '../../storage/repositories/workouts'
import { Page } from '../../ui/Page'
import { ProgressLine } from '../../ui/charts'
import { Button, Card, cx, Empty, IconButton, SectionTitle } from '../../ui/primitives'

export function WorkoutScreen() {
  const today = useToday()
  const templates = useTemplates()
  const sessions = useSessions()
  const exercises = useExercises()
  const cardio = useCardio()
  const sheets = useSheets()
  const navigate = useNavigate()
  const active = sessions.find((s) => s.kind === 'session' && !s.finishedAt)
  const planned = templateForDay(templates, today)
  const doneToday = sessions.some((s) => s.kind === 'session' && s.finishedAt && s.date === today)
  const ws = startOfWeek(today)
  const weekDone = completedCount(sessions, ws, addDays(ws, 6))
  const weekPlanned = plannedCount(templates, ws, addDays(ws, 6))
  const recent = sessions
    .filter((s) => s.kind === 'session' && s.finishedAt)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startedAt.localeCompare(a.startedAt))
    .slice(0, 6)
  const bodyweight = exercises
    .filter((e) => e.type !== 'weighted')
    .sort((a, b) => (a.name === 'Push-ups' ? -1 : b.name === 'Push-ups' ? 1 : a.name.localeCompare(b.name)))

  async function start(t: WorkoutTemplate | null) {
    const s = await sessionRepo.start(t)
    navigate(`/workout/session/${s.id}`)
  }

  return (
    <Page title="Workout" eyebrow={weekPlanned ? `This week · ${weekDone} / ${weekPlanned} planned` : `This week · ${weekDone} completed`}>
      <div className="space-y-6">
        {active ? (
          <Card onClick={() => navigate(`/workout/session/${active.id}`)} className="border-accent/40 bg-[radial-gradient(120%_120%_at_0%_0%,var(--c-accent-soft),transparent_60%)]">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-accent text-bg">
                <Timer size={20} />
              </span>
              <div className="flex-1">
                <div className="text-[12px] font-semibold tracking-[0.08em] text-accent-strong uppercase">In progress</div>
                <div className="text-[17px] font-semibold">{active.name}</div>
              </div>
              <ChevronRight className="text-muted" />
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-[13px] font-medium text-muted">{doneToday ? 'Done today — nice work' : planned ? "Today's plan" : 'No workout planned today'}</div>
            <div className="mt-0.5 text-[22px] font-bold tracking-tight">{planned?.name ?? 'Free session'}</div>
            {planned && <div className="mt-1 text-[13px] text-muted">{planned.exerciseIds.map((id) => exercises.find((e) => e.id === id)?.name).filter(Boolean).join(' · ')}</div>}
            <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
              <Button variant="solid" icon={Play} onClick={() => (planned ? start(planned) : sheets.open({ type: 'startWorkout' }))}>
                {planned ? `Start ${planned.name}` : 'Start workout'}
              </Button>
              <Button onClick={() => sheets.open({ type: 'startWorkout' })}>Other</Button>
            </div>
          </Card>
        )}

        <section>
          <SectionTitle action={<IconButton icon={Settings2} label="Manage templates" size={18} className="-mr-2 h-9 w-9" onClick={() => navigate('/workout/templates')} />}>
            Templates
          </SectionTitle>
          <div className="space-y-2.5">
            {templates.map((t) => (
              <Card key={t.id} className="!py-3">
                <div className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-semibold">{t.name}</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.weekdays.map((d) => (
                        <span key={d} className="rounded-md bg-surface-2 px-1.5 py-0.5 text-[11px] font-semibold text-muted">
                          {WEEKDAYS_SHORT[d]}
                        </span>
                      ))}
                      <span className="text-[12px] text-faint">{t.exerciseIds.length} exercises</span>
                    </div>
                  </div>
                  <Button size="sm" variant="primary" icon={Play} disabled={!!active} onClick={() => start(t)}>
                    Start
                  </Button>
                </div>
              </Card>
            ))}
            {!templates.length && <Empty icon={Dumbbell} title="No templates yet" />}
          </div>
        </section>

        <section>
          <SectionTitle>Bodyweight</SectionTitle>
          <div className="space-y-2.5">
            {bodyweight.map((e) => (
              <BodyweightCard key={e.id} ex={e} onLog={() => sheets.open({ type: 'bodyweight', exerciseId: e.id, date: today })} />
            ))}
          </div>
        </section>

        <section>
          <SectionTitle
            action={
              <button onClick={() => sheets.open({ type: 'cardio', date: today })} className="press flex h-9 items-center gap-1 rounded-full bg-accent-soft pr-3.5 pl-2.5 text-[14px] font-semibold text-accent-strong">
                <Plus size={16} strokeWidth={2.5} /> Log
              </button>
            }
          >
            Cardio
          </SectionTitle>
          <Card className="!py-2">
            {[...cardio].reverse().slice(0, 5).map((c) => (
              <div key={c.id} className="flex min-h-14 items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-surface-2 text-carbs">
                  <Footprints size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium">{c.activity}</div>
                  <div className="tabular truncate text-[12px] text-muted">
                    {[`${c.minutes} min`, c.km && `${num(c.km)} km`, c.kmh && `${num(c.kmh)} km/h`, c.inclinePct && `${num(c.inclinePct)}% incline`, c.kcalEstimate && `~${c.kcalEstimate} kcal`]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>
                <span className="text-[12px] text-faint">{relativeDayLabel(c.date, today)}</span>
              </div>
            ))}
            {!cardio.length && <p className="py-3 text-[14px] text-muted">Walks, treadmill sessions and rides show up here.</p>}
          </Card>
          <p className="mt-2 px-1 text-[12px] text-faint">Exercise calories are rough estimates and aren't added back to your calorie target.</p>
        </section>

        <section>
          <SectionTitle>Recent workouts</SectionTitle>
          <Card className="!py-1">
            {recent.map((s) => (
              <button key={s.id} onClick={() => navigate(`/workout/session/${s.id}`)} className="press flex min-h-14 w-full items-center gap-3 rounded-xl text-left active:bg-surface-2">
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-medium">{s.name}</div>
                  <div className="text-[12px] text-muted">
                    {s.exercises.length} exercises · {s.exercises.reduce((n, e) => n + e.sets.filter((x) => x.reps || x.seconds).length, 0)} sets
                  </div>
                </div>
                <span className="text-[12px] text-faint">{formatDay(s.date)}</span>
                <ChevronRight size={16} className="text-faint" />
              </button>
            ))}
            {!recent.length && <p className="py-3 text-[14px] text-muted">Finished workouts appear here.</p>}
          </Card>
        </section>
      </div>
    </Page>
  )
}

function BodyweightCard({ ex, onLog }: { ex: Exercise; onLog: () => void }) {
  const sessions = useSessions()
  const hist = exerciseHistory(sessions, ex)
  const fmt = (v: number) => (ex.type === 'timed' ? `${v} s` : `${v}`)
  const vals = hist.map((h) => primaryValue(h.best, ex.type))
  const best = vals.length ? Math.max(...vals) : null
  const first = vals[0]
  const latest = vals.at(-1)
  return (
    <Card className="!py-3.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-semibold">{ex.name}</div>
          <div className="tabular text-[13px] text-muted">
            {best != null ? (
              <>
                Best <span className="font-semibold text-text">{fmt(best)}</span>
                {ex.type === 'reps' && ' reps'}
                {first != null && latest != null && latest !== first && (
                  <span className={cx('ml-2', latest > first ? 'text-good' : 'text-muted')}>
                    {latest > first ? '+' : ''}
                    {latest - first} since {formatDay(hist[0].date)}
                  </span>
                )}
              </>
            ) : (
              'No entries yet'
            )}
          </div>
        </div>
        <Button size="sm" variant="primary" icon={Plus} onClick={onLog}>
          Log
        </Button>
      </div>
      {hist.length >= 2 && (
        <>
          <ProgressLine data={hist.map((h) => ({ date: h.date, value: primaryValue(h.best, ex.type) }))} format={(v) => (ex.type === 'timed' ? `${v} s` : `${v} reps`)} color="var(--c-fat)" />
          <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pt-1">
            {[...hist].reverse().slice(0, 8).map((h) => (
              <div key={h.date} className="shrink-0 text-center">
                <div className="text-[11px] text-faint">{formatDay(h.date)}</div>
                <div className="tabular text-[14px] font-semibold">{fmt(primaryValue(h.best, ex.type))}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )
}
