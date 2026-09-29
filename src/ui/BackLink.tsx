import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router'

/** Small back link used as a page eyebrow on secondary screens. */
export function BackLink({ label, to }: { label: string; to: string }) {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(to)} className="-ml-1 flex items-center gap-1 text-accent-strong">
      <ArrowLeft size={16} /> {label}
    </button>
  )
}
