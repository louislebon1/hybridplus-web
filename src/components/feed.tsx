'use client'

import type { ReactNode } from 'react'

/**
 * The pager. One child fills the viewport; navigation is a hard vertical snap
 * with no partial scroll position.
 */
export function Pager({ children }: { children: ReactNode }) {
  return <div className="pager">{children}</div>
}

/**
 * One complete state, owning the entire viewport.
 *
 * `field` is the full-bleed subject. This product has no imagery and may not
 * invent any, so the subject is the athlete's own data drawn large — a plot, a
 * bar field, a figure. The scrim and grain sit above it, the content above them.
 */
export function Page({ field, children }: { field?: ReactNode; children: ReactNode }) {
  return (
    <section className="page">
      {field && <div className="absolute inset-0 z-0">{field}</div>}
      <div className="scrim z-10" />
      <div className="grain z-10" />
      <div className="relative z-20 h-full flex flex-col">{children}</div>
    </section>
  )
}

/**
 * The right-hand rail: the only chrome on the surface. Glyph over count, thumb
 * height, stacked. An engaged action fills.
 */
export function Rail({ children }: { children: ReactNode }) {
  return (
    <div className="absolute right-3 top-1/3 z-30 flex flex-col items-center gap-6">
      {children}
    </div>
  )
}

export function RailAction({
  icon,
  label,
  count,
  engaged = false,
  onClick,
  disabled,
}: {
  icon: ReactNode
  label: string
  count?: string
  engaged?: boolean
  onClick?: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex flex-col items-center gap-1.5 bg-transparent border-0 p-0 cursor-pointer disabled:opacity-30 disabled:cursor-default"
    >
      <span
        className={[
          'w-12 h-12 rounded-pill flex items-center justify-center transition-transform duration-150 ease-out active:scale-90',
          engaged ? 'bg-scrim text-void' : 'text-scrim',
        ].join(' ')}
      >
        {icon}
      </span>
      {count !== undefined && (
        <span className="meta text-scrim tabular">{count}</span>
      )}
    </button>
  )
}

/**
 * Lower-left content block — the world's caption position. Everything the
 * athlete reads sits here, beneath the figure it belongs to.
 */
export function Caption({ children }: { children: ReactNode }) {
  return <div className="mt-auto px-5 pb-28 max-w-[78%]">{children}</div>
}

/** Snap affordance, lower-right, matching the source's SCROLL FOR NEXT. */
export function SnapHint({ label = 'Next' }: { label?: string }) {
  return (
    <div className="absolute right-4 bottom-8 z-30 flex items-center gap-2 pointer-events-none">
      <span className="meta">{label}</span>
      <span className="w-5 h-8 rounded-pill border border-stone/60 flex items-start justify-center pt-1.5">
        <span className="w-1 h-1 rounded-pill bg-stone block" />
      </span>
    </div>
  )
}

/**
 * The full-bleed subject for a set-based item: the athlete's real logged volume
 * per set, drawn as a bar field across the whole viewport. Empty history draws
 * nothing — an empty field is the honest state, not a seeded one.
 */
export function LoadField({ values }: { values: number[] }) {
  if (values.length === 0) return null
  const max = Math.max(...values)
  return (
    <div className="absolute inset-0 flex items-end gap-[3px] px-2 pb-0" aria-hidden>
      {values.map((v, i) => (
        <div
          key={i}
          className="flex-1 bg-steel"
          style={{ height: `${max > 0 ? Math.max(4, (v / max) * 62) : 4}%` }}
        />
      ))}
    </div>
  )
}
