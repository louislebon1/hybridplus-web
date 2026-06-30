'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Check, ChevronLeft } from 'lucide-react'
import { useSessionStore, formatDuration, getElapsedSeconds, getRestRemaining } from '@/stores/session-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { useCardioStore } from '@/stores/cardio-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { Button, Input, Sheet } from '@/components/ui'
import type { ActivityType, RunSessionType } from '@/types'
import { localDateStr } from '@/lib/date'

const CARDIO_ICONS: Record<ActivityType, string> = { run: '🏃', swim: '🏊', cycle: '🚴', walk: '🚶', row: '🚣' }

const EMPTY_CARDIO_FORM = {
  activityType: 'run' as ActivityType,
  sessionDate: '',
  hours: '', minutes: '30',
  distanceKm: '', heartRate: '', rpe: '',
  runType: 'easy' as RunSessionType,
  notes: '',
}

const EXERCISES = [
  { id: 'sq', name: 'Squat' }, { id: 'bp', name: 'Bench Press' }, { id: 'dl', name: 'Deadlift' },
  { id: 'op', name: 'Overhead Press' }, { id: 'row', name: 'Barbell Row' }, { id: 'pull', name: 'Pull Up' },
  { id: 'rdl', name: 'Romanian Deadlift' }, { id: 'lgp', name: 'Leg Press' }, { id: 'inc', name: 'Incline Press' },
  { id: 'cable', name: 'Cable Fly' }, { id: 'curl', name: 'Barbell Curl' }, { id: 'tri', name: 'Tricep Pushdown' },
  { id: 'lat', name: 'Lat Pulldown' }, { id: 'shrug', name: 'Shrug' }, { id: 'fp', name: 'Face Pull' },
  { id: 'calf', name: 'Calf Raise' }, { id: 'lunge', name: 'Lunge' }, { id: 'dip', name: 'Dip' },
  { id: 'hc', name: 'Hammer Curl' }, { id: 'le', name: 'Leg Extension' },
]

function RestTimer() {
  const { restTimer, dismissRestTimer, addRestTime } = useSessionStore()
  const [remaining, setRemaining] = useState(0)

  useEffect(() => {
    if (!restTimer.isActive) return
    const interval = setInterval(() => setRemaining(getRestRemaining(restTimer)), 500)
    setRemaining(getRestRemaining(restTimer))
    return () => clearInterval(interval)
  }, [restTimer])

  if (!restTimer.isActive) return null

  return (
    <div className="flex-shrink-0 bg-accent/10 border-b border-accent/20 px-5 py-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-accent text-xs font-normal uppercase">Rest</span>
        <span className="text-accent font-normal tabular text-lg">{formatDuration(remaining)}</span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => addRestTime(60)} className="text-xs text-accent font-normal">+60s</button>
        <button onClick={dismissRestTimer} className="text-xs text-text-secondary">SKIP</button>
      </div>
    </div>
  )
}

