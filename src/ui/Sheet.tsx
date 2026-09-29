import { X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cx, IconButton } from './primitives'

/**
 * Bottom sheet — the main logging surface. Slides up over the current screen,
 * respects the home-indicator safe area and can be dismissed by dragging down.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  full,
  headerRight,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  full?: boolean
  headerRight?: ReactNode
}) {
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  const [drag, setDrag] = useState(0)
  const startY = useRef<number | null>(null)

  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      setDrag(0)
    } else if (mounted) {
      setClosing(true)
      const t = setTimeout(() => {
        setMounted(false)
        setClosing(false)
      }, 220)
      return () => clearTimeout(t)
    }
  }, [open, mounted])

  useEffect(() => {
    if (!mounted) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [mounted, onClose])

  if (!mounted) return null

  const onTouchStart = (e: React.TouchEvent) => (startY.current = e.touches[0].clientY)
  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return
    setDrag(Math.max(0, e.touches[0].clientY - startY.current))
  }
  const onTouchEnd = () => {
    if (drag > 110) onClose()
    else setDrag(0)
    startY.current = null
  }

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className={cx('absolute inset-0 bg-backdrop backdrop-blur-[2px]', closing ? 'opacity-0 transition-opacity duration-200' : 'animate-fade-in')}
        onClick={onClose}
      />
      <div
        className={cx(
          'absolute inset-x-0 bottom-0 mx-auto flex max-w-[560px] flex-col rounded-t-[28px] border-t border-line bg-surface shadow-[0_-12px_40px_rgb(0_0_0/0.35)]',
          full ? 'h-[92dvh]' : 'max-h-[92dvh]',
          closing ? 'translate-y-full transition-transform duration-200 ease-in' : !drag && 'animate-sheet-in',
        )}
        style={drag ? { transform: `translateY(${drag}px)` } : undefined}
      >
        <div className="shrink-0 touch-none" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
          <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-line-strong" />
          {(title || headerRight) && (
            <div className="flex items-start gap-2 px-5 pt-3 pb-2">
              <div className="min-w-0 flex-1 pt-1.5">
                {title && <h2 className="text-[20px] font-semibold tracking-tight">{title}</h2>}
                {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
              </div>
              {headerRight}
              <IconButton icon={X} label="Close" onClick={onClose} className="-mr-2 bg-surface-2" size={18} />
            </div>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-4">{children}</div>
        {footer && <div className="shrink-0 border-t border-line px-5 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]">{footer}</div>}
        {!footer && <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />}
      </div>
    </div>,
    document.body,
  )
}
