'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Play, ChevronRight } from 'lucide-react'
import { useCalendarStore } from '@/stores/calendar-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { useSessionStore } from '@/stores/session-store'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'
import type { CalendarEventData, Programme } from '@/types'
import { localDateStr } from '@/lib/date'
import { estimateDuration } from '@/lib/duration'
import { ActivityIcon } from '@/lib/activity-icons'
import { SectionLabel } from '@/components/dash'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const CARDIO_TYPES = new Set(['run', 'swim', 'cycle', 'walk', 'row'])

const CARDIO_LABELS: Record<string, string> = {
  run: 'Run', swim: 'Swim', cycle: 'Cycle', walk: 'Walk', row: 'Row',
}

const isoDate = localDateStr

function getWeekDays(): Date[] {
  const now = new Date()
  const diff = (now.getDay() + 6) % 7
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now)
    d.setDate(now.getDate() - diff + i)
    d.setHours(0, 0, 0, 0)
    return d
  })
}

function getTemplate(ev: CalendarEventData, programmes: Programme[]) {
  if (!ev.workoutTemplateId || !ev.programmeId) return null
  return programmes.find(p => p.id === ev.programmeId)?.templates.find(t => t.id === ev.workoutTemplateId) ?? null
}

function getDuration(ev: CalendarEventData, programmes: Programme[]): string | null {
  if (ev.eventType === 'strength') {
    const tmpl = getTemplate(ev, programmes)
    if (tmpl && tmpl.exerciseBlocks.length> 0) {
      const totalSets = tmpl.exerciseBlocks.reduce((s, b) => s + b.targetSets, 0)
      return estimateDuration(totalSets)
    }
  }
  if (ev.durationMinutes) return `${ev.durationMinutes} Mins`
  return null
}

function getMuscleGroups(ev: CalendarEventData, programmes: Programme[]): string[] {
  if (ev.eventType !== 'strength') return []
  const tmpl = getTemplate(ev, programmes)
  if (!tmpl) return []
  const seen = new Set<string>()
  for (const block of tmpl.exerciseBlocks) {
    const ex = EXERCISE_LIBRARY.find(e => e.id === block.exerciseId)
    if (ex) seen.add(ex.category)
  }
  return Array.from(seen).slice(0, 3).map(c => MUSCLE_GROUP_LABELS[c] ?? c)
}

function getExerciseCount(ev: CalendarEventData, programmes: Programme[]): number | null {
  if (ev.eventType !== 'strength') return null
  return getTemplate(ev, programmes)?.exerciseBlocks.length ?? null
}

/** Interpretation of the week-completion metric. */
function readWeek(pct: number | null, scheduled: number) {
  if (scheduled === 0) {
    return {
      title: 'Nothing Scheduled',
      copy: 'No sessions on your calendar this week. Add a programme or start a quick workout to begin tracking.',
    }
  }
  if (pct === 100) {
    return {
      title: 'Week Complete',
      copy: "Every session on this week's plan is done. Strong consistency — hold this rhythm into next week.",
    }
  }
  if ((pct ?? 0)>= 60) {
    return {
      title: 'On Track',
      copy: "You're through most of this week's plan. Keep the remaining sessions in place to finish clean.",
    }
  }
  if ((pct ?? 0)>= 30) {
    return {
      title: 'Building Momentum',
      copy: "You're partway through the week. A couple more sessions keeps this block on schedule.",
    }
  }
  if ((pct ?? 0)> 0) {
    return {
      title: 'Just Started',
      copy: "You've opened the week. Most of the plan is still ahead — pick the next session and get moving.",
    }
  }
  return {
    title: 'Not Started',
    copy: "This week's sessions are all still open. Start with the one scheduled for today.",
  }
}

