'use client'

/**
 * Presentational primitives for the performance-dashboard look.
 * These render existing app data — they hold no state and fetch nothing.
 */

import type { ReactNode } from 'react'

// ── Atmospheric gradient hero ───────────────────────────────────────────────

/**
 * Large soft radial wash that emerges from behind a focal metric and fades
 * into black. Purely decorative; sits behind content and ignores pointers.
 */
export function HeroGlow({ color, className = '' }: { color: string; className?: string }) {
  // No clipping container and no black scrim: the radials fade to transparent
  // over the page's own black, which avoids any visible banding edge.
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 h-[460px] ${className}`}>
      {/* Vivid core, sitting just behind the focal metric */}
      <div
        className="absolute inset-x-0 -top-32 h-[440px]"
        style={{
          background: `radial-gradient(46% 44% at 28% 46%, ${color} 0%, ${color} 12%, transparent 70%)`,
          filter: 'blur(44px)',
        }}
      />
      {/* Wider secondary bloom for atmosphere */}
      <div
        className="absolute inset-x-0 -top-24 h-[460px]"
        style={{
          background: `radial-gradient(56% 46% at 72% 24%, ${color} 0%, transparent 72%)`,
          filter: 'blur(80px)',
          opacity: 0.5,
        }}
      />
    </div>
  )
}

// ── Labels ──────────────────────────────────────────────────────────────────

export function SectionLabel({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <p className="text-tag uppercase tracking-[0.08em] text-text-tertiary m-0">{children}</p>
      {action}
    </div>
  )
}

/** Small pill used for status words like FAIR / POOR / OPTIMAL. */
export function StatusPill({ label, color = 'var(--text-tertiary)' }: { label: string; color?: string }) {
  return (
    <span
      className="text-tag uppercase tracking-[0.06em] px-2 py-0.5 rounded inline-flex items-center"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 16%, transparent)` }}
    >
      {label}
    </span>
  )
}

// ── Cards ───────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = '',
  as: Tag = 'div',
  ...rest
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'button'
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`bg-bg-card border border-border rounded-[20px] ${className}`}
      {...rest}
    >
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
    <div className="flex-1 min-w-0 bg-bg-card border border-border rounded-[16px] px-3 py-3 flex flex-col gap-1">
      <p className="text-tag uppercase tracking-[0.06em] text-text-tertiary m-0 truncate">{label}</p>
      <p
        className="text-h2 font-medium tabular m-0 truncate"
        style={valueColor ? { color: valueColor } : undefined}
      >
        {value}
      </p>
      {caption && <p className="text-tag text-text-tertiary m-0 truncate">{caption}</p>}
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
    <div className="flex items-center gap-3">
      <span className="text-caption text-text-secondary w-[84px] flex-shrink-0 truncate">{zone.label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/[0.07] overflow-hidden min-w-0">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.max(zone.pct, 0)}%`, backgroundColor: zone.color }}
        />
      </div>
      <span className="text-caption text-text tabular w-9 text-right flex-shrink-0">{Math.round(zone.pct)}%</span>
      {zone.count !== undefined && (
        <span className="text-caption text-text-tertiary tabular w-8 text-right flex-shrink-0">{zone.count}</span>
      )}
    </div>
  )
}

/** Multi-segment bar — the stacked intensity strip from the reference. */
export function StackedBar({ zones, height = 10 }: { zones: ZoneDatum[]; height?: number }) {
  const total = zones.reduce((sum, z) => sum + z.pct, 0) || 1
  return (
    <div className="flex w-full rounded-full overflow-hidden gap-0.5" style={{ height }}>
      {zones.map(z => (
        <div
          key={z.label}
          style={{ width: `${(z.pct / total) * 100}%`, backgroundColor: z.color }}
          title={`${z.label} ${Math.round(z.pct)}%`}
        />
      ))}
    </div>
  )
}

/** Percentage triple above a stacked bar, as in "Training Focus". */
export function DistributionSummary({ zones }: { zones: ZoneDatum[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        {zones.map(z => (
          <div key={z.label} className="flex-1 min-w-0 flex flex-col gap-0.5">
            <span className="text-tag uppercase tracking-[0.06em] truncate" style={{ color: z.color }}>
              {z.label}
            </span>
            <span className="text-h3 font-medium text-text tabular">{Math.round(z.pct)}%</span>
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
  color = 'var(--accent)',
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
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
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
export function WeekGrid({ rows, accent = 'var(--accent)' }: { rows: WeekRow[]; accent?: string }) {
  return (
    <div className="flex flex-col gap-1">
      {/* Header */}
      <div className="flex items-center gap-2 pb-1">
        <span className="w-9 flex-shrink-0" />
        <div className="flex-1 grid grid-cols-7 gap-1">
          {DAY_HEADS.map((d, i) => (
            <span key={i} className="text-tag text-text-tertiary text-center">{d}</span>
          ))}
        </div>
        <span className="text-tag text-text-tertiary w-12 text-right flex-shrink-0">Load</span>
        <span className="text-tag text-text-tertiary w-12 text-right flex-shrink-0">Change</span>
      </div>

      {rows.map(row => (
        <div key={row.label} className="flex items-center gap-2">
          <span className="text-tag text-text-tertiary w-9 flex-shrink-0 tabular">{row.label}</span>
          <div className="flex-1 grid grid-cols-7 gap-1">
            {row.days.map((intensity, i) => (
              <div key={i} className="flex items-center justify-center h-7">
                {intensity > 0 ? (
                  <span
                    className="rounded-full block"
                    style={{
                      width: 8 + intensity * 12,
                      height: 8 + intensity * 12,
                      backgroundColor: accent,
                      opacity: 0.35 + intensity * 0.65,
                    }}
                  />
                ) : (
                  <span className="w-1 h-1 rounded-full bg-white/10 block" />
                )}
              </div>
            ))}
          </div>
          <span className="text-caption text-text tabular w-12 text-right flex-shrink-0">{row.load}</span>
          <span
            className="text-caption tabular w-12 text-right flex-shrink-0"
            style={{ color: row.change ? (row.changePositive ? 'var(--accent)' : 'var(--error)') : 'var(--text-tertiary)' }}
          >
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
    <div className="flex gap-2 flex-wrap">
      {options.map(opt => {
        const active = opt === value
        return (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={[
              'px-4 py-1.5 rounded-full text-caption font-medium capitalize outline-none',
              'transition-[background-color,color] duration-150 ease-out',
              'focus-visible:ring-2 focus-visible:ring-accent/50',
              active
                ? 'bg-accent text-accent-fg'
                : 'bg-bg-card border border-border text-text-secondary hover:bg-bg-hover',
            ].join(' ')}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}
