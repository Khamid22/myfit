import type { ReactNode } from 'react'
import { cx } from './primitives'

/** Screen scaffold: large iOS-style title, safe-area aware, space for the tab bar. */
export function Page({
  title,
  eyebrow,
  action,
  children,
  className,
}: {
  title?: ReactNode
  eyebrow?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <main
      className={cx('mx-auto w-full max-w-[560px] animate-fade-in px-4', className)}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 104px)',
      }}
    >
      {(title || action) && (
        <header className="mb-5 flex items-end justify-between gap-3 px-1 pt-2">
          <div className="min-w-0">
            {eyebrow && <div className="mb-0.5 text-[13px] font-medium text-muted">{eyebrow}</div>}
            {title && <h1 className="text-[30px] leading-[1.15] font-bold tracking-[-0.02em] text-balance">{title}</h1>}
          </div>
          {action}
        </header>
      )}
      {children}
    </main>
  )
}
