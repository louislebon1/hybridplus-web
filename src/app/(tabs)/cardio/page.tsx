'use client'

import { useState } from 'react'
import { useCardioStore } from '@/stores/cardio-store'
import { Button, Input, EmptyState } from '@/components/ui'
import type { ActivityType, RunSessionType } from '@/types'
import { localDateStr } from '@/lib/date'

const ACTIVITY_ICONS: Record<ActivityType, string> = {
  run: '🏃', swim: '🏊', cycle: '🚴', walk: '🚶', row: '🚣',
}

function fmtPace(paceSecs: number | null) {
  if (!paceSecs) return '—'
  const m = Math.floor(paceSecs / 60)
  const s = Math.round(paceSecs % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

function fmtDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function CardioPage() {
  const { sessions, addSession, deleteSession } = useCardioStore()
  const [tab, setTab] = useState<'history' | 'log'>('history')

  const [form, setForm] = useState({
    activityType: 'run' as ActivityType,
    sessionDate: localDateStr(),
    hours: '', minutes: '30',
    distanceKm: '', heartRate: '', rpe: '',
    runType: 'easy' as RunSessionType,
    notes: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const durationSeconds = (parseInt(form.hours || '0') * 3600) + (parseInt(form.minutes || '0') * 60)
    const distKm = form.distanceKm ? parseFloat(form.distanceKm) : null
    const paceSecs = distKm && durationSeconds ? durationSeconds / distKm : null
    addSession({
      activityType: form.activityType,
      sessionDate: form.sessionDate,
      startedAt: null, completedAt: null,
      durationSeconds,
      distanceKm: distKm,
      avgPaceSecs: paceSecs,
      avgSpeedKmh: distKm && durationSeconds ? (distKm / durationSeconds) * 3600 : null,
      avgHeartRate: form.heartRate ? parseInt(form.heartRate) : null,
      maxHeartRate: null,
      elevationGainM: null, elevationLossM: null,
      rpe: form.rpe ? parseInt(form.rpe) : null,
      runType: form.activityType === 'run' ? form.runType : null,
      cadenceSpm: null,
      stroke: null, poolLengthM: null, swolfScore: null,
      avgPowerWatts: null, cadenceRpm: null, strokeRateSpm: null,
      surface: null,
      notes: form.notes || null,
      splits: [],
    })
    setForm({ activityType: 'run', sessionDate: localDateStr(), hours: '', minutes: '30', distanceKm: '', heartRate: '', rpe: '', runType: 'easy', notes: '' })
    setTab('history')
  }

  const sorted = [...sessions].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 pt-12 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-normal text-text">Cardio</h1>
      </div>

      {/* Tabs */}
      <div className="flex px-5 gap-1 mb-4 flex-shrink-0">
        {(['history', 'log'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-2 rounded-xl text-sm font-normal transition-colors',
              tab === t ? 'bg-accent text-accent-fg' : 'bg-bg-element text-text-secondary',
            ].join(' ')}
          >
            {t === 'history' ? 'History' : 'Log Session'}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-2">
          {sorted.length === 0 ? (
            <EmptyState
              icon="🏃"
              title="No cardio logged yet"
              description="Log your first session to start tracking"
              action={{ label: 'Log Session', onClick: () => setTab('log') }}
            />
          ) : (
            sorted.map((s) => (
              <div key={s.id} className="bg-bg-element border border-border rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{ACTIVITY_ICONS[s.activityType]}</span>
                    <div>
                      <p className="text-sm font-normal text-text capitalize">
                        {s.runType ? `${s.runType.replace('_', ' ')} ` : ''}{s.activityType}
                      </p>
                      <p className="text-xs text-text-secondary">{fmtDate(s.sessionDate)}</p>
                    </div>
                  </div>
                  <button onClick={() => { if (window.confirm('Delete this session?')) deleteSession(s.id) }} className="text-xs text-error">✕</button>
                </div>
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-xs text-text-tertiary">Duration</p>
                    <p className="text-sm font-normal text-text tabular">{fmtDuration(s.durationSeconds)}</p>
                  </div>
                  {s.distanceKm && (
                    <div>
                      <p className="text-xs text-text-tertiary">Distance</p>
                      <p className="text-sm font-normal text-text tabular">{s.distanceKm.toFixed(2)} km</p>
                    </div>
                  )}
                  {s.avgPaceSecs && (
                    <div>
                      <p className="text-xs text-text-tertiary">Avg pace</p>
                      <p className="text-sm font-normal text-text tabular">{fmtPace(s.avgPaceSecs)}</p>
                    </div>
                  )}
                  {s.avgHeartRate && (
                    <div>
                      <p className="text-xs text-text-tertiary">HR</p>
                      <p className="text-sm font-normal text-text tabular">{s.avgHeartRate} bpm</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-4">
          {/* Activity type */}
          <div>
            <p className="text-sm font-normal text-text mb-2">Activity</p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {(['run','swim','cycle','walk','row'] as ActivityType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, activityType: type }))}
                  className={[
                    'flex-shrink-0 px-4 py-2 rounded-full text-sm font-normal border transition-colors',
                    form.activityType === type
                      ? 'bg-accent text-accent-fg border-accent'
                      : 'border-border text-text-secondary hover:bg-bg-element',
                  ].join(' ')}
                >
                  {ACTIVITY_ICONS[type]} {type}
                </button>
              ))}
            </div>
          </div>

          <Input label="Date" type="date" value={form.sessionDate} onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))} />

          <div>
            <p className="text-sm font-normal text-text mb-2">Duration</p>
            <div className="flex gap-2">
              <Input placeholder="0" type="number" min="0" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} />
              <span className="self-center text-text-secondary text-sm">h</span>
              <Input placeholder="30" type="number" min="0" max="59" value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))} />
              <span className="self-center text-text-secondary text-sm">m</span>
            </div>
          </div>

          <Input label="Distance (km)" type="number" step="0.01" placeholder="5.00" value={form.distanceKm} onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))} />
          <Input label="Avg heart rate (bpm)" type="number" placeholder="145" value={form.heartRate} onChange={(e) => setForm((f) => ({ ...f, heartRate: e.target.value }))} />
          <Input label="RPE (1–10)" type="number" min="1" max="10" placeholder="7" value={form.rpe} onChange={(e) => setForm((f) => ({ ...f, rpe: e.target.value }))} />

          {form.activityType === 'run' && (
            <div>
              <p className="text-sm font-normal text-text mb-2">Run type</p>
              <div className="flex flex-wrap gap-2">
                {(['easy','tempo','intervals','long_run','recovery','race'] as RunSessionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, runType: type }))}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs font-normal border transition-colors',
                      form.runType === type ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary',
                    ].join(' ')}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input label="Notes" placeholder="How did it feel?" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" size="lg" className="w-full">LOG SESSION</Button>
        </form>
      )}
    </div>
  )
}
