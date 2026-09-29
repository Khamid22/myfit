import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ACTIVITY_LEVELS, calculatedTargets, estimateEnergy } from '../../domain/profile/energy'
import { fromDisplayLength, fromDisplayWeight } from '../../domain/profile/units'
import type { ActivityLevel, Goal, LengthUnit, Sex, WeightUnit } from '../../domain/models'
import { todayKey } from '../../lib/dates'
import { int, parseNum } from '../../lib/format'
import { profileRepo } from '../../storage/repositories/profile'
import { weightRepo } from '../../storage/repositories/body'
import { seedStarterContent } from '../../storage/seed'
import { Button, Field, Input, NumberInput, Segmented, cx } from '../../ui/primitives'
import { applyTheme } from '../../app/theme'

const STEPS = 5

export function Onboarding() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [wu, setWu] = useState<WeightUnit>('kg')
  const [lu, setLu] = useState<LengthUnit>('cm')
  const [age, setAge] = useState('')
  const [sex, setSex] = useState<Sex>('male')
  const [height, setHeight] = useState('')
  const [feet, setFeet] = useState('')
  const [inches, setInches] = useState('')
  const [weight, setWeight] = useState('')
  const [goalWeight, setGoalWeight] = useState('')
  const [goal, setGoal] = useState<Goal>('lose')
  const [activity, setActivity] = useState<ActivityLevel>('light')
  const [customTarget, setCustomTarget] = useState('')
  const [saving, setSaving] = useState(false)

  const heightCm = useMemo(() => {
    if (lu === 'cm') return parseNum(height)
    const f = parseNum(feet) ?? 0
    const i = parseNum(inches) ?? 0
    return f || i ? fromDisplayLength(f * 12 + i, 'in') : null
  }, [lu, height, feet, inches])
  const weightKg = parseNum(weight) != null ? fromDisplayWeight(parseNum(weight)!, wu) : null
  const goalKg = parseNum(goalWeight) != null ? fromDisplayWeight(parseNum(goalWeight)!, wu) : null
  const ageN = parseNum(age)

  const valid = [
    name.trim().length > 0,
    ageN != null && ageN >= 14 && ageN <= 100 && heightCm != null && heightCm >= 120 && heightCm <= 240,
    weightKg != null && weightKg >= 35 && weightKg <= 350 && goalKg != null && goalKg >= 35 && goalKg <= 350,
    true,
    true,
  ]

  const input =
    ageN && heightCm && weightKg && goalKg
      ? { sex, age: ageN, heightCm, weightKg, activity, goal, goalWeightKg: goalKg }
      : null
  const est = input ? estimateEnergy(input) : null

  async function finish() {
    if (!input) return
    setSaving(true)
    const targets = calculatedTargets(input)
    const manual = parseNum(customTarget)
    if (manual && manual !== targets.kcal) {
      targets.kcal = Math.round(manual)
      targets.source = 'manual'
    }
    const today = todayKey()
    await seedStarterContent()
    await weightRepo.setForDay(today, weightKg!)
    await profileRepo.save({
      name: name.trim(),
      birthYear: new Date().getFullYear() - ageN!,
      sex,
      heightCm: heightCm!,
      startWeightKg: weightKg!,
      goalWeightKg: goalKg!,
      activity,
      goal,
      units: { weight: wu, length: lu },
      targets,
      waterGoalMl: 2500,
      theme: 'dark',
      startDate: today,
    })
    applyTheme('dark')
  }

  const next = () => (step < STEPS - 1 ? setStep(step + 1) : void finish())

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-[560px] flex-col px-5"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 16px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}
    >
      <div className="flex items-center gap-3">
        {step > 0 ? (
          <button onClick={() => setStep(step - 1)} className="press -ml-2 grid h-11 w-11 place-items-center rounded-full text-muted" aria-label="Back">
            <ArrowLeft size={22} />
          </button>
        ) : (
          <div className="h-11" />
        )}
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <div key={i} className={cx('h-1 flex-1 rounded-full transition-colors', i <= step ? 'bg-accent' : 'bg-surface-2')} />
          ))}
        </div>
      </div>

      <div key={step} className="flex-1 animate-rise pt-8">
        {step === 0 && (
          <>
            <div className="mb-8 grid h-16 w-16 place-items-center rounded-[20px] bg-accent-soft">
              <img src="/favicon.svg" alt="" className="h-16 w-16 rounded-[20px]" />
            </div>
            <h1 className="text-[34px] leading-tight font-bold tracking-[-0.02em]">Welcome to MyFit</h1>
            <p className="mt-3 text-[17px] leading-relaxed text-muted">
              A private tracker built for consistency. Bad days are recorded, not punished — <span className="text-text">progress never resets.</span>
            </p>
            <p className="mt-2 text-[14px] text-faint">Everything stays on this device.</p>
            <Field label="What should we call you?" className="mt-8">
              <Input autoFocus placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="given-name" enterKeyHint="next" onKeyDown={(e) => e.key === 'Enter' && valid[0] && next()} />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Title title="About you" sub="Used only to estimate your energy needs." />
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Weight unit">
                  <Segmented options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} value={wu} onChange={setWu} />
                </Field>
                <Field label="Height unit">
                  <Segmented options={[{ value: 'cm', label: 'cm' }, { value: 'in', label: 'ft / in' }]} value={lu} onChange={setLu} />
                </Field>
              </div>
              <Field label="Sex" hint="Biological sex is used in the BMR equation.">
                <Segmented options={[{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }]} value={sex} onChange={setSex} />
              </Field>
              <Field label="Age">
                <NumberInput integer value={age} onChange={setAge} placeholder="30" suffix="years" />
              </Field>
              {lu === 'cm' ? (
                <Field label="Height">
                  <NumberInput value={height} onChange={setHeight} placeholder="178" suffix="cm" />
                </Field>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Height">
                    <NumberInput integer value={feet} onChange={setFeet} placeholder="5" suffix="ft" />
                  </Field>
                  <Field label="&nbsp;">
                    <NumberInput value={inches} onChange={setInches} placeholder="10" suffix="in" />
                  </Field>
                </div>
              )}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Title title="Weight and goal" sub="Your starting point is kept forever — it's how you'll see how far you've come." />
            <div className="space-y-5">
              <Field label="Current weight">
                <NumberInput value={weight} onChange={setWeight} placeholder={wu === 'kg' ? '95.0' : '210'} suffix={wu} />
              </Field>
              <Field label="Goal weight">
                <NumberInput value={goalWeight} onChange={setGoalWeight} placeholder={wu === 'kg' ? '85.0' : '187'} suffix={wu} />
              </Field>
              <Field label="Primary goal">
                <Segmented
                  options={[
                    { value: 'lose', label: 'Lose' },
                    { value: 'maintain', label: 'Maintain' },
                    { value: 'gain', label: 'Gain' },
                  ]}
                  value={goal}
                  onChange={setGoal}
                />
              </Field>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Title title="Activity level" sub="Outside of logged workouts, how active is a typical week?" />
            <div className="space-y-2.5">
              {ACTIVITY_LEVELS.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActivity(a.id)}
                  className={cx(
                    'press flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left',
                    activity === a.id ? 'border-accent/60 bg-accent-soft' : 'border-line bg-surface',
                  )}
                >
                  <div>
                    <div className="text-[16px] font-semibold">{a.label}</div>
                    <div className="text-[13px] text-muted">{a.hint}</div>
                  </div>
                  <div className={cx('h-5 w-5 rounded-full border-2', activity === a.id ? 'border-accent bg-accent shadow-[inset_0_0_0_3px_var(--c-surface)]' : 'border-line-strong')} />
                </button>
              ))}
            </div>
          </>
        )}

        {step === 4 && est && (
          <>
            <Title title={`Your starting estimate`} sub="A starting point, not a rule." />
            <div className="rounded-[22px] border border-line bg-surface p-5">
              <div className="text-[13px] font-medium text-muted">Daily calorie target</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="tabular text-[44px] font-bold tracking-tight">{int(parseNum(customTarget) ?? est.target)}</span>
                <span className="text-muted">kcal</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 border-t border-line pt-4">
                <div>
                  <div className="text-[12px] text-muted">Resting (BMR)</div>
                  <div className="tabular text-[17px] font-semibold">{int(est.bmr)} kcal</div>
                </div>
                <div>
                  <div className="text-[12px] text-muted">Est. maintenance</div>
                  <div className="tabular text-[17px] font-semibold">{int(est.maintenance)} kcal</div>
                </div>
              </div>
              {goal !== 'maintain' && (
                <p className="mt-3 text-[13px] text-muted">
                  {goal === 'lose'
                    ? `A moderate ${int(-est.adjustment)} kcal/day below maintenance — sustainable, no crash dieting.`
                    : `A modest ${int(est.adjustment)} kcal/day surplus for lean gains.`}
                </p>
              )}
            </div>
            <div className="mt-4 flex gap-3 rounded-2xl bg-accent-soft/60 p-4 text-[14px] leading-relaxed text-muted">
              <Info size={18} className="mt-0.5 shrink-0 text-accent-strong" />
              <span>
                This uses the Mifflin–St Jeor equation. Real energy expenditure varies from person to person, so treat it as an
                estimate. After 2–3 weeks, your weight trend will show whether to adjust — you can change it anytime in Profile.
              </span>
            </div>
            <Field label="Prefer a different target? (optional)" className="mt-5">
              <NumberInput integer value={customTarget} onChange={setCustomTarget} placeholder={String(est.target)} suffix="kcal" />
            </Field>
          </>
        )}
      </div>

      <Button variant="solid" size="lg" block className="mt-6" disabled={!valid[step] || saving} onClick={next}>
        {step === STEPS - 1 ? "Let's begin" : 'Continue'}
        {step < STEPS - 1 && <ArrowRight size={18} />}
      </Button>
    </div>
  )
}

function Title({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-[30px] leading-tight font-bold tracking-[-0.02em]">{title}</h1>
      <p className="mt-2 text-[15px] leading-relaxed text-muted">{sub}</p>
    </div>
  )
}
