import { Minus, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../../app/context'
import { useWeights } from '../../hooks/data'
import { fromDisplayWeight, toDisplayWeight } from '../../domain/profile/units'
import { rollingAverage } from '../../domain/weight/weight'
import { addDays, relativeDayLabel, todayKey, type DayKey } from '../../lib/dates'
import { parseNum } from '../../lib/format'
import { weightRepo } from '../../storage/repositories/body'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Button, Chip, Input } from '../../ui/primitives'

export function WeightSheet({ open, onClose, date: initialDate }: { open: boolean; onClose: () => void; date?: DayKey }) {
  const { profile, units } = useApp()
  const weights = useWeights()
  const { toast } = useFeedback()
  const [date, setDate] = useState<DayKey>(initialDate ?? todayKey())
  const [value, setValue] = useState('')
  const [note, setNote] = useState('')
  const existing = weights.find((w) => w.date === date)
  const last = weights.filter((w) => w.date <= date).at(-1) ?? weights.at(-1)

  useEffect(() => {
    if (!open) return
    const d = initialDate ?? todayKey()
    setDate(d)
    const e = weights.find((w) => w.date === d)
    const base = e ?? weights.at(-1)
    setValue(base ? toDisplayWeight(base.kg, profile.units.weight).toFixed(1) : '')
    setNote(e?.note ?? '')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const step = (d: number) => {
    const v = parseNum(value) ?? (last ? toDisplayWeight(last.kg, profile.units.weight) : 0)
    setValue((Math.round((v + d) * 10) / 10).toFixed(1))
  }

  const kg = parseNum(value) != null ? fromDisplayWeight(parseNum(value)!, profile.units.weight) : null
  const avgAfter = kg != null ? rollingAverage([...weights.filter((w) => w.date !== date), { date, kg } as never], date) : null

  async function save() {
    if (kg == null || kg < 30 || kg > 400) return
    await weightRepo.setForDay(date, kg, note.trim() || undefined)
    onClose()
    toast(`Saved ${units.weightU(kg)}`)
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Log weight"
      subtitle={existing ? 'Replaces this day’s entry. Everything else stays.' : 'Daily weight fluctuates — the 7-day average tells the story.'}
      footer={
        <Button variant="solid" size="lg" block disabled={kg == null} onClick={save}>
          Save
        </Button>
      }
    >
      <div className="no-scrollbar -mx-5 mb-5 flex gap-2 overflow-x-auto px-5">
        {[0, -1, -2].map((n) => {
          const d = addDays(todayKey(), n)
          return (
            <Chip key={d} active={d === date} onClick={() => setDate(d)}>
              {relativeDayLabel(d)}
            </Chip>
          )
        })}
      </div>
      <div className="flex items-center justify-center gap-4 py-2">
        <button onClick={() => step(-0.1)} className="press grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted" aria-label="Decrease">
          <Minus size={22} />
        </button>
        <div className="flex items-baseline gap-2">
          <input
            autoFocus
            inputMode="decimal"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(/[^0-9.,]/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="tabular w-[150px] bg-transparent text-center text-[56px] font-bold tracking-tight outline-none"
            style={{ fontSize: 56 }}
            aria-label={`Weight in ${units.w}`}
          />
          <span className="text-[18px] text-muted">{units.w}</span>
        </div>
        <button onClick={() => step(0.1)} className="press grid h-14 w-14 place-items-center rounded-full bg-surface-2 text-muted" aria-label="Increase">
          <Plus size={22} />
        </button>
      </div>
      <div className="mt-2 text-center text-[13px] text-muted">
        {avgAfter != null && (
          <>
            7-day average would be <span className="tabular font-semibold text-accent-strong">{units.weightU(avgAfter)}</span>
          </>
        )}
      </div>
      <Input className="mt-6" placeholder="Note (optional) — e.g. salty dinner, poor sleep" value={note} onChange={(e) => setNote(e.target.value)} />
    </Sheet>
  )
}
