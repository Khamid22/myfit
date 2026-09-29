import { useSheets } from '../../app/sheets'
import { calorieStatus } from '../../domain/nutrition/nutrition'
import type { Nutrients, Targets } from '../../domain/models'
import type { DayKey } from '../../lib/dates'
import { int } from '../../lib/format'
import { MacroBar, Ring } from '../../ui/progress'
import { Card } from '../../ui/primitives'

export function CaloriesCard({ totals, targets, today, compact }: { totals: Nutrients; targets: Targets; today: DayKey; compact?: boolean }) {
  const s = calorieStatus(totals.kcal, targets)
  const sheets = useSheets()
  const over = s.over > 0
  return (
    <Card>
      <button className="flex w-full items-center gap-5 text-left" onClick={() => sheets.open({ type: 'food', date: today })}>
        <Ring value={s.ratio} size={compact ? 118 : 136} stroke={compact ? 11 : 13}>
          <div>
            <div className="tabular text-[26px] leading-none font-bold tracking-tight">{int(over ? s.over : s.remaining)}</div>
            <div className="mt-1 text-[12px] font-medium text-muted">{over ? 'kcal over' : 'remaining'}</div>
          </div>
        </Ring>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-muted">Calories</div>
          <div className="tabular mt-0.5 text-[24px] leading-tight font-semibold tracking-tight">
            {int(s.consumed)}
            <span className="text-[15px] font-normal text-muted"> / {int(s.target)}</span>
          </div>
          <div className="text-[13px] text-muted">kcal eaten today</div>
          {over && (
            <p className="mt-2 text-[13px] leading-snug text-warn">
              +{int(s.over)} kcal. No need to skip meals tomorrow — simply return to your normal target.
            </p>
          )}
        </div>
      </button>
      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-line pt-4">
        <MacroBar label="Protein" value={totals.protein} target={targets.protein} color="var(--c-protein)" />
        <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} color="var(--c-carbs)" />
        <MacroBar label="Fat" value={totals.fat} target={targets.fat} color="var(--c-fat)" />
      </div>
    </Card>
  )
}
