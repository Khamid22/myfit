import { Plus, Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { mealTotals, unitLabel } from '../../domain/nutrition/nutrition'
import type { Food, SavedMeal, SavedMealItem } from '../../domain/models'
import { int, num, parseNum } from '../../lib/format'
import { mealsRepo } from '../../storage/repositories/food'
import { Button, Field, Input, NumberInput } from '../../ui/primitives'

/** Combine foods into a reusable meal, e.g. "Usual Breakfast". */
export function MealEditor({ meal, foods, onDone, onDelete }: { meal?: SavedMeal; foods: Food[]; onDone: () => void; onDelete?: () => void }) {
  const [name, setName] = useState(meal?.name ?? '')
  const [items, setItems] = useState<(SavedMealItem & { qtyText: string })[]>(
    meal?.items.map((i) => ({ ...i, qtyText: String(i.qty) })) ?? [],
  )
  const [q, setQ] = useState('')
  const byId = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])
  const parsed = items.map((i) => ({ foodId: i.foodId, qty: parseNum(i.qtyText) ?? 0 }))
  const totals = mealTotals({ items: parsed } as SavedMeal, byId)
  const matches = foods
    .filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, 12)

  async function save() {
    const clean = parsed.filter((i) => i.qty > 0)
    if (meal) await mealsRepo.update(meal.id, { name: name.trim(), items: clean })
    else await mealsRepo.add({ name: name.trim(), items: clean })
    onDone()
  }

  return (
    <div className="space-y-4 pb-2">
      <Field label="Meal name">
        <Input placeholder="e.g. Usual Breakfast" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <div className="rounded-2xl bg-surface-2 p-3">
        <div className="tabular text-[15px] font-semibold">
          {int(totals.kcal)} kcal
          <span className="ml-2 text-[13px] font-normal text-muted">
            P {num(totals.protein, 0)} · C {num(totals.carbs, 0)} · F {num(totals.fat, 0)} g
          </span>
        </div>
        <div className="mt-2 space-y-2">
          {items.map((it, idx) => {
            const f = byId.get(it.foodId)
            if (!f) return null
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-[14px]">{f.name}</span>
                <NumberInput
                  value={it.qtyText}
                  onChange={(v) => setItems(items.map((x, i) => (i === idx ? { ...x, qtyText: v } : x)))}
                  className="!h-10 w-[112px] !px-3"
                  suffix={unitLabel(f.unit, 2).slice(0, 5)}
                />
                <button className="press grid h-9 w-9 place-items-center rounded-full text-muted" aria-label="Remove" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                  <X size={16} />
                </button>
              </div>
            )
          })}
          {!items.length && <p className="text-[13px] text-muted">Add foods below.</p>}
        </div>
      </div>

      <div>
        <Input placeholder="Search My Foods" value={q} onChange={(e) => setQ(e.target.value)} className="!h-11" suffix="" />
        <div className="mt-1">
          {matches.map((f) => (
            <button
              key={f.id}
              onClick={() => setItems([...items, { foodId: f.id, qty: f.lastQty ?? f.servingSize, qtyText: String(f.lastQty ?? f.servingSize) }])}
              className="press flex min-h-11 w-full items-center gap-2 rounded-xl px-2 text-left active:bg-surface-2"
            >
              <Plus size={16} className="text-accent-strong" />
              <span className="flex-1 truncate text-[14px]">{f.name}</span>
              <span className="text-[12px] text-faint">{int(f.kcal)} kcal</span>
            </button>
          ))}
          {!matches.length && (
            <p className="flex items-center gap-2 px-2 py-2 text-[13px] text-muted">
              <Search size={14} /> Save the food first, then add it here.
            </p>
          )}
        </div>
      </div>

      <Button variant="solid" size="lg" block disabled={!name.trim() || !parsed.some((i) => i.qty > 0)} onClick={save}>
        Save meal
      </Button>
      {onDelete && (
        <Button variant="ghost" block className="!text-warn" onClick={onDelete}>
          Delete meal
        </Button>
      )}
    </div>
  )
}
