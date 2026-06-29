'use client'

import { useState } from 'react'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { useCardioStore } from '@/stores/cardio-store'
import { localDateStr } from '@/lib/date'

function fmtPace(paceSecs: number) {
  const m = Math.floor(paceSecs / 60)
  const s = Math.round(paceSecs % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtVolume(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`
}

function getWeekKey(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((day + 6) % 7))
  return localDateStr(mon)
}

export default function ProgressPage() {
  const { sessions } = useSessionHistoryStore()
  const { sessions: cardioSessions } = useCardioStore()
  const [tab, setTab] = useState<'overview' | 'strength' | 'cardio'>('overview')

  // ── Overview ──────────────────────────────────────────────────────────────
  const totalSessions = sessions.length + cardioSessions.length
  const totalVolume = sessions.reduce((acc, s) => acc + s.totalVolume, 0)

  // Weekly volumes for bar chart (last 6 weeks)
  const weeklyVolumes: Record<string, number> = {}
  for (const s of sessions) {
    const wk = getWeekKey(s.sessionDate)
    weeklyVolumes[wk] = (weeklyVolumes[wk] ?? 0) + s.totalVolume
  }
  const weekKeys = Object.keys(weeklyVolumes).sort().slice(-6)
  const maxVol = Math.max(...weekKeys.map((k) => weeklyVolumes[k]), 1)

  // Streak
  const allDates = new Set([
    ...sessions.map((s) => s.sessionDate),
    ...cardioSessions.map((s) => s.sessionDate),
  ])
  let streak = 0
  const cursor = new Date(); cursor.setHours(0,0,0,0)
  while (allDates.has(localDateStr(cursor))) {
    streak++; cursor.setDate(cursor.getDate() - 1)
  }

  // Deload heuristic: 4+ consecutive training weeks
  const consecutiveWeeks = (() => {
    let count = 0
    const now = new Date(); now.setHours(0,0,0,0)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
    for (let i = 0; i < 12; i++) {
      const ws = new Date(weekStart)
      ws.setDate(weekStart.getDate() - i * 7)
      const we = new Date(ws); we.setDate(ws.getDate() + 6)
      const wsStr = localDateStr(ws)
      const weStr = localDateStr(we)
      const hasSession = sessions.some((s) => s.sessionDate >= wsStr && s.sessionDate <= weStr)
        || cardioSessions.some((s) => s.sessionDate >= wsStr && s.sessionDate <= weStr)
      if (!hasSession) break
      count++
    }
    return count
  })()

  // ── Strength PRs ──────────────────────────────────────────────────────────
  const prMap: Record<string, { name: string; maxWeight: number; maxE1rm: number; lastDate: string }> = {}
  for (const s of sessions) {
    for (const ex of s.exercises) {
      if (!prMap[ex.exerciseId]) {
        prMap[ex.exerciseId] = { name: ex.exerciseName, maxWeight: 0, maxE1rm: 0, lastDate: s.sessionDate }
      }
      const entry = prMap[ex.exerciseId]
      for (const set of ex.sets) {
        if (set.weight && set.weight > entry.maxWeight) entry.maxWeight = set.weight
        if (set.e1rm && set.e1rm > entry.maxE1rm) entry.maxE1rm = set.e1rm
      }
      if (s.sessionDate > entry.lastDate) entry.lastDate = s.sessionDate
    }
  }
  const prs = Object.values(prMap).sort((a, b) => a.name.localeCompare(b.name))

  // ── Cardio stats ──────────────────────────────────────────────────────────
  const totalDistKm = cardioSessions.reduce((acc, s) => acc + (s.distanceKm ?? 0), 0)
  const totalCardioSecs = cardioSessions.reduce((acc, s) => acc + s.durationSeconds, 0)
  const activityCounts: Record<string, number> = {}
  for (const s of cardioSessions) activityCounts[s.activityType] = (activityCounts[s.activityType] ?? 0) + 1
  const paceEntries = cardioSessions.filter((s) => s.avgPaceSecs && s.distanceKm)
  const bestPace = paceEntries.length ? Math.min(...paceEntries.map((s) => s.avgPaceSecs!)) : null
  const recentRuns = cardioSessions
    .filter((s) => s.activityType === 'run')
    .sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))
    .slice(0, 5)

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-12 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-normal text-text">Progress</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-1 mb-4 flex-shrink-0">
        {(['overview', 'strength', 'cardio'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-2 rounded-xl text-xs font-normal transition-colors capitalize',
              tab === t ? 'bg-accent text-accent-fg' : 'bg-bg-element text-text-secondary',
            ].join(' ')}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-5">
        {tab === 'overview' && (
          <>
            {/* Deload banner */}
            {consecutiveWeeks >= 4 && (
              <div className="bg-warning/10 border border-warning/30 rounded-2xl p-4">
                <p className="text-sm font-normal text-warning">Recovery recommended</p>
                <p className="text-xs text-text-secondary mt-1">
                  You&apos;ve trained {consecutiveWeeks} consecutive weeks. Consider a deload this week.
                </p>
              </div>
            )}

            {/* All-time stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Sessions', value: totalSessions },
                { label: 'Total volume', value: fmtVolume(totalVolume) },
                { label: 'Streak', value: `${streak}d` },
              ].map(({ label, value }) => (
                <div key={label} className="bg-bg-element border border-border rounded-2xl p-3 text-center">
                  <p className="text-xl font-normal text-text tabular">{value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Weekly volume chart */}
            {weekKeys.length > 0 && (
              <div>
                <p className="eyebrow mb-3">Weekly volume</p>
                <div className="bg-bg-element border border-border rounded-2xl p-4">
                  <div className="flex items-end gap-1.5 h-24">
                    {weekKeys.map((wk) => {
                      const vol = weeklyVolumes[wk]
                      const pct = (vol / maxVol) * 100
                      const wkNum = Math.ceil((new Date(wk).getTime() - new Date(new Date(wk).getFullYear(), 0, 1).getTime()) / (7 * 86400000))
                      return (
                        <div key={wk} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-sm bg-accent/20 relative" style={{ height: `${Math.max(pct, 4)}%` }}>
                            <div className="absolute bottom-0 left-0 right-0 bg-accent rounded-t-sm" style={{ height: '100%' }} />
                          </div>
                          <span className="text-[10px] text-text-tertiary tabular">W{wkNum}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'strength' && (
          <>
            <p className="eyebrow">Personal records</p>
            {prs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-4xl">🏆</span>
                <p className="text-text-secondary text-sm">No records yet — complete some workouts</p>
              </div>
            ) : (
              <div className="bg-bg-element border border-border rounded-2xl overflow-hidden">
                {/* Table header */}
                <div className="grid grid-cols-4 px-4 py-2 border-b border-border">
                  <span className="text-xs font-normal text-text-tertiary col-span-2">Exercise</span>
                  <span className="text-xs font-normal text-text-tertiary text-right">Max kg</span>
                  <span className="text-xs font-normal text-text-tertiary text-right">e1RM</span>
                </div>
                {prs.map((pr, i) => (
                  <div key={i} className="grid grid-cols-4 px-4 py-3 border-b border-border last:border-b-0">
                    <div className="col-span-2 min-w-0">
                      <p className="text-sm text-text truncate">{pr.name}</p>
                      <p className="text-xs text-text-tertiary">{fmtDate(pr.lastDate)}</p>
                    </div>
                    <p className="text-sm font-normal text-text tabular text-right self-center">{pr.maxWeight > 0 ? `${pr.maxWeight}` : '—'}</p>
                    <p className="text-sm font-normal text-accent tabular text-right self-center">{pr.maxE1rm > 0 ? `${pr.maxE1rm.toFixed(1)}` : '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === 'cardio' && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Distance', value: `${totalDistKm.toFixed(1)} km` },
                { label: 'Time', value: totalCardioSecs >= 3600 ? `${Math.floor(totalCardioSecs/3600)}h` : `${Math.floor(totalCardioSecs/60)}m` },
                { label: 'Best pace', value: bestPace ? fmtPace(bestPace) : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-bg-element border border-border rounded-2xl p-3 text-center">
                  <p className="text-base font-normal text-text tabular">{value}</p>
                  <p className="text-xs text-text-secondary mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Activity breakdown */}
            {Object.keys(activityCounts).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {Object.entries(activityCounts).map(([type, count]) => (
                  <div key={type} className="px-3 py-2 bg-bg-element border border-border rounded-xl">
                    <p className="text-xs font-normal text-text capitalize">{type}</p>
                    <p className="text-lg font-normal text-text tabular">{count}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Recent runs */}
            {recentRuns.length > 0 && (
              <div>
                <p className="eyebrow mb-3">Recent runs</p>
                <div className="flex flex-col gap-2">
                  {recentRuns.map((s) => (
                    <div key={s.id} className="bg-bg-element border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-normal text-text">{s.runType?.replace('_', ' ') ?? 'Run'}</p>
                        <p className="text-xs text-text-secondary">{fmtDate(s.sessionDate)}</p>
                      </div>
                      <div className="text-right">
                        {s.distanceKm && <p className="text-sm font-normal text-text tabular">{s.distanceKm.toFixed(2)} km</p>}
                        {s.avgPaceSecs && <p className="text-xs text-text-secondary tabular">{fmtPace(s.avgPaceSecs)}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {cardioSessions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-2">
                <span className="text-4xl">🏃</span>
                <p className="text-text-secondary text-sm">No cardio sessions yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
