'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react'
import { useSessionStore, formatDuration, getElapsedSeconds, getRestRemaining, getActiveSet } from '@/stores/session-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { useCardioStore } from '@/stores/cardio-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { Button, Input, Sheet } from '@/components/ui'
import type { ActivityType, RunSessionType } from '@/types'
import { localDateStr } from '@/lib/date'
import { EXERCISE_LIBRARY_SORTED } from '@/lib/exercise-library'

const CARDIO_ICONS: Record<ActivityType, string> = { run: '🏃', swim: '🏊', cycle: '🚴', walk: '🚶', row: '🚣' }

const EMPTY_CARDIO_FORM = {
  activityType: 'run' as ActivityType,
  sessionDate: '',
  hours: '', minutes: '30',
  distanceKm: '', heartRate: '', rpe: '',
  runType: 'easy' as RunSessionType,
  notes: '',
}

const stepperBtn = 'w-9 h-9 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0 outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-bg-hover active:scale-90 active:bg-bg-selected focus-visible:ring-2 focus-visible:ring-accent/50'

const REST_RING_RADIUS = 100
const REST_RING_CIRCUMFERENCE = 2 * Math.PI * REST_RING_RADIUS

function RestRing({ pct, label, sublabel }: { pct: number; label: string; sublabel: string }) {
  const offset = REST_RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, pct)))
  return (
    <div className="relative w-[220px] h-[220px] flex items-center justify-center flex-shrink-0">
      <svg width={220} height={220} viewBox="0 0 220 220" className="-rotate-90 absolute inset-0">
        <circle cx={110} cy={110} r={REST_RING_RADIUS} fill="none" stroke="rgba(17,17,17,0.08)" strokeWidth={12} />
        <circle
          cx={110} cy={110} r={REST_RING_RADIUS} fill="none" stroke="var(--accent)" strokeWidth={12}
          strokeDasharray={REST_RING_CIRCUMFERENCE} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col items-center gap-1">
        <p className="font-medium text-[72px] leading-none text-text tabular">{label}</p>
        <p className="text-caption font-medium text-text/40 uppercase tracking-wide">{sublabel}</p>
      </div>
    </div>
  )
}

