import { useEffect, useState } from 'react'
import { useApp } from '../../app/context'
import { ACTIVITY_LEVELS, calculatedTargets } from '../../domain/profile/energy'
import { fromDisplayLength, fromDisplayWeight, toDisplayLength, toDisplayWeight } from '../../domain/profile/units'
import type { ActivityLevel, Goal, Sex } from '../../domain/models'
import { int, parseNum } from '../../lib/format'
import { profileRepo } from '../../storage/repositories/profile'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Button, Field, Input, NumberInput, Segmented, cx } from '../../ui/primitives'

export function PersonalSheet({ open, onClose, currentKg }: { open: boolean; onClose: () => void; currentKg: number }) {
  const { profile, units } = useApp()
  const { toast } = useFeedback()
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [height, setHeight] = useState('')
  const [goalW, setGoalW] = useState('')
  const [goal, setGoal] = useState<Goal>('lose')
  const [activity, setActivity] = useState<ActivityLevel>('light')

  useEffect(() => {
    if (!open) return
    setName(profile.name)
    setAge(String(new Date().getFullYear() - profile.birthYear))
    setSex(profile.sex)
    setHeight(toDisplayLength(profile.heightCm, profile.units.length).toFixed(profile.units.length === 'cm' ? 0 : 1))
    setGoalW(toDisplayWeight(profile.goalWeightKg, profile.units.weight).toFixed(1))
    setGoal(profile.goal)
    setActivity(profile.activity)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const heightCm = parseNum(height) != null ? fromDisplayLength(parseNum(height)!, profile.units.length) : null
  const goalKg = parseNum(goalW) != null ? fromDisplayWeight(parseNum(goalW)!, profile.units.weight) : null
  const ageN = parseNum(age)
  const valid = name.trim() && ageN && heightCm && goalKg
  const rec = valid ? calculatedTargets({ sex, age: ageN!, heightCm: heightCm!, weightKg: currentKg, activity, goal, goalWeightKg: goalKg! }) : null

  async function save(recalc: boolean) {
    if (!valid) return
    await profileRepo.update({
      name: name.trim(),
      birthYear: new Date().getFullYear() - ageN!,
      sex,
      heightCm: heightCm!,
      goalWeightKg: goalKg!,
      goal,
      activity,
      ...(recalc && rec ? { targets: rec } : {}),
    })
    onClose()
    toast(recalc ? 'Profile saved and targets recalculated' : 'Profile saved')
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit profile" full>
      <div className="space-y-4 pb-2">
        <Field label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Age">
            <NumberInput integer value={age} onChange={setAge} suffix="y" />
          </Field>
          <Field label="Height">
            <NumberInput value={height} onChange={setHeight} suffix={units.l} />
          </Field>
        </div>
        <Field label="Sex">
          <Segmented options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} value={sex} onChange={setSex} />
        </Field>
        <Field label="Goal">
          <Segmented options={[{ value: 'lose', label: 'Lose' }, { value: 'maintain', label: 'Maintain' }, { value: 'gain', label: 'Gain' }]} value={goal} onChange={setGoal} />
        </Field>
        <Field label="Goal weight">
          <NumberInput value={goalW} onChange={setGoalW} suffix={units.w} />
        </Field>
        <Field label="Activity level">
          <div className="space-y-1.5">
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a.id}
                onClick={() => setActivity(a.id)}
                className={cx('press flex w-full items-center justify-between rounded-xl border px-3.5 py-2.5 text-left', activity === a.id ? 'border-accent/60 bg-accent-soft' : 'border-line bg-surface-2')}
              >
                <span className="text-[14px] font-semibold">{a.label}</span>
                <span className="text-[12px] text-muted">{a.hint}</span>
              </button>
            ))}
          </div>
        </Field>
        <p className="px-1 text-[12px] text-faint">Your starting weight ({units.weightU(profile.startWeightKg)}) is kept as part of your history.</p>
        <Button variant="solid" size="lg" block disabled={!valid} onClick={() => save(true)}>
          Save & recalculate targets{rec ? ` (${int(rec.kcal)} kcal)` : ''}
        </Button>
        <Button block onClick={() => save(false)} disabled={!valid}>
          Save, keep current targets
        </Button>
      </div>
    </Sheet>
  )
}
