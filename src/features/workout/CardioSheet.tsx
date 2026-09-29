import { useEffect, useState } from 'react'
import type { DayKey } from '../../lib/dates'
import { parseNum } from '../../lib/format'
import { cardioRepo } from '../../storage/repositories/body'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Button, Chip, Field, Input, NumberInput } from '../../ui/primitives'

const ACTIVITIES = ['Walking', 'Treadmill', 'Running', 'Cycling', 'Elliptical', 'Swimming', 'Stairs']

export function CardioSheet({ open, onClose, date }: { open: boolean; onClose: () => void; date: DayKey }) {
  const { toast } = useFeedback()
  const [activity, setActivity] = useState('Walking')
  const [custom, setCustom] = useState('')
  const [minutes, setMinutes] = useState('30')
  const [km, setKm] = useState('')
  const [kmh, setKmh] = useState('')
  const [incline, setIncline] = useState('')
  const [kcal, setKcal] = useState('')

  useEffect(() => {
    if (open) {
      setKm('')
      setKcal('')
    }
  }, [open])

  const name = activity === 'Other' ? custom.trim() : activity
  const showIncline = activity === 'Treadmill'
  const valid = name && (parseNum(minutes) ?? 0) > 0

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log cardio"
      subtitle="A walk counts toward your Walking habit automatically."
      footer={
        <Button
          variant="solid"
          size="lg"
          block
          disabled={!valid}
          onClick={async () => {
            await cardioRepo.add({
              date,
              activity: name,
              minutes: parseNum(minutes)!,
              km: parseNum(km) ?? undefined,
              kmh: parseNum(kmh) ?? undefined,
              inclinePct: showIncline ? (parseNum(incline) ?? undefined) : undefined,
              kcalEstimate: parseNum(kcal) ?? undefined,
            })
            onClose()
            toast(`${name} saved`)
          }}
        >
          Save
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {[...ACTIVITIES, 'Other'].map((a) => (
            <Chip key={a} active={a === activity} onClick={() => setActivity(a)}>
              {a}
            </Chip>
          ))}
        </div>
        {activity === 'Other' && <Input autoFocus placeholder="Activity name" value={custom} onChange={(e) => setCustom(e.target.value)} />}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration">
            <NumberInput integer value={minutes} onChange={setMinutes} suffix="min" />
          </Field>
          <Field label="Distance (optional)">
            <NumberInput value={km} onChange={setKm} suffix="km" />
          </Field>
          <Field label="Speed (optional)">
            <NumberInput value={kmh} onChange={setKmh} suffix="km/h" />
          </Field>
          {showIncline ? (
            <Field label="Incline (optional)">
              <NumberInput value={incline} onChange={setIncline} suffix="%" />
            </Field>
          ) : (
            <Field label="Calories (optional)">
              <NumberInput integer value={kcal} onChange={setKcal} suffix="kcal" />
            </Field>
          )}
        </div>
        {showIncline && (
          <Field label="Calories (optional)">
            <NumberInput integer value={kcal} onChange={setKcal} suffix="kcal" />
          </Field>
        )}
        <p className="px-1 text-[12px] leading-snug text-faint">
          Machine and watch calorie numbers are rough estimates. They're saved for reference only and not added back to your daily target.
        </p>
      </div>
    </Sheet>
  )
}
