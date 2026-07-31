'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useCalendarStore } from '@/stores/calendar-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'
import type { CalendarEventData, Programme } from '@/types'
import { localDateStr } from '@/lib/date'

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const CARDIO_TYPES = new Set(['run', 'swim', 'cycle', 'walk', 'row'])

const CARDIO_LABELS: Record<string, string> = {
  run: 'Run', swim: 'Swim', cycle: 'Cycle', walk: 'Walk', row: 'Row',
}

const metaText: React.CSSProperties = {
  fontFamily: 'var(--font-geist-sans)',
  fontSize: '11px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  color: 'rgba(17,17,17,0.4)',
  lineHeight: '14px',
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
      const est = totalSets * 3
      const lo = Math.max(15, Math.round(est * 0.85 / 5) * 5)
      const hi = Math.round(est * 1.15 / 5) * 5
      return lo === hi ? `${lo} Mins` : `${lo} – ${hi} Mins`
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

export default function HomePage() {
  const router = useRouter()
  const today = isoDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)

  const { events } = useCalendarStore()
  const { programmes } = useProgrammeStore()

  const weekDays = getWeekDays()

  const activeProgramme = programmes.find(p => p.isActive) ?? programmes[0] ?? null
  const activePhase = activeProgramme?.phases.find(ph => ph.isActive) ?? activeProgramme?.phases[0] ?? null

  const weekNumber = activeProgramme?.startDate
    ? Math.max(1, Math.floor((Date.now() - new Date(activeProgramme.startDate + 'T00:00:00').getTime()) / (7 * 86400000)) + 1)
    : null

  const selectedEvents = events[selectedDate] ?? []

  function getTemplateName(ev: CalendarEventData): string {
    if (!ev.workoutTemplateId || !ev.programmeId) return ev.name ?? sessionLabel
    return programmes.find(p => p.id === ev.programmeId)?.templates.find(t => t.id === ev.workoutTemplateId)?.name
      ?? ev.name
      ?? sessionLabel
  }

  function sessionTypeName(eventType: string): string {
    if (eventType === 'strength') return 'Strength'
    if (CARDIO_TYPES.has(eventType)) return 'Cardio'
    return eventType.charAt(0).toUpperCase() + eventType.slice(1)
  }

  const sessionLabel = selectedDate === today
    ? "Today's sessions"
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>

      {/* ── Logo ── */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '28px 0', flexShrink: 0 }}>
        <svg width="141" height="18" viewBox="0 0 110 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0H3.72574V5.36375H12.7126V0H16.4208V14H12.7126V8.63625H3.72574V14H0V0Z" fill="#111111"/>
          <path d="M25.2409 9.31875L17.8655 0H22.5095L27.098 6.04917L31.6835 0H36.307L28.9491 9.31875V14H25.2409V9.31875Z" fill="#111111"/>
          <path d="M37.74 0H48.0019C51.3708 0 52.5143 1.42917 52.5143 3.4475C52.5143 5.0925 51.5785 6.16875 50.1747 6.69667C51.8592 7.12833 53.2629 8.08792 53.2629 10.1617C53.2629 12.4512 51.9352 14 48.7885 14H37.7429V0H37.74ZM46.8584 5.775C47.9258 5.775 48.7856 5.55917 48.7856 4.2875C48.7856 3.09458 48.0545 2.83792 46.8584 2.83792H41.4657V5.775H46.8584ZM47.6071 11.1621C48.6745 11.1621 49.4056 10.9083 49.4056 9.65417C49.4056 8.4 48.5429 8.18417 47.6071 8.18417H41.4657V11.1592H47.6071V11.1621Z" fill="#111111"/>
          <path d="M55.3657 0H66.037C69.6692 0 71.4297 1.44958 71.4297 4.19125C71.4297 6.11042 70.4383 7.36167 68.6222 7.91C70.3067 8.00917 71.3917 9.02708 71.3917 10.71V14H67.6659V11.3371C67.6659 10.0654 67.2536 9.63375 66.037 9.63375H59.0915V14H55.3657V0ZM65.1772 6.50125C66.657 6.50125 67.5548 6.11042 67.5548 4.79792C67.5548 3.48542 66.657 3.1325 65.1772 3.1325H59.0915V6.50125H65.1772Z" fill="#111111"/>
          <path d="M73.9478 0H77.6735V14H73.9478V0Z" fill="#111111"/>
          <path d="M80.1592 0H89.4267C93.3777 0 96.2407 2.9575 96.2407 6.99125C96.2407 11.025 93.3777 14 89.4267 14H80.1592V0ZM87.9294 10.71C90.8129 10.71 92.3863 9.35958 92.3863 6.98833C92.3863 4.61708 90.8129 3.28708 87.9294 3.28708H83.8849V10.7071H87.9294V10.71Z" fill="#111111"/>
          <path d="M109.108 5.60016H105.833V2.3335H103.025V5.60016H99.75V8.40016H103.025V11.6668H105.833V8.40016H109.108V5.60016Z" fill="#3B948F"/>
        </svg>
      </div>

      {/* ── Scrollable content ── */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>

          {/* ── Calendar (no card bg — transparent, on white page) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Days row */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              {weekDays.map((d, i) => {
                const ds         = isoDate(d)
                const isToday    = ds === today
                const isSelected = ds === selectedDate
                const dayEvs     = events[ds] ?? []
                const hasStrength = dayEvs.some(e => e.eventType === 'strength')
                const hasCardio   = dayEvs.some(e => CARDIO_TYPES.has(e.eventType))
                return (
                  <button
                    key={ds}
                    onClick={() => setSelectedDate(ds)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: 0, cursor: 'pointer', flex: 1 }}
                  >
                    {/* Day label */}
                    <span style={{
                      fontFamily: 'var(--font-geist-sans)', fontSize: '11px', fontWeight: 500,
                      textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '14px',
                      textAlign: 'center', color: '#111111',
                      opacity: (isToday || isSelected) ? 1 : 0.4,
                    }}>{DAY_LABELS[i]}</span>

                    {/* Day circle */}
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '40px',
                      background: isSelected
                        ? '#3B948F'
                        : isToday ? 'rgba(59,148,143,0.10)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-geist-sans)', fontSize: '16px', fontWeight: 500, lineHeight: '24px',
                        color: isSelected ? '#FFFDF5' : '#111111',
                      }}>{d.getDate()}</span>
                    </div>

                    {/* Activity dots */}
                    <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', height: '6px', alignItems: 'center' }}>
                      {hasStrength && <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#3B948F', display: 'block' }} />}
                      {hasCardio   && <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#111111', display: 'block' }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Divider */}
            <div style={{ height: '1px', background: 'rgba(17,17,17,0.08)' }} />

            {/* Plan info row */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                {activePhase && (
                  <span style={{
                    fontFamily: 'var(--font-geist-sans)', fontSize: '11px', fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '14px',
                    color: '#FFFDF5', background: '#3B948F',
                    padding: '4px 12px', borderRadius: '200px', display: 'inline-flex', alignItems: 'center',
                  }}>
                    {activePhase.name}
                  </span>
                )}
                {activeProgramme && (
                  <span style={{
                    fontFamily: 'var(--font-geist-sans)', fontSize: '11px', fontWeight: 500,
                    textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '14px',
                    color: '#111111',
                  }}>{activeProgramme.name}</span>
                )}
              </div>
              {weekNumber !== null && (
                <span style={{
                  fontFamily: 'var(--font-geist-sans)', fontSize: '11px', fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '14px',
                  color: '#3B948F',
                }}>Week {weekNumber}</span>
              )}
            </div>
          </div>

          {/* ── Sessions header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '24px', marginBottom: '16px' }}>
            <span style={{
              fontFamily: 'var(--font-geist-sans)', fontSize: '18px', fontWeight: 500,
              lineHeight: '24px', color: '#111111',
            }}>
              {sessionLabel}
            </span>
            <button
              onClick={() => router.push('/calendar')}
              style={{
                fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 500,
                lineHeight: '18px', color: '#111111', textDecoration: 'underline',
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              }}
            >
              View schedule
            </button>
          </div>

          {/* ── Session cards ── */}
          {selectedEvents.length === 0 ? (
            <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', color: 'rgba(17,17,17,0.4)', margin: 0 }}>
              No sessions planned
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedEvents.map(ev => {
                const isStrength     = ev.eventType === 'strength'
                const isCardio       = CARDIO_TYPES.has(ev.eventType)
                const badgeBg        = isStrength ? '#3B948F' : '#111111'
                const name           = getTemplateName(ev)
                const duration       = getDuration(ev, programmes)
                const exerciseCount  = getExerciseCount(ev, programmes)
                const muscleTags     = getMuscleGroups(ev, programmes)
                const cardioTag      = isCardio ? (CARDIO_LABELS[ev.eventType] ?? null) : null

                return (
                  <div
                    key={ev.id}
                    style={{
                      background: 'rgba(17,17,17,0.03)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      display: 'flex', flexDirection: 'column', gap: '16px',
                    }}
                  >
                    {/* Name + tags group */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {/* Session name */}
                      <span style={{
                        fontFamily: 'var(--font-geist-sans)', fontSize: '16px', fontWeight: 500,
                        lineHeight: '24px', color: '#111111',
                      }}>
                        {name}
                      </span>

                      {/* Tags row */}
                      <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '4px' }}>
                        {/* Type badge */}
                        <span style={{
                          fontFamily: 'var(--font-geist-sans)', fontSize: '11px', fontWeight: 500,
                          textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '14px',
                          color: '#FFFDF5', background: badgeBg,
                          padding: '4px 12px', borderRadius: '200px', display: 'inline-flex', alignItems: 'center',
                        }}>
                          {sessionTypeName(ev.eventType)}
                        </span>

                        {/* Cardio discipline tag */}
                        {cardioTag && (
                          <span style={{
                            fontFamily: 'var(--font-geist-sans)', fontSize: '11px', fontWeight: 500,
                            textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '14px',
                            color: '#3B948F', background: 'rgba(17,17,17,0.05)',
                            padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center',
                          }}>
                            {cardioTag}
                          </span>
                        )}

                        {/* Muscle group tags */}
                        {muscleTags.map(tag => (
                          <span key={tag} style={{
                            fontFamily: 'var(--font-geist-sans)', fontSize: '11px', fontWeight: 500,
                            textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '14px',
                            color: '#3B948F', background: 'rgba(17,17,17,0.05)',
                            padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Meta row */}
                    {(duration || exerciseCount) && (
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
                        {duration && (
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                            <Image src="/icon-clock.svg" alt="" width={12} height={12} />
                            <span style={metaText}>{duration}</span>
                          </div>
                        )}
                        {exerciseCount !== null && (
                          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                            <Image src="/icon-exercise.svg" alt="" width={12} height={12} />
                            <span style={metaText}>{exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ height: '8px' }} />
        </div>
      </div>

      {/* ── Start Workout — sits above floating nav pill ── */}
      <div style={{ padding: '12px 16px', paddingBottom: '88px', flexShrink: 0 }}>
        <button
          onClick={() => router.push('/session')}
          style={{
            width: '100%', height: '48px',
            background: '#3B948F', borderRadius: '40px', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          }}
        >
          <Image src="/icon-play.svg" alt="" width={24} height={24} />
          <span style={{
            fontFamily: 'var(--font-geist-sans)', fontSize: '16px', fontWeight: 500,
            lineHeight: '24px', color: '#FFFEFA',
          }}>Start workout</span>
        </button>
      </div>
    </div>
  )
}
