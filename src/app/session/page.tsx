'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight, CircleCheck, Dumbbell, Minus, Plus, Repeat, Trash2, X } from 'lucide-react'
import { useSessionStore, formatDuration, getElapsedSeconds, getRestRemaining, getActiveSet } from '@/stores/session-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { useCardioStore } from '@/stores/cardio-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { Button, Input, Sheet, EmptyState } from '@/components/ui'
import { Pager, Page, Rail, RailAction, Caption, SnapHint, LoadField } from '@/components/feed'
import type { ActivityType, RunSessionType, CompletedSet } from '@/types'
import { localDateStr } from '@/lib/date'
import { EXERCISE_LIBRARY_SORTED } from '@/lib/exercise-library'
import { ActivityIcon } from '@/lib/activity-icons'

type EditableField = 'weight' | 'reps' | 'rpe'

const EMPTY_CARDIO_FORM = {
  activityType: 'run' as ActivityType,
  sessionDate: '',
  hours: '', minutes: '30',
  distanceKm: '', heartRate: '', rpe: '',
  runType: 'easy' as RunSessionType,
  notes: '',
}

const stepperBtn = 'w-9 h-9 rounded-full bg-bg-element flex items-center justify-center flex-shrink-0 outline-none transition-[background-color,transform] duration-150 ease-out hover:bg-bg-hover active:scale-90 active:bg-bg-selected focus-visible:ring-2 focus-visible:ring-text/60'

/**
 * One logging row: tap the steppers for quick adjustments, or type straight
 * into the field. The unit sits inside the field, with a matching-width
 * spacer opposite so the number stays optically centred as digits change.
 */
function ValueRow({
  label, unit, display, placeholder, onDec, onInc, onChange, onFocus, onBlur,
}: {
  label: string
  unit: string
  display: string
  placeholder?: string
  onDec: () => void
  onInc: () => void
  onChange: (raw: string) => void
  onFocus: () => void
  onBlur: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onDec}
        aria-label={`Decrease ${label}`}
        className="w-12 h-12 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer transition-transform duration-150 ease-out active:scale-90"
      >
        <Minus size={16} />
      </button>

      <div className="flex-1 min-w-0 h-16 rounded-card matt flex items-baseline justify-center gap-2 px-3 focus-within:border-scrim/45">
        <input
          type="number"
          inputMode="decimal"
          aria-label={label}
          value={display}
          placeholder={placeholder}
          onChange={e => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          className="display text-figure tabular w-0 flex-1 min-w-0 text-right bg-transparent border-0 outline-none text-scrim placeholder:text-fog"
        />
        <span className="meta flex-shrink-0">{unit}</span>
      </div>

      <button
        onClick={onInc}
        aria-label={`Increase ${label}`}
        className="w-12 h-12 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer transition-transform duration-150 ease-out active:scale-90"
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

const REST_RING_RADIUS = 100
const REST_RING_CIRCUMFERENCE = 2 * Math.PI * REST_RING_RADIUS

/** Most recent past session's set at the same set-index for this exercise, if any. */
function getLastTimeSet(
  exerciseId: string,
  setIndex: number,
  history: { exercises: { exerciseId: string; sets: CompletedSet[] }[] }[],
): CompletedSet | null {
  for (const session of history) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId)
    const set = ex?.sets[setIndex]
    if (set && (set.weight != null || set.reps != null)) return set
  }
  return null
}

function fmtLastTime(set: CompletedSet): string {
  const parts: string[] = []
  if (set.weight != null) parts.push(`${set.weight}kg`)
  if (set.reps != null) parts.push(`${set.reps} reps`)
  if (set.rpe != null) parts.push(`RPE ${set.rpe}`)
  return parts.join(' × ')
}

