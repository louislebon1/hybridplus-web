'use client'

/**
 * Data primitives. They render existing app data — they hold no state and
 * fetch nothing. Series separate by tonal value, never by hue: the only
 * interface colour in this world is white.
 */

import type { ReactNode } from 'react'

/** Tonal ramp for any multi-series figure. Index in, opacity out. */
export const DATA_TONES = [
  'rgba(230,232,236,0.92)',
  'rgba(230,232,236,0.70)',
  'rgba(230,232,236,0.52)',
  'rgba(230,232,236,0.36)',
  'rgba(230,232,236,0.22)',
]

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="meta m-0">{children}</p>
      {action}
    </div>
  )
}

/** Small pill used for status words like LOW / BUILDING / HIGH. */
export function StatusPill({ label, color }: { label: string; color?: string }) {
  return (
    <span className="meta px-3 py-1.5 rounded-pill matt inline-block" style={color ? { color } : undefined}>
      {label}
    </span>
  )
}

// ── Cards ───────────────────────────────────────────────────────────────────

export function Card({
  children,
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode
  as?: 'div' | 'button'
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag className="matt rounded-card p-4" {...rest}>
      {children}
    </Tag>
  )
}

/** Compact metric tile: tiny label, prominent figure, tiny caption. */
export function StatCard({
  label,
  value,
  caption,
  valueColor,
}: {
  label: string
  value: string
  caption?: string
  valueColor?: string
}) {
  return (
    <div className="flex-1 min-w-0 matt rounded-card px-3.5 py-3.5 flex flex-col gap-1">
      <p className="meta m-0 truncate">{label}</p>
      <p
        className="display text-figure tabular m-0 truncate text-scrim"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {caption && <p className="meta m-0 truncate">{caption}</p>}
    </div>
  )
}

// ── Distribution ────────────────────────────────────────────────────────────

export interface ZoneDatum {
  label: string
  color: string
  /** 0–100 */
  pct: number
  /** e.g. "16×" */
  count?: string
}

/** One labelled row: name, track+fill bar, percentage, optional count. */
export function ZoneRow({ zone }: { zone: ZoneDatum }) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 flex-shrink-0 text-label text-stone truncate">{zone.label}</span>
      <div className="flex-1 min-w-0 h-2 rounded-pill bg-steel overflow-hidden">
        <div
          className="h-full rounded-pill"
          style={{ width: `${Math.max(zone.pct, 0)}%`, background: zone.color }}
        />
      </div>
      <span className="w-11 flex-shrink-0 text-right display text-label tabular text-scrim">
        {Math.round(zone.pct)}%
      </span>
      {zone.count !== undefined && (
        <span className="w-9 flex-shrink-0 text-right meta tabular">{zone.count}</span>
      )}
    </div>
  )
}

/** Multi-segment bar — one strip, segments by tonal value. */
export function StackedBar({ zones, height = 10 }: { zones: ZoneDatum[]; height?: number }) {
  const total = zones.reduce((sum, z) => sum + z.pct, 0) || 1
  return (
    <div className="flex w-full rounded-pill overflow-hidden gap-[2px]" style={{ height }}>
      {zones.map(z => (
        <div
          key={z.label}
          style={{ width: `${(z.pct / total) * 100}%`, background: z.color }}
          title={`${z.label} ${Math.round(z.pct)}%`}
        />
      ))}
    </div>
  )
}

/** Percentage row above a stacked bar. */
export function DistributionSummary({ zones }: { zones: ZoneDatum[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-3">
        {zones.map(z => (
          <div key={z.label} className="min-w-0">
            <span className="meta block truncate">{z.label}</span>
            <span className="display text-figure tabular text-scrim">{Math.round(z.pct)}%</span>
          </div>
        ))}
      </div>
      <StackedBar zones={zones} />
    </div>
  )
}

// ── Charts ──────────────────────────────────────────────────────────────────

/** Thin line over the field, with a highlighted final point. */
export function Sparkline({
  values,
  color = '#E6E8EC',
  height = 44,
}: {
  values: number[]
  color?: string
  height?: number
}) {
  if (values.length === 0) return null
  const W = 100
  const H = 100
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const PAD = 3
  const inner = W - PAD * 2
  const step = values.length > 1 ? inner / (values.length - 1) : 0
  const pts = values.map((v, i) => {
    const x = values.length === 1 ? W / 2 : PAD + i * step
    const y = H - ((v - min) / span) * H * 0.82 - H * 0.09
    return [x, y] as const
  })
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ')
  const area = `${d} L${W},${H} L0,${H} Z`
  const last = pts[pts.length - 1]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height }} aria-hidden>
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {values.length > 1 && <path d={area} fill="url(#sparkfill)" />}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ── Week × day activity grid ────────────────────────────────────────────────

export interface WeekRow {
  label: string
  /** 7 intensities, Mon–Sun, each 0–1 (0 = no session that day) */
  days: number[]
  load: string
  change: string | null
  changePositive: boolean
}

const DAY_HEADS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/** A row per week, a dot per day sized by relative load, plus load and change. */
export function WeekGrid({ rows }: { rows: WeekRow[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-3">
        <span className="w-9 flex-shrink-0" />
        <div className="flex-1 grid grid-cols-7 gap-1">
          {DAY_HEADS.map((d, i) => (
            <span key={i} className="meta text-center">{d}</span>
          ))}
        </div>
        <span className="w-14 flex-shrink-0 text-right meta">Load</span>
        <span className="w-12 flex-shrink-0 text-right meta">Chg</span>
      </div>

      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-3">
          <span className="w-9 flex-shrink-0 meta tabular">{row.label}</span>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {row.days.map((intensity, i) => (
              <div key={i} className="h-6 flex items-center justify-center">
                {intensity > 0 ? (
                  <span
                    className="rounded-pill bg-scrim block"
                    style={{
                      width: 6 + intensity * 10,
                      height: 6 + intensity * 10,
                      opacity: 0.3 + intensity * 0.7,
                    }}
                  />
                ) : (
                  <span className="w-1 h-1 rounded-pill bg-steel block" />
                )}
              </div>
            ))}
          </div>
          <span className="w-14 flex-shrink-0 text-right display text-label tabular text-scrim">{row.load}</span>
          <span className="w-12 flex-shrink-0 text-right meta tabular">{row.change ?? '—'}</span>
        </div>
      ))}
    </div>
  )
}

// ── Segmented control ───────────────────────────────────────────────────────

export function SegmentedChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2">
      {options.map(opt => {
        const active = opt === value
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={[
              'px-4 py-2 rounded-pill border cursor-pointer transition-colors duration-150 meta',
              active ? 'bg-scrim text-void border-transparent' : 'matt',
            ].join(' ')}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
