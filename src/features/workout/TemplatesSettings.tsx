import { ArrowLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useExercises, useTemplates } from '../../hooks/data'
import type { WorkoutTemplate } from '../../domain/models'
import { WEEKDAYS_SHORT } from '../../lib/dates'
import { templateRepo } from '../../storage/repositories/workouts'
import { useFeedback } from '../../ui/feedback'
import { Page } from '../../ui/Page'
import { Sheet } from '../../ui/Sheet'
import { Button, Card, cx, Field, Input } from '../../ui/primitives'
import { ExercisePicker } from './SessionScreen'

export function TemplatesSettings() {
  const navigate = useNavigate()
  const templates = useTemplates()
  const exercises = useExercises()
  const [edit, setEdit] = useState<WorkoutTemplate | 'new' | null>(null)
  return (
    <Page
      title="Templates"
      eyebrow={
        <button onClick={() => navigate(-1)} className="-ml-1 flex items-center gap-1 text-accent-strong">
          <ArrowLeft size={16} /> Back
        </button>
      }
    >
      <p className="-mt-2 mb-4 px-1 text-[14px] text-muted">Planned days are used to compare completed vs planned workouts — missing one never resets anything.</p>
      <div className="space-y-2.5">
        {templates.map((t) => (
          <Card key={t.id} onClick={() => setEdit(t)}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-semibold">{t.name}</div>
                <div className="truncate text-[13px] text-muted">{t.exerciseIds.map((id) => exercises.find((e) => e.id === id)?.name).filter(Boolean).join(' · ')}</div>
                <div className="mt-1 text-[12px] text-faint">{t.weekdays.map((d) => WEEKDAYS_SHORT[d]).join(', ') || 'No fixed day'}</div>
              </div>
              <ChevronRight size={18} className="text-faint" />
            </div>
          </Card>
        ))}
        <Button block variant="primary" icon={Plus} onClick={() => setEdit('new')}>
          New template
        </Button>
      </div>
      <TemplateEditor template={edit} onClose={() => setEdit(null)} nextOrder={templates.length} />
    </Page>
  )
}

function TemplateEditor({ template, onClose, nextOrder }: { template: WorkoutTemplate | 'new' | null; onClose: () => void; nextOrder: number }) {
  const exercises = useExercises()
  const { confirm } = useFeedback()
  const t = template === 'new' ? null : template
  const [name, setName] = useState('')
  const [days, setDays] = useState<number[]>([])
  const [ids, setIds] = useState<string[]>([])
  const [picker, setPicker] = useState(false)
  const [loadedFor, setLoadedFor] = useState<unknown>(null)

  if (template !== loadedFor) {
    setLoadedFor(template)
    setName(t?.name ?? '')
    setDays(t?.weekdays ?? [])
    setIds(t?.exerciseIds ?? [])
  }

  async function save() {
    const data = { name: name.trim(), weekdays: [...days].sort(), exerciseIds: ids }
    if (t) await templateRepo.update(t.id, data)
    else await templateRepo.add({ ...data, order: nextOrder })
    onClose()
  }

  return (
    <Sheet open={!!template} onClose={onClose} title={t ? 'Edit template' : 'New template'} full>
      <div className="space-y-5 pb-2">
        <Field label="Name">
          <Input placeholder="e.g. Chest + Triceps" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Planned days">
          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAYS_SHORT.map((d, i) => (
              <button
                key={d}
                onClick={() => setDays(days.includes(i) ? days.filter((x) => x !== i) : [...days, i])}
                className={cx('press h-11 rounded-xl text-[13px] font-semibold', days.includes(i) ? 'bg-accent text-bg' : 'bg-surface-2 text-muted')}
              >
                {d.slice(0, 2)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Exercises">
          <div className="space-y-1.5">
            {ids.map((id, i) => (
              <div key={`${id}-${i}`} className="flex h-12 items-center gap-2 rounded-xl bg-surface-2 pr-1 pl-4">
                <span className="flex-1 truncate text-[15px]">{exercises.find((e) => e.id === id)?.name}</span>
                <button onClick={() => setIds(ids.filter((_, j) => j !== i))} className="press grid h-10 w-10 place-items-center text-faint" aria-label="Remove">
                  <X size={16} />
                </button>
              </div>
            ))}
            <Button block variant="ghost" icon={Plus} onClick={() => setPicker(true)}>
              Add exercise
            </Button>
          </div>
        </Field>
        <Button variant="solid" size="lg" block disabled={!name.trim()} onClick={save}>
          Save template
        </Button>
        {t && (
          <Button
            variant="ghost"
            block
            className="!text-warn"
            onClick={async () => {
              if (await confirm({ title: `Delete ${t.name}?`, body: 'Past workouts from this template stay in your history.', confirmLabel: 'Delete', danger: true })) {
                await templateRepo.remove(t.id)
                onClose()
              }
            }}
          >
            Delete template
          </Button>
        )}
      </div>
      <ExercisePicker
        open={picker}
        onClose={() => setPicker(false)}
        exercises={exercises}
        onPick={(e) => {
          setIds([...ids, e.id])
          setPicker(false)
        }}
      />
    </Sheet>
  )
}
