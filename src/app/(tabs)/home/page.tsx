'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCalendarStore } from '@/stores/calendar-store'
import { useProgrammeStore } from '@/stores/programme-store'
import type { CalendarEventData, Programme } from '@/types'
import { localDateStr } from '@/lib/date'

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const CARDIO_TYPES = new Set(['run', 'swim', 'cycle', 'walk', 'row'])

const card: React.CSSProperties = {
  background: 'rgba(17, 17, 17, 0.03)',
  border: '1px solid rgba(17, 17, 17, 0.08)',
  borderRadius: '12px',
}

const label10: React.CSSProperties = {
  fontFamily: 'var(--font-geist-sans)',
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  lineHeight: '13px',
  color: 'rgba(17,17,17,0.4)',
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

function getDurationRange(ev: CalendarEventData, programmes: Programme[]): string | null {
  if (ev.eventType === 'strength' && ev.workoutTemplateId && ev.programmeId) {
    const template = programmes
      .find(p => p.id === ev.programmeId)
      ?.templates.find(t => t.id === ev.workoutTemplateId)
    if (template && template.exerciseBlocks.length > 0) {
      const totalSets = template.exerciseBlocks.reduce((s, b) => s + b.targetSets, 0)
      const estMin = totalSets * 3
      const lo = Math.max(15, Math.round(estMin * 0.85 / 5) * 5)
      const hi = Math.round(estMin * 1.15 / 5) * 5
      return `${lo}M–${hi}M`
    }
  }
  if (ev.durationMinutes) return `${ev.durationMinutes}M`
  return null
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

  function getTemplateName(templateId: string | null, programmeId: string | null) {
    if (!templateId || !programmeId) return null
    return programmes.find(p => p.id === programmeId)?.templates.find(t => t.id === templateId)?.name ?? null
  }

  function sessionDisplayLabel(eventType: string): string {
    if (eventType === 'strength') return 'Strength'
    if (CARDIO_TYPES.has(eventType)) return 'Cardio'
    return eventType.charAt(0).toUpperCase() + eventType.slice(1)
  }

  const sessionLabel = selectedDate === today
    ? "Today's Sessions"
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px 0', flexShrink: 0 }}>
        <svg width="110" height="14" viewBox="0 0 110 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0H3.72574V5.36375H12.7126V0H16.4208V14H12.7126V8.63625H3.72574V14H0V0Z" fill="#111111"/>
          <path d="M25.2409 9.31875L17.8655 0H22.5095L27.098 6.04917L31.6835 0H36.307L28.9491 9.31875V14H25.2409V9.31875Z" fill="#111111"/>
          <path d="M37.74 0H48.0019C51.3708 0 52.5143 1.42917 52.5143 3.4475C52.5143 5.0925 51.5785 6.16875 50.1747 6.69667C51.8592 7.12833 53.2629 8.08792 53.2629 10.1617C53.2629 12.4512 51.9352 14 48.7885 14H37.7429V0H37.74ZM46.8584 5.775C47.9258 5.775 48.7856 5.55917 48.7856 4.2875C48.7856 3.09458 48.0545 2.83792 46.8584 2.83792H41.4657V5.775H46.8584ZM47.6071 11.1621C48.6745 11.1621 49.4056 10.9083 49.4056 9.65417C49.4056 8.4 48.5429 8.18417 47.6071 8.18417H41.4657V11.1592H47.6071V11.1621Z" fill="#111111"/>
          <path d="M55.3657 0H66.037C69.6692 0 71.4297 1.44958 71.4297 4.19125C71.4297 6.11042 70.4383 7.36167 68.6222 7.91C70.3067 8.00917 71.3917 9.02708 71.3917 10.71V14H67.6659V11.3371C67.6659 10.0654 67.2536 9.63375 66.037 9.63375H59.0915V14H55.3657V0ZM65.1772 6.50125C66.657 6.50125 67.5548 6.11042 67.5548 4.79792C67.5548 3.48542 66.657 3.1325 65.1772 3.1325H59.0915V6.50125H65.1772Z" fill="#111111"/>
          <path d="M73.9478 0H77.6735V14H73.9478V0Z" fill="#111111"/>
          <path d="M80.1592 0H89.4267C93.3777 0 96.2407 2.9575 96.2407 6.99125C96.2407 11.025 93.3777 14 89.4267 14H80.1592V0ZM87.9294 10.71C90.8129 10.71 92.3863 9.35958 92.3863 6.98833C92.3863 4.61708 90.8129 3.28708 87.9294 3.28708H83.8849V10.7071H87.9294V10.71Z" fill="#111111"/>
          <path d="M109.108 5.60016H105.833V2.3335H103.025V5.60016H99.75V8.40016H103.025V11.6668H105.833V8.40016H109.108V5.60016Z" fill="#3B948F"/>
        </svg>
      </div>

      {/* Scrollable content */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ── Calendar ── */}
          <div style={{ ...card, padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Days row */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', width: '32px', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <span style={{
                      fontFamily: 'var(--font-geist-sans)', fontSize: '10px', fontWeight: 500,
                      lineHeight: '13px', textAlign: 'center', width: '32px',
                      color: '#111111', opacity: (isToday || isSelected) ? 1 : 0.35,
                    }}>{DAY_LABELS[i]}</span>

                    <div style={{
                      width: '32px', height: '32px', borderRadius: '40px',
                      background: isSelected ? '#3B948F' : (isToday ? 'rgba(59,148,143,0.12)' : 'transparent'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-geist-sans)', fontSize: '12px', fontWeight: 600, lineHeight: '16px',
                        color: isSelected ? '#FFFDF5' : '#111111',
                      }}>{d.getDate()}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', height: '6px', alignItems: 'center' }}>
                      {hasStrength && <span style={{ width: '6px', height: '6px', borderRadius: '200px', background: '#3B948F', display: 'block' }} />}
                      {hasCardio   && <span style={{ width: '6px', height: '6px', borderRadius: '200px', background: '#111111', display: 'block' }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ height: '1px', background: 'rgba(17, 17, 17, 0.08)' }} />

            {/* Plan info row */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                {activePhase && (
                  <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#FFFDF5', background: '#3B948F', padding: '4px 10px', borderRadius: '200px', display: 'inline-flex', alignItems: 'center' }}>
                    {activePhase.name}
                  </span>
                )}
                {activeProgramme && (
                  <span style={{ ...label10, color: '#111111', opacity: 0.6 }}>{activeProgramme.name}</span>
                )}
              </div>
              {weekNumber !== null && (
                <span style={{ ...label10 }}>Week {weekNumber}</span>
              )}
            </div>
          </div>

          {/* ── Sessions ── */}
          <div style={{ marginTop: '8px' }}>
            <p style={{ ...label10, marginBottom: '12px' }}>{sessionLabel}</p>

            {selectedEvents.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', color: 'rgba(17,17,17,0.4)' }}>
                No sessions planned
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedEvents.map(ev => {
                  const isStrength = ev.eventType === 'strength'
                  const isCardio = CARDIO_TYPES.has(ev.eventType)
                  const accentColor = isStrength ? '#3B948F' : isCardio ? '#111111' : 'rgba(17,17,17,0.15)'
                  const pillTextColor = isStrength ? '#FFFDF5' : isCardio ? '#FFFEFA' : '#111111'
                  const templateName = getTemplateName(ev.workoutTemplateId, ev.programmeId)
                  const duration     = getDurationRange(ev, programmes)
                  return (
                    <div key={ev.id} style={{ ...card, padding: '12px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', position: 'relative', overflow: 'hidden', minHeight: '68px' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', background: accentColor }} />
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: '13px', color: pillTextColor, background: accentColor, padding: '4px 10px', borderRadius: '200px', display: 'inline-flex', alignItems: 'center' }}>
                          {sessionDisplayLabel(ev.eventType)}
                        </span>
                        {duration && <span style={{ ...label10 }}>{duration}</span>}
                      </div>
                      <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '16px', fontWeight: 600, lineHeight: '20px', color: '#111111', display: 'block' }}>
                        {templateName ?? ev.name ?? sessionDisplayLabel(ev.eventType)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div style={{ height: '8px' }} />
        </div>
      </div>

      {/* ── Start Workout — sits above floating nav pill ── */}
      <div style={{ padding: '0 16px', paddingBottom: 'max(calc(env(safe-area-inset-bottom) + 80px), 80px)', flexShrink: 0 }}>
        <button
          onClick={() => router.push('/session')}
          style={{
            width: '100%', height: '48px',
            background: '#3B948F', borderRadius: '40px', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-geist-sans)', fontSize: '16px', fontWeight: 600, color: '#FFFDF5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          Start Workout
        </button>
      </div>
    </div>
  )
}
