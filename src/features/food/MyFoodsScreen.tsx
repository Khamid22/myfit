import { ArrowLeft, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { useFoods, useMeals } from '../../hooks/data'
import { describeServing, mealTotals } from '../../domain/nutrition/nutrition'
import type { Food, SavedMeal } from '../../domain/models'
import { int, num } from '../../lib/format'
import { foodsRepo, mealsRepo } from '../../storage/repositories/food'
import { useFeedback } from '../../ui/feedback'
import { Page } from '../../ui/Page'
import { Sheet } from '../../ui/Sheet'
import { Button, Card, Empty, IconButton, Input, Segmented } from '../../ui/primitives'
import { FoodForm } from './FoodForm'
import { MealEditor } from './MealEditor'

type Edit = { kind: 'food'; food?: Food } | { kind: 'meal'; meal?: SavedMeal } | null

/** Manage the personal library: My Foods, Favorites and Saved Meals. */
export function MyFoodsScreen() {
  const navigate = useNavigate()
  const foods = useFoods()
  const meals = useMeals()
  const { confirm, toast } = useFeedback()
  const [tab, setTab] = useState<'foods' | 'meals'>('foods')
  const [q, setQ] = useState('')
  const [edit, setEdit] = useState<Edit>(null)
  const byId = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])
  const list = foods
    .filter((f) => !q || f.name.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Page
      title="My foods"
      eyebrow={
        <button onClick={() => navigate('/food')} className="-ml-1 flex items-center gap-1 text-accent-strong">
          <ArrowLeft size={16} /> Food
        </button>
      }
      action={<IconButton icon={Plus} label="New" className="bg-accent-soft text-accent-strong" onClick={() => setEdit(tab === 'foods' ? { kind: 'food' } : { kind: 'meal' })} />}
    >
      <Segmented
        className="mb-3"
        value={tab}
        onChange={setTab}
        options={[
          { value: 'foods', label: `Foods (${foods.length})` },
          { value: 'meals', label: `Saved meals (${meals.length})` },
        ]}
      />
      {tab === 'foods' && (
        <>
          <Input placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3" />
          <Card className="!px-2 !py-1">
            {list.map((f) => (
              <div key={f.id} className="flex items-center">
                <button onClick={() => setEdit({ kind: 'food', food: f })} className="press min-h-14 min-w-0 flex-1 rounded-xl px-2 text-left active:bg-surface-2">
                  <div className="truncate text-[15px] font-medium">{f.name}</div>
                  <div className="tabular truncate text-[12px] text-muted">
                    {describeServing(f)} · {int(f.kcal)} kcal · P {num(f.protein)} · C {num(f.carbs)} · F {num(f.fat)}
                  </div>
                </button>
              </div>
            ))}
            {!list.length && <Empty title="No foods found" />}
          </Card>
        </>
      )}
      {tab === 'meals' && (
        <div className="space-y-3">
          {meals.map((m) => {
            const t = mealTotals(m, byId)
            return (
              <Card key={m.id} onClick={() => setEdit({ kind: 'meal', meal: m })}>
                <div className="flex items-baseline justify-between">
                  <span className="text-[16px] font-semibold">{m.name}</span>
                  <span className="tabular text-[14px] text-muted">{int(t.kcal)} kcal</span>
                </div>
                <div className="mt-1 text-[13px] text-muted">
                  {m.items.map((i) => `${num(i.qty)} ${byId.get(i.foodId)?.name ?? '—'}`).join(' · ')}
                </div>
                <div className="tabular mt-1 text-[12px] text-faint">
                  P {num(t.protein, 0)} g · C {num(t.carbs, 0)} g · F {num(t.fat, 0)} g
                </div>
              </Card>
            )
          })}
          {!meals.length && <Empty title="No saved meals">Tap + to combine foods into a meal you can add with one tap.</Empty>}
          <Button variant="primary" block icon={Plus} onClick={() => setEdit({ kind: 'meal' })}>
            New meal
          </Button>
        </div>
      )}

      <Sheet open={edit?.kind === 'food'} onClose={() => setEdit(null)} title={edit?.kind === 'food' && edit.food ? 'Edit food' : 'New food'}>
        {edit?.kind === 'food' && (
          <FoodForm
            key={edit.food?.id ?? 'new'}
            initial={edit.food}
            submitLabel="Save"
            onSubmit={async ({ save: _s, ...data }) => {
              if (edit.food) await foodsRepo.update(edit.food.id, data)
              else await foodsRepo.create({ ...data, source: 'user' })
              setEdit(null)
              toast('Saved')
            }}
            onDelete={
              edit.food
                ? async () => {
                    const ok = await confirm({ title: `Delete ${edit.food!.name}?`, body: 'Past log entries keep their values — only the saved food is removed.', confirmLabel: 'Delete', danger: true })
                    if (ok) {
                      await foodsRepo.remove(edit.food!.id)
                      setEdit(null)
                    }
                  }
                : undefined
            }
          />
        )}
      </Sheet>
      <Sheet open={edit?.kind === 'meal'} onClose={() => setEdit(null)} title={edit?.kind === 'meal' && edit.meal ? 'Edit meal' : 'New meal'} full>
        {edit?.kind === 'meal' && (
          <MealEditor
            key={edit.meal?.id ?? 'new'}
            meal={edit.meal}
            foods={foods}
            onDone={() => setEdit(null)}
            onDelete={
              edit.meal
                ? async () => {
                    const ok = await confirm({ title: `Delete ${edit.meal!.name}?`, confirmLabel: 'Delete', danger: true })
                    if (ok) {
                      await mealsRepo.remove(edit.meal!.id)
                      setEdit(null)
                    }
                  }
                : undefined
            }
          />
        )}
      </Sheet>
    </Page>
  )
}
