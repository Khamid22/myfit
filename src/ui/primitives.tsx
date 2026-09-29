import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import { forwardRef } from 'react'
import type { LucideIcon } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

export function Card({
  children,
  className,
  onClick,
  as = 'div',
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  as?: 'div' | 'button' | 'section'
}) {
  const Tag = onClick ? 'button' : as
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'block w-full rounded-[22px] border border-line bg-surface p-4 text-left',
        onClick && 'press active:bg-surface-2',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('mb-2.5 flex min-h-8 items-center justify-between px-1', className)}>
      <h2 className="text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">{children}</h2>
      {action}
    </div>
  )
}

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'solid'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant
  size?: 'sm' | 'md' | 'lg'
  block?: boolean
  icon?: LucideIcon
}

export function Button({ variant = 'secondary', size = 'md', block, icon: Icon, className, children, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        'press inline-flex items-center justify-center gap-2 rounded-2xl font-semibold whitespace-nowrap select-none disabled:opacity-40',
        size === 'sm' && 'h-9 px-3.5 text-[14px]',
        size === 'md' && 'h-12 px-5 text-[15px]',
        size === 'lg' && 'h-14 px-6 text-[16px]',
        variant === 'solid' && 'bg-accent text-white active:opacity-90 [html[data-theme=dark]_&]:text-bg',
        variant === 'primary' && 'border border-accent/60 bg-accent-soft text-accent-strong active:bg-accent/25',
        variant === 'secondary' && 'bg-surface-2 text-text active:bg-elev',
        variant === 'ghost' && 'text-accent-strong active:bg-accent-soft',
        variant === 'danger' && 'border border-warn/40 bg-warn-soft text-warn',
        block && 'w-full',
        className,
      )}
    >
      {Icon && <Icon size={size === 'sm' ? 16 : 18} strokeWidth={2.2} />}
      {children}
    </button>
  )
}

export function IconButton({
  icon: Icon,
  label,
  className,
  size = 20,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string; size?: number }) {
  return (
    <button
      aria-label={label}
      title={label}
      {...rest}
      className={cx(
        'press grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted active:bg-surface-2',
        className,
      )}
    >
      <Icon size={size} strokeWidth={2} />
    </button>
  )
}

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx('block', className)}>
      <span className="mb-1.5 block px-1 text-[13px] font-medium text-muted">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block px-1 text-[12px] leading-snug text-faint">{hint}</span>}
    </label>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { suffix?: string }>(
  function Input({ className, suffix, ...rest }, ref) {
    return (
      <div className={cx('flex h-12 items-center rounded-2xl border border-line bg-surface-2 px-4 focus-within:border-accent/60', className)}>
        <input
          ref={ref}
          {...rest}
          className="h-full w-full min-w-0 bg-transparent text-[16px] text-text outline-none placeholder:text-faint"
        />
        {suffix && <span className="ml-2 shrink-0 text-[14px] text-muted">{suffix}</span>}
      </div>
    )
  },
)

/** Numeric input that opens the decimal keypad on iPhone. */
export const NumberInput = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
    value: string
    onChange: (v: string) => void
    suffix?: string
    integer?: boolean
  }
>(function NumberInput({ value, onChange, integer, ...rest }, ref) {
  return (
    <Input
      ref={ref}
      {...rest}
      type="text"
      inputMode={integer ? 'numeric' : 'decimal'}
      pattern={integer ? '[0-9]*' : undefined}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ''))}
      className={cx('tabular', rest.className)}
    />
  )
})

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  size = 'md',
}: {
  options: { value: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="tablist" className={cx('flex rounded-2xl bg-surface-2 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'flex-1 rounded-xl font-semibold transition-colors',
            size === 'sm' ? 'h-8 text-[13px]' : 'h-10 text-[14px]',
            o.value === value ? 'bg-elev text-text shadow-[0_1px_3px_rgb(0_0_0/0.25)]' : 'text-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'press h-9 shrink-0 rounded-full border px-3.5 text-[14px] font-medium',
        active ? 'border-accent/60 bg-accent-soft text-accent-strong' : 'border-line bg-surface-2 text-muted',
        className,
      )}
    >
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cx('relative h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-accent' : 'bg-elev')}
    >
      <span
        className={cx(
          'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
          checked && 'translate-x-5',
        )}
      />
    </button>
  )
}

export function Empty({ icon: Icon, title, children }: { icon?: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-8 text-center">
      {Icon && (
        <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-muted">
          <Icon size={22} />
        </div>
      )}
      <p className="text-[15px] font-semibold">{title}</p>
      {children && <div className="mt-1 text-[14px] leading-snug text-muted">{children}</div>}
    </div>
  )
}

export function Stat({ label, value, unit, sub, className }: { label: string; value: ReactNode; unit?: string; sub?: ReactNode; className?: string }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="truncate text-[12px] font-medium text-muted">{label}</div>
      <div className="mt-0.5 flex items-baseline gap-1">
        <span className="tabular truncate text-[20px] font-semibold tracking-tight">{value}</span>
        {unit && <span className="text-[13px] text-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 truncate text-[12px] text-faint">{sub}</div>}
    </div>
  )
}

export function ListRow({
  title,
  subtitle,
  right,
  onClick,
  leading,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  onClick?: () => void
  leading?: ReactNode
  className?: string
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={cx(
        'flex min-h-14 w-full items-center gap-3 py-2.5 text-left',
        onClick && 'press rounded-xl active:bg-surface-2',
        className,
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium">{title}</div>
        {subtitle && <div className="truncate text-[13px] text-muted">{subtitle}</div>}
      </div>
      {right}
    </Tag>
  )
}

export function Divider({ className }: { className?: string }) {
  return <div className={cx('h-px bg-line', className)} />
}
