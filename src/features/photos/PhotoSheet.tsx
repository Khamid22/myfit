import { Camera, Loader2, Lock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../app/context'
import { useWeights } from '../../hooks/data'
import type { PhotoPose } from '../../domain/models'
import { todayKey } from '../../lib/dates'
import { resizeImage } from '../../lib/image'
import { photoRepo } from '../../storage/repositories/body'
import { useFeedback } from '../../ui/feedback'
import { Sheet } from '../../ui/Sheet'
import { Button, Input, Segmented } from '../../ui/primitives'
import { useBlobUrl } from './PhotoThumb'

export const POSES: { value: PhotoPose; label: string }[] = [
  { value: 'front', label: 'Front' },
  { value: 'side', label: 'Side' },
  { value: 'back', label: 'Back' },
]

export default function PhotoSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { units } = useApp()
  const weights = useWeights()
  const { toast } = useFeedback()
  const [pose, setPose] = useState<PhotoPose>('front')
  const [file, setFile] = useState<Blob>()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  const preview = useBlobUrl(file)
  const latest = weights.at(-1)

  useEffect(() => {
    if (open) {
      setFile(undefined)
      setNote('')
    }
  }, [open])

  async function save() {
    if (!file) return
    setBusy(true)
    try {
      const [image, thumb] = await Promise.all([resizeImage(file, 1600, 0.85), resizeImage(file, 360, 0.75)])
      await photoRepo.add({ date: todayKey(), pose, image, thumb, weightKg: latest?.kg, note: note.trim() || undefined })
      onClose()
      toast('Photo saved on this device')
    } catch {
      toast('Could not read that image')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Add progress photo"
      footer={
        <Button variant="solid" size="lg" block disabled={!file || busy} onClick={save}>
          {busy ? <Loader2 size={18} className="animate-spin" /> : 'Save photo'}
        </Button>
      }
    >
      <div className="space-y-4">
        <Segmented options={POSES} value={pose} onChange={setPose} />
        <button
          onClick={() => input.current?.click()}
          className="press relative grid aspect-[3/4] max-h-[42dvh] w-full place-items-center overflow-hidden rounded-[22px] border border-dashed border-line-strong bg-surface-2"
        >
          {preview ? (
            <img src={preview} alt="Preview" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="text-center text-muted">
              <Camera size={28} className="mx-auto mb-2" />
              <div className="text-[15px] font-semibold text-text">Take or choose a photo</div>
              <div className="text-[13px]">Same spot and lighting makes comparisons easier</div>
            </div>
          )}
        </button>
        <input ref={input} type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0])} />
        <Input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        <p className="flex items-start gap-2 px-1 text-[12px] leading-snug text-faint">
          <Lock size={13} className="mt-0.5 shrink-0" />
          Saved with today's date{latest ? ` and weight (${units.weightU(latest.kg)})` : ''}. Resized and stored only on this device — never uploaded.
        </p>
      </div>
    </Sheet>
  )
}
