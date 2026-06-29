/** Returns the local date as YYYY-MM-DD. Never use toISOString() for date-only
 *  strings — that returns UTC and will be off by one day in UTC+ timezones. */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
