import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, Check, Plus, Trash2, TrendingUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useApp } from '../../app/context'
import { useExercises, useSessions } from '../../hooks/data'
import { fromDisplayWeight } from '../../domain/profile/units'
import { compareTopSets, formatSet, previousPerformance, topSet } from '../../domain/workouts/workouts'
import type { Exercise, ExerciseType, SessionExercise, WorkoutSet } from '../../domain/models'
import { formatDay } from '../../lib/dates'
import { parseNum } from '../../lib/format'
import { db } from '../../storage/db'
import { exerciseRepo, sessionRepo } from '../../storage/repositories/workouts'
import { useFeedback } from '../../ui/feedback'
import { Page } from '../../ui/Page'
import { Sheet } from '../../ui/Sheet'
import { Button, Card, cx, Input, Segmented } from '../../ui/primitives'

export function SessionScreen() {
  const { id = '' } = useParams()
  const session = useLiveQuery(() => db.sessions.get(id), [id])
  const sessions = useSessions()
  const exercises = useExercises()
  const navigate = useNavigate()
  const { confirm, toast } = useFeedback()
  const [picker, setPicker] = useState(false)
  const now = useMinuteClock()

  if (session === undefined) return <Page>{null}</Page>
  if (!session || session.deletedAt) {
    return (
      <Page title="Workout">
        <Button onClick={() => navigate('/workout')}>Back to workouts</Button>
      </Page>
    )
  }

  const exById = new Map(exercises.map((e) => [e.id, e]))
  const activeRun = !session.finishedAt
  const minutes = Math.max(0, Math.round((now - new Date(session.startedAt).getTime()) / 60000))
  const save = (list: SessionExercise[]) => sessionRepo.setExercises(session.id, list)

  return (
    <Page
      eyebrow={
        <button onClick={() => navigate('/workout')} className="-ml-1 flex items-center gap-1 text-accent-strong">
          <ArrowLeft size={16} /> Workout
        </button>
      }
      title={session.name}
    >
      <div className="-mt-3 mb-4 px-1 text-[13px] text-muted">
        {activeRun ? `In progress · ${minutes} min` : `${formatDay(session.date, { weekday: 'long', month: 'short', day: 'numeric' })}`}
      </div>

      <div className="space-y-3">
        {session.exercises.map((se, i) => {
          const ex = exById.get(se.exerciseId)
          if (!ex) return null
          return (
            <ExerciseCard
              key={`${se.exerciseId}-${i}`}
              ex={ex}
              se={se}
              prev={previousPerformance(sessions, se.exerciseId, session.id)}
              onChange={(next) => save(session.exercises.map((x, j) => (j === i ? next : x)))}
              onRemove={async () => {
                if (se.sets.some((s) => s.reps || s.seconds)) {
                  const ok = await confirm({ title: `Remove ${ex.name}?`, body: 'Sets logged for this exercise in this workout will be removed.', confirmLabel: 'Remove', danger: true })
                  if (!ok) return
                }
                void save(session.exercises.filter((_, j) => j !== i))
              }}
            />
          )
        })}
        <Button block variant="primary" icon={Plus} onClick={() => setPicker(true)}>
          Add exercise
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-[auto_1fr] gap-3">
        <Button
          variant="danger"
          icon={Trash2}
          onClick={async () => {
            const ok = await confirm({
              title: activeRun ? 'Discard this workout?' : 'Delete this workout?',
              body: activeRun ? 'Nothing from this session will be saved.' : 'This removes this one workout from your history.',
              confirmLabel: activeRun ? 'Discard' : 'Delete',
              danger: true,
            })
            if (!ok) return
            if (activeRun) await sessionRepo.discard(session.id)
            else await sessionRepo.remove(session.id)
            navigate('/workout')
          }}
        >
          {activeRun ? 'Discard' : 'Delete'}
        </Button>
        {activeRun ? (
          <Button
            variant="solid"
            icon={Check}
            onClick={async () => {
              // Drop empty trailing sets before saving.
              await save(session.exercises.map((e) => ({ ...e, sets: e.sets.filter((s) => s.reps || s.seconds) })).filter((e) => e.sets.length))
              await sessionRepo.finish(session.id)
              toast('Workout saved')
              navigate('/workout')
            }}
          >
            Finish workout
          </Button>
        ) : (
          <Button onClick={() => navigate('/workout')}>Done</Button>
        )}
      </div>

      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        exercises={exercises}
        onPick={(ex) => {
          void save([...session.exercises, { exerciseId: ex.id, sets: [{}] }])
          setPicker(false)
        }}
      />
    </Page>
  )
}

function useMinuteClock() {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])
  return now
}