export default function SessionPage() {
  const router = useRouter()
  const {
    activeSession, startSession, finishSession, abandonSession,
    addExerciseBlock, removeExerciseBlock, addSet, removeSet, updateSet, completeSet,
    setSessionNotes,
  } = useSessionStore()
  const { programmes } = useProgrammeStore()
  const { addSession: addCardioSession } = useCardioStore()
  const { events: calendarEvents } = useCalendarStore()

  const [elapsed, setElapsed] = useState(0)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [cardioForm, setCardioForm] = useState(EMPTY_CARDIO_FORM)
  const [showLogCardio, setShowLogCardio] = useState(false)

  function openCardioLog(preset?: { activityType: ActivityType; minutes?: number | null; km?: number | null }) {
    setCardioForm({
      ...EMPTY_CARDIO_FORM,
      sessionDate: localDateStr(),
      activityType: preset?.activityType ?? 'run',
      minutes: preset?.minutes ? String(preset.minutes) : '30',
      distanceKm: preset?.km ? String(preset.km) : '',
    })
    setShowLogCardio(true)
  }

  function handleCardioLog(e: React.FormEvent) {
    e.preventDefault()
    const durationSeconds = (parseInt(cardioForm.hours || '0') * 3600) + (parseInt(cardioForm.minutes || '0') * 60)
    const distKm = cardioForm.distanceKm ? parseFloat(cardioForm.distanceKm) : null
    const paceSecs = distKm && durationSeconds ? durationSeconds / distKm : null
    addCardioSession({
      activityType: cardioForm.activityType,
      sessionDate: cardioForm.sessionDate || localDateStr(),
      startedAt: null, completedAt: null,
      durationSeconds,
      distanceKm: distKm,
      avgPaceSecs: paceSecs,
      avgSpeedKmh: distKm && durationSeconds ? (distKm / durationSeconds) * 3600 : null,
      avgHeartRate: cardioForm.heartRate ? parseInt(cardioForm.heartRate) : null,
      maxHeartRate: null,
      elevationGainM: null, elevationLossM: null,
      rpe: cardioForm.rpe ? parseInt(cardioForm.rpe) : null,
      runType: cardioForm.activityType === 'run' ? cardioForm.runType : null,
      cadenceSpm: null, stroke: null, poolLengthM: null, swolfScore: null,
      avgPowerWatts: null, cadenceRpm: null, strokeRateSpm: null,
      surface: null,
      notes: cardioForm.notes || null,
      splits: [],
    })
    setShowLogCardio(false)
    router.replace('/home')
  }

  useEffect(() => {
    if (!activeSession) return
    const interval = setInterval(() => setElapsed(getElapsedSeconds(activeSession)), 1000)
    setElapsed(getElapsedSeconds(activeSession))
    return () => clearInterval(interval)
  }, [activeSession])

  const allTemplates = programmes.flatMap((p) =>
    p.templates.map((t) => ({ ...t, programmeName: p.name, programmeId: p.id }))
  ).slice(0, 5)

  const allCardioTemplates = programmes.flatMap((p) =>
    (p.cardioTemplates ?? []).map((ct) => ({ ...ct, programmeName: p.name }))
  )

  const today = localDateStr()
  const todayEvents = calendarEvents[today] ?? []
  const todayStrengthIds = new Set(
    todayEvents
      .filter(e => e.eventType === 'strength' && e.workoutTemplateId)
      .map(e => e.workoutTemplateId!)
  )
  const CARDIO_TYPES = new Set(['run','swim','cycle','walk','row'])
  const todayCardioEvents = todayEvents.filter(e => CARDIO_TYPES.has(e.eventType))

  const filtered = exerciseSearch
    ? EXERCISES.filter((e) => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
    : EXERCISES

  if (!activeSession) {
    return (
      <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 flex-shrink-0">
          <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-element">
            <ChevronLeft size={20} className="text-text" />
          </button>
          <h1 className="text-xl font-normal text-text">Start Workout</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-5">
          {/* Quick start */}
          <button
            onClick={() => startSession(null, 'Quick Workout')}
            className="bg-accent text-accent-fg rounded-2xl p-5 text-left"
          >
            <p className="text-lg font-normal">Quick Start</p>
            <p className="text-sm opacity-80 mt-1">Start an empty session — add exercises as you go</p>
          </button>

          {/* Today's scheduled sessions */}
          {(todayStrengthIds.size > 0 || todayCardioEvents.length > 0) && (
            <div>
              <p className="eyebrow mb-3">Today</p>
              <div className="flex flex-col gap-2">
                {allTemplates
                  .filter(t => todayStrengthIds.has(t.id))
                  .map((t) => {
                    const store = useProgrammeStore.getState()
                    const ref = store.getTemplateRefWithOverrides(t.id, t.programmeId)
                    const activePhase = store.getActivePhase(t.programmeId)
                    const hasOverride = activePhase?.overrides.some(o => o.templateId === t.id)
                    return (
                      <button
                        key={t.id}
                        onClick={() => ref && startSession(ref)}
                        className="bg-accent/10 border border-accent/40 rounded-2xl px-4 py-3 text-left hover:bg-accent/15 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-text">{t.name}</p>
                          {hasOverride && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/20 text-accent">phase</span>
                          )}
                        </div>
                        <p className="text-[10px] text-accent/70">
                          {t.programmeName}{activePhase ? ` · ${activePhase.name}` : ''} · {t.exerciseBlocks.length} exercises
                        </p>
                      </button>
                    )
                  })}
                {todayCardioEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => openCardioLog({ activityType: ev.eventType as ActivityType })}
                    className="bg-white/5 border border-white/20 rounded-2xl px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                  >
                    <span className="text-xl">{CARDIO_ICONS[ev.eventType as ActivityType]}</span>
                    <div>
                      <p className="text-sm text-text">{ev.name ?? ev.eventType}</p>
                      <p className="text-[10px] text-text-secondary capitalize">
                        {ev.eventType}{ev.durationMinutes ? ` · ${ev.durationMinutes} min` : ''}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {allTemplates.length > 0 && (
            <div>
              <p className="eyebrow mb-3">From programme</p>
              <div className="flex flex-col gap-2">
                {allTemplates.map((t) => {
                  const store = useProgrammeStore.getState()
                  const ref = store.getTemplateRefWithOverrides(t.id, t.programmeId)
                  const activePhase = store.getActivePhase(t.programmeId)
                  const hasOverride = activePhase?.overrides.some(o => o.templateId === t.id)
                  const isToday = todayStrengthIds.has(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => ref && startSession(ref)}
                      className={['rounded-2xl px-4 py-3 text-left transition-colors border', isToday ? 'opacity-40 bg-bg-element border-border' : 'bg-bg-element border-border hover:bg-bg-hover'].join(' ')}
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-text">{t.name}</p>
                        {hasOverride && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">phase</span>
                        )}
                      </div>
                      <p className="text-[10px] text-text-secondary">
                        {t.programmeName}{activePhase ? ` · ${activePhase.name}` : ''} · {t.exerciseBlocks.length} exercises
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Cardio */}
          <div>
            <p className="eyebrow mb-3">Log cardio</p>
            <div className="flex flex-col gap-2">
              {allCardioTemplates.length > 0 && allCardioTemplates.map((ct) => (
                <button
                  key={ct.id}
                  onClick={() => openCardioLog({ activityType: ct.activityType, minutes: ct.targetDurationMinutes, km: ct.targetDistanceKm })}
                  className="bg-bg-element border border-border rounded-2xl px-4 py-3 text-left hover:bg-bg-hover transition-colors flex items-center gap-3"
                >
                  <span className="text-xl">{CARDIO_ICONS[ct.activityType]}</span>
                  <div>
                    <p className="text-sm text-text">{ct.name}</p>
                    <p className="text-[10px] text-text-secondary">
                      {ct.programmeName} · {ct.activityType}
                      {ct.targetDurationMinutes ? ` · ${ct.targetDurationMinutes} min` : ''}
                      {ct.targetDistanceKm ? ` · ${ct.targetDistanceKm} km` : ''}
                    </p>
                  </div>
                </button>
              ))}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(['run', 'swim', 'cycle', 'walk', 'row'] as ActivityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => openCardioLog({ activityType: type })}
                    className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 bg-bg-element border border-border rounded-2xl hover:bg-bg-hover transition-colors"
                  >
                    <span className="text-xl">{CARDIO_ICONS[type]}</span>
                    <span className="text-xs text-text-secondary capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Log cardio sheet */}
      <Sheet visible={showLogCardio} onClose={() => setShowLogCardio(false)} title="Log Cardio">
        <form onSubmit={handleCardioLog} className="px-5 py-4 flex flex-col gap-4 pb-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['run', 'swim', 'cycle', 'walk', 'row'] as ActivityType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setCardioForm(f => ({ ...f, activityType: type }))}
                className={[
                  'flex-shrink-0 px-4 py-2 rounded-full text-sm border transition-colors',
                  cardioForm.activityType === type
                    ? 'bg-accent text-accent-fg border-accent'
                    : 'border-border text-text-secondary hover:bg-bg-element',
                ].join(' ')}
              >
                {CARDIO_ICONS[type]} {type}
              </button>
            ))}
          </div>

          <Input label="Date" type="date" value={cardioForm.sessionDate} onChange={e => setCardioForm(f => ({ ...f, sessionDate: e.target.value }))} />

          <div>
            <p className="text-sm font-normal text-text mb-2">Duration</p>
            <div className="flex gap-2 items-center">
              <Input placeholder="0" type="number" min="0" value={cardioForm.hours} onChange={e => setCardioForm(f => ({ ...f, hours: e.target.value }))} />
              <span className="text-text-secondary text-sm flex-shrink-0">h</span>
              <Input placeholder="30" type="number" min="0" max="59" value={cardioForm.minutes} onChange={e => setCardioForm(f => ({ ...f, minutes: e.target.value }))} />
              <span className="text-text-secondary text-sm flex-shrink-0">m</span>
            </div>
          </div>

          <Input label="Distance (km)" type="number" step="0.01" placeholder="5.00" value={cardioForm.distanceKm} onChange={e => setCardioForm(f => ({ ...f, distanceKm: e.target.value }))} />
          <Input label="Avg heart rate (bpm)" type="number" placeholder="145" value={cardioForm.heartRate} onChange={e => setCardioForm(f => ({ ...f, heartRate: e.target.value }))} />
          <Input label="RPE (1–10)" type="number" min="1" max="10" placeholder="7" value={cardioForm.rpe} onChange={e => setCardioForm(f => ({ ...f, rpe: e.target.value }))} />

          {cardioForm.activityType === 'run' && (
            <div>
              <p className="text-sm font-normal text-text mb-2">Run type</p>
              <div className="flex flex-wrap gap-2">
                {(['easy', 'tempo', 'intervals', 'long_run', 'recovery', 'race'] as RunSessionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCardioForm(f => ({ ...f, runType: type }))}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs border transition-colors',
                      cardioForm.runType === type ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary',
                    ].join(' ')}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input label="Notes" placeholder="How did it feel?" value={cardioForm.notes} onChange={e => setCardioForm(f => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" size="lg" className="w-full">LOG SESSION</Button>
        </form>
      </Sheet>
      </>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-10 pb-3 flex-shrink-0 border-b border-border">
        <button
          onClick={() => { if (window.confirm('Abandon this session? Progress will be lost.')) { abandonSession(); router.back() } }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-element text-text-secondary"
        >
          <X size={18} />
        </button>
        <div className="flex flex-col items-center">
          {editingName ? (
            <input
              autoFocus
              defaultValue={activeSession.name}
              onBlur={(e) => { useSessionStore.getState().activeSession && Object.assign(useSessionStore.getState().activeSession!, { name: e.target.value }); setEditingName(false) }}
              onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
              className="text-base font-normal text-text bg-transparent border-b border-accent text-center focus:outline-none w-40"
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="text-base font-normal text-text">{activeSession.name}</button>
          )}
          <span className="text-xs text-text-secondary tabular">{formatDuration(elapsed)}</span>
        </div>
        <Button
          size="sm"
          onClick={() => { finishSession(); router.replace('/home') }}
        >
          FINISH
        </Button>
      </div>

      {/* Rest timer */}
      <RestTimer />

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto pb-24">
        {activeSession.exerciseBlocks.map((block) => (
          <div key={block.id} className="border-b border-border">
            <div className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-normal text-text">{block.exerciseName}</p>
                <p className="text-xs text-text-secondary">{block.sets.filter((s) => s.isCompleted).length}/{block.sets.length} sets</p>
              </div>
              <button onClick={() => removeExerciseBlock(block.id)} className="text-error text-xs">✕</button>
            </div>

            {/* Set rows */}
            <div className="px-3 pb-2">
              <div className="grid grid-cols-[28px_1fr_1fr_1fr_32px] gap-1 px-2 mb-1">
                {['#', 'kg', 'reps', 'RPE', ''].map((h) => (
                  <span key={h} className="text-[10px] font-normal text-text-tertiary text-center">{h}</span>
                ))}
              </div>
              {block.sets.map((set) => (
                <div
                  key={set.id}
                  className={[
                    'grid grid-cols-[28px_1fr_1fr_1fr_32px] gap-1 items-center px-1 py-0.5 rounded-lg mb-0.5',
                    set.isCompleted ? 'bg-success/10' : '',
                  ].join(' ')}
                >
                  <span className="text-xs text-text-tertiary text-center">{set.setNumber}</span>
                  <input
                    type="number"
                    step="0.5"
                    placeholder={block.targetWeightKg?.toString() ?? '—'}
                    value={set.weightValue ?? ''}
                    onChange={(e) => updateSet(block.id, set.id, { weightValue: e.target.value ? parseFloat(e.target.value) : null })}
                    className="h-8 w-full text-center text-sm text-text bg-bg-element rounded-lg border border-border focus:outline-none focus:border-accent tabular"
                  />
                  <input
                    type="number"
                    placeholder={block.targetRepsMin?.toString() ?? '—'}
                    value={set.reps ?? ''}
                    onChange={(e) => updateSet(block.id, set.id, { reps: e.target.value ? parseInt(e.target.value) : null })}
                    className="h-8 w-full text-center text-sm text-text bg-bg-element rounded-lg border border-border focus:outline-none focus:border-accent tabular"
                  />
                  <input
                    type="number"
                    min="1" max="10"
                    placeholder="—"
                    value={set.rpe ?? ''}
                    onChange={(e) => updateSet(block.id, set.id, { rpe: e.target.value ? parseFloat(e.target.value) : null })}
                    className="h-8 w-full text-center text-sm text-text bg-bg-element rounded-lg border border-border focus:outline-none focus:border-accent tabular"
                  />
                  <button
                    onClick={() => completeSet(block.id, set.id)}
                    className={[
                      'w-7 h-7 rounded-full flex items-center justify-center border transition-colors',
                      set.isCompleted
                        ? 'bg-success border-success text-white'
                        : 'border-border text-text-tertiary hover:border-success hover:text-success',
                    ].join(' ')}
                  >
                    <Check size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2 mt-1 px-1">
                <button
                  onClick={() => addSet(block.id)}
                  className="flex-1 text-xs text-accent font-normal py-1.5 border border-dashed border-accent/30 rounded-lg hover:bg-accent/5"
                >
                  + Add set
                </button>
                {block.sets.length > 1 && (
                  <button
                    onClick={() => removeSet(block.id, block.sets[block.sets.length - 1].id)}
                    className="text-xs text-error px-2"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {activeSession.exerciseBlocks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
            <span className="text-4xl">🏋️</span>
            <p className="text-text-secondary text-sm">No exercises added yet</p>
            <button
              onClick={() => { setExerciseSearch(''); setShowAddExercise(true) }}
              className="text-accent text-sm font-normal"
            >
              + Add your first exercise
            </button>
          </div>
        )}
      </div>

      {/* Add exercise button */}
      <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-2 bg-bg border-t border-border">
        <Button
          variant="secondary"
          size="lg"
          className="w-full"
          onClick={() => { setExerciseSearch(''); setShowAddExercise(true) }}
        >
          <Plus size={18} />
          ADD EXERCISE
        </Button>
      </div>

      {/* Exercise search sheet */}
      <Sheet visible={showAddExercise} onClose={() => setShowAddExercise(false)} title="Add Exercise">
        <div className="px-5 pt-4 pb-2">
          <Input
            placeholder="Search exercises…"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="divide-y divide-border">
          {filtered.map((ex) => (
            <button
              key={ex.id}
              className="w-full text-left px-5 py-3.5 text-sm text-text hover:bg-bg-element"
              onClick={() => {
                addExerciseBlock({ id: ex.id, name: ex.name, category: 'full body', equipment: 'barbell', primaryMuscles: [] })
                setShowAddExercise(false)
              }}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  )
}
