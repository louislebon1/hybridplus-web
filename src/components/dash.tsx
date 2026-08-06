'use client'

/**
 * Presentational primitives for the performance-dashboard look.
 * These render existing app data — they hold no state and fetch nothing.
 */

import type { ReactNode } from 'react'

// ── Atmospheric gradient hero ───────────────────────────────────────────────

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div>
      <p>{children}</p>
      {action}
    </div>
  )
}

/** Small pill used for status words like FAIR / POOR / OPTIMAL. */
export function StatusPill({ label, color = 'var(--text-tertiary)' }: { label: string; color?: string }) {
  return (
    <span>
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
    <Tag {...rest}>
      {children}
    </Tag>
  )
}

/** Compact 3-across metric tile: tiny label, prominent value, tiny caption. */
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
    <div>
      <p>{label}</p>
      <p style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </p>
      {caption && <p>{caption}</p>}
    </div>
  )
}

// ── Distribution bars ───────────────────────────────────────────────────────

export interface ZoneDatum {
  label: string
  color: string
  /** 0–100 */
  pct: number
  /** e.g. "16×" — the count column in the reference */
  count?: string
}

/** One labelled row: name, track+fill bar, percentage, optional count. */
export function ZoneRow({ zone }: { zone: ZoneDatum }) {
  return (
    <div>
      <span>{zone.label}</span>
      <div>
        <div style={{ width: `${Math.max(zone.pct, 0)}%`}} />
      </div>
      <span>{Math.round(zone.pct)}%</span>
      {zone.count !== undefined && (
        <span>{zone.count}</span>
      )}
    </div>
  )
}

/** Multi-segment bar — the stacked intensity strip from the reference. */
export function StackedBar({ zones, height = 10 }: { zones: ZoneDatum[]; height?: number }) {
  const total = zones.reduce((sum, z) => sum + z.pct, 0) || 1
  return (
    <div style={{ height }}>
      {zones.map(z => (
        <div key={z.label}
          style={{ width: `${(z.pct / total) * 100}%`}}
          title={`${z.label} ${Math.round(z.pct)}%`} />
      ))}
    </div>
  )
}

/** Percentage triple above a stacked bar, as in "Training Focus". */
export function DistributionSummary({ zones }: { zones: ZoneDatum[] }) {
  return (
    <div>
      <div>
        {zones.map(z => (
          <div key={z.label}>
            <span>
              {z.label}
            </span>
            <span>{Math.round(z.pct)}%</span>
          </div>
        ))}
      </div>
      <StackedBar zones={zones} />
    </div>
  )
}

// ── Charts ──────────────────────────────────────────────────────────────────

/** Thin accent line over a dark field, with a highlighted final point. */
export function Sparkline({
  values,
  color = 'var(--text)',
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
  // Inset horizontally so the end-point marker isn't clipped by the viewBox.
  const PAD = 3
  const inner = W - PAD * 2
  const step = values.length> 1 ? inner / (values.length - 1) : 0
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
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {values.length> 1 && <path d={area} fill="url(#sparkfill)" />}
      <path d={d}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r={2.4} fill={color} vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

// ── Week × day activity grid ────────────────────────────────────────────────

export interface WeekRow {
  /** e.g. "W31" */
  label: string
  /** 7 intensities, Mon–Sun, each 0–1 (0 = no session that day) */
  days: number[]
  /** right-hand "load" column */
  load: string
  /** right-hand "change" column, e.g. "+107%" */
  change: string | null
  changePositive: boolean
}

const DAY_HEADS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

/**
 * Dot-matrix training grid: a row per week, a dot per day sized by relative
 * load, plus load and change columns — the reference's "Training Summary".
 */
export function WeekGrid({ rows, accent = 'var(--text)' }: { rows: WeekRow[]; accent?: string }) {
  return (
    <div>
      {/* Header */}
      <div>
        <span />
        <div>
          {DAY_HEADS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <span>Load</span>
        <span>Change</span>
      </div>

      {rows.map(row => (
        <div key={row.label}>
          <span>{row.label}</span>
          <div>
            {row.days.map((intensity, i) => (
              <div key={i}>
                {intensity> 0 ? (
                  <span style={{
                      width: 8 + intensity * 12,
                      height: 8 + intensity * 12,
                      opacity: 0.35 + intensity * 0.65}} />
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>
          <span>{row.load}</span>
          <span>
            {row.change ?? '—'}
          </span>
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
    <div>
      {options.map(opt => {
        const active = opt === value
        return (
          <button key={opt}
            onClick={() => onChange(opt)}>
            {opt}
          </button>
        )
      })}
    </div>
  )
}
