import { ArrowDown, ArrowUp, Plus } from 'lucide-react'
import { BackLink } from '../../ui/BackLink'
import { useState } from 'react'
import { useHabits } from '../../hooks/data'
import type { HabitDef, HabitKind } from '../../domain/models'
import { habitRepo } from '../../storage/repositories/habits'
import { HABIT_ICONS, habitIcon } from '../../ui/icons'
import { useFeedback } from '../../ui/feedback'
import { Page } from '../../ui/Page'
import { Sheet } from '../../ui/Sheet'
import { Button, Card, cx, Field, Input, Segmented, Toggle } from '../../ui/primitives'

export function HabitsSettings() {
  const habits = useHabits()
  const [edit, setEdit] = useState<HabitDef | 'new' | null>(null)

  const move = (i: number, d: number) => {
    const ids = habits.map((h) => h.id)
    const j = i + d
    if (j < 0 || j >= ids.length) return
    ;[ids[i], ids[j]] = [ids[j], ids[i]]
    void habitRepo.reorder(ids)
  }

  return (
    <Page
      title="Habits"
      eyebrow={
        <BackLink label="Settings" to="/settings" />
      }
    >
      <p className="-mt-2 mb-4 px-1 text-[14px] text-muted">
        Tick a habit on Today when you've done it. For “avoid” habits like No Energy Drink, <b className="text-text">long-press</b> it to note that you had one — that's fine, it just keeps your weekly counts honest. Turning a habit off hides it; its history is kept.
      </p>
      <Card className="!px-2 !py-1">
        {habits.map((h, i) => {
          const Icon = habitIcon(h.icon)
          return (
            <div key={h.id} className="flex min-h-16 items-center gap-2 border-b border-line last:border-0">
              <button onClick={() => setEdit(h)} className="press flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1 py-2 text-left">
                <span className={cx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', h.active ? 'bg-accent-soft text-accent-strong' : 'bg-surface-2 text-faint')}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className={cx('block truncate text-[15px] font-medium', !h.active && 'text-muted')}>{h.name}</span>
                  <span className="block text-[12px] text-faint">
                    {h.kind === 'avoid' ? 'Avoid' : 'Do'}
                    {h.auto ? ' · auto-completes' : ''}
                  </span>
                </span>
              </button>
              <div className="flex">
                <button className="press grid h-9 w-8 place-items-center text-faint disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">
                  <ArrowUp size={15} />
                </button>
                <button className="press grid h-9 w-8 place-items-center text-faint disabled:opacity-30" disabled={i === habits.length - 1} onClick={() => move(i, 1)} aria-label="Move down">
                  <ArrowDown size={15} />
                </button>
              </div>
              <Toggle checked={h.active} onChange={(v) => habitRepo.update(h.id, { active: v })} label={`${h.name} active`} />
            </div>
          )
        })}
      </Card>
      <Button block variant="primary" icon={Plus} className="mt-4" onClick={() => setEdit('new')}>
        Add habit
      </Button>
      <HabitEditor habit={edit} onClose={() => setEdit(null)} nextOrder={habits.length} />
    </Page>
  )
}

function HabitEditor({ habit, onClose, nextOrder }: { habit: HabitDef | 'new' | null; onClose: () => void; nextOrder: number }) {
  const { confirm } = useFeedback()
  const h = habit === 'new' ? null : habit
  const [name, setName] = useState('')
  const [kind, setKind] = useState<HabitKind>('do')
  const [icon, setIcon] = useState('check')
  const [loaded, setLoaded] = useState<unknown>(null)
  if (habit !== loaded) {
    setLoaded(habit)
    setName(h?.name ?? '')
    setKind(h?.kind ?? 'do')
    setIcon(h?.icon ?? 'check')
  }

  return (
    <Sheet open={!!habit} onClose={onClose} title={h ? 'Edit habit' : 'New habit'}>
      <div className="space-y-4 pb-2">
        <Field label="Name" hint={kind === 'avoid' ? 'Phrase it positively, e.g. “No Sweets”.' : undefined}>
          <Input autoFocus={!h} placeholder={kind === 'avoid' ? 'No Sweets' : 'Stretch 10 minutes'} value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Type">
          <Segmented options={[{ value: 'do', label: 'Do something' }, { value: 'avoid', label: 'Avoid something' }]} value={kind} onChange={setKind} />
        </Field>
        <Field label="Icon">
          <div className="grid grid-cols-8 gap-1.5">
            {Object.entries(HABIT_ICONS).map(([k, Icon]) => (
              <button key={k} onClick={() => setIcon(k)} className={cx('press grid aspect-square place-items-center rounded-xl', icon === k ? 'bg-accent text-bg' : 'bg-surface-2 text-muted')} aria-label={k}>
                <Icon size={17} />
              </button>
            ))}
          </div>
        </Field>
        <Button
          variant="solid"
          size="lg"
          block
          disabled={!name.trim()}
          onClick={async () => {
            if (h) await habitRepo.update(h.id, { name: name.trim(), kind, icon })
            else await habitRepo.add({ name: name.trim(), kind, icon, order: nextOrder, active: true })
            onClose()
          }}
        >
          Save
        </Button>
        {h && !h.key && (
          <Button
            variant="ghost"
            block
            className="!text-warn"
            onClick={async () => {
              if (await confirm({ title: `Remove ${h.name}?`, body: 'The habit is removed from your list. Past check-ins stay in your backup history.', confirmLabel: 'Remove', danger: true })) {
                await habitRepo.remove(h.id)
                onClose()
              }
            }}
          >
            Remove habit
          </Button>
        )}
      </div>
    </Sheet>
  )
}

