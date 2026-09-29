import { useEffect, useState } from 'react'
import type { ProgressPhoto } from '../../domain/models'
import { cx } from '../../ui/primitives'

export function useBlobUrl(blob: Blob | undefined): string | undefined {
  const [url, setUrl] = useState<string>()
  useEffect(() => {
    if (!blob) return
    const u = URL.createObjectURL(blob)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [blob])
  return url
}

export function PhotoThumb({ photo, className, full }: { photo: ProgressPhoto; className?: string; full?: boolean }) {
  const url = useBlobUrl(full ? photo.image : photo.thumb)
  return (
    <div className={cx('overflow-hidden bg-surface-2', className)}>
      {url && <img src={url} alt={`${photo.pose} photo`} className="h-full w-full object-cover" draggable={false} />}
    </div>
  )
}
