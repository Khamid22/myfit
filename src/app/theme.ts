import type { ThemePref } from '../domain/models'

export function applyTheme(pref: ThemePref) {
  try {
    localStorage.setItem('myfit.theme', pref)
  } catch {
    /* private mode */
  }
  const resolved = pref === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : pref
  document.documentElement.dataset.theme = resolved
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--c-bg').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#161826')
}
