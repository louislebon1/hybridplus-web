/** Rough session length estimate from a set count — ~3 min/set ±15%. */
export function estimateDuration(totalSets: number): string {
  const est = totalSets * 3
  const lo = Math.max(15, Math.round(est * 0.85 / 5) * 5)
  const hi = Math.max(lo, Math.round(est * 1.15 / 5) * 5)
  return lo === hi ? `${lo} Mins` : `${lo} – ${hi} Mins`
}
