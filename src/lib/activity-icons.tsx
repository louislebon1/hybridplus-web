import { Dumbbell, Footprints, Waves, Bike, PersonStanding, Sailboat, Moon, Calendar } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CalendarEventType, ActivityType } from '@/types'

/**
 * Single source of truth for activity/session-type icons.
 *
 * These were emoji until the monochrome pass, where they became the only
 * colour left on most screens — and a system font's idea of a barbell is not
 * an icon system. Drawn marks at one stroke weight take colour from their
 * container, so an activity reads the same way the numerals do.
 */
export const ACTIVITY_ICONS: Record<CalendarEventType, LucideIcon> = {
  strength: Dumbbell,
  run: Footprints,
  swim: Waves,
  cycle: Bike,
  walk: PersonStanding,
  row: Sailboat,
  rest: Moon,
  other: Calendar,
}

export const CARDIO_ICONS: Record<ActivityType, LucideIcon> = {
  run: ACTIVITY_ICONS.run,
  swim: ACTIVITY_ICONS.swim,
  cycle: ACTIVITY_ICONS.cycle,
  walk: ACTIVITY_ICONS.walk,
  row: ACTIVITY_ICONS.row,
}

/** One stroke weight everywhere; colour is inherited from the container. */
export function ActivityIcon({
  type,
  size = 20,
}: {
  type: CalendarEventType | ActivityType
  size?: number
}) {
  const Icon = ACTIVITY_ICONS[type as CalendarEventType] ?? Calendar
  return <Icon size={size} strokeWidth={1.75}  aria-hidden />
}
