import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DayKey } from '../lib/dates'
import { formatDay } from '../lib/dates'

const axis = { fontSize: 11, fill: 'var(--c-faint)' }

function TooltipBox({ lines, date }: { date: DayKey; lines: { label: string; value: string; color: string }[] }) {
  return (
    <div className="rounded-xl border border-line-strong bg-elev px-3 py-2 text-[12px] shadow-lg">
      <div className="mb-1 font-semibold">{formatDay(date, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
      {lines.map((l) => (
        <div key={l.label} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
          <span className="text-muted">{l.label}</span>
          <span className="tabular ml-auto pl-3 font-semibold">{l.value}</span>
        </div>
      ))}
    </div>
  )
}

export interface WeightPoint {
  date: DayKey
  kg?: number
  avg: number | null
}

/**
 * Weight trend: the 7-day average is the hero line; individual weigh-ins
 * are small, quiet dots so daily noise doesn't dominate.
 */
export function WeightTrendChart({
  data,
  unit,
  goal,
  height = 220,
}: {
  data: { date: DayKey; weight?: number; avg?: number }[]
  unit: string
  goal?: number
  height?: number
}) {
  const vals = data.flatMap((d) => [d.weight, d.avg]).filter((v): v is number => v != null)
  if (!vals.length) return null
  const lo = Math.min(...vals)
  const hi = Math.max(...vals)
  const pad = Math.max(0.6, (hi - lo) * 0.15)
  const tickEvery = Math.max(1, Math.ceil(data.length / 5))
  const narrow = hi - lo + 2 * pad < 6

  return (
    <div style={{ height }} className="-ml-2">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--c-line)" />
          <XAxis
            dataKey="date"
            tick={axis}
            tickLine={false}
            axisLine={false}
            interval={tickEvery - 1}
            tickFormatter={(d: string) => formatDay(d)}
            minTickGap={16}
          />
          <YAxis
            domain={[Math.floor((lo - pad) * 2) / 2, Math.ceil((hi + pad) * 2) / 2]}
            tick={axis}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => v.toFixed(narrow ? 1 : 0)}
            allowDecimals={narrow}
            tickCount={5}
          />
          <Tooltip
            cursor={{ stroke: 'var(--c-line-strong)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload
              if (!p) return null
              const lines = [
                p.avg != null && { label: '7-day avg', value: `${p.avg.toFixed(1)} ${unit}`, color: 'var(--c-accent)' },
                p.weight != null && { label: 'Weigh-in', value: `${p.weight.toFixed(1)} ${unit}`, color: 'var(--c-faint)' },
              ].filter(Boolean) as { label: string; value: string; color: string }[]
              return <TooltipBox date={p.date} lines={lines} />
            }}
          />
          {goal != null && goal >= lo - pad && goal <= hi + pad && (
            <Line dataKey={() => goal} stroke="var(--c-good)" strokeDasharray="4 4" strokeWidth={1} dot={false} isAnimationActive={false} activeDot={false} />
          )}
          <Line
            dataKey="weight"
            stroke="none"
            isAnimationActive={false}
            dot={{ r: 2.5, fill: 'var(--c-faint)', stroke: 'none' }}
            activeDot={{ r: 4, fill: 'var(--c-muted)', stroke: 'var(--c-surface)', strokeWidth: 2 }}
          />
          <Line
            dataKey="avg"
            type="monotone"
            stroke="var(--c-accent)"
            strokeWidth={2.5}
            dot={false}
            connectNulls
            activeDot={{ r: 5, fill: 'var(--c-accent)', stroke: 'var(--c-surface)', strokeWidth: 2 }}
            animationDuration={600}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Small single-series progression chart (push-ups, bench press best set…). */
export function ProgressLine({
  data,
  format,
  height = 110,
  color = 'var(--c-accent)',
}: {
  data: { date: DayKey; value: number }[]
  format: (v: number) => string
  height?: number
  color?: string
}) {
  if (data.length < 2) return null
  return (
    <div style={{ height }} className="-mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
          <XAxis dataKey="date" hide />
          <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
          <Tooltip
            cursor={{ stroke: 'var(--c-line-strong)', strokeWidth: 1 }}
            content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload
              return p ? <TooltipBox date={p.date} lines={[{ label: 'Best', value: format(p.value), color }]} /> : null
            }}
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3.5, fill: color, stroke: 'var(--c-surface)', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: color, stroke: 'var(--c-surface)', strokeWidth: 2 }}
            animationDuration={500}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
