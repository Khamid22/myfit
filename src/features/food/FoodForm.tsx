import { useState } from 'react'
import type { Food, FoodUnit } from '../../domain/models'
import { parseNum } from '../../lib/format'
import { Button, Field, Input, NumberInput, Segmented, Toggle } from '../../ui/primitives'

export interface FoodFormValues {
  name: string
  servingSize: number
  unit: FoodUnit
  kcal: number
  protein: number
  carbs: number
  fat: number
  save: boolean
}

const s = (n: number | undefined) => (n == null ? '' : String(n))

/** Create or edit a food. Values are per serving. */
export function FoodForm({
  initial,
  submitLabel,
  allowLogOnly,
  onSubmit,
  onDelete,
}: {
  initial?: Partial<Food>
  submitLabel: string
  allowLogOnly?: boolean
  onSubmit: (v: FoodFormValues) => void
  onDelete?: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [size, setSize] = useState(s(initial?.servingSize ?? 100))
  const [unit, setUnit] = useState<FoodUnit>(initial?.unit ?? 'g')
  const [kcal, setKcal] = useState(s(initial?.kcal))
  const [protein, setProtein] = useState(s(initial?.protein))
  const [carbs, setCarbs] = useState(s(initial?.carbs))
  const [fat, setFat] = useState(s(initial?.fat))
  const [save, setSave] = useState(true)

  const p = (v: string) => parseNum(v) ?? 0
  const valid = name.trim() && parseNum(size) && parseNum(kcal) != null
  // Helpful sanity hint: energy from macros vs entered calories.
  const macroKcal = p(protein) * 4 + p(carbs) * 4 + p(fat) * 9
  const mismatch = parseNum(kcal) && macroKcal > 0 && Math.abs(macroKcal - p(kcal)) / p(kcal) > 0.25

  return (
    <div className="space-y-4 pb-2">
      <Field label="Food name">
        <Input autoFocus={!initial?.name} placeholder="e.g. Chicken breast" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <div className="grid grid-cols-[1fr_1.6fr] gap-3">
        <Field label="Serving amount">
          <NumberInput value={size} onChange={setSize} />
        </Field>
        <Field label="Unit">
          <Segmented
            size="md"
            options={[
              { value: 'g', label: 'g' },
              { value: 'ml', label: 'ml' },
              { value: 'piece', label: 'pc' },
              { value: 'serving', label: 'srv' },
            ]}
            value={unit}
            onChange={setUnit}
          />
        </Field>
      </div>
      <Field label="Calories per serving">
        <NumberInput value={kcal} onChange={setKcal} placeholder="0" suffix="kcal" />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Protein">
          <NumberInput value={protein} onChange={setProtein} placeholder="0" suffix="g" />
        </Field>
        <Field label="Carbs">
          <NumberInput value={carbs} onChange={setCarbs} placeholder="0" suffix="g" />
        </Field>
        <Field label="Fat">
          <NumberInput value={fat} onChange={setFat} placeholder="0" suffix="g" />
        </Field>
      </div>
      {mismatch && (
        <p className="px-1 text-[12px] text-faint">Macros add up to about {Math.round(macroKcal)} kcal — double-check the label if that looks off.</p>
      )}
      {allowLogOnly && (
        <div className="flex items-center justify-between rounded-2xl bg-surface-2 px-4 py-3">
          <div>
            <div className="text-[15px] font-medium">Save for next time</div>
            <div className="text-[12px] text-muted">It will appear at the top of your list</div>
          </div>
          <Toggle checked={save} onChange={setSave} label="Save for next time" />
        </div>
      )}
      <Button
        variant="solid"
        size="lg"
        block
        disabled={!valid}
        onClick={() =>
          onSubmit({
            name: name.trim(),
            servingSize: parseNum(size)!,
            unit,
            kcal: p(kcal),
            protein: p(protein),
            carbs: p(carbs),
            fat: p(fat),
            save,
          })
        }
      >
        {submitLabel}
      </Button>
      {onDelete && (
        <Button variant="ghost" block className="!text-warn" onClick={onDelete}>
          Delete food
        </Button>
      )}
    </div>
  )
}
