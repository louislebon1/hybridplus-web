'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Footprints, Trophy, User } from 'lucide-react'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { useCardioStore } from '@/stores/cardio-store'
import { localDateStr } from '@/lib/date'
import { EmptyState } from '@/components/ui'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'
import {
  SectionLabel, StatCard, WeekGrid, SegmentedChips,
  DistributionSummary, Sparkline, StatusPill, ZoneRow, DATA_TONES,
  type WeekRow, type ZoneDatum,
} from '@/components/dash'
import { Pager, Page, Caption, SnapHint, LoadField } from '@/components/feed'



function fmtPace(paceSecs: number) {
  const m = Math.floor(paceSecs / 60)
  const s = Math.round(paceSecs % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtVolume(kg: number) {
  return kg>= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)} kg`
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
      const hasSession = sessions.some((s) => s.sessionDate>= wsStr && s.sessionDate <= weStr)
        || cardioSessions.some((s) => s.sessionDate>= wsStr && s.sessionDate <= weStr)
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
      if (vol> 0) return Math.min(1, vol / maxDayVolume)
      return cardioDates.has(ds) ? 0.32 : 0
    })

    const load = weeklyVolumes[mondayStr] ?? 0
    const prevMonday = new Date(monday); prevMonday.setDate(monday.getDate() - 7)
    const prevLoad = weeklyVolumes[localDateStr(prevMonday)] ?? 0
    const pctChange = prevLoad> 0 ? Math.round(((load - prevLoad) / prevLoad) * 100) : null

    return {
      label: weekLabel(mondayStr),
      days,
      load: load> 0 ? fmtVolume(load) : '—',
      change: pctChange !== null ? `${pctChange> 0 ? '+' : ''}${pctChange}%` : null,
      changePositive: (pctChange ?? 0)>= 0,
    }
  })

  const hasGridData = weekRows.some(r => r.days.some(d => d> 0))

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
      color: DATA_TONES[i % DATA_TONES.length],
      pct: groupTotal> 0 ? (vol / groupTotal) * 100 : 0,
    }))

  const allGroupZones: ZoneDatum[] = Object.entries(volumeByGroup)
    .sort((a, b) => b[1] - a[1])
    .map(([group, vol], i) => ({
      label: MUSCLE_GROUP_LABELS[group] ?? group,
      color: DATA_TONES[i % DATA_TONES.length],
      pct: groupTotal> 0 ? (vol / groupTotal) * 100 : 0,
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
        if (set.weight && set.weight> entry.maxWeight) entry.maxWeight = set.weight
        if (set.e1rm && set.e1rm> entry.maxE1rm) entry.maxE1rm = set.e1rm
      }
      if (s.sessionDate> entry.lastDate) entry.lastDate = s.sessionDate
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
  const consistencyLabel = consecutiveWeeks>= 4 ? 'HIGH' : consecutiveWeeks>= 2 ? 'BUILDING' : 'LOW'
  const consistencyColor = consecutiveWeeks >= 4 ? '#E6E8EC' : consecutiveWeeks >= 2 ? '#8A9099' : '#5C6572'

  return (
    <Pager>

      {/* ── Headline: the tab's own figure owns the frame ─────────────────── */}
      <Page field={<LoadField values={volumeTrend} />}>
        <header className="flex items-start justify-between px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
          <span className="display text-title">Progress</span>
          <Link
            href="/profile"
            aria-label="Profile"
            className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim"
          >
            <User size={18} />
          </Link>
        </header>

        <Caption>
          {tab === 'overview' && (
            <>
              <p className="meta">Volume lifted · all time</p>
              <p className="display text-hero tabular m-0 mt-3">{fmtVolume(totalVolume)}</p>
              <p className="meta mt-3">
                {totalSessions} session{totalSessions !== 1 ? 's' : ''} · {streak}d streak
              </p>
            </>
          )}
          {tab === 'strength' && (
            <>
              <p className="meta">Personal records</p>
              <p className="display text-hero tabular m-0 mt-3">{prs.length}</p>
              <p className="meta mt-3">tracked lifts</p>
            </>
          )}
          {tab === 'cardio' && (
            <>
              <p className="meta">Distance covered</p>
              <p className="display text-hero tabular m-0 mt-3 flex items-start">
                {totalDistKm.toFixed(1)}
                <span className="text-title mt-3 ml-1 text-fog">km</span>
              </p>
              <p className="meta mt-3">
                {totalCardioSecs >= 3600
                  ? Math.floor(totalCardioSecs / 3600) + 'h moving'
                  : Math.floor(totalCardioSecs / 60) + 'm moving'}
              </p>
            </>
          )}

          <div className="mt-5">
            <SegmentedChips options={['overview', 'strength', 'cardio'] as const} value={tab} onChange={setTab} />
          </div>
        </Caption>

        <SnapHint />
      </Page>

      {/* ── Overview ──────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <>
          <Page>
            <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
              <span className="meta">Last 6 weeks</span>
            </header>
            <Caption>
              <h2 className="display text-display m-0">Training summary</h2>
              <div className="mt-5">
                {hasGridData ? (
                  <WeekGrid rows={weekRows} />
                ) : (
                  <p className="text-label text-stone m-0">No training logged in the last 6 weeks.</p>
                )}
              </div>
            </Caption>
            <SnapHint />
          </Page>

          <Page>
            <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
              <span className="meta">Where the work went</span>
            </header>
            <Caption>
              <h2 className="display text-display m-0">Training focus</h2>
              <div className="mt-5">
                {focusZones.length > 0 ? (
                  <DistributionSummary zones={focusZones} />
                ) : (
                  <p className="text-label text-stone m-0">Log a strength session to see your split.</p>
                )}
              </div>
            </Caption>
            <SnapHint />
          </Page>

          <Page>
            <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
              <span className="meta">This week</span>
            </header>
            <Caption>
              <h2 className="display text-display m-0">Fitness</h2>

              <div className="mt-5 matt rounded-card p-4">
                <p className="meta m-0">Weekly volume</p>
                <p className="display text-display tabular m-0 mt-1">
                  {fmtVolume(weekKeys.length ? weeklyVolumes[weekKeys[weekKeys.length - 1]] : 0)}
                </p>
                <div className="mt-3">
                  <StatusPill label={consistencyLabel} color={consistencyColor} />
                </div>
                <div className="mt-3">
                  {volumeTrend.length > 0
                    ? <Sparkline values={volumeTrend} />
                    : <p className="meta m-0">No data</p>}
                </div>
              </div>

              <div className="mt-2.5 matt rounded-card p-4">
                <p className="meta m-0">Consistency</p>
                <p className="display text-display tabular m-0 mt-1">
                  {consecutiveWeeks}<span className="text-figure text-fog ml-1">wk</span>
                </p>
                <p className="meta mt-1">consecutive training weeks</p>
              </div>
            </Caption>
            {consecutiveWeeks >= 4 && <SnapHint label="Advice" />}
          </Page>

          {consecutiveWeeks >= 4 && (
            <Page>
              <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
                <span className="meta">Load management</span>
              </header>
              <Caption>
                <h2 className="display text-display m-0">Recovery recommended</h2>
                <p className="text-label text-stone m-0 mt-3 max-w-[44ch]">
                  You&apos;ve trained {consecutiveWeeks} consecutive weeks. Consider a deload this week.
                </p>
              </Caption>
            </Page>
          )}
        </>
      )}

      {/* ── Strength ──────────────────────────────────────────────────────── */}
      {tab === 'strength' && (
        <>
          <Page>
            <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
              <span className="meta">Split</span>
            </header>
            <Caption>
              <h2 className="display text-display m-0">Volume by muscle group</h2>
              <div className="mt-5 flex flex-col gap-3 max-h-[44vh] overflow-y-auto">
                {allGroupZones.length > 0 ? (
                  allGroupZones.map(z => <ZoneRow key={z.label} zone={z} />)
                ) : (
                  <p className="text-label text-stone m-0">No strength volume logged yet.</p>
                )}
              </div>
            </Caption>
            <SnapHint />
          </Page>

          <Page>
            <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
              <span className="meta">Bests</span>
            </header>
            <Caption>
              <h2 className="display text-display m-0">Personal records</h2>
              {prs.length === 0 ? (
                <EmptyState
                  icon={Trophy}
                  title="No records yet"
                  description="Complete some workouts to start tracking your PRs."
                />
              ) : (
                <div className="mt-5 max-h-[44vh] overflow-y-auto">
                  <div className="flex items-center gap-3 pb-2">
                    <span className="flex-1 meta">Exercise</span>
                    <span className="w-16 text-right meta">Max kg</span>
                    <span className="w-16 text-right meta">e1RM</span>
                  </div>
                  {prs.map((pr, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-t border-scrim/8">
                      <div className="flex-1 min-w-0">
                        <p className="text-label text-scrim m-0 truncate">{pr.name}</p>
                        <p className="meta">{fmtDate(pr.lastDate)}</p>
                      </div>
                      <p className="w-16 text-right display text-figure tabular m-0">
                        {pr.maxWeight > 0 ? pr.maxWeight : '—'}
                      </p>
                      <p className="w-16 text-right display text-figure tabular m-0 text-stone">
                        {pr.maxE1rm > 0 ? pr.maxE1rm.toFixed(1) : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Caption>
          </Page>
        </>
      )}

      {/* ── Cardio ────────────────────────────────────────────────────────── */}
      {tab === 'cardio' && (
        <>
          {cardioSessions.length === 0 ? (
            <Page>
              <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
                <span className="meta">Conditioning</span>
              </header>
              <Caption>
                <EmptyState
                  icon={Footprints}
                  title="No cardio sessions yet"
                  description="Log a cardio session to see your stats here."
                />
              </Caption>
            </Page>
          ) : (
            <>
              <Page>
                <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
                  <span className="meta">Conditioning</span>
                </header>
                <Caption>
                  <h2 className="display text-display m-0">Totals</h2>
                  <div className="flex gap-2 mt-5">
                    <StatCard label="Distance" value={totalDistKm.toFixed(1)} caption="km total" />
                    <StatCard
                      label="Time"
                      value={totalCardioSecs >= 3600 ? Math.floor(totalCardioSecs / 3600) + 'h' : Math.floor(totalCardioSecs / 60) + 'm'}
                      caption="moving"
                    />
                    <StatCard
                      label="Best pace"
                      value={bestPace ? fmtPace(bestPace).replace(' /km', '') : '—'}
                      caption="per km"
                    />
                  </div>

                  {Object.keys(activityCounts).length > 0 && (
                    <div className="mt-6 flex flex-col gap-3">
                      <p className="meta m-0">Activity split</p>
                      {Object.entries(activityCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count], i) => {
                          const total = Object.values(activityCounts).reduce((a, b) => a + b, 0)
                          return (
                            <ZoneRow
                              key={type}
                              zone={{
                                label: type.charAt(0).toUpperCase() + type.slice(1),
                                color: DATA_TONES[i % DATA_TONES.length],
                                pct: (count / total) * 100,
                                count: count + '×',
                              }}
                            />
                          )
                        })}
                    </div>
                  )}
                </Caption>
                {recentRuns.length > 0 && <SnapHint />}
              </Page>

              {recentRuns.length > 0 && (
                <Page>
                  <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
                    <span className="meta">Latest</span>
                  </header>
                  <Caption>
                    <h2 className="display text-display m-0">Recent runs</h2>
                    <div className="mt-5 max-h-[44vh] overflow-y-auto">
                      {recentRuns.map((s) => (
                        <div key={s.id} className="flex items-center justify-between gap-3 py-3 border-t border-scrim/8">
                          <div className="min-w-0">
                            <p className="text-label text-scrim m-0 truncate capitalize">
                              {s.runType?.replace('_', ' ') ?? 'Run'}
                            </p>
                            <p className="meta">{fmtDate(s.sessionDate)}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {s.distanceKm && (
                              <p className="display text-figure tabular m-0">{s.distanceKm.toFixed(2)} km</p>
                            )}
                            {s.avgPaceSecs && <p className="meta">{fmtPace(s.avgPaceSecs)}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Caption>
                </Page>
              )}
            </>
          )}
        </>
      )}
    </Pager>
  )
}