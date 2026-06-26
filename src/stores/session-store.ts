import { create } from 'zustand'
import type {
  ActiveSession,
  ActiveExerciseBlock,
  ActiveSet,
  RestTimerState,
  SessionChange,
  ChangeType,
  ExerciseOption,
  WorkoutTemplateRef,
  CompletedExercise,
  CompletedSet,
  StrengthSession,
} from '@/types'
import { useSessionHistoryStore } from './session-history-store'

// ── Standalone pure selectors ──────────────────────────────────────────────

export function getElapsedSeconds(session: ActiveSession): number {
  const start = new Date(session.startedAt).getTime()

  if (session.status === 'completed' && session.completedAt) {
    return Math.max(
      0,
      Math.floor(
        (new Date(session.completedAt).getTime() - start - session.totalPausedMs) / 1000
      )
    )
  }

  if (session.status === 'paused' && session.pausedAt) {
    return Math.max(
      0,
      Math.floor(
        (new Date(session.pausedAt).getTime() - start - session.totalPausedMs) / 1000
      )
    )
  }

  return Math.max(
    0,
    Math.floor((Date.now() - start - session.totalPausedMs) / 1000)
  )
}

export function getRestRemaining(timer: RestTimerState): number {
  if (!timer.isActive || !timer.startedAt) return 0
  const elapsed = Math.floor(
    (Date.now() - new Date(timer.startedAt).getTime()) / 1000
  )
  return Math.max(0, timer.durationSeconds - elapsed)
}

