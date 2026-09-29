import { ArrowLeft, Globe, Loader2, PenLine, Plus, Search, WifiOff, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useFoods, useMeals } from '../../hooks/data'
import { MEALS, mealForNow, mealTotals } from '../../domain/nutrition/nutrition'
import type { Food, MealSlot, SavedMeal } from '../../domain/models'
import { relativeDayLabel, type DayKey } from '../../lib/dates'
import { int, num } from '../../lib/format'
import { isOnline, searchCatalog, searchOnline, type FoodCandidate } from '../../services/foodSearch'
import { foodLogRepo, foodsRepo } from '../../storage/repositories/food'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Chip, cx, Empty, Segmented } from '../../ui/primitives'
import { candidateSub, FoodRow, foodSub } from './FoodRow'
import { FoodForm, type FoodFormValues } from './FoodForm'
import { FoodQuantity } from './FoodQuantity'
import { MealEditor } from './MealEditor'
import { db } from '../../storage/db'

type Tab = 'recent' | 'favorites' | 'mine' | 'meals'
type View =
  | { kind: 'browse' }
  | { kind: 'qty'; food: Food }
  | { kind: 'candidate'; c: FoodCandidate }
  | { kind: 'create'; initial?: Partial<Food> }
  | { kind: 'edit'; food: Food }
  | { kind: 'meal'; meal?: SavedMeal }

export function FoodSheet({ open, onClose, date, meal: initialMeal }: { open: boolean; onClose: () => void; date: DayKey; meal?: MealSlot }) {
  const foods = useFoods()
  const meals = useMeals()
  const { toast } = useFeedback()
  const [meal, setMeal] = useState<MealSlot>(initialMeal ?? mealForNow())
  const [tab, setTab] = useState<Tab>('recent')
  const [view, setView] = useState<View>({ kind: 'browse' })
  const [q, setQ] = useState('')

  useEffect(() => {
    if (open) {
      setMeal(initialMeal ?? mealForNow())
      setView({ kind: 'browse' })
      setQ('')
    }
  }, [open, initialMeal])

  const mealLabel = MEALS.find((m) => m.id === meal)!.label
  const byId = useMemo(() => new Map(foods.map((f) => [f.id, f])), [foods])

  async function addFood(f: Food, qty: number) {
    const id = await foodLogRepo.logFood(f, qty, date, meal)
    toast(`${f.name} added`, { label: 'Undo', run: () => void db.foodLogs.delete(id) })
    setView({ kind: 'browse' })
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
  }

  /** Candidates from the database/online become My Foods when first used. */
  async function saveCandidate(c: FoodCandidate): Promise<Food> {
    const existing = foods.find((f) => f.name === c.name && f.kcal === c.kcal)
    if (existing) return existing
    return foodsRepo.create({
      name: c.name,
      brand: c.brand,
      servingSize: c.servingSize,
      unit: c.unit,
      gramsPerUnit: c.gramsPerUnit,
      kcal: c.kcal,
      protein: c.protein,
      carbs: c.carbs,
      fat: c.fat,
      source: c.source,
      barcode: c.barcode,
    })
  }

  async function submitForm(v: FoodFormValues) {
    const { save, ...data } = v
    if (save) {
      const f = await foodsRepo.create({ ...data, source: 'user' })
      await addFood(f, data.servingSize)
    } else {
      await foodLogRepo.add({ date, meal, name: data.name, qty: data.servingSize, unit: data.unit, kcal: data.kcal, protein: data.protein, carbs: data.carbs, fat: data.fat })
      toast(`${data.name} added`)
      setView({ kind: 'browse' })
    }
  }

  const title =
    view.kind === 'create' ? 'New food' : view.kind === 'edit' ? 'Edit food' : view.kind === 'meal' ? (view.meal ? 'Edit meal' : 'New meal') : 'Add food'

  const back =
    view.kind !== 'browse' ? (
      <button onClick={() => setView({ kind: 'browse' })} className="press -ml-2 grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-muted" aria-label="Back">
        <ArrowLeft size={18} />
      </button>
    ) : null

  return (
    <Sheet open={open} onClose={onClose} full title={title} subtitle={`${relativeDayLabel(date)} · ${mealLabel}`} headerRight={back}>
      {view.kind === 'browse' && (
        <Browse
          {...{ foods, meals, byId, tab, setTab, q, setQ, meal, setMeal }}
          onOpenFood={(food) => setView({ kind: 'qty', food })}
          onQuickFood={(f) => addFood(f, f.lastQty ?? f.servingSize)}
          onOpenCandidate={(c) => setView({ kind: 'candidate', c })}
          onQuickCandidate={async (c) => addFood(await saveCandidate(c), c.servingSize)}
          onAddMeal={addMeal}
          onEditMeal={(m) => setView({ kind: 'meal', meal: m })}
          onCreate={() => setView({ kind: 'create', initial: q ? { name: q } : undefined })}
          onNewMeal={() => setView({ kind: 'meal' })}
        />
      )}
      {view.kind === 'qty' && (
        <FoodQuantity
          food={byId.get(view.food.id) ?? view.food}
          mealLabel={mealLabel}
          onAdd={(qty) => addFood(view.food, qty)}
          onToggleFavorite={() => foodsRepo.toggleFavorite(view.food.id)}
          onEdit={() => setView({ kind: 'edit', food: view.food })}
        />
      )}
      {view.kind === 'candidate' && (
        <FoodQuantity
          food={{ ...view.c, lastQty: view.c.servingSize }}
          mealLabel={mealLabel}
          onAdd={async (qty) => addFood(await saveCandidate(view.c), qty)}
          sourceNote={
            view.c.source === 'openfoodfacts'
              ? 'From Open Food Facts (community data). Check the label if it matters. Saved to My Foods when added.'
              : view.c.source === 'usda'
                ? 'USDA FoodData Central reference values. Saved to My Foods when added.'
                : 'Typical-recipe estimate — adjust to your portion. Saved to My Foods when added.'
          }
        />
      )}
      {view.kind === 'create' && <FoodForm initial={view.initial} submitLabel={`Add to ${mealLabel}`} allowLogOnly onSubmit={submitForm} />}
      {view.kind === 'edit' && (
        <FoodForm
          initial={view.food}
          submitLabel="Save changes"
          onSubmit={async ({ save: _s, ...data }) => {
            await foodsRepo.update(view.food.id, data)
            setView({ kind: 'qty', food: { ...view.food, ...data } })
          }}
        />
      )}
      {view.kind === 'meal' && <MealEditor meal={view.meal} foods={foods} onDone={() => { setTab('meals'); setView({ kind: 'browse' }) }} />}
    </Sheet>
  )
}