export default function HomePage() {
  const router = useRouter()
  const today = isoDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)

  const { events } = useCalendarStore()
  const { programmes, getTemplateRefWithOverrides } = useProgrammeStore()
  const { activeSession, startSession } = useSessionStore()

  const weekDays = getWeekDays()

  const activeProgramme = programmes.find(p => !!p.startDate) ?? null
  const activePhase = activeProgramme?.phases.find(ph => ph.isActive) ?? activeProgramme?.phases[0] ?? null

  const weekNumber = activeProgramme?.startDate
    ? Math.max(1, Math.floor((Date.now() - new Date(activeProgramme.startDate + 'T00:00:00').getTime()) / (7 * 86400000)) + 1)
    : null

  const selectedEvents = events[selectedDate] ?? []

  function getTemplateName(ev: CalendarEventData): string {
    if (!ev.workoutTemplateId || !ev.programmeId) return ev.name ?? sessionTypeName(ev.eventType)
    return programmes.find(p => p.id === ev.programmeId)?.templates.find(t => t.id === ev.workoutTemplateId)?.name
      ?? ev.name
      ?? sessionTypeName(ev.eventType)
  }

  function sessionTypeName(eventType: string): string {
    if (eventType === 'strength') return 'Strength'
    if (CARDIO_TYPES.has(eventType)) return 'Cardio'
    return eventType.charAt(0).toUpperCase() + eventType.slice(1)
  }

  const sessionLabel = selectedDate === today
    ? "Today's sessions"
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

  // ── Smart Start: when today has exactly one thing left to do, name it and
  // (for strength) skip the picker entirely and jump straight into logging.
  const todayIncomplete = (events[today] ?? []).filter(ev => !ev.isCompleted)
  const smartTarget = !activeSession && todayIncomplete.length === 1 ? todayIncomplete[0] : null
  const smartIsStrength = !!smartTarget && smartTarget.eventType === 'strength' && !!smartTarget.workoutTemplateId && !!smartTarget.programmeId

  function startFromEvent(ev: CalendarEventData) {
    if (ev.eventType !== 'strength' || !ev.workoutTemplateId || !ev.programmeId) return
    const ref = getTemplateRefWithOverrides(ev.workoutTemplateId, ev.programmeId)
    if (!ref) return
    startSession(ref, getTemplateName(ev))
    router.push('/session')
  }

  const ctaLabel = smartTarget
    ? smartIsStrength
      ? `Start ${getTemplateName(smartTarget)}`
      : `Log ${CARDIO_LABELS[smartTarget.eventType] ?? sessionTypeName(smartTarget.eventType)}`
    : 'Start workout'

  function handleCtaClick() {
    if (smartTarget && smartIsStrength) {
      startFromEvent(smartTarget)
    } else {
      router.push('/session')
    }
  }

  // ── Hero metric: this week's plan completion, from existing calendar data ──
  const weekEvents = weekDays.flatMap(d => events[isoDate(d)] ?? [])
  const weekDone = weekEvents.filter(ev => ev.isCompleted).length
  const weekPct = weekEvents.length> 0 ? Math.round((weekDone / weekEvents.length) * 100) : null
  const read = readWeek(weekPct, weekEvents.length)

  const todayLabel = new Date(today + 'T00:00:00')
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div>

      <div>

        {/* ── Hero ── */}
        <div>
          <div>
            <div>
              <p>Today</p>
              <p>{todayLabel}</p>
            </div>
            <Link href="/profile"
              aria-label="Profile">
              <User size={18} />
            </Link>
          </div>

          {/* Focal metric — only when there's a plan to measure against */}
          {weekPct !== null && (
            <div>
              <span>{weekPct}</span>
              <span>%</span>
            </div>
          )}

          <h1>{read.title}</h1>
          <p>{read.copy}</p>

          {/* Plan status card */}
          <div>
            {activeProgramme ? (
              <>
                <div>
                  <p>
                    {activePhase ? activePhase.name : activeProgramme.name}
                  </p>
                  <p>
                    {activeProgramme.name}
                    {weekNumber !== null && ` · Week ${weekNumber}`}
                  </p>
                </div>
                <span>
                  Active
                </span>
              </>
            ) : (
              <>
                <p>No active programme</p>
                <button onClick={() => router.push('/programmes')}>
                  Set up
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Timeline strip ── */}
        <div>
          <SectionLabel>This week</SectionLabel>
          <div>
            {weekDays.map((d, i) => {
              const ds          = isoDate(d)
              const isToday     = ds === today
              const isSelected  = ds === selectedDate
              const dayEvs      = events[ds] ?? []
              const hasStrength = dayEvs.some(e => e.eventType === 'strength')
              const hasCardio   = dayEvs.some(e => CARDIO_TYPES.has(e.eventType))
              return (
                <button key={ds}
                  onClick={() => setSelectedDate(ds)}>
                  <span>
                    {DAY_LABELS[i]}
                  </span>
                  <div>
                    <span>
                      {d.getDate()}
                    </span>
                  </div>
                  <div>
                    {hasStrength && <span />}
                    {hasCardio   && <span />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Sessions ── */}
        <div>
          <SectionLabel action={
              <button onClick={() => router.push('/calendar')}>
                View schedule
              </button>
            }>
            {sessionLabel}
          </SectionLabel>

          <div>
            {selectedEvents.length === 0 ? (
              <div>
                <p>No sessions planned</p>
              </div>
            ) : (
              selectedEvents.map(ev => {
                const isStrength    = ev.eventType === 'strength'
                const name          = getTemplateName(ev)
                const duration      = getDuration(ev, programmes)
                const exerciseCount = getExerciseCount(ev, programmes)
                const muscleTags    = getMuscleGroups(ev, programmes)
                const cardioTag     = CARDIO_TYPES.has(ev.eventType) ? (CARDIO_LABELS[ev.eventType] ?? null) : null
                const isStartable   = isStrength && selectedDate === today && !ev.isCompleted && !activeSession
                const meta = [
                  duration,
                  exerciseCount !== null ? `${exerciseCount} exercise${exerciseCount !== 1 ? 's' : ''}` : null,
                  cardioTag,
                  ...muscleTags,
                ].filter(Boolean).join(' · ')

                const Wrapper = isStartable ? 'button' : 'div'

                return (
                  <Wrapper key={ev.id}
                    {...(isStartable ? { type: 'button' as const, onClick: () => startFromEvent(ev) } : {})}>
                    <span>
                      <ActivityIcon type={ev.eventType} size={18} />
                    </span>

                    <div>
                      <p>{name}</p>
                      {meta && <p>{meta}</p>}
                    </div>

                    {ev.isCompleted ? (
                      <span>
                        Done
                      </span>
                    ) : isStartable ? (
                      <ChevronRight size={16} />
                    ) : null}
                  </Wrapper>
                )
              })
            )}
          </div>
        </div>

        <div />
      </div>

      {/* ── Primary CTA — sits above the floating nav ── */}
      <div>
        <button onClick={handleCtaClick}>
          <Play size={18}  fill="currentColor" />
          <span>{ctaLabel}</span>
        </button>
      </div>
    </div>
  )
}