function ExerciseCard({
  ex,
  se,
  prev,
  onChange,
  onRemove,
}: {
  ex: Exercise
  se: SessionExercise
  prev: { date: string; sets: WorkoutSet[] } | null
  onChange: (se: SessionExercise) => void
  onRemove: () => void
}) {
  const { units } = useApp()
  const prevTop = prev ? topSet(prev.sets, ex.type) : null
  const curTop = topSet(se.sets, ex.type)
  const delta = compareTopSets(prevTop, curTop, ex.type, units.w, units.toW)
  const setAt = (i: number, patch: Partial<WorkoutSet>) => onChange({ ...se, sets: se.sets.map((s, j) => (j === i ? { ...s, ...patch } : s)) })

  return (
    <Card className="!px-3">
      <div className="flex items-start gap-2 px-1">
        <div className="min-w-0 flex-1">
          <div className="text-[17px] font-semibold">{ex.name}</div>
          <div className="text-[13px] text-muted">
            {prevTop ? (
              <>
                Last time: <span className="tabular text-text">{formatSet(prevTop, ex.type, units.w, units.toW)}</span>
                <span className="text-faint"> · {formatDay(prev!.date)}</span>
              </>
            ) : (
              'First time — this sets your baseline'
            )}
          </div>
        </div>
        {delta && (
          <span
            className={cx(
              'mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold',
              delta.tone === 'up' ? 'bg-good-soft text-good' : 'bg-surface-2 text-muted',
            )}
          >
            {delta.tone === 'up' && <TrendingUp size={12} />}
            {delta.text}
          </span>
        )}
        <button onClick={onRemove} className="press -mt-1 -mr-1 grid h-9 w-9 place-items-center rounded-full text-faint" aria-label={`Remove ${ex.name}`}>
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-[28px_1fr_1fr_40px] items-center gap-2 px-1 text-[11px] font-semibold tracking-wide text-faint uppercase">
        <span>Set</span>
        <span>{ex.type === 'weighted' ? units.w : ex.type === 'timed' ? 'Seconds' : 'Reps'}</span>
        <span>{ex.type === 'weighted' ? 'Reps' : ''}</span>
        <span />
      </div>
      {se.sets.map((s, i) => (
        <SetRow key={`${i}-${se.sets.length}`} index={i} set={s} type={ex.type} onChange={(p) => setAt(i, p)} onRemove={se.sets.length > 1 ? () => onChange({ ...se, sets: se.sets.filter((_, j) => j !== i) }) : undefined} />
      ))}
      <button
        onClick={() => onChange({ ...se, sets: [...se.sets, { ...(se.sets.at(-1) ?? {}), done: false }] })}
        className="press mt-1 flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[14px] font-semibold text-accent-strong active:bg-accent-soft"
      >
        <Plus size={16} /> Add set
      </button>
    </Card>
  )
}

function SetRow({
  index,
  set,
  type,
  onChange,
  onRemove,
}: {
  index: number
  set: WorkoutSet
  type: ExerciseType
  onChange: (p: Partial<WorkoutSet>) => void
  onRemove?: () => void
}) {
  const { profile, units } = useApp()
  // Uncontrolled inputs keep partially typed values like "62." intact.
  const weightDefault = set.weightKg != null ? String(+units.toW(set.weightKg).toFixed(2)) : ''
  const cls = 'tabular h-11 w-full min-w-0 rounded-xl border border-line bg-surface-2 px-3 text-[16px] font-semibold outline-none focus:border-accent/60'
  const logged = !!(set.reps || set.seconds)
  return (
    <div className="grid grid-cols-[28px_1fr_1fr_40px] items-center gap-2 px-1 py-1">
      <span className={cx('text-[14px] font-semibold', logged ? 'text-good' : 'text-faint')}>{index + 1}</span>
      {type === 'weighted' ? (
        <input
          defaultValue={weightDefault}
          inputMode="decimal"
          placeholder="0"
          className={cls}
          onChange={(e) => {
            const v = parseNum(e.target.value)
            onChange({ weightKg: v == null ? undefined : fromDisplayWeight(v, profile.units.weight) })
          }}
        />
      ) : (
        <input
          defaultValue={(type === 'timed' ? set.seconds : set.reps) ?? ''}
          inputMode="numeric"
          placeholder="0"
          className={cls}
          onChange={(e) => {
            const v = parseNum(e.target.value) ?? undefined
            onChange(type === 'timed' ? { seconds: v } : { reps: v })
          }}
        />
      )}
      {type === 'weighted' ? (
        <input
          defaultValue={set.reps ?? ''}
          inputMode="numeric"
          placeholder="0"
          className={cls}
          onChange={(e) => onChange({ reps: parseNum(e.target.value) ?? undefined })}
        />
      ) : (
        <span />
      )}
      {onRemove ? (
        <button onClick={onRemove} className="press grid h-10 w-10 place-items-center rounded-full text-faint" aria-label="Remove set">
          <X size={15} />
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}

export function ExercisePicker({
  open,
  onClose,
  exercises,
  onPick,
}: {
  open: boolean
  onClose: () => void
  exercises: Exercise[]
  onPick: (e: Exercise) => void
}) {
  const [q, setQ] = useState('')
  const [type, setType] = useState<ExerciseType>('weighted')
  const list = exercises.filter((e) => e.name.toLowerCase().includes(q.toLowerCase())).sort((a, b) => a.name.localeCompare(b.name))
  const exact = exercises.some((e) => e.name.toLowerCase() === q.trim().toLowerCase())
  return (
    <Sheet open={open} onClose={onClose} title="Add exercise" full>
      <Input autoFocus placeholder="Search or type a new exercise" value={q} onChange={(e) => setQ(e.target.value)} />
      {q.trim() && !exact && (
        <div className="mt-3 rounded-2xl bg-surface-2 p-3">
          <div className="mb-2 text-[13px] text-muted">Create “{q.trim()}” as</div>
          <Segmented
            size="sm"
            value={type}
            onChange={setType}
            options={[
              { value: 'weighted', label: 'Weight × reps' },
              { value: 'reps', label: 'Reps' },
              { value: 'timed', label: 'Time' },
            ]}
          />
          <Button block variant="primary" className="mt-3" icon={Plus} onClick={async () => onPick(await exerciseRepo.ensure(q, type))}>
            Create and add
          </Button>
        </div>
      )}
      <div className="mt-2">
        {list.map((e) => (
          <button key={e.id} onClick={() => onPick(e)} className="press flex min-h-12 w-full items-center justify-between rounded-xl px-2 text-left active:bg-surface-2">
            <span className="text-[15px]">{e.name}</span>
            <span className="text-[12px] text-faint">{e.type === 'weighted' ? 'weight × reps' : e.type === 'timed' ? 'time' : 'reps'}</span>
          </button>
        ))}
      </div>
    </Sheet>
  )
}
