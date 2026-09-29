import type { ReactNode } from 'react'
import { cx } from './primitives'

/** Circular progress. Values above 1 draw a second, softer lap instead of a red warning. */
export function Ring({
  value,
  size = 168,
  stroke = 14,
  color = 'var(--c-accent)',
  overColor = 'var(--c-warn)',
  children,
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
  overColor?: string
  children?: ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const main = Math.min(1, Math.max(0, value))
  const over = Math.min(1, Math.max(0, value - 1))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--c-surface-2)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - main)}
          style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.9,.25,1)' }}
        />
        {over > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={overColor}
            strokeOpacity={0.85}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - over)}
            style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(.2,.9,.25,1)' }}
          />
        )}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  )
}

export function Bar({ value, color = 'var(--c-accent)', className, height = 8 }: { value: number; color?: string; className?: string; height?: number }) {
  const v = Math.min(1, Math.max(0, value))
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-surface-2', className)} style={{ height }}>
      <div
        className="h-full rounded-full"
        style={{ width: `${v * 100}%`, background: color, transition: 'width 600ms cubic-bezier(.2,.9,.25,1)' }}
      />
    </div>
  )
}

export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const done = target > 0 && value >= target
  return (
    <div className="min-w-0">
      <div className="mb-1.5 flex items-baseline justify-between gap-1">
        <span className="text-[13px] font-medium text-muted">{label}</span>
        {done && <span className="text-[11px] font-semibold" style={{ color }}>✓</span>}
      </div>
      <Bar value={target ? value / target : 0} color={color} height={6} />
      <div className="tabular mt-1.5 text-[14px] font-semibold">
        {Math.round(value)}
        <span className="font-normal text-muted"> / {target} g</span>
      </div>
    </div>
  )
}
