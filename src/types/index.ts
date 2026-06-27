// Programme types
export type SetType = 'warm_up' | 'working' | 'drop' | 'back_off' | 'failure'
export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'
  | 'full body'
  | 'olympic'
export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'ez-bar'
  | 'band'
  | 'other'

export interface ExerciseLibraryItem {
  id: string
  name: string
  category: MuscleGroup
  equipment: Equipment
  primaryMuscles: string[]
}

export interface ExerciseTemplateBlock {
  id: string
  exerciseId: string
  exerciseName: string
  orderIndex: number
  setType: SetType
  targetSets: number
  targetRepsMin: number
  targetRepsMax: number
  targetWeightKg: number | null
  targetRpe: number | null
  restSeconds: number
  supersetGroupId: string | null
  notes: string | null
}

export interface WorkoutTemplate {
  id: string
  programmeId: string
  name: string
  orderIndex: number
  notes: string | null
  exerciseBlocks: ExerciseTemplateBlock[]
}

export interface PhaseExerciseOverride {
  blockId: string
  targetSetsOverride: number | null
  targetRepsMinOverride: number | null
  targetRepsMaxOverride: number | null
  targetRpeOverride: number | null
  intensityPct: number | null
}

export interface PhaseTemplateOverride {
  templateId: string
  exerciseOverrides: PhaseExerciseOverride[]
}

export interface Phase {
  id: string
  programmeId: string
  name: string
  description: string | null
  durationWeeks: number
  orderIndex: number
  colorHex: string | null
  templateIds: string[]
  templateDays: Record<string, number[]> // templateId → [0=Mon…6=Sun]
  overrides: PhaseTemplateOverride[]
  isActive: boolean
}

export interface Programme {
  id: string
  name: string
  description: string
  isActive: boolean
  startDate: string | null
  createdAt: string
  updatedAt: string
  phases: Phase[]
  templates: WorkoutTemplate[]
}

// Session types
export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned'
export type WeightUnit = 'kg' | 'lb'

export interface ActiveSet {
  id: string
  setNumber: number
  setType: SetType
  isCompleted: boolean
  targetWeightKg: number | null
  targetReps: number | null
  targetRepsMax: number | null
  targetRpe: number | null
  weightValue: number | null
  weightUnit: WeightUnit
  reps: number | null
  rpe: number | null
  estimatedOneRepMax: number | null
  completedAt: string | null
}

export interface ActiveExerciseBlock {
  id: string
  exerciseId: string
  exerciseName: string
  orderIndex: number
  templateBlockId: string | null
  targetSets: number
  targetRepsMin: number
  targetRepsMax: number
  targetWeightKg: number | null
  targetRpe: number | null
  restSeconds: number
  supersetGroupId: string | null
  sets: ActiveSet[]
  notes: string | null
  isSubstituted: boolean
  originalExerciseId: string | null
  originalExerciseName: string | null
}

export type ChangeType = 'substitution' | 'added_sets' | 'removed_sets' | 'reordered'

export interface SessionChange {
  id: string
  type: ChangeType
  exerciseBlockId: string
  exerciseName: string
  description: string
  newExerciseId?: string
  newExerciseName?: string
}

export interface RestTimerState {
  isActive: boolean
  durationSeconds: number
  startedAt: string | null
}

export interface ActiveSession {
  id: string
  name: string
  status: SessionStatus
  workoutTemplateId: string | null
  programmeId: string | null
  sessionDate: string
  startedAt: string
  pausedAt: string | null
  completedAt: string | null
  totalPausedMs: number
  exerciseBlocks: ActiveExerciseBlock[]
  notes: string
  changes: SessionChange[]
}

export interface WorkoutTemplateRef {
  id: string
  name: string
  programmeId: string | null
  exerciseBlocks: Array<{
    id: string
    exerciseId: string
    exerciseName: string
    orderIndex: number
    setType: SetType
    targetSets: number
    targetRepsMin: number
    targetRepsMax: number
    targetWeightKg: number | null
    targetRpe: number | null
    restSeconds: number
    supersetGroupId: string | null
    notes: string | null
  }>
}

export interface ExerciseOption {
  id: string
  name: string
  category: string
  equipment: string
  primaryMuscles: string[]
}

// Calendar types
export type CalendarEventType =
  | 'strength'
  | 'run'
  | 'swim'
  | 'cycle'
  | 'walk'
  | 'row'
  | 'rest'
  | 'other'
export type RunType =
  | 'easy'
  | 'tempo'
  | 'intervals'
  | 'long_run'
  | 'recovery'
  | 'race'
  | 'fartlek'
export type SwimType =
  | 'freestyle'
  | 'backstroke'
  | 'breaststroke'
  | 'butterfly'
  | 'im'
  | 'mixed'

export interface CalendarEventData {
  id: string
  eventType: CalendarEventType
  date: string
  name: string | null
  isCompleted: boolean
  workoutTemplateId: string | null
  programmeId: string | null
  durationMinutes: number | null
  distanceKm: number | null
  distanceMeters: number | null
  runType: RunType | null
  swimType: SwimType | null
  targetPaceSecs: number | null
  notes: string | null
  colorHex: string | null
}

// Cardio types
export type ActivityType = 'run' | 'swim' | 'cycle' | 'walk' | 'row'
export type RunSessionType =
  | 'easy'
  | 'tempo'
  | 'intervals'
  | 'long_run'
  | 'recovery'
  | 'race'
  | 'fartlek'
export type SwimStroke =
  | 'freestyle'
  | 'backstroke'
  | 'breaststroke'
  | 'butterfly'
  | 'im'
  | 'mixed'

export interface SplitData {
  splitNumber: number
  splitUnit: 'km' | '100m' | '500m'
  durationSeconds: number
  paceSecs: number
  heartRate: number | null
  elevationGainM: number | null
}

export interface CardioSession {
  id: string
  activityType: ActivityType
  sessionDate: string
  startedAt: string | null
  completedAt: string | null
  durationSeconds: number
  distanceKm: number | null
  avgPaceSecs: number | null
  avgSpeedKmh: number | null
  avgHeartRate: number | null
  maxHeartRate: number | null
  elevationGainM: number | null
  elevationLossM: number | null
  rpe: number | null
  runType: RunSessionType | null
  cadenceSpm: number | null
  stroke: SwimStroke | null
  poolLengthM: number | null
  swolfScore: number | null
  avgPowerWatts: number | null
  cadenceRpm: number | null
  strokeRateSpm: number | null
  surface: string | null
  notes: string | null
  isPersonalRecord: boolean
  splits: SplitData[]
}

// Session history types
export interface CompletedSet {
  weight: number | null
  reps: number | null
  e1rm: number | null
  setType: string
}

export interface CompletedExercise {
  exerciseId: string
  exerciseName: string
  sets: CompletedSet[]
  totalVolume: number
}

export interface StrengthSession {
  id: string
  name: string
  sessionDate: string
  startedAt: string
  completedAt: string
  durationSeconds: number
  exercises: CompletedExercise[]
  totalVolume: number
  notes: string
}
