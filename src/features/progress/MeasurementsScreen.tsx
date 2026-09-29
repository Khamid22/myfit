import { Plus } from 'lucide-react'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import { useMeasurements } from '../../hooks/data'
import { MEASUREMENTS } from '../../domain/progress/measurements'
import { formatDay } from '../../lib/dates'
import { signed } from '../../lib/format'
import { BackLink } from '../../ui/BackLink'
import { Button, Card, cx } from '../../ui/primitives'
import { Page } from '../../ui/Page'

export function MeasurementsScreen() {
  const { units } = useApp()
  const list = useMeasurements()
  const sheets = useSheets()
  return (
    <Page title="Measurements" eyebrow={<BackLink label="Progress" to="/progress" />}>
      <Card className="!py-1.5">
        {MEASUREMENTS.map(({ key, label }) => {
          const vals = list.filter((m) => m.values[key] != null)
          const first = vals[0]
          const last = vals.at(-1)
          const d = first && last && first !== last ? last.values[key]! - first.values[key]! : null
          return (
            <div key={key} className="flex min-h-13 items-center gap-3 border-b border-line last:border-0">
              <span className="flex-1 text-[15px] font-medium">{label}</span>
              {d != null && <span className={cx('tabular text-[13px]', d < 0 ? 'text-good' : 'text-muted')}>{signed(units.toL(d))}</span>}
              <span className="tabular w-[84px] text-right text-[15px] font-semibold">
                {last ? (
                  <>
                    {units.length(last.values[key])} <span className="text-[12px] font-normal text-muted">{units.l}</span>
                  </>
                ) : (
                  <span className="text-faint">—</span>
                )}
              </span>
            </div>
          )
        })}
      </Card>
      {list.length > 0 && <p className="mt-2 px-1 text-[12px] text-faint">Last measured {formatDay(list.at(-1)!.date)}. Changes are since your first entry.</p>}
      <Button variant="primary" block icon={Plus} className="mt-4" onClick={() => sheets.open({ type: 'measure' })}>
        Log measurements
      </Button>
    </Page>
  )
}
