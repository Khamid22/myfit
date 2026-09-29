import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MEALS, unitLabel } from '../../domain/nutrition/nutrition'
import type { FoodLog, MealSlot } from '../../domain/models'
import { int, num, parseNum } from '../../lib/format'
import { foodLogRepo } from '../../storage/repositories/food'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Button, Chip, NumberInput } from '../../ui/primitives'

/** Adjust or remove a logged entry. Nutrients scale from the snapshot taken at log time. */
export function EntrySheet({ entry, onClose }: { entry: FoodLog | null; onClose: () => void }) {
  const [last, setLast] = useState<FoodLog | null>(entry)
  const [qty, setQty] = useState('')
  const [meal, setMeal] = useState<MealSlot>('breakfast')
  const { toast } = useFeedback()

  useEffect(() => {
    if (entry) {
      setLast(entry)
      setQty(String(entry.qty))
      setMeal(entry.meal)
    }
  }, [entry])

  const e = entry ?? last
  if (!e) return null
  const q = parseNum(qty) ?? 0
  const f = e.qty > 0 ? q / e.qty : 0

  return (
    <Sheet open={!!entry} onClose={onClose} title={e.name} subtitle={`${int(e.kcal * f)} kcal · P ${num(e.protein * f)} · C ${num(e.carbs * f)} · F ${num(e.fat * f)} g`}>
      <div className="space-y-4 pb-2">
        <NumberInput value={qty} onChange={setQty} suffix={unitLabel(e.unit, q)} className="!h-14 text-[20px]" />
        <div className="flex flex-wrap gap-2">
          {MEALS.map((m) => (
            <Chip key={m.id} active={m.id === meal} onClick={() => setMeal(m.id)}>
              {m.label}
            </Chip>
          ))}
        </div>
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Button
            variant="danger"
            icon={Trash2}
            onClick={async () => {
              await foodLogRepo.remove(e.id)
              onClose()
              toast('Entry removed', { label: 'Undo', run: () => void foodLogRepo.update(e.id, { deletedAt: undefined }) })
            }}
          >
            Remove
          </Button>
          <Button
            variant="solid"
            disabled={q <= 0}
            onClick={async () => {
              await foodLogRepo.update(e.id, { qty: q, meal, kcal: e.kcal * f, protein: e.protein * f, carbs: e.carbs * f, fat: e.fat * f })
              onClose()
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
