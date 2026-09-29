import { ArrowLeft, Camera, Columns2, Plus, SplitSquareHorizontal, Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useApp } from '../../app/context'
import { useSheets } from '../../app/sheets'
import { usePhotos } from '../../hooks/data'
import type { PhotoPose, ProgressPhoto } from '../../domain/models'
import { formatDay } from '../../lib/dates'
import { photoRepo } from '../../storage/repositories/body'
import { useFeedback } from '../../ui/feedback'
import { Page } from '../../ui/Page'
import { Sheet } from '../../ui/Sheet'
import { Button, Card, cx, Empty, IconButton, Segmented } from '../../ui/primitives'
import { POSES } from './PhotoSheet'
import { PhotoThumb, useBlobUrl } from './PhotoThumb'

export function PhotosScreen() {
  const navigate = useNavigate()
  const { units } = useApp()
  const sheets = useSheets()
  const { confirm } = useFeedback()
  const all = usePhotos()
  const [pose, setPose] = useState<PhotoPose>('front')
  const [viewing, setViewing] = useState<ProgressPhoto | null>(null)
  const [pick, setPick] = useState<'before' | 'after' | null>(null)
  const [beforeId, setBeforeId] = useState<string>()
  const [afterId, setAfterId] = useState<string>()
  const [mode, setMode] = useState<'slider' | 'side'>('slider')

  const photos = all.filter((p) => p.pose === pose)
  const before = photos.find((p) => p.id === beforeId) ?? photos[0]
  const after = photos.find((p) => p.id === afterId) ?? photos.at(-1)
  const byDate = [...photos].reverse().reduce<Record<string, ProgressPhoto[]>>((acc, p) => {
    ;(acc[p.date] ??= []).push(p)
    return acc
  }, {})
  const label = (p: ProgressPhoto) => `${formatDay(p.date, { month: 'short', day: 'numeric', year: 'numeric' })}${p.weightKg ? ` · ${units.weightU(p.weightKg)}` : ''}`

  return (
    <Page
      title="Photos"
      eyebrow={
        <button onClick={() => navigate('/progress')} className="-ml-1 flex items-center gap-1 text-accent-strong">
          <ArrowLeft size={16} /> Progress
        </button>
      }
      action={<IconButton icon={Plus} label="Add photo" className="bg-accent-soft text-accent-strong" onClick={() => sheets.open({ type: 'photo' })} />}
    >
      <Segmented options={POSES} value={pose} onChange={setPose} className="mb-4" />

      {photos.length >= 2 && before && after && (
        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">Compare</h2>
            <Segmented
              size="sm"
              className="w-[150px]"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'slider', label: <SplitSquareHorizontal size={15} className="mx-auto" /> },
                { value: 'side', label: <Columns2 size={15} className="mx-auto" /> },
              ]}
            />
          </div>
          {mode === 'slider' ? <CompareSlider before={before} after={after} /> : (
            <div className="grid grid-cols-2 gap-2">
              <PhotoThumb photo={before} full className="aspect-[3/4] rounded-2xl" />
              <PhotoThumb photo={after} full className="aspect-[3/4] rounded-2xl" />
            </div>
          )}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => setPick('before')} className="press rounded-xl bg-surface px-3 py-2 text-left">
              <div className="text-[11px] font-semibold text-faint uppercase">Before</div>
              <div className="truncate text-[13px] font-medium">{label(before)}</div>
            </button>
            <button onClick={() => setPick('after')} className="press rounded-xl bg-surface px-3 py-2 text-left">
              <div className="text-[11px] font-semibold text-faint uppercase">Now</div>
              <div className="truncate text-[13px] font-medium">{label(after)}</div>
            </button>
          </div>
        </section>
      )}

      {!photos.length && (
        <Card>
          <Empty icon={Camera} title={`No ${pose} photos yet`}>
            Photos show changes the scale can't. Add two to compare before and now.
          </Empty>
          <Button block variant="primary" icon={Plus} onClick={() => sheets.open({ type: 'photo' })}>
            Add photo
          </Button>
        </Card>
      )}

      <div className="space-y-5">
        {Object.entries(byDate).map(([date, list]) => (
          <section key={date}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <span className="text-[15px] font-semibold">{formatDay(date, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {list[0].weightKg && <span className="tabular text-[13px] text-muted">{units.weightU(list[0].weightKg)}</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              {list.map((p) => (
                <button key={p.id} onClick={() => setViewing(p)} className="press">
                  <PhotoThumb photo={p} className="aspect-[3/4] rounded-2xl" />
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>

      <Sheet open={!!pick} onClose={() => setPick(null)} title={pick === 'before' ? 'Choose “before”' : 'Choose “now”'}>
        <div className="grid grid-cols-3 gap-2 pb-2">
          {photos.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                if (pick === 'before') setBeforeId(p.id)
                else setAfterId(p.id)
                setPick(null)
              }}
              className={cx('press text-left', (pick === 'before' ? before : after)?.id === p.id && 'rounded-2xl ring-2 ring-accent')}
            >
              <PhotoThumb photo={p} className="aspect-[3/4] rounded-2xl" />
              <div className="mt-1 truncate text-[11px] text-muted">{formatDay(p.date)}</div>
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={!!viewing} onClose={() => setViewing(null)} title={viewing ? label(viewing) : ''} subtitle={viewing?.note}>
        {viewing && (
          <div className="space-y-3 pb-2">
            <PhotoThumb photo={viewing} full className="max-h-[62dvh] rounded-2xl [&_img]:object-contain" />
            <Button
              block
              variant="danger"
              icon={Trash2}
              onClick={async () => {
                if (await confirm({ title: 'Delete this photo?', body: 'It will be permanently removed from this device.', confirmLabel: 'Delete', danger: true })) {
                  await photoRepo.remove(viewing.id)
                  setViewing(null)
                }
              }}
            >
              Delete photo
            </Button>
          </div>
        )}
      </Sheet>
    </Page>
  )
}

/** Drag the handle to reveal before/after. Touch-first; no hover required. */
function CompareSlider({ before, after }: { before: ProgressPhoto; after: ProgressPhoto }) {
  const [pos, setPos] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const a = useBlobUrl(before.image)
  const b = useBlobUrl(after.image)
  const move = (clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (r) setPos(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)))
  }
  return (
    <div
      ref={box}
      className="relative aspect-[3/4] w-full touch-none overflow-hidden rounded-[22px] bg-surface-2 select-none"
      onPointerDown={(e) => {
        ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
        move(e.clientX)
      }}
      onPointerMove={(e) => e.buttons && move(e.clientX)}
    >
      {b && <img src={b} alt="Now" className="absolute inset-0 h-full w-full object-cover" draggable={false} />}
      {a && (
        <img
          src={a}
          alt="Before"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
          draggable={false}
        />
      )}
      <div className="absolute inset-y-0 w-0.5 bg-white/90 shadow" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[#161826] shadow-lg">
          <SplitSquareHorizontal size={18} />
        </div>
      </div>
      <span className="absolute top-3 left-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">Before</span>
      <span className="absolute top-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">Now</span>
    </div>
  )
}
