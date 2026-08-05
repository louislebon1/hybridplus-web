'use client'

import { useState } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { useCardioStore } from '@/stores/cardio-store'
import { localDateStr } from '@/lib/date'
import { EmptyState } from '@/components/ui'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'
import {
  HeroGlow, SectionLabel, StatCard, WeekGrid, SegmentedChips,
  DistributionSummary, Sparkline, StatusPill, ZoneRow,
  type WeekRow, type ZoneDatum,
} from '@/components/dash'

const ZONE_COLORS = ['var(--zone-1)', 'var(--zone-3)', 'var(--zone-4)', 'var(--zone-5)', 'var(--zone-2)']

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

/** ISO-ish week number, used only as a compact row label (W31). */
function weekLabel(mondayStr: string) {
  const d = new Date(mondayStr + 'T00:00:00')
  const jan1 = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7)
  return `W${week}`
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

  // ── Training summary grid: last 6 weeks × 7 days ──────────────────────────
  const volumeByDate: Record<string, number> = {}
  for (const s of sessions) volumeByDate[s.sessionDate] = (volumeByDate[s.sessionDate] ?? 0) + s.totalVolume
  const cardioDates = new Set(cardioSessions.map(s => s.sessionDate))
  const maxDayVolume = Math.max(...Object.values(volumeByDate), 1)

  const thisMonday = (() => {
    const n = new Date(); n.setHours(0, 0, 0, 0)
    n.setDate(n.getDate() - ((n.getDay() + 6) % 7))
    return n
  })()

  const weekRows: WeekRow[] = Array.from({ length: 6 }, (_, i) => {
    const monday = new Date(thisMonday)
    monday.setDate(thisMonday.getDate() - (5 - i) * 7)
    const mondayStr = localDateStr(monday)

    const days = Array.from({ length: 7 }, (_, d) => {
      const day = new Date(monday)
      day.setDate(monday.getDate() + d)
      const ds = localDateStr(day)
      const vol = volumeByDate[ds] ?? 0
      if (vol > 0) return Math.min(1, vol / maxDayVolume)
      return cardioDates.has(ds) ? 0.32 : 0
    })

    const load = weeklyVolumes[mondayStr] ?? 0
    const prevMonday = new Date(monday); prevMonday.setDate(monday.getDate() - 7)
    const prevLoad = weeklyVolumes[localDateStr(prevMonday)] ?? 0
    const pctChange = prevLoad > 0 ? Math.round(((load - prevLoad) / prevLoad) * 100) : null

    return {
      label: weekLabel(mondayStr),
      days,
      load: load > 0 ? fmtVolume(load) : '—',
      change: pctChange !== null ? `${pctChange > 0 ? '+' : ''}${pctChange}%` : null,
      changePositive: (pctChange ?? 0) >= 0,
    }
  })

  const hasGridData = weekRows.some(r => r.days.some(d => d > 0))

  // ── Training focus: share of strength volume by muscle group ──────────────
  const volumeByGroup: Record<string, number> = {}
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const lib = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
      if (!lib) continue
      volumeByGroup[lib.category] = (volumeByGroup[lib.category] ?? 0) + ex.totalVolume
    }
  }
  const groupTotal = Object.values(volumeByGroup).reduce((a, b) => a + b, 0)
  const focusZones: ZoneDatum[] = Object.entries(volumeByGroup)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([group, vol], i) => ({
      label: MUSCLE_GROUP_LABELS[group] ?? group,
      color: ZONE_COLORS[i % ZONE_COLORS.length],
      pct: groupTotal > 0 ? (vol / groupTotal) * 100 : 0,
    }))

  const allGroupZones: ZoneDatum[] = Object.entries(volumeByGroup)
    .sort((a, b) => b[1] - a[1])
    .map(([group, vol], i) => ({
      label: MUSCLE_GROUP_LABELS[group] ?? group,
      color: ZONE_COLORS[i % ZONE_COLORS.length],
      pct: groupTotal > 0 ? (vol / groupTotal) * 100 : 0,
      count: `${Math.round(vol / 1000 * 10) / 10}t`,
    }))

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

  const volumeTrend = weekKeys.map(k => weeklyVolumes[k])
  const consistencyLabel = consecutiveWeeks >= 4 ? 'HIGH' : consecutiveWeeks >= 2 ? 'BUILDING' : 'LOW'
  const consistencyColor = consecutiveWeeks >= 4 ? 'var(--warning)' : consecutiveWeeks >= 2 ? 'var(--accent)' : 'var(--text-tertiary)'

  return (
    <div className="relative flex flex-col h-full overflow-hidden">
      <HeroGlow color="#00ABFE" className="opacity-40" />

      <div className="relative no-scrollbar flex-1 overflow-y-auto">

        {/* ── Header ── */}
        <div className="px-5 screen-top flex items-center justify-between gap-3">
          <h1 className="text-h2 font-bold text-text m-0">Progress</h1>
          <Link
            href="/profile"
            aria-label="Profile"
            className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0 outline-none transition-colors duration-150 ease-out hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/40"
          >
            <User size={18} className="text-text" />
          </Link>
        </div>

        {/* ── Training summary grid ── */}
        <div className="px-5 mt-6">
          <SectionLabel
            action={<span className="text-tag text-text-tertiary">{totalSessions} session{totalSessions !== 1 ? 's' : ''}</span>}
          >
            Training summary
          </SectionLabel>
          <div className="mt-3 bg-bg-card rounded-card px-3.5 py-3.5">
            {hasGridData ? (
              <WeekGrid rows={weekRows} />
            ) : (
              <p className="text-caption text-text-tertiary text-center py-6 m-0">
                No training logged in the last 6 weeks
              </p>
            )}
          </div>
        </div>

        {/* ── Segmented control ── */}
        <div className="px-5 mt-5">
          <SegmentedChips options={['overview', 'strength', 'cardio'] as const} value={tab} onChange={setTab} />
        </div>

        <div className="px-5 mt-5 flex flex-col gap-5">

          {tab === 'overview' && (
            <>
              {/* Compact stat row */}
              <div className="flex gap-2.5">
                <StatCard label="Sessions" value={String(totalSessions)} caption="all time" />
                <StatCard label="Volume" value={fmtVolume(totalVolume)} caption="lifted" />
                <StatCard label="Streak" value={`${streak}d`} caption="current" />
              </div>

              {/* Training focus distribution */}
              <div>
                <SectionLabel>Training focus</SectionLabel>
                <div className="mt-3 bg-bg-card rounded-card p-4">
                  {focusZones.length > 0 ? (
                    <DistributionSummary zones={focusZones} />
                  ) : (
                    <p className="text-caption text-text-tertiary text-center py-4 m-0">
                      Log a strength session to see your split
                    </p>
                  )}
                </div>
              </div>

              {/* Fitness cards */}
              <div>
                <SectionLabel>Fitness</SectionLabel>
                <div className="mt-3 flex flex-col gap-2.5">
                  <div className="bg-bg-card rounded-card p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-tag uppercase tracking-[0.06em] text-text-tertiary m-0">Weekly volume</p>
                      <p className="text-h1 font-bold text-text tabular m-0 mt-1">
                        {fmtVolume(weekKeys.length ? weeklyVolumes[weekKeys[weekKeys.length - 1]] : 0)}
                      </p>
                      <div className="mt-1.5">
                        <StatusPill label={consistencyLabel} color={consistencyColor} />
                      </div>
                    </div>
                    <div className="w-[104px] flex-shrink-0">
                      {volumeTrend.length > 0
                        ? <Sparkline values={volumeTrend} />
                        : <p className="text-tag text-text-tertiary text-right m-0">No data</p>}
                    </div>
                  </div>

                  <div className="bg-bg-card rounded-card p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-tag uppercase tracking-[0.06em] text-text-tertiary m-0">Consistency</p>
                      <p className="text-h1 font-bold text-text tabular m-0 mt-1">
                        {consecutiveWeeks}<span className="text-h4 text-text-tertiary ml-1">wk</span>
                      </p>
                      <p className="text-tag text-text-tertiary m-0 mt-1.5">consecutive training weeks</p>
                    </div>
                  </div>
                </div>
              </div>

              {consecutiveWeeks >= 4 && (
                <div className="rounded-card p-4 border" style={{ backgroundColor: 'var(--warning-subtle)', borderColor: 'rgba(251,146,60,0.3)' }}>
                  <p className="text-label font-medium m-0" style={{ color: 'var(--warning)' }}>Recovery recommended</p>
                  <p className="text-caption text-text-secondary mt-1 m-0">
                    You&apos;ve trained {consecutiveWeeks} consecutive weeks. Consider a deload this week.
                  </p>
                </div>
              )}
            </>
          )}

          {tab === 'strength' && (
            <>
              <div>
                <SectionLabel>Volume by muscle group</SectionLabel>
                <div className="mt-3 bg-bg-card rounded-card p-4">
                  {allGroupZones.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      {allGroupZones.map(z => <ZoneRow key={z.label} zone={z} />)}
                    </div>
                  ) : (
                    <p className="text-caption text-text-tertiary text-center py-4 m-0">No strength volume logged yet</p>
                  )}
                </div>
              </div>

              <div>
                <SectionLabel>Personal records</SectionLabel>
                {prs.length === 0 ? (
                  <EmptyState
                    icon="🏆"
                    title="No records yet"
                    description="Complete some workouts to start tracking your PRs."
                  />
                ) : (
                  <div className="mt-3 bg-bg-card rounded-card overflow-hidden">
                    <div className="grid grid-cols-4 px-4 py-2.5 border-b border-border">
                      <span className="text-tag uppercase tracking-[0.06em] text-text-tertiary col-span-2">Exercise</span>
                      <span className="text-tag uppercase tracking-[0.06em] text-text-tertiary text-right">Max kg</span>
                      <span className="text-tag uppercase tracking-[0.06em] text-text-tertiary text-right">e1RM</span>
                    </div>
                    {prs.map((pr, i) => (
                      <div key={i} className="grid grid-cols-4 px-4 py-3 border-b border-border last:border-b-0">
                        <div className="col-span-2 min-w-0">
                          <p className="text-label font-medium text-text truncate m-0">{pr.name}</p>
                          <p className="text-tag text-text-tertiary m-0 mt-0.5">{fmtDate(pr.lastDate)}</p>
                        </div>
                        <p className="text-label font-medium text-text tabular text-right self-center m-0">{pr.maxWeight > 0 ? `${pr.maxWeight}` : '—'}</p>
                        <p className="text-label font-medium text-accent tabular text-right self-center m-0">{pr.maxE1rm > 0 ? `${pr.maxE1rm.toFixed(1)}` : '—'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {tab === 'cardio' && (
            <>
              <div className="flex gap-2.5">
                <StatCard label="Distance" value={`${totalDistKm.toFixed(1)}`} caption="km total" />
                <StatCard
                  label="Time"
                  value={totalCardioSecs >= 3600 ? `${Math.floor(totalCardioSecs / 3600)}h` : `${Math.floor(totalCardioSecs / 60)}m`}
                  caption="moving"
                />
                <StatCard label="Best pace" value={bestPace ? fmtPace(bestPace).replace(' /km', '') : '—'} caption="per km" />
              </div>

              {Object.keys(activityCounts).length > 0 && (
                <div>
                  <SectionLabel>Activity split</SectionLabel>
                  <div className="mt-3 bg-bg-card rounded-card p-4 flex flex-col gap-3">
                    {Object.entries(activityCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count], i) => {
                        const total = Object.values(activityCounts).reduce((a, b) => a + b, 0)
                        return (
                          <ZoneRow
                            key={type}
                            zone={{
                              label: type.charAt(0).toUpperCase() + type.slice(1),
                              color: ZONE_COLORS[i % ZONE_COLORS.length],
                              pct: (count / total) * 100,
                              count: `${count}×`,
                            }}
                          />
                        )
                      })}
                  </div>
                </div>
              )}

              {recentRuns.length > 0 && (
                <div>
                  <SectionLabel>Recent runs</SectionLabel>
                  <div className="mt-3 flex flex-col gap-2.5">
                    {recentRuns.map((s) => (
                      <div key={s.id} className="bg-bg-card rounded-card px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-label font-medium text-text m-0 capitalize truncate">{s.runType?.replace('_', ' ') ?? 'Run'}</p>
                          <p className="text-tag text-text-tertiary m-0 mt-0.5">{fmtDate(s.sessionDate)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {s.distanceKm && <p className="text-label font-medium text-text tabular m-0">{s.distanceKm.toFixed(2)} km</p>}
                          {s.avgPaceSecs && <p className="text-tag text-text-tertiary tabular m-0 mt-0.5">{fmtPace(s.avgPaceSecs)}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {cardioSessions.length === 0 && (
                <EmptyState
                  icon="🏃"
                  title="No cardio sessions yet"
                  description="Log a cardio session to see your stats here."
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
