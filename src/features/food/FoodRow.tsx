import { Globe, Plus, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { describeServing, scale, unitLabel } from '../../domain/nutrition/nutrition'
import type { Food } from '../../domain/models'
import type { FoodCandidate } from '../../services/foodSearch'
import { int, num } from '../../lib/format'
import { cx } from '../../ui/primitives'

export function foodSub(f: Food): string {
  const qty = f.lastQty ?? f.servingSize
  const n = scale(f, qty)
  return `${num(qty)} ${unitLabel(f.unit, qty)} · ${int(n.kcal)} kcal · ${num(n.protein, 0)} g protein`
}

export function candidateSub(c: FoodCandidate): string {
  return `${c.brand ? c.brand + ' · ' : ''}${describeServing(c)} · ${int(c.kcal)} kcal · ${num(c.protein)} P`
}

export function FoodRow({
  title,
  sub,
  onOpen,
  onQuickAdd,
  favorite,
  badge,
  trailing,
}: {
  title: string
  sub: string
  onOpen: () => void
  onQuickAdd?: () => void
  favorite?: boolean
  badge?: 'online' | 'db'
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-center gap-1">
      <button onClick={onOpen} className="press flex min-h-[58px] min-w-0 flex-1 flex-col justify-center rounded-2xl px-2 text-left active:bg-surface-2">
        <span className="flex items-center gap-1.5 text-[15px] font-medium">
          <span className="truncate">{title}</span>
          {favorite && <Star size={12} className="shrink-0 fill-warn text-warn" />}
          {badge === 'online' && <Globe size={12} className="shrink-0 text-faint" />}
        </span>
        <span className="tabular truncate text-[13px] text-muted">{sub}</span>
      </button>
      {trailing}
      {onQuickAdd && (
        <button
          onClick={onQuickAdd}
          aria-label={`Add ${title}`}
          className={cx('press grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent-strong active:bg-accent/30')}
        >
          <Plus size={20} strokeWidth={2.4} />
        </button>
      )}
    </div>
  )
}
