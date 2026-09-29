export const round1 = (n: number) => Math.round(n * 10) / 10

export function int(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return Math.round(n).toLocaleString('en-US')
}

export function dec1(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return '—'
  return round1(n).toFixed(1)
}

/** Compact number: drops a trailing ".0". */
export function num(n: number | null | undefined, digits = 1): string {
  if (n == null || Number.isNaN(n)) return '—'
  const f = 10 ** digits
  return String(Math.round(n * f) / f)
}

/** Signed with a true minus sign, e.g. "+0.4" / "−1.2". */
export function signed(n: number, digits = 1): string {
  const r = Number(Math.abs(n).toFixed(digits))
  if (r === 0) return (0).toFixed(digits)
  return (n > 0 ? '+' : '−') + r.toFixed(digits)
}

export function mean(xs: number[]): number | null {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null
}

export function clamp(n: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, n))
}

export function pct(part: number, total: number): number {
  return total > 0 ? part / total : 0
}

export function parseNum(s: string): number | null {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}