export default function SessionPage() {
  const router = useRouter()
  const {
    activeSession, activeBlockId, startSession, finishSession, abandonSession,
    addExerciseBlock, substituteExercise, updateSet, completeSet, removeSet,
    setSessionName, setActiveBlock,
    restTimer, dismissRestTimer, addRestTime,
  } = useSessionStore()
  const { programmes } = useProgrammeStore()
  const { addSession: addCardioSession } = useCardioStore()
  const { events: calendarEvents } = useCalendarStore()

  const [elapsed, setElapsed] = useState(0)
  const [restRemaining, setRestRemaining] = useState(0)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [showSwapExercise, setShowSwapExercise] = useState(false)
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

  useEffect(() => {
    if (!restTimer.isActive) return
    const interval = setInterval(() => setRestRemaining(getRestRemaining(restTimer)), 500)
    setRestRemaining(getRestRemaining(restTimer))
    return () => clearInterval(interval)
  }, [restTimer])

  // Once every set in the current exercise is logged, jump to the next exercise that still has one
  useEffect(() => {
    if (!activeSession) return
    const block = activeSession.exerciseBlocks.find(b => b.id === activeBlockId)
    if (block && !getActiveSet(block)) {
      const next = [...activeSession.exerciseBlocks]
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .find(b => getActiveSet(b))
      if (next && next.id !== activeBlockId) setActiveBlock(next.id)
    }
  }, [activeSession, activeBlockId, setActiveBlock])

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

  const filteredLibrary = exerciseSearch.trim()
    ? EXERCISE_LIBRARY_SORTED.filter((e) => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
    : EXERCISE_LIBRARY_SORTED

  if (!activeSession) {
    return (
      <>
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-4 pt-12 pb-4 flex-shrink-0">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0">
            <ArrowLeft size={16} className="text-accent" />
          </button>
          <h1 className="text-h3 font-medium text-text">Start Workout</h1>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-5">
          {/* Quick start */}
          <button
            onClick={() => startSession(null, 'Quick Workout')}
            className="bg-accent text-accent-fg rounded-2xl p-5 text-left"
          >
            <p className="text-h4 font-medium">Quick Start</p>
            <p className="text-label opacity-80 mt-1">Start an empty session — add exercises as you go</p>
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
                    return (
                      <button key={t.id} onClick={() => ref && startSession(ref)} className="relative overflow-hidden bg-text/[0.03] border border-text/[0.08] rounded-xl px-5 py-3 min-h-[68px] flex flex-col justify-center gap-1.5 text-left w-full outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-text/[0.06] active:scale-[0.98] active:bg-text/[0.08] focus-visible:ring-2 focus-visible:ring-accent/50">
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-accent" />
                        <div className="flex items-center gap-2">
                          <span className="text-tag uppercase text-accent-fg bg-accent px-2.5 py-1 rounded-full">Strength</span>
                          {activePhase && <span className="text-tag uppercase text-text/40">{activePhase.name}</span>}
                        </div>
                        <span className="text-body leading-5 font-medium text-text">{t.name}</span>
                      </button>
                    )
                  })}
                {todayCardioEvents.map(ev => (
                  <button key={ev.id} onClick={() => openCardioLog({ activityType: ev.eventType as ActivityType })} className="relative overflow-hidden bg-text/[0.03] border border-text/[0.08] rounded-xl px-5 py-3 min-h-[68px] flex flex-col justify-center gap-1.5 text-left w-full outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-text/[0.06] active:scale-[0.98] active:bg-text/[0.08] focus-visible:ring-2 focus-visible:ring-accent/50">
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-text" />
                    <span className="text-tag uppercase text-accent-fg bg-text px-2.5 py-1 rounded-full inline-flex items-center w-fit">{ev.eventType}</span>
                    <span className="text-body leading-5 font-medium text-text">{ev.name ?? ev.eventType}</span>
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
                  const isToday = todayStrengthIds.has(t.id)
                  return (
                    <button key={t.id} onClick={() => ref && startSession(ref)} className={`relative overflow-hidden bg-text/[0.03] border border-text/[0.08] rounded-xl px-5 py-3 min-h-[68px] flex flex-col justify-center gap-1.5 text-left w-full outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-text/[0.06] active:scale-[0.98] active:bg-text/[0.08] focus-visible:ring-2 focus-visible:ring-accent/50 ${isToday ? 'opacity-40' : ''}`}>
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-accent" />
                      <div className="flex items-center gap-2">
                        <span className="text-tag uppercase text-accent-fg bg-accent px-2.5 py-1 rounded-full">Strength</span>
                        {activePhase && <span className="text-tag uppercase text-text/40">{activePhase.name}</span>}
                      </div>
                      <span className="text-body leading-5 font-medium text-text">{t.name}</span>
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
                <button key={ct.id} onClick={() => openCardioLog({ activityType: ct.activityType, minutes: ct.targetDurationMinutes, km: ct.targetDistanceKm })} className="relative overflow-hidden bg-text/[0.03] border border-text/[0.08] rounded-xl px-5 py-3 min-h-[68px] flex flex-col justify-center gap-1.5 text-left w-full outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-text/[0.06] active:scale-[0.98] active:bg-text/[0.08] focus-visible:ring-2 focus-visible:ring-accent/50">
                  <div className="absolute left-0 top-0 bottom-0 w-2 bg-text" />
                  <div className="flex items-center gap-2">
                    <span className="text-tag uppercase text-accent-fg bg-text px-2.5 py-1 rounded-full">{ct.activityType}</span>
                    {ct.targetDurationMinutes && <span className="text-tag uppercase text-text/40">{ct.targetDurationMinutes}M</span>}
                  </div>
                  <span className="text-body leading-5 font-medium text-text">{ct.name}</span>
                </button>
              ))}
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {(['run', 'swim', 'cycle', 'walk', 'row'] as ActivityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => openCardioLog({ activityType: type })}
                    className="flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 bg-bg-element border border-border rounded-2xl hover:bg-bg-hover transition-colors"
                  >
                    <span className="text-h3">{CARDIO_ICONS[type]}</span>
                    <span className="text-caption text-text-secondary capitalize">{type}</span>
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
                  'flex-shrink-0 px-4 py-2 rounded-full text-label border transition-colors',
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
            <p className="text-label font-medium text-text mb-2">Duration</p>
            <div className="flex gap-2 items-center">
              <Input placeholder="0" type="number" min="0" value={cardioForm.hours} onChange={e => setCardioForm(f => ({ ...f, hours: e.target.value }))} />
              <span className="text-text-secondary text-label flex-shrink-0">h</span>
              <Input placeholder="30" type="number" min="0" max="59" value={cardioForm.minutes} onChange={e => setCardioForm(f => ({ ...f, minutes: e.target.value }))} />
              <span className="text-text-secondary text-label flex-shrink-0">m</span>
            </div>
          </div>

          <Input label="Distance (km)" type="number" step="0.01" placeholder="5.00" value={cardioForm.distanceKm} onChange={e => setCardioForm(f => ({ ...f, distanceKm: e.target.value }))} />
          <Input label="Avg heart rate (bpm)" type="number" placeholder="145" value={cardioForm.heartRate} onChange={e => setCardioForm(f => ({ ...f, heartRate: e.target.value }))} />
          <Input label="RPE (1–10)" type="number" min="1" max="10" placeholder="7" value={cardioForm.rpe} onChange={e => setCardioForm(f => ({ ...f, rpe: e.target.value }))} />

          {cardioForm.activityType === 'run' && (
            <div>
              <p className="text-label font-medium text-text mb-2">Run type</p>
              <div className="flex flex-wrap gap-2">
                {(['easy', 'tempo', 'intervals', 'long_run', 'recovery', 'race'] as RunSessionType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setCardioForm(f => ({ ...f, runType: type }))}
                    className={[
                      'px-3 py-1.5 rounded-full text-caption border transition-colors',
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

  // ── Active session: one exercise at a time ────────────────────────────────

  const sortedBlocks = [...activeSession.exerciseBlocks].sort((a, b) => a.orderIndex - b.orderIndex)
  const currentBlock = sortedBlocks.find(b => b.id === activeBlockId)
    ?? sortedBlocks.find(b => getActiveSet(b))
    ?? sortedBlocks[0]
    ?? null
  const currentIndex = currentBlock ? sortedBlocks.findIndex(b => b.id === currentBlock.id) : -1
  const currentSet = currentBlock ? getActiveSet(currentBlock) : null
  const prevBlock = currentIndex > 0 ? sortedBlocks[currentIndex - 1] : null
  const nextBlock = currentIndex >= 0 && currentIndex < sortedBlocks.length - 1 ? sortedBlocks[currentIndex + 1] : null
  const setPosition = currentBlock ? currentBlock.sets.findIndex(s => s.id === currentSet?.id) : -1

  function stepWeight(delta: number) {
    if (!currentBlock || !currentSet) return
    const base = currentSet.weightValue ?? currentSet.targetWeightKg ?? 0
    updateSet(currentBlock.id, currentSet.id, { weightValue: Math.max(0, base + delta) })
  }
  function stepReps(delta: number) {
    if (!currentBlock || !currentSet) return
    const base = currentSet.reps ?? currentSet.targetReps ?? 0
    updateSet(currentBlock.id, currentSet.id, { reps: Math.max(0, base + delta) })
  }
  function stepRpe(delta: number) {
    if (!currentBlock || !currentSet) return
    const base = currentSet.rpe ?? currentSet.targetRpe ?? 5
    updateSet(currentBlock.id, currentSet.id, { rpe: Math.min(10, Math.max(1, base + delta)) })
  }

  function handleFinish() {
    finishSession()
    router.replace('/session/complete')
  }

  function handleLogSet() {
    if (!currentBlock || !currentSet) return
    const updates: Partial<typeof currentSet> = {}
    if (currentSet.weightValue === null) updates.weightValue = currentSet.targetWeightKg
    if (currentSet.reps === null) updates.reps = currentSet.targetReps
    if (currentSet.rpe === null) updates.rpe = currentSet.targetRpe
    if (Object.keys(updates).length > 0) updateSet(currentBlock.id, currentSet.id, updates)
    completeSet(currentBlock.id, currentSet.id)
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4 pt-7 pb-6 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          {editingName ? (
            <input
              autoFocus
              defaultValue={activeSession.name}
              onBlur={(e) => { setSessionName(e.target.value); setEditingName(false) }}
              onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
              className="text-h3 font-medium leading-[26px] text-text bg-transparent border-b border-accent outline-none flex-1 min-w-0"
            />
          ) : (
            <button onClick={() => setEditingName(true)} className="text-h3 font-medium leading-[26px] text-text text-left min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
              {activeSession.name}
            </button>
          )}
          <button
            onClick={() => { if (window.confirm('Abandon this session? Progress will be lost.')) { abandonSession(); router.back() } }}
            className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0 ml-3"
          >
            <X size={16} className="text-accent" />
          </button>
        </div>
        <p className="text-caption font-medium text-accent tabular">{formatDuration(elapsed)}</p>
      </div>

      {restTimer.isActive ? (
        /* ── Resting ── */
        <>
          <div className="flex-1 flex flex-col gap-6 items-center justify-center px-4 py-6">
            <RestRing
              pct={restTimer.durationSeconds ? restRemaining / restTimer.durationSeconds : 0}
              label={formatDuration(restRemaining)}
              sublabel="Resting"
            />
            <Button variant="primary" onClick={() => addRestTime(15)}>
              <Plus size={16} /> Add 15 seconds
            </Button>
            {nextBlock && (
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-tag uppercase text-accent">Next exercise</p>
                <p className="text-h2 font-medium leading-[30px] text-text">{nextBlock.exerciseName}</p>
              </div>
            )}
          </div>
          <div className="px-4 pb-6 flex-shrink-0">
            <Button size="lg" className="w-full" onClick={dismissRestTimer}>
              Skip rest <ChevronRight size={16} />
            </Button>
          </div>
        </>
      ) : currentBlock && currentSet ? (
        /* ── Logging a set ── */
        <>
          <div className="flex-1 overflow-y-auto flex flex-col gap-6">
            <div className="flex gap-4 items-center px-4 pt-6">
              <Button variant="secondary" className="flex-1" onClick={() => setShowSwapExercise(true)}>Swap exercise</Button>
            </div>

            <div className="flex flex-col gap-2 items-center text-center px-4">
              <p className="text-h1 text-text">{currentBlock.exerciseName}</p>
              <p className="text-tag uppercase text-accent">
                Set {setPosition + 1} / {currentBlock.sets.length}
              </p>
            </div>

            <div className="flex flex-col gap-2 items-center px-4">
              {/* Weight */}
              <div className="flex gap-3 items-center justify-center w-full">
                <button onClick={() => stepWeight(-2.5)} className={stepperBtn}><Minus size={16} className="text-accent" /></button>
                <div className="flex-1 max-w-[242px] bg-text/5 rounded-full py-2 flex items-center justify-center">
                  <span className="text-display text-text tabular">{currentSet.weightValue ?? currentSet.targetWeightKg ?? 0}</span>
                </div>
                <button onClick={() => stepWeight(2.5)} className={stepperBtn}><Plus size={16} className="text-accent" /></button>
              </div>
              {/* Reps */}
              <div className="flex gap-3 items-center justify-center w-full">
                <button onClick={() => stepReps(-1)} className={stepperBtn}><Minus size={16} className="text-accent" /></button>
                <div className="flex-1 max-w-[242px] bg-text/5 rounded-full py-2 flex items-center justify-center">
                  <span className="text-display text-text tabular">{currentSet.reps ?? currentSet.targetReps ?? 0}</span>
                </div>
                <button onClick={() => stepReps(1)} className={stepperBtn}><Plus size={16} className="text-accent" /></button>
              </div>
              {/* RPE */}
              <div className="flex gap-3 items-center justify-center w-full">
                <button onClick={() => stepRpe(-0.5)} className={stepperBtn}><Minus size={16} className="text-accent" /></button>
                <div className="flex-1 max-w-[242px] bg-text/5 rounded-full py-2 flex items-center justify-center">
                  <span className="text-display text-text tabular">{currentSet.rpe ?? currentSet.targetRpe ?? '—'}</span>
                </div>
                <button onClick={() => stepRpe(0.5)} className={stepperBtn}><Plus size={16} className="text-accent" /></button>
              </div>
            </div>
          </div>

          <div className="px-4 pb-6 pt-3 flex-shrink-0 flex flex-col gap-3">
            <Button size="lg" className="w-full" onClick={handleLogSet}>Log set</Button>
            <Button variant="secondary" size="lg" className="w-full" onClick={() => removeSet(currentBlock.id, currentSet.id)}>Delete set</Button>
          </div>

          {/* Prev / next exercise nav */}
          <div className="flex gap-4 p-4 flex-shrink-0">
            <button
              onClick={() => prevBlock && setActiveBlock(prevBlock.id)}
              disabled={!prevBlock}
              className={`w-12 h-12 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0 ${!prevBlock ? 'opacity-40' : ''}`}
            >
              <ChevronLeft size={18} className="text-accent" />
            </button>
            {nextBlock ? (
              <button onClick={() => setActiveBlock(nextBlock.id)} className="flex-1 h-12 rounded-full border border-accent bg-accent flex items-center justify-between pl-6 pr-3">
                <span className="text-body font-medium text-accent-fg">{nextBlock.exerciseName}</span>
                <ChevronRight size={20} className="text-accent-fg" />
              </button>
            ) : (
              <button onClick={handleFinish} className="flex-1 h-12 rounded-full border border-accent bg-accent flex items-center justify-between pl-6 pr-3">
                <span className="text-body font-medium text-accent-fg">Finish workout</span>
                <ChevronRight size={20} className="text-accent-fg" />
              </button>
            )}
          </div>
        </>
      ) : sortedBlocks.length > 0 ? (
        /* ── Every set logged ── */
        <div className="flex-1 flex flex-col items-center justify-center py-16 gap-4 text-center px-6">
          <span className="text-4xl">✅</span>
          <p className="text-text-secondary text-label">All sets logged</p>
          <Button size="lg" onClick={handleFinish}>Finish workout</Button>
        </div>
      ) : (
        /* ── No exercises yet ── */
        <div className="flex-1 flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
          <span className="text-4xl">🏋️</span>
          <p className="text-text-secondary text-label">No exercises added yet</p>
          <button onClick={() => { setExerciseSearch(''); setShowAddExercise(true) }} className="text-accent text-label font-medium">
            + Add your first exercise
          </button>
        </div>
      )}

      {/* Swap exercise sheet */}
      <Sheet visible={showSwapExercise} onClose={() => setShowSwapExercise(false)} title="Swap Exercise">
        <div className="px-5 pt-4 pb-2">
          <Input placeholder="Search exercises…" value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} autoFocus />
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {filteredLibrary.slice(0, 50).map((ex) => (
            <button
              key={ex.id}
              className="w-full text-left px-5 py-3.5 text-label text-text hover:bg-bg-element"
              onClick={() => {
                if (currentBlock) substituteExercise(currentBlock.id, { id: ex.id, name: ex.name, category: ex.category, equipment: ex.equipment, primaryMuscles: ex.primaryMuscles })
                setShowSwapExercise(false)
              }}
            >
              {ex.name}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Exercise search sheet (empty-session flow) */}
      <Sheet visible={showAddExercise} onClose={() => setShowAddExercise(false)} title="Add Exercise">
        <div className="px-5 pt-4 pb-2">
          <Input
            placeholder="Search exercises…"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {filteredLibrary.slice(0, 50).map((ex) => (
            <button
              key={ex.id}
              className="w-full text-left px-5 py-3.5 text-label text-text hover:bg-bg-element"
              onClick={() => {
                addExerciseBlock({ id: ex.id, name: ex.name, category: ex.category, equipment: ex.equipment, primaryMuscles: ex.primaryMuscles })
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