export function formatDuration(secs: number): string {
  const totalSecs = Math.max(0, Math.floor(secs))
  const h = Math.floor(totalSecs / 3600)
  const m = Math.floor((totalSecs % 3600) / 60)
  const s = totalSecs % 60
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function getCompletedSets(block: ActiveExerciseBlock): ActiveSet[] {
  return block.sets.filter(s => s.isCompleted)
}

export function calculateE1RM(weight: number, reps: number): number {
  const raw = weight * (1 + reps / 30)
  return Math.round(raw / 0.25) * 0.25
}

export function getActiveSet(block: ActiveExerciseBlock): ActiveSet | null {
  return block.sets.find(s => !s.isCompleted) ?? null
}

// ── Store ──────────────────────────────────────────────────────────────────

interface SessionStore {
  activeSession: ActiveSession | null
  activeBlockId: string | null
  restTimer: RestTimerState

  startSession(template: WorkoutTemplateRef | null, name?: string): void
  pauseSession(): void
  resumeSession(): void
  finishSession(): void
  abandonSession(): void

  addExerciseBlock(exercise: ExerciseOption): void
  removeExerciseBlock(blockId: string): void
  moveBlockUp(blockId: string): void
  moveBlockDown(blockId: string): void
  substituteExercise(blockId: string, newExercise: ExerciseOption): void
  setExerciseNotes(blockId: string, notes: string): void

  addSet(blockId: string): void
  removeSet(blockId: string, setId: string): void
  updateSet(blockId: string, setId: string, updates: Partial<ActiveSet>): void
  completeSet(blockId: string, setId: string): void

  startRestTimer(durationSeconds: number): void
  dismissRestTimer(): void
  addRestTime(secs: number): void

  setSessionNotes(notes: string): void
  setActiveBlock(blockId: string | null): void
  recordChange(change: Omit<SessionChange, 'id'>): void
  clearChanges(): void
}

function buildActiveSet(
  setNumber: number,
  overrides: Partial<ActiveSet> = {}
): ActiveSet {
  return {
    id: crypto.randomUUID(),
    setNumber,
    setType: 'working',
    isCompleted: false,
    targetWeightKg: null,
    targetReps: null,
    targetRepsMax: null,
    targetRpe: null,
    weightValue: null,
    weightUnit: 'kg',
    reps: null,
    rpe: null,
    estimatedOneRepMax: null,
    completedAt: null,
    ...overrides,
  }
}

function buildBlockFromTemplate(
  tBlock: WorkoutTemplateRef['exerciseBlocks'][number],
  orderIndex: number
): ActiveExerciseBlock {
  const sets: ActiveSet[] = Array.from({ length: tBlock.targetSets }, (_, i) =>
    buildActiveSet(i + 1, {
      setType: tBlock.setType,
      targetWeightKg: tBlock.targetWeightKg,
      targetReps: tBlock.targetRepsMin,
      targetRepsMax: tBlock.targetRepsMax,
      targetRpe: tBlock.targetRpe,
    })
  )

  return {
    id: crypto.randomUUID(),
    exerciseId: tBlock.exerciseId,
    exerciseName: tBlock.exerciseName,
    orderIndex,
    templateBlockId: tBlock.id,
    targetSets: tBlock.targetSets,
    targetRepsMin: tBlock.targetRepsMin,
    targetRepsMax: tBlock.targetRepsMax,
    targetWeightKg: tBlock.targetWeightKg,
    targetRpe: tBlock.targetRpe,
    restSeconds: tBlock.restSeconds,
    supersetGroupId: tBlock.supersetGroupId,
    sets,
    notes: tBlock.notes,
    isSubstituted: false,
    originalExerciseId: null,
    originalExerciseName: null,
  }
}

const EMPTY_REST_TIMER: RestTimerState = {
  isActive: false,
  durationSeconds: 0,
  startedAt: null,
}

export const useSessionStore = create<SessionStore>()((set, get) => ({
  activeSession: null,
  activeBlockId: null,
  restTimer: EMPTY_REST_TIMER,

  // ── Session lifecycle ──────────────────────────────────────────────────

  startSession(template, name) {
    const now = new Date().toISOString()
    const today = now.split('T')[0]

    const exerciseBlocks: ActiveExerciseBlock[] = template
      ? template.exerciseBlocks
          .slice()
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((b, i) => buildBlockFromTemplate(b, i))
      : []

    const session: ActiveSession = {
      id: crypto.randomUUID(),
      name: name ?? template?.name ?? 'Quick Workout',
      status: 'active',
      workoutTemplateId: template?.id ?? null,
      programmeId: template?.programmeId ?? null,
      sessionDate: today,
      startedAt: now,
      pausedAt: null,
      completedAt: null,
      totalPausedMs: 0,
      exerciseBlocks,
      notes: '',
      changes: [],
    }

    set({
      activeSession: session,
      activeBlockId: exerciseBlocks[0]?.id ?? null,
      restTimer: EMPTY_REST_TIMER,
    })
  },

  pauseSession() {
    const { activeSession } = get()
    if (!activeSession || activeSession.status !== 'active') return
    set({
      activeSession: {
        ...activeSession,
        status: 'paused',
        pausedAt: new Date().toISOString(),
      },
    })
  },

  resumeSession() {
    const { activeSession } = get()
    if (!activeSession || activeSession.status !== 'paused' || !activeSession.pausedAt) return

    const additionalPausedMs =
      Date.now() - new Date(activeSession.pausedAt).getTime()

    set({
      activeSession: {
        ...activeSession,
        status: 'active',
        pausedAt: null,
        totalPausedMs: activeSession.totalPausedMs + additionalPausedMs,
      },
    })
  },

  finishSession() {
    const { activeSession } = get()
    if (!activeSession) return

    const completedAt = new Date().toISOString()
    const startMs = new Date(activeSession.startedAt).getTime()
    const durationSeconds = Math.max(
      0,
      Math.floor(
        (new Date(completedAt).getTime() - startMs - activeSession.totalPausedMs) / 1000
      )
    )

    const exercises: CompletedExercise[] = activeSession.exerciseBlocks.map(block => {
      const completedSets: CompletedSet[] = block.sets
        .filter(s => s.isCompleted)
        .map(s => ({
          weight: s.weightValue,
          reps: s.reps,
          e1rm: s.estimatedOneRepMax,
          setType: s.setType,
        }))

      const totalVolume = completedSets.reduce((acc, s) => {
        if (s.weight !== null && s.reps !== null) return acc + s.weight * s.reps
        return acc
      }, 0)

      return {
        exerciseId: block.exerciseId,
        exerciseName: block.exerciseName,
        sets: completedSets,
        totalVolume,
      }
    })

    const totalVolume = exercises.reduce((acc, e) => acc + e.totalVolume, 0)

    const strengthSession: StrengthSession = {
      id: activeSession.id,
      name: activeSession.name,
      sessionDate: activeSession.sessionDate,
      startedAt: activeSession.startedAt,
      completedAt,
      durationSeconds,
      exercises,
      totalVolume,
      notes: activeSession.notes,
    }

    useSessionHistoryStore.getState().addSession(strengthSession)

    set({
      activeSession: {
        ...activeSession,
        status: 'completed',
        completedAt,
      },
      activeBlockId: null,
      restTimer: EMPTY_REST_TIMER,
    })
  },

  abandonSession() {
    set({
      activeSession: null,
      activeBlockId: null,
      restTimer: EMPTY_REST_TIMER,
    })
  },

  // ── Exercise blocks ────────────────────────────────────────────────────

  addExerciseBlock(exercise) {
    const { activeSession } = get()
    if (!activeSession) return

    const blockId = crypto.randomUUID()
    const orderIndex = activeSession.exerciseBlocks.length

    const sets: ActiveSet[] = Array.from({ length: 3 }, (_, i) =>
      buildActiveSet(i + 1)
    )

    const block: ActiveExerciseBlock = {
      id: blockId,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      orderIndex,
      templateBlockId: null,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: null,
      targetRpe: null,
      restSeconds: 120,
      supersetGroupId: null,
      sets,
      notes: null,
      isSubstituted: false,
      originalExerciseId: null,
      originalExerciseName: null,
    }

    set({
      activeSession: {
        ...activeSession,
        exerciseBlocks: [...activeSession.exerciseBlocks, block],
      },
      activeBlockId: blockId,
    })
  },

  removeExerciseBlock(blockId) {
    const { activeSession } = get()
    if (!activeSession) return

    const filtered = activeSession.exerciseBlocks
      .filter(b => b.id !== blockId)
      .map((b, i) => ({ ...b, orderIndex: i }))

    set({
      activeSession: { ...activeSession, exerciseBlocks: filtered },
      activeBlockId:
        get().activeBlockId === blockId ? (filtered[0]?.id ?? null) : get().activeBlockId,
    })
  },

  moveBlockUp(blockId) {
    const { activeSession } = get()
    if (!activeSession) return

    const blocks = [...activeSession.exerciseBlocks]
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx <= 0) return

    ;[blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]]
    const reordered = blocks.map((b, i) => ({ ...b, orderIndex: i }))

    get().recordChange({
      type: 'reordered',
      exerciseBlockId: blockId,
      exerciseName: blocks[idx - 1].exerciseName,
      description: `Moved ${blocks[idx - 1].exerciseName} up`,
    })

    set({ activeSession: { ...activeSession, exerciseBlocks: reordered } })
  },

  moveBlockDown(blockId) {
    const { activeSession } = get()
    if (!activeSession) return

    const blocks = [...activeSession.exerciseBlocks]
    const idx = blocks.findIndex(b => b.id === blockId)
    if (idx === -1 || idx >= blocks.length - 1) return

    ;[blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]]
    const reordered = blocks.map((b, i) => ({ ...b, orderIndex: i }))

    get().recordChange({
      type: 'reordered',
      exerciseBlockId: blockId,
      exerciseName: blocks[idx + 1].exerciseName,
      description: `Moved ${blocks[idx + 1].exerciseName} down`,
    })

    set({ activeSession: { ...activeSession, exerciseBlocks: reordered } })
  },

  substituteExercise(blockId, newExercise) {
    const { activeSession } = get()
    if (!activeSession) return

    const updatedBlocks = activeSession.exerciseBlocks.map(block => {
      if (block.id !== blockId) return block
      return {
        ...block,
        exerciseId: newExercise.id,
        exerciseName: newExercise.name,
        isSubstituted: true,
        originalExerciseId: block.isSubstituted
          ? block.originalExerciseId
          : block.exerciseId,
        originalExerciseName: block.isSubstituted
          ? block.originalExerciseName
          : block.exerciseName,
      }
    })

    const target = activeSession.exerciseBlocks.find(b => b.id === blockId)

    get().recordChange({
      type: 'substitution',
      exerciseBlockId: blockId,
      exerciseName: target?.exerciseName ?? '',
      description: `Substituted ${target?.exerciseName ?? ''} → ${newExercise.name}`,
      newExerciseId: newExercise.id,
      newExerciseName: newExercise.name,
    })

    set({ activeSession: { ...activeSession, exerciseBlocks: updatedBlocks } })
  },

  setExerciseNotes(blockId, notes) {
    const { activeSession } = get()
    if (!activeSession) return

    set({
      activeSession: {
        ...activeSession,
        exerciseBlocks: activeSession.exerciseBlocks.map(b =>
          b.id === blockId ? { ...b, notes } : b
        ),
      },
    })
  },

  // ── Sets ───────────────────────────────────────────────────────────────

  addSet(blockId) {
    const { activeSession } = get()
    if (!activeSession) return

    const updatedBlocks = activeSession.exerciseBlocks.map(block => {
      if (block.id !== blockId) return block
      const last = block.sets[block.sets.length - 1]
      const newSet = buildActiveSet(block.sets.length + 1, {
        setType: last?.setType ?? 'working',
        targetWeightKg: last?.targetWeightKg ?? null,
        targetReps: last?.targetReps ?? null,
        targetRepsMax: last?.targetRepsMax ?? null,
        targetRpe: last?.targetRpe ?? null,
        weightValue: last?.weightValue ?? null,
        weightUnit: last?.weightUnit ?? 'kg',
      })
      return { ...block, sets: [...block.sets, newSet] }
    })

    set({ activeSession: { ...activeSession, exerciseBlocks: updatedBlocks } })
  },

  removeSet(blockId, setId) {
    const { activeSession } = get()
    if (!activeSession) return

    const updatedBlocks = activeSession.exerciseBlocks.map(block => {
      if (block.id !== blockId) return block
      const filtered = block.sets.filter(s => s.id !== setId)
      const reindexed = filtered.map((s, i) => ({ ...s, setNumber: i + 1 }))
      return { ...block, sets: reindexed }
    })

    set({ activeSession: { ...activeSession, exerciseBlocks: updatedBlocks } })
  },

  updateSet(blockId, setId, updates) {
    const { activeSession } = get()
    if (!activeSession) return

    set({
      activeSession: {
        ...activeSession,
        exerciseBlocks: activeSession.exerciseBlocks.map(block =>
          block.id !== blockId
            ? block
            : {
                ...block,
                sets: block.sets.map(s =>
                  s.id === setId ? { ...s, ...updates } : s
                ),
              }
        ),
      },
    })
  },

  completeSet(blockId, setId) {
    const { activeSession } = get()
    if (!activeSession) return

    let restSeconds = 120

    const updatedBlocks = activeSession.exerciseBlocks.map(block => {
      if (block.id !== blockId) return block
      restSeconds = block.restSeconds

      return {
        ...block,
        sets: block.sets.map(s => {
          if (s.id !== setId) return s
          const e1rm =
            s.weightValue !== null &&
            s.reps !== null &&
            s.reps >= 1 &&
            s.weightValue > 0
              ? calculateE1RM(s.weightValue, s.reps)
              : null
          return {
            ...s,
            isCompleted: true,
            estimatedOneRepMax: e1rm,
            completedAt: new Date().toISOString(),
          }
        }),
      }
    })

    set({ activeSession: { ...activeSession, exerciseBlocks: updatedBlocks } })
    get().startRestTimer(restSeconds)
  },

  // ── Rest timer ─────────────────────────────────────────────────────────

  startRestTimer(durationSeconds) {
    set({
      restTimer: {
        isActive: true,
        durationSeconds,
        startedAt: new Date().toISOString(),
      },
    })
  },

  dismissRestTimer() {
    set({ restTimer: EMPTY_REST_TIMER })
  },

  addRestTime(secs) {
    const { restTimer } = get()
    if (!restTimer.isActive) return
    set({
      restTimer: { ...restTimer, durationSeconds: restTimer.durationSeconds + secs },
    })
  },

  // ── Misc ───────────────────────────────────────────────────────────────

  setSessionNotes(notes) {
    const { activeSession } = get()
    if (!activeSession) return
    set({ activeSession: { ...activeSession, notes } })
  },

  setActiveBlock(blockId) {
    set({ activeBlockId: blockId })
  },

  recordChange(change) {
    const { activeSession } = get()
    if (!activeSession) return
    const full: SessionChange = { id: crypto.randomUUID(), ...change }
    set({
      activeSession: {
        ...activeSession,
        changes: [...activeSession.changes, full],
      },
    })
  },

  clearChanges() {
    const { activeSession } = get()
    if (!activeSession) return
    set({ activeSession: { ...activeSession, changes: [] } })
  },
}))
