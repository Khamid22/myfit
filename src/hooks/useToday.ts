import { useEffect, useState } from 'react'
import { todayKey } from '../lib/dates'

/** Today's day key; rolls over at midnight and when the app returns from the background. */
export function useToday(): string {
  const [k, setK] = useState(todayKey)
  useEffect(() => {
    const check = () => setK(todayKey())
    const t = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return k
}
