/**
 * Cloudflare Pages Function: GET /api/food-search?q=...
 * Proxies Open Food Facts search (free open data) so the browser can call it same-origin.
 */
interface Ctx {
  request: Request
}

const FIELDS = 'code,product_name,brands,nutriments'
const UA = 'MyFit/1.0 (personal fitness PWA)'

export async function onRequestGet({ request }: Ctx): Promise<Response> {
  const q = new URL(request.url).searchParams.get('q')?.trim().slice(0, 80)
  if (!q) return json({ products: [] })

  const primary = `https://search.openfoodfacts.org/search?q=${encodeURIComponent(q)}&page_size=25&fields=${FIELDS}`
  const fallback = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&json=1&page_size=25&fields=${FIELDS}`

  for (const [url, key] of [
    [primary, 'hits'],
    [fallback, 'products'],
  ] as const) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 86400, cacheEverything: true } } as RequestInit)
      if (!res.ok) continue
      const data = (await res.json()) as Record<string, unknown>
      const products = data[key]
      if (Array.isArray(products)) return json({ products }, 3600)
    } catch {
      // try the next source
    }
  }
  return json({ products: [], error: 'unavailable' }, 0, 502)
}

function json(body: unknown, maxAge = 0, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${maxAge}` },
  })
}