function Browse({
  foods,
  meals,
  byId,
  tab,
  setTab,
  q,
  setQ,
  meal,
  setMeal,
  onOpenFood,
  onQuickFood,
  onOpenCandidate,
  onQuickCandidate,
  onAddMeal,
  onEditMeal,
  onCreate,
  onNewMeal,
}: {
  foods: Food[]
  meals: SavedMeal[]
  byId: Map<string, Food>
  tab: Tab
  setTab: (t: Tab) => void
  q: string
  setQ: (s: string) => void
  meal: MealSlot
  setMeal: (m: MealSlot) => void
  onOpenFood: (f: Food) => void
  onQuickFood: (f: Food) => void
  onOpenCandidate: (c: FoodCandidate) => void
  onQuickCandidate: (c: FoodCandidate) => void
  onAddMeal: (m: SavedMeal) => void
  onEditMeal: (m: SavedMeal) => void
  onCreate: () => void
  onNewMeal: () => void
}) {
  const query = q.trim().toLowerCase()
  const [online, setOnline] = useState<{ q: string; state: 'idle' | 'loading' | 'done' | 'error'; items: FoodCandidate[] }>({ q: '', state: 'idle', items: [] })
  const abort = useRef<AbortController | null>(null)

  // Debounced online search once the user pauses typing.
  useEffect(() => {
    if (query.length < 3 || !isOnline()) return
    const t = setTimeout(() => {
      abort.current?.abort()
      const ac = new AbortController()
      abort.current = ac
      setOnline({ q: query, state: 'loading', items: [] })
      searchOnline(query, ac.signal)
        .then((items) => setOnline({ q: query, state: 'done', items }))
        .catch((e) => (e as Error).name !== 'AbortError' && setOnline({ q: query, state: 'error', items: [] }))
    }, 600)
    return () => clearTimeout(t)
  }, [query])

  const mine = foods.filter((f) => !query || f.name.toLowerCase().includes(query) || f.brand?.toLowerCase().includes(query))
  const catalog = query ? searchCatalog(query).filter((c) => !foods.some((f) => f.name === c.name)) : []
  const mealMatches = meals.filter((m) => !query || m.name.toLowerCase().includes(query))

  const lists: Record<Tab, Food[]> = {
    recent: [...foods].filter((f) => f.lastUsedAt).sort((a, b) => b.lastUsedAt!.localeCompare(a.lastUsedAt!)).slice(0, 25),
    favorites: foods.filter((f) => f.favorite).sort((a, b) => b.useCount - a.useCount),
    mine: [...foods].sort((a, b) => a.name.localeCompare(b.name)),
    meals: [],
  }

  return (
    <div className="pb-2">
      <div className="no-scrollbar -mx-5 mb-3 flex gap-2 overflow-x-auto px-5">
        {MEALS.map((m) => (
          <Chip key={m.id} active={m.id === meal} onClick={() => setMeal(m.id)}>
            {m.label}
          </Chip>
        ))}
      </div>
      <div className="flex h-12 items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3.5 focus-within:border-accent/60">
        <Search size={18} className="text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search foods, database & online"
          className="h-full min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-faint"
          enterKeyHint="search"
        />
        {q && (
          <button onClick={() => setQ('')} aria-label="Clear" className="grid h-7 w-7 place-items-center rounded-full bg-elev text-muted">
            <X size={14} />
          </button>
        )}
      </div>

      {!query && (
        <>
          <Segmented
            className="mt-3"
            size="sm"
            value={tab}
            onChange={setTab}
            options={[
              { value: 'recent', label: 'Recent' },
              { value: 'favorites', label: 'Favorites' },
              { value: 'mine', label: 'My Foods' },
              { value: 'meals', label: 'Meals' },
            ]}
          />
          <div className="mt-2">
            {tab !== 'meals' &&
              lists[tab].map((f) => (
                <FoodRow key={f.id} title={f.name} sub={foodSub(f)} favorite={f.favorite} onOpen={() => onOpenFood(f)} onQuickAdd={() => onQuickFood(f)} />
              ))}
            {tab === 'recent' && !lists.recent.length && (
              <Empty title="Nothing recent yet">Foods you log appear here for one-tap re-adding. Try My Foods or search.</Empty>
            )}
            {tab === 'favorites' && !lists.favorites.length && <Empty title="No favorites yet">Tap the star on any food to pin it here.</Empty>}
            {tab === 'meals' && (
              <>
                {meals.map((m) => (
                  <MealRow key={m.id} meal={m} byId={byId} onAdd={() => onAddMeal(m)} onEdit={() => onEditMeal(m)} />
                ))}
                {!meals.length && <Empty title="No saved meals">Combine foods you often eat together — add them with one tap.</Empty>}
                <ActionRow icon={Plus} label="Create a meal" onClick={onNewMeal} />
              </>
            )}
          </div>
          {tab !== 'meals' && <ActionRow icon={PenLine} label="Create a new food" onClick={onCreate} />}
        </>
      )}

      {query && (
        <div className="mt-3 space-y-4">
          {!!mealMatches.length && (
            <Group title="Saved meals">
              {mealMatches.map((m) => (
                <MealRow key={m.id} meal={m} byId={byId} onAdd={() => onAddMeal(m)} onEdit={() => onEditMeal(m)} />
              ))}
            </Group>
          )}
          {!!mine.length && (
            <Group title="My Foods">
              {mine.slice(0, 20).map((f) => (
                <FoodRow key={f.id} title={f.name} sub={foodSub(f)} favorite={f.favorite} onOpen={() => onOpenFood(f)} onQuickAdd={() => onQuickFood(f)} />
              ))}
            </Group>
          )}
          {!!catalog.length && (
            <Group title="Food database">
              {catalog.map((c) => (
                <FoodRow key={c.key} title={c.name} sub={candidateSub(c)} badge="db" onOpen={() => onOpenCandidate(c)} onQuickAdd={() => onQuickCandidate(c)} />
              ))}
            </Group>
          )}
          <Group title="Online · Open Food Facts">
            {!isOnline() && (
              <p className="flex items-center gap-2 px-2 py-2 text-[13px] text-muted">
                <WifiOff size={14} /> Offline — My Foods and the built-in database still work.
              </p>
            )}
            {isOnline() && query.length < 3 && <p className="px-2 py-2 text-[13px] text-muted">Type at least 3 letters to search online.</p>}
            {online.state === 'loading' && (
              <p className="flex items-center gap-2 px-2 py-2 text-[13px] text-muted">
                <Loader2 size={14} className="animate-spin" /> Searching…
              </p>
            )}
            {online.state === 'error' && <p className="px-2 py-2 text-[13px] text-muted">Online search is unavailable right now.</p>}
            {online.state === 'done' && online.q === query && !online.items.length && <p className="px-2 py-2 text-[13px] text-muted">No online results.</p>}
            {online.q === query &&
              online.items.map((c) => (
                <FoodRow key={c.key} title={c.name} sub={candidateSub(c)} badge="online" onOpen={() => onOpenCandidate(c)} onQuickAdd={() => onQuickCandidate(c)} />
              ))}
          </Group>
          <ActionRow icon={PenLine} label={`Create “${q.trim()}”`} onClick={onCreate} />
        </div>
      )}
    </div>
  )
}

function MealRow({ meal, byId, onAdd, onEdit }: { meal: SavedMeal; byId: Map<string, Food>; onAdd: () => void; onEdit: () => void }) {
  const t = mealTotals(meal, byId)
  const names = meal.items.map((i) => byId.get(i.foodId)?.name).filter(Boolean).join(', ')
  return (
    <FoodRow
      title={meal.name}
      sub={`${int(t.kcal)} kcal · ${num(t.protein, 0)} g protein · ${names}`}
      onOpen={onEdit}
      onQuickAdd={onAdd}
    />
  )
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-1.5 px-2 text-[12px] font-semibold tracking-[0.06em] text-faint uppercase">
        {title === 'Online · Open Food Facts' && <Globe size={12} />}
        {title}
      </div>
      {children}
    </div>
  )
}

function ActionRow({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className={cx('press mt-2 flex min-h-12 w-full items-center gap-3 rounded-2xl px-2 text-left text-[15px] font-semibold text-accent-strong active:bg-accent-soft')}>
      <span className="grid h-9 w-9 place-items-center rounded-full border border-dashed border-accent/50">
        <Icon size={17} />
      </span>
      {label}
    </button>
  )
}

