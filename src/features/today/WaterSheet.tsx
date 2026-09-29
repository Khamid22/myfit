import { Droplets, Undo2 } from 'lucide-react'
import { useApp } from '../../app/context'
import { useWaterMl } from '../../hooks/data'
import type { DayKey } from '../../lib/dates'
import { int } from '../../lib/format'
import { waterRepo } from '../../storage/repositories/body'
import { Sheet } from '../../ui/Sheet'
import { Ring } from '../../ui/progress'
import { Button } from '../../ui/primitives'

const AMOUNTS = [150, 250, 330, 500, 750]

export function WaterSheet({ open, onClose, date }: { open: boolean; onClose: () => void; date: DayKey }) {
  const { profile } = useApp()
  const ml = useWaterMl(date)
  const goal = profile.waterGoalMl
  return (
    <Sheet open={open} onClose={onClose} title="Water" subtitle={`Goal ${int(goal)} ml · the Water Goal habit completes automatically`}>
      <div className="flex flex-col items-center py-3">
        <Ring value={ml / goal} size={170} stroke={14} color="var(--c-carbs)" overColor="var(--c-carbs)">
          <div>
            <Droplets size={20} className="mx-auto mb-1 text-carbs" />
            <div className="tabular text-[30px] leading-none font-bold">{int(ml)}</div>
            <div className="mt-1 text-[12px] text-muted">of {int(goal)} ml</div>
          </div>
        </Ring>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        {AMOUNTS.map((a) => (
          <Button key={a} variant={a === 250 ? 'primary' : 'secondary'} onClick={() => waterRepo.addMl(date, a)}>
            +{a} ml
          </Button>
        ))}
        <Button variant="ghost" icon={Undo2} disabled={ml === 0} onClick={() => waterRepo.undoLast(date)}>
          Undo
        </Button>
      </div>
    </Sheet>
  )
}
