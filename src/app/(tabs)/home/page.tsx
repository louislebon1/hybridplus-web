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
import { ACTIVITY_ICONS } from '@/lib/activity-icons'
import { HeroGlow, SectionLabel } from '@/components/dash'

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
    if (tmpl && tmpl.exerciseBlocks.length > 0) {
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

/** Interpretation of the week-completion metric — copy + hero accent. */
function readWeek(pct: number | null, scheduled: number) {
  if (scheduled === 0) {
    return {
      title: 'Nothing Scheduled',
      copy: 'No sessions on your calendar this week. Add a programme or start a quick workout to begin tracking.',
      color: '#22D3EE',
    }
  }
  if (pct === 100) {
    return {
      title: 'Week Complete',
      copy: "Every session on this week's plan is done. Strong consistency — hold this rhythm into next week.",
      color: '#4ADE80',
    }
  }
  if ((pct ?? 0) >= 60) {
    return {
      title: 'On Track',
      copy: "You're through most of this week's plan. Keep the remaining sessions in place to finish clean.",
      color: '#4ADE80',
    }
  }
  if ((pct ?? 0) >= 30) {
    return {
      title: 'Building Momentum',
      copy: "You're partway through the week. A couple more sessions keeps this block on schedule.",
      color: '#FDE047',
    }
  }
  if ((pct ?? 0) > 0) {
    return {
      title: 'Just Started',
      copy: "You've opened the week. Most of the plan is still ahead — pick the next session and get moving.",
      color: '#FB923C',
    }
  }
  return {
    title: 'Not Started',
    copy: "This week's sessions are all still open. Start with the one scheduled for today.",
    color: '#FB923C',
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
  const weekPct = weekEvents.length > 0 ? Math.round((weekDone / weekEvents.length) * 100) : null
  const read = readWeek(weekPct, weekEvents.length)

  const todayLabel = new Date(today + 'T00:00:00')
    .toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="relative flex flex-col h-[100dvh] overflow-hidden">
      <HeroGlow color={read.color} />

      <div className="no-scrollbar relative flex-1 overflow-y-auto">

        {/* ── Hero ── */}
        <div className="px-5 pt-6 flex flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-h4 font-medium text-text m-0">Today</p>
              <p className="text-label text-white/70 m-0 mt-0.5">{todayLabel}</p>
            </div>
            <Link
              href="/profile"
              aria-label="Profile"
              className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 outline-none transition-colors duration-150 ease-out hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <User size={18} className="text-text" />
            </Link>
          </div>

          {/* Focal metric — only when there's a plan to measure against */}
          {weekPct !== null && (
            <div className="mt-8 flex items-start gap-1">
              <span className="text-metric font-medium text-text tabular">{weekPct}</span>
              <span className="text-h2 font-medium text-text mt-3">%</span>
            </div>
          )}

          <h1 className={`text-h2 font-medium text-text m-0 ${weekPct !== null ? 'mt-3' : 'mt-10'}`}>{read.title}</h1>
          <p className="text-label text-white/70 m-0 mt-2 max-w-[34ch]">{read.copy}</p>

          {/* Plan status card */}
          <div className="mt-6 bg-bg-card border border-border rounded-[16px] px-4 py-3.5 flex items-center justify-between gap-3">
            {activeProgramme ? (
              <>
                <div className="min-w-0">
                  <p className="text-label font-medium text-text m-0 truncate">
                    {activePhase ? activePhase.name : activeProgramme.name}
                  </p>
                  <p className="text-tag uppercase tracking-[0.06em] text-text-tertiary m-0 mt-1 truncate">
                    {activeProgramme.name}
                    {weekNumber !== null && ` · Week ${weekNumber}`}
                  </p>
                </div>
                <span className="text-tag uppercase tracking-[0.06em] text-accent-fg bg-accent px-2.5 py-1 rounded-full flex-shrink-0">
                  Active
                </span>
              </>
            ) : (
              <>
                <p className="text-label text-text-secondary m-0">No active programme</p>
                <button
                  onClick={() => router.push('/programmes')}
                  className="text-caption text-accent flex-shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded"
                >
                  Set up
                </button>
              </>
            )}
          </div>
        </div>

        {/* ── Timeline strip ── */}
        <div className="px-5 mt-7">
          <SectionLabel>This week</SectionLabel>
          <div className="mt-3 flex justify-between items-start gap-1">
            {weekDays.map((d, i) => {
              const ds          = isoDate(d)
              const isToday     = ds === today
              const isSelected  = ds === selectedDate
              const dayEvs      = events[ds] ?? []
              const hasStrength = dayEvs.some(e => e.eventType === 'strength')
              const hasCardio   = dayEvs.some(e => CARDIO_TYPES.has(e.eventType))
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds)}
                  className="flex flex-col items-center gap-2 flex-1 outline-none rounded-xl py-1 transition-colors duration-150 ease-out focus-visible:ring-2 focus-visible:ring-accent/50"
                >
                  <span className={`text-tag uppercase ${isToday || isSelected ? 'text-text' : 'text-text-tertiary'}`}>
                    {DAY_LABELS[i]}
                  </span>
                  <div className={[
                    'w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 ease-out',
                    isSelected ? 'bg-accent' : isToday ? 'bg-white/10 border border-white/20' : 'bg-white/[0.04]',
                  ].join(' ')}>
                    <span className={`text-label font-medium tabular ${isSelected ? 'text-accent-fg' : 'text-text'}`}>
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1.5 items-center">
                    {hasStrength && <span className="w-1.5 h-1.5 rounded-full bg-accent block" />}
                    {hasCardio   && <span className="w-1.5 h-1.5 rounded-full bg-zone-5 block" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Sessions ── */}
        <div className="px-5 mt-7">
          <SectionLabel
            action={
              <button
                onClick={() => router.push('/calendar')}
                className="text-caption text-accent outline-none rounded focus-visible:ring-2 focus-visible:ring-accent/50"
              >
                View schedule
              </button>
            }
          >
            {sessionLabel}
          </SectionLabel>

          <div className="mt-3 flex flex-col gap-2">
            {selectedEvents.length === 0 ? (
              <div className="bg-bg-card border border-border rounded-[16px] px-4 py-5">
                <p className="text-label text-text-tertiary m-0 text-center">No sessions planned</p>
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
                  <Wrapper
                    key={ev.id}
                    {...(isStartable ? { type: 'button' as const, onClick: () => startFromEvent(ev) } : {})}
                    className={[
                      'bg-bg-card border border-border rounded-[16px] px-3.5 py-3 flex items-center gap-3 w-full text-left',
                      isStartable
                        ? 'outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-bg-card-raised active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-accent/50'
                        : '',
                    ].join(' ')}
                  >
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-[18px] flex-shrink-0"
                      style={{ backgroundColor: isStrength ? 'rgba(74,222,128,0.14)' : 'rgba(34,211,238,0.14)' }}
                    >
                      {ACTIVITY_ICONS[ev.eventType] ?? '📅'}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="text-label font-medium text-text m-0 truncate">{name}</p>
                      {meta && <p className="text-tag text-text-tertiary m-0 mt-0.5 truncate">{meta}</p>}
                    </div>

                    {ev.isCompleted ? (
                      <span className="text-tag uppercase tracking-[0.06em] text-accent bg-accent/15 px-2 py-1 rounded flex-shrink-0">
                        Done
                      </span>
                    ) : isStartable ? (
                      <ChevronRight size={16} className="text-text-tertiary flex-shrink-0" />
                    ) : null}
                  </Wrapper>
                )
              })
            )}
          </div>
        </div>

        <div className="h-6" />
      </div>

      {/* ── Primary CTA — sits above the floating nav ── */}
      <div className="relative px-5 pt-3 pb-[92px] flex-shrink-0">
        <button
          onClick={handleCtaClick}
          className="w-full h-13 py-3.5 bg-accent rounded-full flex items-center justify-center gap-2 px-4 outline-none transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.98] active:opacity-80 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          <Play size={18} className="text-accent-fg flex-shrink-0" fill="currentColor" />
          <span className="text-body font-medium text-accent-fg truncate min-w-0">{ctaLabel}</span>
        </button>
      </div>
    </div>
  )
}
