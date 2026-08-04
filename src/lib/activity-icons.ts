import type { CalendarEventType, ActivityType } from '@/types'

/** Single source of truth for activity/session-type emoji across the app. */
export const ACTIVITY_ICONS: Record<CalendarEventType, string> = {
  strength: '🏋️',
  run: '🏃',
  swim: '🏊',
  cycle: '🚴',
  walk: '🚶',
  row: '🚣',
  rest: '😴',
  other: '📅',
}

export const CARDIO_ICONS: Record<ActivityType, string> = {
  run: ACTIVITY_ICONS.run,
  swim: ACTIVITY_ICONS.swim,
  cycle: ACTIVITY_ICONS.cycle,
  walk: ACTIVITY_ICONS.walk,
  row: ACTIVITY_ICONS.row,
}
