import { FOOD_DATABASE, type CatalogFood } from '../data/foodDatabase'

/** A search hit from the bundled database or the internet, normalised to per-serving values. */
export interface FoodCandidate {
  key: string
  name: string
  brand?: string
  servingSize: number
  unit: 'g' | 'ml' | 'piece' | 'serving'
  gramsPerUnit?: number
  kcal: number
  protein: number
  carbs: number
  fat: number
  source: 'usda' | 'estimate' | 'openfoodfacts'
  barcode?: string
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

export function fromCatalog(c: CatalogFood): FoodCandidate {
  return {
    key: `db:${c.key}`,
    name: c.name,
    servingSize: c.size,
    unit: c.unit,
    gramsPerUnit: c.g,
    kcal: c.kcal,
    protein: c.protein,
    carbs: c.carbs,
    fat: c.fat,
    source: c.src,
  }
}

/** Offline search over the bundled reference database. */
export function searchCatalog(q: string, limit = 30): FoodCandidate[] {
  const terms = norm(q).split(/\s+/).filter(Boolean)
  if (!terms.length) return []
  return FOOD_DATABASE.filter((f) => {
    const n = norm(f.name)
    return terms.every((t) => n.includes(t))
  })
    .sort((a, b) => Number(norm(b.name).startsWith(terms[0])) - Number(norm(a.name).startsWith(terms[0])))
    .slice(0, limit)
    .map(fromCatalog)
}

interface OffProduct {
  code?: string
  product_name?: string
  brands?: string | string[]
  nutriments?: Record<string, number | string | undefined>
}

const n = (v: unknown) => (typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) || 0 : 0)

function fromOff(p: OffProduct): FoodCandidate | null {
  const m = p.nutriments ?? {}
  const kcal = n(m['energy-kcal_100g']) || n(m['energy_100g']) / 4.184
  if (!p.product_name || !kcal) return null
  const brand = Array.isArray(p.brands) ? p.brands[0] : p.brands?.split(',')[0]
  return {
    key: `off:${p.code ?? p.product_name}`,
    name: p.product_name.trim(),
    brand: brand?.trim() || undefined,
    servingSize: 100,
    unit: 'g',
    kcal: Math.round(kcal),
    protein: Math.round(n(m['proteins_100g']) * 10) / 10,
    carbs: Math.round(n(m['carbohydrates_100g']) * 10) / 10,
    fat: Math.round(n(m['fat_100g']) * 10) / 10,
    source: 'openfoodfacts',
    barcode: p.code,
  }
}

/**
 * Online search via Open Food Facts (free, open data, no key).
 * Goes through our same-origin proxy (`/api/food-search`, a Cloudflare Pages Function)
 * because the upstream search API does not send CORS headers.
 */
export async function searchOnline(q: string, signal?: AbortSignal): Promise<FoodCandidate[]> {
  const res = await fetch(`/api/food-search?q=${encodeURIComponent(q)}`, { signal })
  if (!res.ok) throw new Error(`Search failed (${res.status})`)
  const data = (await res.json()) as { products?: OffProduct[] }
  const seen = new Set<string>()
  return (data.products ?? []).flatMap((p) => {
    const c = fromOff(p)
    if (!c || seen.has(c.key)) return []
    seen.add(c.key)
    return [c]
  })
}

export const isOnline = () => typeof navigator === 'undefined' || navigator.onLine
