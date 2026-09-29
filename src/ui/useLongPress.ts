import { useRef } from 'react'

/** Tap runs `onTap`; holding for 500 ms runs `onLong` instead. Works with touch and mouse. */
export function useLongPress(onTap: () => void, onLong?: () => void, ms = 500) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const fired = useRef(false)
  const start = useRef<{ x: number; y: number } | null>(null)

  const cancel = () => {
    clearTimeout(timer.current)
    start.current = null
  }

  return {
    onPointerDown: (e: React.PointerEvent) => {
      fired.current = false
      start.current = { x: e.clientX, y: e.clientY }
      if (!onLong) return
      timer.current = setTimeout(() => {
        fired.current = true
        navigator.vibrate?.(15)
        onLong()
      }, ms)
    },
    onPointerMove: (e: React.PointerEvent) => {
      // Scrolling cancels the long-press.
      if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) cancel()
    },
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerCancel: cancel,
    onContextMenu: (e: React.MouseEvent) => onLong && e.preventDefault(),
    onClick: () => {
      if (fired.current) {
        fired.current = false
        return
      }
      onTap()
    },
  }
}
