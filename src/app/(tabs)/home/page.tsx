'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Flame, CheckCircle2, Circle } from 'lucide-react'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { useCardioStore } from '@/stores/cardio-store'
import { useProgrammeStore } from '@/stores/programme-store'

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const CARDIO_TYPES = new Set(['run', 'swim', 'cycle', 'walk', 'row'])

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

function fmtLabel(dateStr: string, today: string) {
  if (dateStr === today) return "Today's Sessions"
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })
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

  // Active programme / phase
  const activeProgramme = programmes.find(p => p.isActive) ?? programmes[0] ?? null
  const activePhase = activeProgramme?.phases.find(ph => ph.isActive) ?? null

  const weekNumber = activeProgramme?.startDate
    ? Math.max(1, Math.floor((Date.now() - new Date(activeProgramme.startDate + 'T00:00:00').getTime()) / (7 * 86400000)) + 1)
    : null

  // Week stats
  const inWeek = (dateStr: string) => {
    const d = new Date(dateStr + 'T12:00:00')
    return d >= weekStart && d <= weekEnd
  }
  const weekStrength = strengthSessions.filter(s => inWeek(s.sessionDate))
  const weekCardio = cardioSessions.filter(s => inWeek(s.sessionDate))
  const weekVolume = weekStrength.reduce((a, s) => a + s.totalVolume, 0)
  const avgSession = weekStrength.length > 0
    ? Math.round(weekStrength.reduce((a, s) => a + s.durationSeconds, 0) / weekStrength.length / 60)
    : 0

  // Streak
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

  // Selected day
  const selectedEvents = events[selectedDate] ?? []

  function getTemplateName(templateId: string | null, programmeId: string | null) {
    if (!templateId || !programmeId) return null
    return programmes.find(p => p.id === programmeId)?.templates.find(t => t.id === templateId)?.name ?? null
  }

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex justify-center pt-10 pb-5 flex-shrink-0">
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
      <div className="flex-1 overflow-y-auto px-4 pb-4 flex flex-col gap-4 no-scrollbar">

        {/* Weekly calendar card */}
        <div className="bg-bg-element border border-border rounded-2xl p-4">
          <div className="grid grid-cols-7">
            {weekDays.map((d, i) => {
              const ds = isoDate(d)
              const isSelected = ds === selectedDate
              const dayEvents = events[ds] ?? []
              const hasStrength = dayEvents.some(e => e.eventType === 'strength')
              const hasCardio = dayEvents.some(e => CARDIO_TYPES.has(e.eventType))
              return (
                <button key={ds} onClick={() => setSelectedDate(ds)} className="flex flex-col items-center gap-1 py-1">
                  <span className="text-[9px] text-text-tertiary font-mono tracking-wider">{DAY_LABELS[i]}</span>
                  <span className={[
                    'w-8 h-8 flex items-center justify-center rounded-full text-sm transition-colors',
                    isSelected ? 'bg-accent text-accent-fg font-semibold' : 'text-text',
                  ].join(' ')}>
                    {d.getDate()}
                  </span>
                  <div className="flex gap-0.5 h-2 items-center justify-center">
                    {hasStrength && <span className="w-1.5 h-1.5 rounded-full bg-accent" />}
                    {hasCardio && <span className="w-1.5 h-1.5 rounded-full border border-text-secondary" />}
                    {!hasStrength && !hasCardio && <span className="w-1.5 h-1.5" />}
                  </div>
                </button>
              )
            })}
          </div>

          {(activeProgramme || activePhase) && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              {activePhase && (
                <span className="text-[9px] px-2.5 py-1 rounded-full bg-accent text-accent-fg font-mono uppercase tracking-wider">
                  {activePhase.name}
                </span>
              )}
              {activeProgramme && (
                <span className="text-xs text-text">{activeProgramme.name}</span>
              )}
              {weekNumber && (
                <span className="ml-auto text-[9px] text-text-tertiary font-mono uppercase tracking-wider">Week {weekNumber}</span>
              )}
            </div>
          )}
        </div>

        {/* Streak card */}
        <div className="bg-bg-element border border-border rounded-2xl p-4">
          <div className="flex gap-4 items-start">
            <div className="min-w-[90px]">
              <Flame size={22} className="text-accent mb-2" />
              <p className="text-text leading-none">
                <span className="text-3xl">{streak}</span>
                <span className="text-lg ml-1">Day</span>
              </p>
              <p className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary mt-1">Workout Streak</p>
            </div>
            <div className="flex-1 flex flex-col gap-3 pt-1">
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((completedThisWeek / 7) * 100)}%` }}
                />
              </div>
              <div className="flex justify-between">
                {weekDays.map((d, i) => {
                  const done = dayHasSession(d)
                  return (
                    <div key={i} className="flex flex-col items-center gap-1">
                      {done
                        ? <CheckCircle2 size={16} className="text-accent" />
                        : <Circle size={16} className="text-border" />
                      }
                      <span className="text-[8px] text-text-tertiary font-mono">{DAY_LABELS[i].slice(0, 3)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* This week stats */}
        <div>
          <p className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary mb-3">This Week</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: weekStrength.length + weekCardio.length, label: 'Workouts', unit: '' },
              { value: weekVolume > 0 ? Math.round(weekVolume).toLocaleString() : 0, label: 'Volume', unit: 'kg' },
              { value: weekCardio.length, label: 'Cardio', unit: '' },
              { value: avgSession, label: 'Avg Session', unit: 'min' },
            ].map(({ value, label, unit }) => (
              <div key={label} className="bg-bg-element border border-border rounded-2xl p-4">
                <p className="text-text leading-none">
                  <span className="text-3xl tabular">{value}</span>
                  {unit && <span className="text-sm text-text-secondary ml-1">{unit}</span>}
                </p>
                <p className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary mt-2">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected day sessions */}
        <div>
          <p className="text-[9px] font-mono uppercase tracking-wider text-text-tertiary mb-3">
            {fmtLabel(selectedDate, today)}
          </p>
          {selectedEvents.length === 0 ? (
            <p className="text-text-secondary text-sm py-2">No sessions planned</p>
          ) : (
            <div className="flex flex-col gap-3">
              {selectedEvents.map(ev => {
                const isStrength = ev.eventType === 'strength'
                const borderColor = isStrength ? '#1DB954' : '#ffffff'
                const templateName = getTemplateName(ev.workoutTemplateId, ev.programmeId)
                return (
                  <div
                    key={ev.id}
                    className="bg-bg-element border border-border rounded-2xl p-4"
                    style={{ borderLeftColor: borderColor, borderLeftWidth: '3px' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={[
                        'text-[9px] px-2.5 py-1 rounded-full border font-mono uppercase tracking-wider',
                        isStrength ? 'border-accent text-accent' : 'border-text text-text',
                      ].join(' ')}>
                        {ev.eventType}
                      </span>
                      {ev.durationMinutes && (
                        <span className="text-[9px] font-mono text-text-secondary uppercase tracking-wider">
                          {ev.durationMinutes}M
                        </span>
                      )}
                    </div>
                    <p className="text-lg font-semibold text-text truncate">
                      {templateName ?? ev.name ?? ev.eventType}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Start Workout CTA */}
      <div className="px-4 pb-8 pt-3 flex-shrink-0">
        <button
          onClick={() => router.push('/session')}
          className="w-full bg-accent text-accent-fg text-base font-semibold py-4 rounded-full hover:bg-accent-hover transition-colors"
        >
          Start Workout
        </button>
      </div>
    </div>
  )
}
