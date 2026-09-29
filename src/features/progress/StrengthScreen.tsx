import { useState } from 'react'
import { useApp } from '../../app/context'
import { useExercises, useSessions } from '../../hooks/data'
import { exerciseHistory, formatSet, primaryValue } from '../../domain/workouts/workouts'
import { formatDay } from '../../lib/dates'
import { signed } from '../../lib/format'
import { BackLink } from '../../ui/BackLink'
import { ProgressLine } from '../../ui/charts'
import { Card, Chip, Empty, Stat } from '../../ui/primitives'
import { Page } from '../../ui/Page'

/** "Am I becoming stronger?" — best set per session for each exercise. */
export function StrengthScreen() {
  const { units } = useApp()
  const sessions = useSessions()
  const exercises = useExercises()
  const withHistory = exercises
    .map((e) => ({ e, hist: exerciseHistory(sessions, e) }))
    .filter((x) => x.hist.length > 0)
    .sort((a, b) => b.hist.length - a.hist.length)
  const [sel, setSel] = useState<string | null>(null)
  const current = withHistory.find((x) => x.e.id === sel) ?? withHistory[0]

  return (
    <Page title="Strength" eyebrow={<BackLink label="Progress" to="/progress" />}>
      {!current ? (
        <Card>
          <Empty title="No lifts logged yet">Finish a workout and your best sets will show here.</Empty>
        </Card>
      ) : (
        <>
          <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4">
            {withHistory.map(({ e }) => (
              <Chip key={e.id} active={e.id === current.e.id} onClick={() => setSel(e.id)}>
                {e.name}
              </Chip>
            ))}
          </div>
          {(() => {
            const { e, hist } = current
            const first = hist[0]
            const last = hist.at(-1)!
            const conv = e.type === 'weighted' ? units.toW : (v: number) => v
            const d = conv(primaryValue(last.best, e.type)) - conv(primaryValue(first.best, e.type))
            const unit = e.type === 'weighted' ? units.w : e.type === 'timed' ? 's' : 'reps'
            return (
              <Card>
                <div className="grid grid-cols-3 gap-3">
                  <Stat label="First" value={formatSet(first.best, e.type, units.w, units.toW)} sub={formatDay(first.date)} />
                  <Stat label="Latest" value={formatSet(last.best, e.type, units.w, units.toW)} sub={formatDay(last.date)} />
                  <Stat label="Change" value={<span className={d > 0 ? 'text-good' : ''}>{hist.length > 1 ? signed(d, e.type === 'weighted' ? 1 : 0) : '—'}</span>} unit={hist.length > 1 ? unit : undefined} />
                </div>
                <ProgressLine
                  height={160}
                  data={hist.map((h) => ({ date: h.date, value: +conv(primaryValue(h.best, e.type)).toFixed(1) }))}
                  format={(v) => `${v} ${unit}`}
                />
                <div className="mt-2 space-y-1">
                  {[...hist].reverse().slice(0, 10).map((h) => (
                    <div key={h.date} className="flex justify-between text-[14px]">
                      <span className="text-muted">{formatDay(h.date)}</span>
                      <span className="tabular font-medium">{formatSet(h.best, e.type, units.w, units.toW)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )
          })()}
        </>
      )}
    </Page>
  )
}
