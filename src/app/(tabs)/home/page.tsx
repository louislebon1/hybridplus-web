'use client'

import { useRouter } from 'next/navigation'
import { Dumbbell } from 'lucide-react'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { useCardioStore } from '@/stores/cardio-store'
import { Button } from '@/components/ui'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getWeekBounds() {
  const now = new Date()
  const day = now.getDay()
  const mon = new Date(now)
  mon.setDate(now.getDate() - ((day + 6) % 7))
  mon.setHours(0, 0, 0, 0)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  sun.setHours(23, 59, 59, 999)
  return { mon, sun }
}

function isoDate(d: Date) { return d.toISOString().split('T')[0] }

function relativeDate(dateStr: string) {
  const today = isoDate(new Date())
  const yesterday = isoDate(new Date(Date.now() - 86400000))
  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'
  const diff = Math.round((new Date(today).getTime() - new Date(dateStr).getTime()) / 86400000)
  return `${diff} days ago`
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  if (m >= 60) {
    const h = Math.floor(m / 60)
    return `${h}h ${m % 60}m`
  }
  return `${m}m ${s}s`
}

function fmtVolume(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`
}

const EVENT_COLORS: Record<string, string> = {
  strength: '#1DB954',
  run: '#1DB954',
  swim: '#06b6d4',
  cycle: '#a855f7',
  walk: '#84cc16',
  row: '#f59e0b',
  rest: '#3E3E3E',
  other: '#A7A7A7',
}

export default function HomePage() {
  const router = useRouter()
  const { sessions: strengthSessions } = useSessionHistoryStore()
  const { events } = useCalendarStore()
  const { sessions: cardioSessions } = useCardioStore()

  const today = isoDate(new Date())
  const todayEvents = events[today] ?? []
  const { mon, sun } = getWeekBounds()

  const weekStrength = strengthSessions.filter((s) => {
    const d = new Date(s.sessionDate)
    return d >= mon && d <= sun
  })
  const weekCardio = cardioSessions.filter((s) => {
    const d = new Date(s.sessionDate)
    return d >= mon && d <= sun
  })
  const weekVolume = weekStrength.reduce((acc, s) => acc + s.totalVolume, 0)

  // Streak: consecutive days ending today with at least one session
  const allDates = new Set([
    ...strengthSessions.map((s) => s.sessionDate),
    ...cardioSessions.map((s) => s.sessionDate),
  ])
  let streak = 0
  let cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  while (allDates.has(isoDate(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }

  const recent = [...strengthSessions]
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .slice(0, 5)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <div>
          <p className="text-text-secondary text-sm">{getGreeting()}</p>
          <h1 className="text-2xl font-normal text-text">Dashboard</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
          <span className="text-accent-fg font-normal text-sm">H</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-5">
        {/* Today's plan */}
        <div className="bg-bg-element border border-border rounded-2xl p-4">
          <p className="eyebrow mb-3">Today</p>
          {todayEvents.length === 0 ? (
            <div className="flex items-center gap-2 text-text-secondary text-sm">
              <span>😴</span>
              <span>Rest day — recover well</span>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {todayEvents.map((ev) => (
                <span
                  key={ev.id}
                  className="px-3 py-1 rounded-full text-xs font-normal text-white"
                  style={{ backgroundColor: EVENT_COLORS[ev.eventType] ?? '#71717a' }}
                >
                  {ev.name ?? ev.eventType}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div>
          <p className="eyebrow mb-3">This week</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Workouts', value: weekStrength.length },
              { label: 'Volume', value: fmtVolume(weekVolume) },
              { label: 'Cardio', value: weekCardio.length },
              { label: 'Streak', value: `${streak}d` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-bg-element border border-border rounded-2xl p-4">
                <p className="text-2xl font-normal text-text tabular">{value}</p>
                <p className="text-xs text-text-secondary mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent sessions */}
        <div>
          <p className="eyebrow mb-3">Recent sessions</p>
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 bg-bg-element border border-border rounded-2xl">
              <Dumbbell size={28} className="text-text-tertiary" />
              <p className="text-text-secondary text-sm">No sessions yet</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {recent.map((s) => (
                <div key={s.id} className="bg-bg-element border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-normal text-text">{s.name}</p>
                    <p className="text-xs text-text-secondary">{relativeDate(s.sessionDate)} · {fmtDuration(s.durationSeconds)}</p>
                  </div>
                  <p className="text-sm font-normal text-text-secondary tabular">{fmtVolume(s.totalVolume)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-4 flex-shrink-0 border-t border-border pt-4">
        <Button size="lg" className="w-full" onClick={() => router.push('/session')}>
          START WORKOUT
        </Button>
      </div>
    </div>
  )
}
