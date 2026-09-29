import { ArrowLeft, ChevronDown, Globe, Loader2, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFoods, useMeals } from '../../hooks/data'
import { MEALS, mealForNow, mealTotals, scale, unitLabel } from '../../domain/nutrition/nutrition'
import type { Food, MealSlot, SavedMeal } from '../../domain/models'
import { relativeDayLabel, type DayKey } from '../../lib/dates'
import { int, num } from '../../lib/format'
import { isOnline, searchCatalog, searchOnline, type FoodCandidate } from '../../services/foodSearch'
import { foodLogRepo, foodsRepo } from '../../storage/repositories/food'
import { db } from '../../storage/db'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Chip, cx } from '../../ui/primitives'
import { FoodForm, type FoodFormValues } from './FoodForm'
import { FoodQuantity } from './FoodQuantity'

type View = { kind: 'list' } | { kind: 'amount'; food: Food } | { kind: 'candidate'; c: FoodCandidate } | { kind: 'create'; name?: string }

/**
 * Add food: one list. Your foods and saved meals first (most recent on top);
 * typing searches your foods, the built-in database and the internet together.
 */
export function FoodSheet({ open, onClose, date, meal: initialMeal }: { open: boolean; onClose: () => void; date: DayKey; meal?: MealSlot }) {
  const foods = useFoods()
  const meals = useMeals()
  const { toast } = useFeedback()
  const [meal, setMeal] = useState<MealSlot>(initialMeal ?? mealForNow())
  const [pickMeal, setPickMeal] = useState(false)
  const [view, setView] = useState<View>({ kind: 'list' })
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) {
      setMeal(initialMeal ?? mealForNow())
      setPickMeal(false)
      setView({ kind: 'list' })
      setQ('')
    }
  }, [open, initialMeal])

  const mealLabel = MEALS.find((m) => m.id === meal)!.label
  const byId = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])

  async function addFood(f: Food, qty: number) {
    const id = await foodLogRepo.logFood(f, qty, date, meal)
    toast(`${f.name} added`, { label: 'Undo', run: () => void db.foodLogs.delete(id) })
    onClose()
  }

  async function addMeal(m: SavedMeal) {
    const before = new Set(await db.foodLogs.where('date').equals(date).primaryKeys())
    await foodLogRepo.logMeal(m, date, meal)
    toast(`${m.name} added`, {
      label: 'Undo',
      run: async () => {
        const after = await db.foodLogs.where('date').equals(date).primaryKeys()
        await db.foodLogs.bulkDelete(after.filter((k) => !before.has(k)) as string[])
      },
    })
    onClose()
  }

  /** Database / internet foods are saved to your foods the first time you use them. */
  async function saveCandidate(c: FoodCandidate): Promise<Food> {
    const existing = foods.find((f) => f.name === c.name && f.kcal === c.kcal)
    if (existing) return existing
    const { key: _k, source, ...rest } = c
    return foodsRepo.create({ ...rest, source })
  }

  async function submitNew({ save, ...data }: FoodFormValues) {
    if (save) {
      await addFood(await foodsRepo.create({ ...data, source: 'user' }), data.servingSize)
    } else {
      await foodLogRepo.add({ date, meal, name: data.name, qty: data.servingSize, unit: data.unit, kcal: data.kcal, protein: data.protein, carbs: data.carbs, fat: data.fat })
      toast(`${data.name} added`)
      onClose()
    }
  }

  const back =
    view.kind !== 'list' ? (
      <button onClick={() => setView({ kind: 'list' })} className="press -ml-2 grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-muted" aria-label="Back">
        <ArrowLeft size={18} />
      </button>
    ) : null

  return (
    <Sheet
      open={open}
      onClose={onClose}
      full={view.kind === 'list' || view.kind === 'create'}
      headerRight={back}
      title={view.kind === 'create' ? 'New food' : 'Add food'}
      subtitle={
        <button onClick={() => setPickMeal(!pickMeal)} className="inline-flex items-center gap-1 font-medium text-accent-strong">
          {relativeDayLabel(date)} · {mealLabel} <ChevronDown size={14} />
        </button>
      }
    >
      {pickMeal && (
        <div className="mb-3 flex gap-2">
          {MEALS.map((m) => (
            <Chip
              key={m.id}
              active={m.id === meal}
              className="flex-1 !px-0"
              onClick={() => {
                setMeal(m.id)
                setPickMeal(false)
              }}
            >
              {m.label}
            </Chip>
          ))}
        </div>
      )}

      {view.kind === 'list' && (
        <FoodList
          foods={foods}
          meals={meals}
          byId={byId}
          q={q}
          setQ={setQ}
          onFood={(food) => setView({ kind: 'amount', food })}
          onMeal={addMeal}
          onCandidate={(c) => setView({ kind: 'candidate', c })}
          onCreate={() => setView({ kind: 'create', name: q.trim() || undefined })}
        />
      )}
      {view.kind === 'amount' && <FoodQuantity food={view.food} mealLabel={mealLabel} onAdd={(qty) => addFood(view.food, qty)} />}
      {view.kind === 'candidate' && (
        <FoodQuantity
          food={view.c}
          mealLabel={mealLabel}
          onAdd={async (qty) => addFood(await saveCandidate(view.c), qty)}
          note={view.c.source === 'openfoodfacts' ? 'From Open Food Facts. It will be saved to your foods.' : 'Saved to your foods when added.'}
        />
      )}
      {view.kind === 'create' && <FoodForm initial={{ name: view.name }} submitLabel={`Add to ${mealLabel.toLowerCase()}`} allowLogOnly onSubmit={submitNew} />}
    </Sheet>
  )
}

