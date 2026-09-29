import { useEffect, useState } from 'react'
import { useApp } from '../../app/context'
import { useMeasurements } from '../../hooks/data'
import { fromDisplayLength } from '../../domain/profile/units'
import type { MeasurementKey } from '../../domain/models'
import { todayKey } from '../../lib/dates'
import { parseNum } from '../../lib/format'
import { measurementRepo } from '../../storage/repositories/body'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Button, Field, NumberInput } from '../../ui/primitives'
import { MEASUREMENTS } from '../../domain/progress/measurements'

export function MeasurementSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, units } = useApp()
  const list = useMeasurements()
  const { toast } = useFeedback()
  const [vals, setVals] = useState<Record<MeasurementKey, string>>({ waist: '', chest: '', arm: '', hips: '', thigh: '' })

  useEffect(() => {
    if (open) setVals({ waist: '', chest: '', arm: '', hips: '', thigh: '' })
  }, [open])

  const lastOf = (k: MeasurementKey) => [...list].reverse().find((m) => m.values[k] != null)?.values[k]
  const any = Object.values(vals).some((v) => parseNum(v))

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Body measurements"
      subtitle={`All optional, in ${units.l === 'cm' ? 'centimetres' : 'inches'}. Measure at the same spot each time.`}
      footer={
        <Button
          variant="solid"
          size="lg"
          block
          disabled={!any}
          onClick={async () => {
            const values: Partial<Record<MeasurementKey, number>> = {}
            for (const { key } of MEASUREMENTS) {
              const v = parseNum(vals[key])
              if (v) values[key] = fromDisplayLength(v, profile.units.length)
            }
            await measurementRepo.add({ date: todayKey(), values })
            onClose()
            toast('Measurements saved')
          }}
        >
          Save
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 pb-2">
        {MEASUREMENTS.map(({ key, label }) => (
          <Field key={key} label={label} hint={lastOf(key) != null ? `Last: ${units.length(lastOf(key))} ${units.l}` : undefined}>
            <NumberInput value={vals[key]} onChange={(v) => setVals({ ...vals, [key]: v })} suffix={units.l} />
          </Field>
        ))}
      </div>
    </Sheet>
  )
}
