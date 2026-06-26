'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Check, ChevronLeft } from 'lucide-react'
import { useSessionStore, formatDuration, getElapsedSeconds, getRestRemaining } from '@/stores/session-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { Button, Input, Sheet } from '@/components/ui'

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

  const [elapsed, setElapsed] = useState(0)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [editingName, setEditingName] = useState(false)

  useEffect(() => {
    if (!activeSession) return
    const interval = setInterval(() => setElapsed(getElapsedSeconds(activeSession)), 1000)
    setElapsed(getElapsedSeconds(activeSession))
    return () => clearInterval(interval)
  }, [activeSession])

  const allTemplates = programmes.flatMap((p) =>
    p.templates.map((t) => ({ ...t, programmeName: p.name, programmeId: p.id }))
  ).slice(0, 5)

  const filtered = exerciseSearch
    ? EXERCISES.filter((e) => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
    : EXERCISES

  if (!activeSession) {
    return (
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

          {allTemplates.length > 0 && (
            <div>
              <p className="eyebrow mb-3">From programme</p>
              <div className="flex flex-col gap-2">
                {allTemplates.map((t) => {
                  const store = useProgrammeStore.getState()
                  const ref = store.getTemplateRefWithOverrides(t.id, t.programmeId)
                  const activePhase = store.getActivePhase(t.programmeId)
                  const hasOverride = activePhase?.overrides.some(o => o.templateId === t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => ref && startSession(ref)}
                      className="bg-bg-element border border-border rounded-2xl px-4 py-3 text-left hover:bg-bg-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-text">{t.name}</p>
                        {hasOverride && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">phase</span>
                        )}
                      </div>
                      <p className="text-xs text-text-secondary">
                        {t.programmeName}{activePhase ? ` · ${activePhase.name}` : ''} · {t.exerciseBlocks.length} exercises
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
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
