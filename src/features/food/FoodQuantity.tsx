import { useState } from 'react'
import { scale, unitLabel } from '../../domain/nutrition/nutrition'
import type { FoodUnit, Nutrients } from '../../domain/models'
import { int, num, parseNum } from '../../lib/format'
import { Button, Chip, NumberInput } from '../../ui/primitives'

export interface Portionable extends Nutrients {
  name: string
  brand?: string
  servingSize: number
  unit: FoodUnit
  lastQty?: number
}

const PRESETS: Record<FoodUnit, number[]> = {
  g: [100, 150, 200, 250],
  ml: [200, 250, 330, 500],
  piece: [1, 2, 3, 4],
  serving: [0.5, 1, 1.5, 2],
}

/** How much? One number, live calories, one button. */
export function FoodQuantity({ food, mealLabel, onAdd, note }: { food: Portionable; mealLabel: string; onAdd: (qty: number) => void; note?: string }) {
  const [qty, setQty] = useState(String(food.lastQty ?? food.servingSize))
  const q = parseNum(qty) ?? 0
  const n = scale(food, q)

  return (
    <div className="pb-2">
      <h3 className="text-[20px] leading-snug font-semibold tracking-tight">{food.name}</h3>
      {food.brand && <p className="text-[13px] text-muted">{food.brand}</p>}

      <NumberInput
        autoFocus
        value={qty}
        onChange={setQty}
        className="mt-5 !h-14 text-[22px]"
        suffix={unitLabel(food.unit, q)}
        onKeyDown={(e) => e.key === 'Enter' && q > 0 && onAdd(q)}
      />
      <div className="mt-3 flex gap-2">
        {PRESETS[food.unit].map((p) => (
          <Chip key={p} active={q === p} onClick={() => setQty(String(p))} className="flex-1">
            {num(p)}
          </Chip>
        ))}
      </div>

      <div className="mt-6 flex items-baseline justify-center gap-2">
        <span className="tabular text-[40px] leading-none font-bold tracking-tight">{int(n.kcal)}</span>
        <span className="text-[16px] text-muted">kcal</span>
      </div>
      <p className="tabular mt-1.5 text-center text-[14px] text-muted">
        Protein <span className="font-semibold text-text">{num(n.protein)} g</span> · Carbs {num(n.carbs)} g · Fat {num(n.fat)} g
      </p>
      {note && <p className="mt-3 text-center text-[12px] text-faint">{note}</p>}

      <Button variant="solid" size="lg" block className="mt-6" disabled={q <= 0} onClick={() => onAdd(q)}>
        Add to {mealLabel.toLowerCase()}
      </Button>
    </div>
  )
}