type Item =
  | { kind: 'food'; key: string; food: Food; sort: string }
  | { kind: 'meal'; key: string; meal: SavedMeal; sort: string }

function FoodList({
  foods,
  meals,
  byId,
  q,
  setQ,
  onFood,
  onMeal,
  onCandidate,
  onCreate,
}: {
  foods: Food[]
  meals: SavedMeal[]
  byId: Map<string, Food>
  q: string
  setQ: (s: string) => void
  onFood: (f: Food) => void
  onMeal: (m: SavedMeal) => void
  onCandidate: (c: FoodCandidate) => void
  onCreate: () => void
}) {
  const query = q.trim().toLowerCase()
  const online = useOnlineSearch(query)
  const match = (s: string) => !query || s.toLowerCase().includes(query)

  // Most recently used first, so your usual foods are always at the top.
  const mine: Item[] = [
    ...meals.filter((m) => match(m.name)).map((m) => ({ kind: 'meal' as const, key: m.id, meal: m, sort: m.lastUsedAt ?? m.createdAt })),
    ...foods.filter((f) => match(f.name)).map((f) => ({ kind: 'food' as const, key: f.id, food: f, sort: f.lastUsedAt ?? '' })),
  ].sort((a, b) => b.sort.localeCompare(a.sort))
  const catalog = query ? searchCatalog(query).filter((c) => !foods.some((f) => f.name === c.name)) : []

  return (
    <div className="pb-2">
      <div className="sticky top-0 z-10 -mx-5 bg-surface px-5 pb-2">
        <div className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3.5 focus-within:border-accent/60">
          <Search size={18} className="text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any food"
            className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint"
            enterKeyHint="search"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Clear" className="grid h-7 w-7 place-items-center rounded-full bg-elev text-muted">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {mine.map((it) =>
        it.kind === 'meal' ? (
          <Row
            key={it.key}
            title={it.meal.name}
            tag="Meal"
            sub={`${int(mealTotals(it.meal, byId).kcal)} kcal · ${it.meal.items.length} items · tap to add`}
            onClick={() => onMeal(it.meal)}
          />
        ) : (
          <Row key={it.key} title={it.food.name} sub={foodSub(it.food)} onClick={() => onFood(it.food)} />
        ),
      )}
      {catalog.map((c) => (
        <Row key={c.key} title={c.name} sub={candidateSub(c)} onClick={() => onCandidate(c)} />
      ))}

      {query.length >= 3 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center gap-1.5 px-2 text-[12px] font-medium text-faint">
            <Globe size={12} /> From the internet
            {online.state === 'loading' && <Loader2 size={12} className="animate-spin" />}
          </div>
          {online.items.map((c) => (
            <Row key={c.key} title={c.name} sub={candidateSub(c)} onClick={() => onCandidate(c)} />
          ))}
          {online.state === 'done' && !online.items.length && <p className="px-2 py-1 text-[13px] text-faint">No results.</p>}
          {online.state === 'offline' && <p className="px-2 py-1 text-[13px] text-faint">You're offline — your foods and the built-in list still work.</p>}
          {online.state === 'error' && <p className="px-2 py-1 text-[13px] text-faint">Not available right now.</p>}
        </div>
      )}

      <button onClick={onCreate} className="press mt-3 w-full rounded-2xl px-2 py-3 text-left text-[15px] font-semibold text-accent-strong active:bg-accent-soft">
        {query ? `Can't find it? Create “${q.trim()}”` : 'Create a new food'}
      </button>
    </div>
  )
}

function Row({ title, sub, tag, onClick }: { title: string; sub: string; tag?: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="press flex min-h-[58px] w-full flex-col justify-center rounded-2xl px-2 text-left active:bg-surface-2">
      <span className="flex items-center gap-2 text-[16px] font-medium">
        <span className="truncate">{title}</span>
        {tag && <span className={cx('shrink-0 rounded-md bg-accent-soft px-1.5 py-0.5 text-[11px] font-semibold text-accent-strong')}>{tag}</span>}
      </span>
      <span className="tabular truncate text-[13px] text-muted">{sub}</span>
    </button>
  )
}

function foodSub(f: Food): string {
  const qty = f.lastQty ?? f.servingSize
  return `${num(qty)} ${unitLabel(f.unit, qty)} · ${int(scale(f, qty).kcal)} kcal`
}

function candidateSub(c: FoodCandidate): string {
  return `${c.brand ? c.brand + ' · ' : ''}${num(c.servingSize)} ${unitLabel(c.unit, c.servingSize)} · ${int(c.kcal)} kcal`
}

function useOnlineSearch(query: string) {
  const [s, setS] = useState<{ q: string; state: 'idle' | 'loading' | 'done' | 'error' | 'offline'; items: FoodCandidate[] }>({ q: '', state: 'idle', items: [] })
  const abort = useRef<AbortController | null>(null)
  useEffect(() => {
    if (query.length < 3) return
    if (!isOnline()) {
      setS({ q: query, state: 'offline', items: [] })
      return
    }
    const t = setTimeout(() => {
      abort.current?.abort()
      const ac = new AbortController()
      abort.current = ac
      setS({ q: query, state: 'loading', items: [] })
      searchOnline(query, ac.signal)
        .then((items) => setS({ q: query, state: 'done', items: items.slice(0, 15) }))
        .catch((e) => (e as Error).name !== 'AbortError' && setS({ q: query, state: 'error', items: [] }))
    }, 500)
    return () => clearTimeout(t)
  }, [query])
  return s.q === query ? s : { q: query, state: 'loading' as const, items: [] }
}
