'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame } from 'lucide-react'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { useCardioStore } from '@/stores/cardio-store'
import { useProgrammeStore } from '@/stores/programme-store'
import type { CalendarEventData, Programme } from '@/types'

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const DAY_SHORT  = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const CARDIO_TYPES = new Set(['run', 'swim', 'cycle', 'walk', 'row'])

const card: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.03)',
  borderRadius: '8px',
}

const mono8: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono)',
  fontSize: '8px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  lineHeight: '10px',
  color: 'rgba(255, 255, 255, 0.4)',
}

const mono10: React.CSSProperties = {
  fontFamily: 'var(--font-geist-mono)',
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  lineHeight: '13px',
  color: 'rgba(255, 255, 255, 0.4)',
}

function isoDate(d: Date) { return d.toISOString().split('T')[0] }

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
      return `${lo}M-${hi}M`
    }
  }
  if (ev.durationMinutes) return `${ev.durationMinutes}M`
  return null
}

function DayCheck({ done }: { done: boolean }) {
  const c = done ? '#00BD44' : 'rgba(255,255,255,0.2)'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.67" stroke={c} strokeWidth="1.33"/>
      <path d="M5.5 8.5L7 10.5L10.5 5.5" stroke={c} strokeWidth="1.33" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function HomePage() {
  const router = useRouter()
  const today = isoDate(new Date())
  const [selectedDate, setSelectedDate] = useState(today)

  const { sessions: strengthSessions } = useSessionHistoryStore()
  const { events } = useCalendarStore()
  const { sessions: cardioSessions } = useCardioStore()
  const { programmes } = useProgrammeStore()

  const weekDays = getWeekDays()
  const weekStart = weekDays[0]
  const weekEnd = new Date(weekDays[6]); weekEnd.setHours(23, 59, 59, 999)

  const activeProgramme = programmes.find(p => p.isActive) ?? programmes[0] ?? null
  const activePhase = activeProgramme?.phases.find(ph => ph.isActive) ?? null

  const weekNumber = activeProgramme?.startDate
    ? Math.max(1, Math.floor((Date.now() - new Date(activeProgramme.startDate + 'T00:00:00').getTime()) / (7 * 86400000)) + 1)
    : null

  const inWeek = (ds: string) => {
    const d = new Date(ds + 'T12:00:00')
    return d >= weekStart && d <= weekEnd
  }
  const weekStrength = strengthSessions.filter(s => inWeek(s.sessionDate))
  const weekCardio   = cardioSessions.filter(s => inWeek(s.sessionDate))
  const weekVolume   = weekStrength.reduce((a, s) => a + s.totalVolume, 0)
  const avgSession   = weekStrength.length > 0
    ? Math.round(weekStrength.reduce((a, s) => a + s.durationSeconds, 0) / weekStrength.length / 60)
    : 0

  const allDates = new Set([
    ...strengthSessions.map(s => s.sessionDate),
    ...cardioSessions.map(s => s.sessionDate),
  ])
  let streak = 0
  const cur = new Date(); cur.setHours(0, 0, 0, 0)
  while (allDates.has(isoDate(cur))) { streak++; cur.setDate(cur.getDate() - 1) }

  const dayHasSession = (d: Date) => {
    const ds = isoDate(d)
    return allDates.has(ds) || (events[ds] ?? []).some(e => e.isCompleted)
  }
  const completedThisWeek = weekDays.filter(dayHasSession).length

  const selectedEvents = events[selectedDate] ?? []

  function getTemplateName(templateId: string | null, programmeId: string | null) {
    if (!templateId || !programmeId) return null
    return programmes.find(p => p.id === programmeId)?.templates.find(t => t.id === templateId)?.name ?? null
  }

  const sessionLabel = selectedDate === today
    ? "Today's Sessions"
    : new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Logo */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '24px 0', flexShrink: 0 }}>
        <svg width="110" height="14" viewBox="0 0 110 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0H3.72574V5.36375H12.7126V0H16.4208V14H12.7126V8.63625H3.72574V14H0V0Z" fill="white"/>
          <path d="M25.2409 9.31875L17.8655 0H22.5095L27.098 6.04917L31.6835 0H36.307L28.9491 9.31875V14H25.2409V9.31875Z" fill="white"/>
          <path d="M37.74 0H48.0019C51.3708 0 52.5143 1.42917 52.5143 3.4475C52.5143 5.0925 51.5785 6.16875 50.1747 6.69667C51.8592 7.12833 53.2629 8.08792 53.2629 10.1617C53.2629 12.4512 51.9352 14 48.7885 14H37.7429V0H37.74ZM46.8584 5.775C47.9258 5.775 48.7856 5.55917 48.7856 4.2875C48.7856 3.09458 48.0545 2.83792 46.8584 2.83792H41.4657V5.775H46.8584ZM47.6071 11.1621C48.6745 11.1621 49.4056 10.9083 49.4056 9.65417C49.4056 8.4 48.5429 8.18417 47.6071 8.18417H41.4657V11.1592H47.6071V11.1621Z" fill="white"/>
          <path d="M55.3657 0H66.037C69.6692 0 71.4297 1.44958 71.4297 4.19125C71.4297 6.11042 70.4383 7.36167 68.6222 7.91C70.3067 8.00917 71.3917 9.02708 71.3917 10.71V14H67.6659V11.3371C67.6659 10.0654 67.2536 9.63375 66.037 9.63375H59.0915V14H55.3657V0ZM65.1772 6.50125C66.657 6.50125 67.5548 6.11042 67.5548 4.79792C67.5548 3.48542 66.657 3.1325 65.1772 3.1325H59.0915V6.50125H65.1772Z" fill="white"/>
          <path d="M73.9478 0H77.6735V14H73.9478V0Z" fill="white"/>
          <path d="M80.1592 0H89.4267C93.3777 0 96.2407 2.9575 96.2407 6.99125C96.2407 11.025 93.3777 14 89.4267 14H80.1592V0ZM87.9294 10.71C90.8129 10.71 92.3863 9.35958 92.3863 6.98833C92.3863 4.61708 90.8129 3.28708 87.9294 3.28708H83.8849V10.7071H87.9294V10.71Z" fill="white"/>
          <path d="M109.108 5.60016H105.833V2.3335H103.025V5.60016H99.75V8.40016H103.025V11.6668H105.833V8.40016H109.108V5.60016Z" fill="#00BD44"/>
        </svg>
      </div>

      {/* Scrollable content */}
      <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '0 16px 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ── Calendar ── */}
          <div style={{ ...card, padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {/* Days row — 7 × 32px + 6 × 16px gap = 320px content */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '16px' }}>
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
                      color: '#FFFFFF', opacity: (isToday || isSelected) ? 1 : 0.4,
                    }}>{DAY_LABELS[i]}</span>

                    <div style={{
                      width: '32px', height: '32px', borderRadius: '40px',
                      background: isSelected ? '#00BD44' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{
                        fontFamily: 'var(--font-geist-sans)', fontSize: '12px', fontWeight: 600, lineHeight: '16px',
                        color: isSelected ? '#0A0A0A' : '#FFFFFF',
                      }}>{d.getDate()}</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'row', gap: '2px', height: '6px', alignItems: 'center' }}>
                      {hasStrength && <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#00BD44', display: 'block' }} />}
                      {hasCardio   && <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: '#FFFFFF', display: 'block' }} />}
                    </div>
                  </button>
                )
              })}
            </div>

            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)' }} />

            {/* Plan info row */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                {activePhase && (
                  <span style={{ ...mono8, color: '#0A0A0A', background: '#00BD44', padding: '4px 10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center' }}>
                    {activePhase.name}
                  </span>
                )}
                {activeProgramme && (
                  <span style={{ ...mono8, color: '#FFFFFF' }}>{activeProgramme.name}</span>
                )}
              </div>
              {weekNumber !== null && (
                <span style={{ ...mono8 }}>Week {weekNumber}</span>
              )}
            </div>
          </div>

          {/* ── Streak ── */}
          <div style={{ ...card, padding: '12px', display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', height: '84px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '72px', flexShrink: 0 }}>
              <Flame size={24} style={{ color: '#00BD44' }} />
              <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 600, lineHeight: '18px', color: '#FFFFFF' }}>
                {streak} Day
              </span>
              <span style={{ ...mono8, textAlign: 'center' }}>Workout Streak</span>
            </div>

            <div style={{ width: '1px', alignSelf: 'stretch', background: 'rgba(255, 255, 255, 0.06)', flexShrink: 0 }} />

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ position: 'relative', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${Math.round((completedThisWeek / 7) * 100)}%`,
                  background: '#00BD44', borderRadius: '4px',
                }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {weekDays.map((d, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '24px' }}>
                    <DayCheck done={dayHasSession(d)} />
                    <span style={{ ...mono8 }}>{DAY_SHORT[i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── This Week ── */}
          <div style={{ marginTop: '8px' }}>
            <p style={{ ...mono10, marginBottom: '12px' }}>This Week</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {([
                { value: weekStrength.length + weekCardio.length, label: 'Workouts', unit: '' },
                { value: weekVolume > 0 ? Math.round(weekVolume) : 0, label: 'Volume', unit: 'kg' },
                { value: weekCardio.length, label: 'Cardio', unit: '' },
                { value: avgSession, label: 'Avg Session', unit: 'min' },
              ] as const).map(({ value, label, unit }) => (
                <div key={label} style={{ ...card, padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '84px' }}>
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '32px', fontWeight: 600, lineHeight: '42px', color: '#FFFFFF' }}>
                      {value.toLocaleString()}
                    </span>
                    {unit && <span style={{ ...mono8 }}>{unit}</span>}
                  </div>
                  <span style={{ ...mono8 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Sessions ── */}
          <div style={{ marginTop: '8px' }}>
            <p style={{ ...mono10, marginBottom: '12px' }}>{sessionLabel}</p>

            {selectedEvents.length === 0 ? (
              <p style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '14px', color: 'rgba(255,255,255,0.4)' }}>
                No sessions planned
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {selectedEvents.map(ev => {
                  const isStrength   = ev.eventType === 'strength'
                  const accentColor  = isStrength ? '#00BD44' : '#FFFFFF'
                  const templateName = getTemplateName(ev.workoutTemplateId, ev.programmeId)
                  const duration     = getDurationRange(ev, programmes)
                  return (
                    <div key={ev.id} style={{ ...card, padding: '12px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '6px', position: 'relative', overflow: 'hidden', minHeight: '68px' }}>
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '8px', background: accentColor }} />
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>
                        <span style={{ ...mono8, color: '#0A0A0A', background: accentColor, padding: '4px 10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center' }}>
                          {ev.eventType}
                        </span>
                        {duration && <span style={{ ...mono8 }}>{duration}</span>}
                      </div>
                      <span style={{ fontFamily: 'var(--font-geist-sans)', fontSize: '16px', fontWeight: 600, lineHeight: '20px', color: '#FFFFFF', display: 'block' }}>
                        {templateName ?? ev.name ?? ev.eventType}
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

      {/* ── Start Workout ── */}
      <div style={{ padding: '0 16px 16px', flexShrink: 0 }}>
        <button
          onClick={() => router.push('/session')}
          style={{
            width: '100%', height: '40px',
            background: '#00BD44', borderRadius: '40px', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-geist-sans)', fontSize: '14px', fontWeight: 600, color: '#0A0A0A',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          Start Workout
        </button>
      </div>
    </div>
  )
}
