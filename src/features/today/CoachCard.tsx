import { Sparkles } from 'lucide-react'
import type { Recommendation, Tone } from '../../domain/recommendations/types'
import { Card, SectionTitle } from '../../ui/primitives'

export const TONE_COLOR: Record<Tone, string> = {
  good: 'var(--c-good)',
  info: 'var(--c-accent-strong)',
  calm: 'var(--c-warn)',
}

export function CoachCard({ tips, title = 'Insights' }: { tips: Recommendation[]; title?: string }) {
  if (!tips.length) return null
  return (
    <section>
      <SectionTitle>{title}</SectionTitle>
      <Card className="space-y-3.5">
        {tips.map((t) => (
          <div key={t.id} className="flex gap-3">
            <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: `color-mix(in srgb, ${TONE_COLOR[t.tone]} 16%, transparent)`, color: TONE_COLOR[t.tone] }}>
              <Sparkles size={13} strokeWidth={2.4} />
            </span>
            <p className="text-[14px] leading-relaxed">{t.text}</p>
          </div>
        ))}
      </Card>
    </section>
  )
}
