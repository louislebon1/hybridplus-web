'use client'
import { Footprints, X } from 'lucide-react'
import { Page } from '@/components/feed'

import { useState } from 'react'
import { useCardioStore } from '@/stores/cardio-store'
import { Button, Input, EmptyState } from '@/components/ui'
import type { ActivityType, RunSessionType } from '@/types'
import { localDateStr } from '@/lib/date'
import { ActivityIcon } from '@/lib/activity-icons'

function fmtPace(paceSecs: number | null) {
  if (!paceSecs) return '—'
  const m = Math.floor(paceSecs / 60)
  const s = Math.round(paceSecs % 60)
  return `${m}:${String(s).padStart(2, '0')} /km`
}

function fmtDuration(secs: number) {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h> 0) return `${h}h ${m}m`
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
    <Page>
      {/* Header */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-4 flex-shrink-0">
        <h1 className="display text-display m-0">Cardio</h1>
      </header>

      {/* Tabs */}
      <div className="px-5 flex gap-2 flex-shrink-0">
        {(['history', 'log'] as const).map((t) => (
          <button key={t}
            onClick={() => setTab(t)}
            className={['px-4 py-2 rounded-pill border cursor-pointer meta transition-colors duration-150', t === tab ? 'bg-scrim text-void border-transparent' : 'matt'].join(' ')}>
            {t === 'history' ? 'History' : 'Log Session'}
          </button>
        ))}
      </div>

      {tab === 'history' ? (
        <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-32 flex flex-col gap-4 pt-4">
          {sorted.length === 0 ? (
            <EmptyState icon={Footprints}
              title="No cardio logged yet"
              description="Log your first session to start tracking"
              action={{ label: 'Log Session', onClick: () => setTab('log') }} />
          ) : (
            sorted.map((s) => (
              <div key={s.id} className="matt rounded-card p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <ActivityIcon type={s.activityType} size={22} className="text-scrim flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="display text-figure m-0 truncate capitalize">
                        {s.runType ? `${s.runType.replace('_', ' ')} ` : ''}{s.activityType}
                      </p>
                      <p className="meta">{fmtDate(s.sessionDate)}</p>
                    </div>
                  </div>
                  <button aria-label="Delete session" className="w-9 h-9 rounded-pill matt flex items-center justify-center text-fog flex-shrink-0 cursor-pointer" onClick={() => { if (window.confirm('Delete this session?')) deleteSession(s.id) }}><X size={14} /></button>
                </div>
                <div>
                  <div>
                    <p>Duration</p>
                    <p>{fmtDuration(s.durationSeconds)}</p>
                  </div>
                  {s.distanceKm && (
                    <div>
                      <p>Distance</p>
                      <p>{s.distanceKm.toFixed(2)} km</p>
                    </div>
                  )}
                  {s.avgPaceSecs && (
                    <div>
                      <p>Avg pace</p>
                      <p>{fmtPace(s.avgPaceSecs)}</p>
                    </div>
                  )}
                  {s.avgHeartRate && (
                    <div>
                      <p>HR</p>
                      <p>{s.avgHeartRate} bpm</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-5 pt-4 pb-32 flex flex-col gap-4">
          {/* Activity type */}
          <div>
            <p>Activity</p>
            <div>
              {(['run','swim','cycle','walk','row'] as ActivityType[]).map((type) => (
                <button key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, activityType: type }))}>
                  <span><ActivityIcon type={type} size={14} />{type}</span>
                </button>
              ))}
            </div>
          </div>

          <Input label="Date" type="date" value={form.sessionDate} onChange={(e) => setForm((f) => ({ ...f, sessionDate: e.target.value }))} />

          <div>
            <p>Duration</p>
            <div>
              <Input placeholder="0" type="number" min="0" value={form.hours} onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))} />
              <span>h</span>
              <Input placeholder="30" type="number" min="0" max="59" value={form.minutes} onChange={(e) => setForm((f) => ({ ...f, minutes: e.target.value }))} />
              <span>m</span>
            </div>
          </div>

          <Input label="Distance (km)" type="number" step="0.01" placeholder="5.00" value={form.distanceKm} onChange={(e) => setForm((f) => ({ ...f, distanceKm: e.target.value }))} />
          <Input label="Avg heart rate (bpm)" type="number" placeholder="145" value={form.heartRate} onChange={(e) => setForm((f) => ({ ...f, heartRate: e.target.value }))} />
          <Input label="RPE (1–10)" type="number" min="1" max="10" placeholder="7" value={form.rpe} onChange={(e) => setForm((f) => ({ ...f, rpe: e.target.value }))} />

          {form.activityType === 'run' && (
            <div>
              <p>Run type</p>
              <div>
                {(['easy','tempo','intervals','long_run','recovery','race'] as RunSessionType[]).map((type) => (
                  <button key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, runType: type }))}>
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input label="Notes" placeholder="How did it feel?" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" size="lg">LOG SESSION</Button>
        </form>
      )}
    </Page>
  )
}