function RestRing({ pct, label, sublabel }: { pct: number; label: string; sublabel: string }) {
  const offset = REST_RING_CIRCUMFERENCE * (1 - Math.min(1, Math.max(0, pct)))
  return (
    <div className="relative w-[240px] h-[240px] flex items-center justify-center flex-shrink-0">
      <svg width={240} height={240} viewBox="0 0 220 220" className="absolute inset-0 -rotate-90">
        <circle cx={110} cy={110} r={REST_RING_RADIUS} fill="none" stroke="var(--color-steel)" strokeWidth={10} />
        <circle
          cx={110} cy={110} r={REST_RING_RADIUS} fill="none" stroke="var(--color-scrim)" strokeWidth={10}
          strokeDasharray={REST_RING_CIRCUMFERENCE} strokeDashoffset={offset} strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col items-center">
        <p className="display text-hero tabular m-0 leading-none">{label}</p>
        <p className="meta mt-2">{sublabel}</p>
      </div>
    </div>
  )
}

export default function SessionPage() {
  const router = useRouter()
  const {
    activeSession, activeBlockId, startSession, finishSession, abandonSession,
    addExerciseBlock, substituteExercise, updateSet, completeSet, addSet, removeSet,
    setSessionName, setActiveBlock,
    restTimer, dismissRestTimer, addRestTime,
  } = useSessionStore()
  const { programmes } = useProgrammeStore()
  const { addSession: addCardioSession } = useCardioStore()
  const { events: calendarEvents } = useCalendarStore()
  const { sessions: pastSessions } = useSessionHistoryStore()

  const [elapsed, setElapsed] = useState(0)
  const [restRemaining, setRestRemaining] = useState(0)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [showSwapExercise, setShowSwapExercise] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [editingValue, setEditingValue] = useState('')
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
      <Pager>

        {/* ── Quick start: the hero item ─────────────────────────────────── */}
        <Page>
          <header className="flex items-center gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
            <button
              onClick={() => router.back()}
              aria-label="Back"
              className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
            <span className="meta">Start workout</span>
          </header>

          <Caption>
            <p className="meta">Empty session</p>
            <h1 className="display text-display m-0 mt-3">Quick Start</h1>
            <p className="text-label text-stone m-0 mt-2 max-w-[42ch]">
              Start with nothing on the board and add exercises as you go.
            </p>
            <button
              onClick={() => startSession(null, 'Quick Workout')}
              className="mt-5 h-14 px-7 rounded-pill bg-scrim text-void inline-flex items-center gap-2.5 border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              <Plus size={18} />
              <span className="display text-figure">Start empty</span>
            </button>
          </Caption>

          <SnapHint />
        </Page>

        {/* ── Today ──────────────────────────────────────────────────────── */}
        {(todayStrengthIds.size > 0 || todayCardioEvents.length > 0) && (
          <Page>
            <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
              <span className="meta">On the plan</span>
            </header>
            <Caption>
              <h2 className="display text-display m-0">Today</h2>
              <div className="flex flex-col gap-2 mt-4">
                {allTemplates
                  .filter(t => todayStrengthIds.has(t.id))
                  .map((t) => {
                    const store = useProgrammeStore.getState()
                    const ref = store.getTemplateRefWithOverrides(t.id, t.programmeId)
                    const activePhase = store.getActivePhase(t.programmeId)
                    return (
                      <button
                        key={t.id}
                        onClick={() => ref && startSession(ref)}
                        className="matt rounded-card px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-transform duration-150 ease-out active:scale-[0.99]"
                      >
                        <span className="min-w-0">
                          <span className="meta block">Strength{activePhase ? ' · ' + activePhase.name : ''}</span>
                          <span className="display text-figure block mt-1 truncate">{t.name}</span>
                        </span>
                        <ChevronRight size={18} className="text-fog flex-shrink-0" />
                      </button>
                    )
                  })}
                {todayCardioEvents.map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => openCardioLog({ activityType: ev.eventType as ActivityType })}
                    className="matt rounded-card px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-transform duration-150 ease-out active:scale-[0.99]"
                  >
                    <span className="min-w-0">
                      <span className="meta block">{ev.eventType}</span>
                      <span className="display text-figure block mt-1 truncate">{ev.name ?? ev.eventType}</span>
                    </span>
                    <ChevronRight size={18} className="text-fog flex-shrink-0" />
                  </button>
                ))}
              </div>
            </Caption>
            <SnapHint />
          </Page>
        )}

        {/* ── From programme ─────────────────────────────────────────────── */}
        {allTemplates.length > 0 && (
          <Page>
            <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
              <span className="meta">Saved</span>
            </header>
            <Caption>
              <h2 className="display text-display m-0">From programme</h2>
              <div className="flex flex-col gap-2 mt-4 max-h-[42vh] overflow-y-auto">
                {allTemplates.map((t) => {
                  const store = useProgrammeStore.getState()
                  const ref = store.getTemplateRefWithOverrides(t.id, t.programmeId)
                  const activePhase = store.getActivePhase(t.programmeId)
                  return (
                    <button
                      key={t.id}
                      onClick={() => ref && startSession(ref)}
                      className="matt rounded-card px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-transform duration-150 ease-out active:scale-[0.99]"
                    >
                      <span className="min-w-0">
                        <span className="meta block">Strength{activePhase ? ' · ' + activePhase.name : ''}</span>
                        <span className="display text-figure block mt-1 truncate">{t.name}</span>
                      </span>
                      <ChevronRight size={18} className="text-fog flex-shrink-0" />
                    </button>
                  )
                })}
              </div>
            </Caption>
            <SnapHint />
          </Page>
        )}

        {/* ── Cardio ─────────────────────────────────────────────────────── */}
        <Page>
          <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
            <span className="meta">After the fact</span>
          </header>
          <Caption>
            <h2 className="display text-display m-0">Log cardio</h2>

            {allCardioTemplates.length > 0 && (
              <div className="flex flex-col gap-2 mt-4">
                {allCardioTemplates.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() => openCardioLog({ activityType: ct.activityType, minutes: ct.targetDurationMinutes, km: ct.targetDistanceKm })}
                    className="matt rounded-card px-4 py-3.5 flex items-center justify-between gap-3 text-left cursor-pointer transition-transform duration-150 ease-out active:scale-[0.99]"
                  >
                    <span className="min-w-0">
                      <span className="meta block">
                        {ct.activityType}
                        {ct.targetDurationMinutes ? ' · ' + ct.targetDurationMinutes + ' min' : ''}
                      </span>
                      <span className="display text-figure block mt-1 truncate">{ct.name}</span>
                    </span>
                    <ChevronRight size={18} className="text-fog flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-5 gap-2 mt-4">
              {(['run', 'swim', 'cycle', 'walk', 'row'] as ActivityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => openCardioLog({ activityType: type })}
                  className="matt rounded-card py-3 flex flex-col items-center gap-2 text-scrim cursor-pointer transition-transform duration-150 ease-out active:scale-[0.96]"
                >
                  <ActivityIcon type={type} size={20} />
                  <span className="meta">{type}</span>
                </button>
              ))}
            </div>
          </Caption>
        </Page>

      </Pager>

      {/* Log cardio sheet */}
      <Sheet visible={showLogCardio} onClose={() => setShowLogCardio(false)} title="Log Cardio">
        <form onSubmit={handleCardioLog}>
          <div>
            {(['run', 'swim', 'cycle', 'walk', 'row'] as ActivityType[]).map((type) => (
              <button key={type}
                type="button"
                onClick={() => setCardioForm(f => ({ ...f, activityType: type }))}>
                <span><ActivityIcon type={type} size={14} />{type}</span>
              </button>
            ))}
          </div>

          <Input label="Date" type="date" value={cardioForm.sessionDate} onChange={e => setCardioForm(f => ({ ...f, sessionDate: e.target.value }))} />

          <div>
            <p>Duration</p>
            <div>
              <Input placeholder="0" type="number" min="0" value={cardioForm.hours} onChange={e => setCardioForm(f => ({ ...f, hours: e.target.value }))} />
              <span>h</span>
              <Input placeholder="30" type="number" min="0" max="59" value={cardioForm.minutes} onChange={e => setCardioForm(f => ({ ...f, minutes: e.target.value }))} />
              <span>m</span>
            </div>
          </div>

          <Input label="Distance (km)" type="number" step="0.01" placeholder="5.00" value={cardioForm.distanceKm} onChange={e => setCardioForm(f => ({ ...f, distanceKm: e.target.value }))} />
          <Input label="Avg heart rate (bpm)" type="number" placeholder="145" value={cardioForm.heartRate} onChange={e => setCardioForm(f => ({ ...f, heartRate: e.target.value }))} />
          <Input label="RPE (1–10)" type="number" min="1" max="10" placeholder="7" value={cardioForm.rpe} onChange={e => setCardioForm(f => ({ ...f, rpe: e.target.value }))} />

          {cardioForm.activityType === 'run' && (
            <div>
              <p>Run type</p>
              <div>
                {(['easy', 'tempo', 'intervals', 'long_run', 'recovery', 'race'] as RunSessionType[]).map((type) => (
                  <button key={type}
                    type="button"
                    onClick={() => setCardioForm(f => ({ ...f, runType: type }))}>
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Input label="Notes" placeholder="How did it feel?" value={cardioForm.notes} onChange={e => setCardioForm(f => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" size="lg">LOG SESSION</Button>
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
  const prevBlock = currentIndex> 0 ? sortedBlocks[currentIndex - 1] : null
  const nextBlock = currentIndex>= 0 && currentIndex < sortedBlocks.length - 1 ? sortedBlocks[currentIndex + 1] : null
  const setPosition = currentBlock ? currentBlock.sets.findIndex(s => s.id === currentSet?.id) : -1
  const lastTimeSet = currentBlock && currentSet && setPosition>= 0 && currentSet.setType !== 'warm_up'
    ? getLastTimeSet(currentBlock.exerciseId, setPosition, pastSessions)
    : null

  // Effective values shown in the fields — the logged value, else the target.
  const weightValue = currentSet?.weightValue ?? currentSet?.targetWeightKg ?? 0
  const repsValue = currentSet?.reps ?? currentSet?.targetReps ?? 0
  const rpeValue = currentSet?.rpe ?? currentSet?.targetRpe ?? null

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

  /**
   * Typed edits commit to the store on every keystroke so "Log set" always
   * captures what's on screen, but the raw string is held locally while the
   * field has focus — otherwise clearing it to retype would immediately
   * snap back to the target value mid-entry.
   */
  function editField(field: EditableField, raw: string) {
    if (!currentBlock || !currentSet) return
    setEditingValue(raw)
    const parsed = raw.trim() === '' ? NaN : parseFloat(raw)
    const ok = !isNaN(parsed)
    if (field === 'weight') {
      updateSet(currentBlock.id, currentSet.id, { weightValue: ok ? Math.max(0, parsed) : null })
    } else if (field === 'reps') {
      updateSet(currentBlock.id, currentSet.id, { reps: ok ? Math.max(0, Math.round(parsed)) : null })
    } else {
      updateSet(currentBlock.id, currentSet.id, { rpe: ok ? Math.min(10, Math.max(1, parsed)) : null })
    }
  }

  function beginEdit(field: EditableField, current: string) {
    setEditingField(field)
    setEditingValue(current)
  }

  function endEdit() {
    setEditingField(null)
    setEditingValue('')
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
    if (Object.keys(updates).length> 0) updateSet(currentBlock.id, currentSet.id, updates)
    completeSet(currentBlock.id, currentSet.id)
  }

  return (
    <Page field={currentBlock ? <LoadField values={currentBlock.sets.map(st => (st.weightValue ?? 0) * (st.reps ?? 0))} /> : undefined}>

      {/* Header: the session, its clock, and the way out */}
      <header className="flex items-center gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)]">
        <div className="flex-1 min-w-0">
          {editingName ? (
            <input
              autoFocus
              defaultValue={activeSession.name}
              onBlur={(e) => { setSessionName(e.target.value); setEditingName(false) }}
              onKeyDown={(e) => e.key === 'Enter' && (e.currentTarget as HTMLInputElement).blur()}
              className="display text-title bg-transparent border-0 border-b border-scrim/40 outline-none text-scrim w-full"
            />
          ) : (
            <button
              onClick={() => setEditingName(true)}
              className="display text-title text-scrim bg-transparent border-0 p-0 text-left truncate block max-w-full cursor-pointer"
            >
              {activeSession.name}
            </button>
          )}
          <p className="meta tabular mt-1">{formatDuration(elapsed)}</p>
        </div>
        <button
          onClick={() => { if (window.confirm('Abandon this session? Progress will be lost.')) { abandonSession(); router.back() } }}
          aria-label="Abandon session"
          className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer"
        >
          <X size={16} />
        </button>
      </header>

      {restTimer.isActive ? (
        /* ── Resting: the clock owns the frame ── */
        <div className="flex-1 flex flex-col items-center justify-center gap-7 px-5 pb-28">
          <RestRing
            pct={restTimer.durationSeconds ? restRemaining / restTimer.durationSeconds : 0}
            label={formatDuration(restRemaining)}
            sublabel="Resting"
          />
          {nextBlock && (
            <div className="text-center">
              <p className="meta">Next</p>
              <p className="display text-title m-0 mt-1">{nextBlock.exerciseName}</p>
            </div>
          )}
          <div className="flex gap-2.5">
            <Button variant="secondary" size="sm" onClick={() => addRestTime(15)}>
              <Plus size={15} /> 15s
            </Button>
            <Button variant="primary" size="sm" onClick={dismissRestTimer}>
              Skip rest <ChevronRight size={15} />
            </Button>
          </div>
        </div>
      ) : currentBlock && currentSet ? (
        /* ── Logging: one exercise owns the frame ── */
        <>
          <Rail>
            <RailAction
              icon={<Plus size={22} />}
              label="Add set"
              count="Add"
              onClick={() => addSet(currentBlock.id)}
            />
            <RailAction
              icon={<Repeat size={22} />}
              label="Swap exercise"
              count="Swap"
              onClick={() => setShowSwapExercise(true)}
            />
            <RailAction
              icon={<Trash2 size={22} />}
              label="Delete set"
              count="Delete"
              disabled={currentBlock.sets.length <= 1}
              onClick={() => removeSet(currentBlock.id, currentSet.id)}
            />
          </Rail>

          <Caption>
            <p className="meta">
              {currentSet.setType === 'warm_up' ? 'Warm-up · ' : ''}
              Set {setPosition + 1} / {currentBlock.sets.length}
            </p>

            <h1 className="display text-display m-0 mt-2">{currentBlock.exerciseName}</h1>

            {lastTimeSet && (
              <p className="meta mt-2">Last time · {fmtLastTime(lastTimeSet)}</p>
            )}

            <div className="flex flex-col gap-2.5 mt-5">
              <ValueRow
                label="Weight" unit="kg"
                display={editingField === 'weight' ? editingValue : String(weightValue)}
                onDec={() => stepWeight(-2.5)}
                onInc={() => stepWeight(2.5)}
                onChange={raw => editField('weight', raw)}
                onFocus={() => beginEdit('weight', String(weightValue))}
                onBlur={endEdit}
              />
              <ValueRow
                label="Reps" unit="reps"
                display={editingField === 'reps' ? editingValue : String(repsValue)}
                onDec={() => stepReps(-1)}
                onInc={() => stepReps(1)}
                onChange={raw => editField('reps', raw)}
                onFocus={() => beginEdit('reps', String(repsValue))}
                onBlur={endEdit}
              />
              <ValueRow
                label="RPE" unit="rpe" placeholder="—"
                display={editingField === 'rpe' ? editingValue : (rpeValue !== null ? String(rpeValue) : '')}
                onDec={() => stepRpe(-0.5)}
                onInc={() => stepRpe(0.5)}
                onChange={raw => editField('rpe', raw)}
                onFocus={() => beginEdit('rpe', rpeValue !== null ? String(rpeValue) : '')}
                onBlur={endEdit}
              />
            </div>

            <div className="flex items-center gap-2.5 mt-5">
              <button
                onClick={() => prevBlock && setActiveBlock(prevBlock.id)}
                disabled={!prevBlock}
                aria-label="Previous exercise"
                className="w-14 h-14 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-default"
              >
                <ChevronLeft size={18} />
              </button>

              <button
                onClick={handleLogSet}
                className="flex-1 h-14 rounded-pill bg-scrim text-void inline-flex items-center justify-center border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                <span className="display text-figure">Log set</span>
              </button>

              <button
                onClick={() => (nextBlock ? setActiveBlock(nextBlock.id) : handleFinish())}
                aria-label={nextBlock ? 'Next exercise' : 'Finish workout'}
                className="w-14 h-14 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            <p className="meta mt-3">
              {nextBlock ? 'Next · ' + nextBlock.exerciseName : 'Last exercise · finish when done'}
            </p>
          </Caption>
        </>
      ) : sortedBlocks.length > 0 ? (
        /* ── Every set logged ── */
        <Caption>
          <EmptyState
            icon={CircleCheck}
            title="All sets logged"
            description="Nice work — ready to wrap up?"
            action={{ label: 'Finish workout', onClick: handleFinish }}
          />
        </Caption>
      ) : (
        /* ── No exercises yet ── */
        <Caption>
          <EmptyState
            icon={Dumbbell}
            title="No exercises yet"
            description="Add your first exercise to build this workout."
            action={{ label: 'Add exercise', onClick: () => { setExerciseSearch(''); setShowAddExercise(true) } }}
          />
        </Caption>
      )}

      {/* Swap exercise sheet */}
      <Sheet visible={showSwapExercise} onClose={() => setShowSwapExercise(false)} title="Swap Exercise">
        <div className="pb-3">
          <Input placeholder="Search exercises…" value={exerciseSearch} onChange={(e) => setExerciseSearch(e.target.value)} autoFocus />
        </div>
        <div className="flex flex-col max-h-[52vh] overflow-y-auto">
          {filteredLibrary.slice(0, 50).map((ex) => (
            <button key={ex.id}
              className="text-left text-body text-scrim py-3.5 border-b border-scrim/8 bg-transparent cursor-pointer w-full"
              onClick={() => {
                if (currentBlock) substituteExercise(currentBlock.id, { id: ex.id, name: ex.name, category: ex.category, equipment: ex.equipment, primaryMuscles: ex.primaryMuscles })
                setShowSwapExercise(false)
              }}>
              {ex.name}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Exercise search sheet (empty-session flow) */}
      <Sheet visible={showAddExercise} onClose={() => setShowAddExercise(false)} title="Add Exercise">
        <div className="pb-3">
          <Input placeholder="Search exercises…"
            value={exerciseSearch}
            onChange={(e) => setExerciseSearch(e.target.value)}
            autoFocus />
        </div>
        <div className="flex flex-col max-h-[52vh] overflow-y-auto">
          {filteredLibrary.slice(0, 50).map((ex) => (
            <button key={ex.id}
              className="text-left text-body text-scrim py-3.5 border-b border-scrim/8 bg-transparent cursor-pointer w-full"
              onClick={() => {
                addExerciseBlock({ id: ex.id, name: ex.name, category: ex.category, equipment: ex.equipment, primaryMuscles: ex.primaryMuscles })
                setShowAddExercise(false)
              }}>
              {ex.name}
            </button>
          ))}
        </div>
      </Sheet>
    </Page>
  )
}
