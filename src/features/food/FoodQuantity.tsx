import { Star } from 'lucide-react'
import { useState } from 'react'
import { scale, unitLabel } from '../../domain/nutrition/nutrition'
import type { FoodUnit, Nutrients } from '../../domain/models'
import { int, num, parseNum } from '../../lib/format'
import { Button, Chip, cx, NumberInput } from '../../ui/primitives'

export interface Portionable extends Nutrients {
  name: string
  brand?: string
  servingSize: number
  unit: FoodUnit
  lastQty?: number
  favorite?: boolean
}

const PRESETS: Record<FoodUnit, number[]> = {
  g: [50, 100, 150, 200, 250, 300],
  ml: [100, 200, 250, 330, 500],
  piece: [1, 2, 3, 4, 5],
  serving: [0.5, 1, 1.5, 2],
}

/** Choose a quantity and see the nutrition update live. */
export function FoodQuantity({
  food,
  mealLabel,
  onAdd,
  onToggleFavorite,
  onEdit,
  sourceNote,
}: {
  food: Portionable
  mealLabel: string
  onAdd: (qty: number) => void
  onToggleFavorite?: () => void
  onEdit?: () => void
  sourceNote?: string
}) {
  const [qty, setQty] = useState(String(food.lastQty ?? food.servingSize))
  const q = parseNum(qty) ?? 0
  const n = scale(food, q)

  return (
    <div className="pb-2">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-[20px] leading-snug font-semibold tracking-tight">{food.name}</h3>
          <p className="text-[13px] text-muted">
            {food.brand && `${food.brand} · `}
            {int(food.kcal)} kcal per {num(food.servingSize)} {unitLabel(food.unit, food.servingSize)}
          </p>
        </div>
        {onToggleFavorite && (
          <button onClick={onToggleFavorite} className="press grid h-11 w-11 place-items-center rounded-full bg-surface-2" aria-label="Favorite">
            <Star size={19} className={cx(food.favorite ? 'fill-warn text-warn' : 'text-muted')} />
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center gap-3">
        <NumberInput autoFocus value={qty} onChange={setQty} className="flex-1 !h-14 text-[22px]" suffix={unitLabel(food.unit, q)} onKeyDown={(e) => e.key === 'Enter' && q > 0 && onAdd(q)} />
      </div>
      <div className="no-scrollbar -mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
        {PRESETS[food.unit].map((p) => (
          <Chip key={p} active={q === p} onClick={() => setQty(String(p))}>
            {num(p)} {food.unit === 'g' || food.unit === 'ml' ? food.unit : ''}
          </Chip>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2 rounded-2xl bg-surface-2 p-3 text-center">
        <Macro label="kcal" value={int(n.kcal)} strong />
        <Macro label="Protein" value={`${num(n.protein)} g`} color="var(--c-protein)" />
        <Macro label="Carbs" value={`${num(n.carbs)} g`} color="var(--c-carbs)" />
        <Macro label="Fat" value={`${num(n.fat)} g`} color="var(--c-fat)" />
      </div>
      {sourceNote && <p className="mt-2 px-1 text-[12px] text-faint">{sourceNote}</p>}

      <Button variant="solid" size="lg" block className="mt-5" disabled={q <= 0} onClick={() => onAdd(q)}>
        Add to {mealLabel}
      </Button>
      {onEdit && (
        <Button variant="ghost" block className="mt-1" onClick={onEdit}>
          Edit food
        </Button>
      )}
    </div>
  )
}

function Macro({ label, value, color, strong }: { label: string; value: string; color?: string; strong?: boolean }) {
  return (
    <div>
      <div className={cx('tabular font-semibold', strong ? 'text-[18px]' : 'text-[15px]')} style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] text-muted">{label}</div>
    </div>
  )
}
