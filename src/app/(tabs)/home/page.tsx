'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Play, CalendarDays } from 'lucide-react'
import { useCalendarStore } from '@/stores/calendar-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { useSessionStore } from '@/stores/session-store'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'
import type { CalendarEventData, Programme } from '@/types'
import { localDateStr } from '@/lib/date'
import { estimateDuration } from '@/lib/duration'
import { ActivityIcon } from '@/lib/activity-icons'
import { Pager, Page, Rail, RailAction, Caption, SnapHint, LoadField } from '@/components/feed'

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
    <Pager>

      {/* ── Item 1: today ─────────────────────────────────────────────────── */}
      <Page field={<LoadField values={weekDays.map(d => (events[isoDate(d)] ?? []).length)} />}>
        <header className="flex items-start justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
          <span className="display text-title">Hybrid<span className="text-fog">+</span></span>
          <Link
            href="/profile"
            aria-label="Profile"
            className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim"
          >
            <User size={18} />
          </Link>
        </header>

        <Rail>
          <RailAction icon={<CalendarDays size={22} />} label="Schedule" onClick={() => router.push('/calendar')} />
        </Rail>

        <Caption>
          <p className="meta">{todayLabel}</p>

          {weekPct !== null && (
            <p className="display text-hero tabular m-0 mt-3 flex items-start">
              {weekPct}
              <span className="text-title mt-3 ml-1 text-fog">%</span>
            </p>
          )}

          <h1 className="display text-display m-0 mt-3">{read.title}</h1>
          <p className="text-label text-stone m-0 mt-2 max-w-[46ch]">{read.copy}</p>

          <p className="meta mt-4">
            {activeProgramme
              ? [activePhase ? activePhase.name : activeProgramme.name, activeProgramme.name]
                  .concat(weekNumber !== null ? ['Week ' + weekNumber] : [])
                  .join(' · ')
              : 'No active programme'}
          </p>

          {/* Week strip — navigation, kept compact so the figure stays dominant */}
          <div className="flex gap-1.5 mt-4">
            {weekDays.map((d, i) => {
              const ds = isoDate(d)
              const isToday = ds === today
              const isSelected = ds === selectedDate
              const dayEvs = events[ds] ?? []
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  aria-label={d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric' })}
                  aria-current={isToday ? 'date' : undefined}
                  className={[
                    'flex-1 h-14 rounded-card flex flex-col items-center justify-center gap-1 border transition-colors duration-150 cursor-pointer',
                    isSelected ? 'bg-scrim text-void border-transparent' : 'matt text-scrim',
                  ].join(' ')}
                >
                  <span className={isSelected ? 'meta text-void' : 'meta'}>{DAY_LABELS[i]}</span>
                  <span className="display text-label tabular leading-none">{d.getDate()}</span>
                  <span
                    className={[
                      'w-1 h-1 rounded-pill block',
                      dayEvs.length ? (isSelected ? 'bg-void' : 'bg-scrim') : 'bg-transparent',
                    ].join(' ')}
                  />
                </button>
              )
            })}
          </div>

          <button
            onClick={handleCtaClick}
            className="mt-5 h-14 px-7 rounded-pill bg-scrim text-void inline-flex items-center gap-2.5 border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <Play size={17} fill="currentColor" />
            <span className="display text-figure">{ctaLabel}</span>
          </button>
        </Caption>

        {selectedEvents.length > 0 && <SnapHint label={selectedEvents.length + ' planned'} />}
      </Page>

      {/* ── One item per planned session ──────────────────────────────────── */}
      {selectedEvents.map((ev, idx) => {
        const isStrength = ev.eventType === 'strength'
        const name = getTemplateName(ev)
        const duration = getDuration(ev, programmes)
        const exerciseCount = getExerciseCount(ev, programmes)
        const muscleTags = getMuscleGroups(ev, programmes)
        const cardioTag = CARDIO_TYPES.has(ev.eventType) ? (CARDIO_LABELS[ev.eventType] ?? null) : null
        const isStartable = isStrength && selectedDate === today && !ev.isCompleted && !activeSession
        const meta = [
          duration,
          exerciseCount !== null ? exerciseCount + (exerciseCount !== 1 ? ' exercises' : ' exercise') : null,
          cardioTag,
          ...muscleTags,
        ].filter(Boolean) as string[]

        return (
          <Page key={ev.id}>
            <header className="flex items-center justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
              <span className="meta">{sessionLabel}</span>
              <span className="meta tabular">
                {idx + 1} / {selectedEvents.length}
              </span>
            </header>

            <Rail>
              {isStartable && (
                <RailAction
                  icon={<Play size={22} fill="currentColor" />}
                  label={'Start ' + name}
                  engaged
                  onClick={() => startFromEvent(ev)}
                />
              )}
              <RailAction icon={<CalendarDays size={22} />} label="Schedule" onClick={() => router.push('/calendar')} />
            </Rail>

            <Caption>
              <span className="w-12 h-12 rounded-pill matt flex items-center justify-center text-scrim">
                <ActivityIcon type={ev.eventType} size={20} />
              </span>

              <h2 className="display text-display m-0 mt-4">{name}</h2>

              {meta.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {meta.map(m => (
                    <span key={m} className="meta px-3 py-1.5 rounded-pill matt text-stone">
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {ev.isCompleted ? (
                <p className="display text-figure m-0 mt-5">Completed</p>
              ) : isStartable ? (
                <button
                  onClick={() => startFromEvent(ev)}
                  className="mt-5 h-14 px-7 rounded-pill bg-scrim text-void inline-flex items-center gap-2.5 border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  <Play size={17} fill="currentColor" />
                  <span className="display text-figure">Start</span>
                </button>
              ) : (
                <p className="text-label text-stone m-0 mt-5">Scheduled — start it from the day it falls on.</p>
              )}
            </Caption>

            {idx < selectedEvents.length - 1 && <SnapHint />}
          </Page>
        )
      })}
    </Pager>
  )
}
