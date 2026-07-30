import type {
  ExerciseLibraryItem,
  ExercisePrescription,
  StrengthSession,
  CompletedSet,
  PhaseType,
  TrainingFocus,
} from '@/types'
import { getPhaseDefaults } from './phase-rules'

interface PerformanceRecord {
  sessionDate: string
  workingSets: CompletedSet[]
  totalVolume: number
}

export function analyzePerformanceHistory(
  exerciseId: string,
  sessions: StrengthSession[],
): PerformanceRecord[] {
  return sessions
    .filter(s => s.exercises.some(e => e.exerciseId === exerciseId))
    .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())
    .map(s => {
      const exercise = s.exercises.find(e => e.exerciseId === exerciseId)!
      const workingSets = exercise.sets.filter(set => set.setType === 'working')
      const totalVolume = exercise.totalVolume
      return { sessionDate: s.sessionDate, workingSets, totalVolume }
    })
}

function roundToIncrement(weight: number, increment: number): number {
  return Math.round(weight / increment) * increment
}

// Default weight increments per equipment type
const DEFAULT_INCREMENT_KG = 2.5

interface LoadRecommendation {
  loadKg: number | null
  rationale: ExercisePrescription['loadRationale']
  note: string | null
}

function computeRecommendedLoad(
  lastRecord: PerformanceRecord | undefined,
  repMin: number,
  repMax: number,
  rpeMax: number,
  increment: number,
): LoadRecommendation {
  if (!lastRecord || lastRecord.workingSets.length === 0) {
    return { loadKg: null, rationale: 'no-history', note: null }
  }

  const sets = lastRecord.workingSets
  const lastLoad = sets[sets.length - 1].weight

  if (lastLoad === null) {
    return { loadKg: null, rationale: 'no-history', note: null }
  }

  const setsWithData = sets.filter(s => s.reps !== null && s.weight !== null)
  if (setsWithData.length === 0) {
    return { loadKg: lastLoad, rationale: 'maintain', note: null }
  }

  const avgRpe =
    setsWithData.filter(s => s.rpe !== null).length > 0
      ? setsWithData.reduce((sum, s) => sum + (s.rpe ?? rpeMax), 0) / setsWithData.length
      : null

  const allHitTopRange = setsWithData.every(s => (s.reps ?? 0) >= repMax)
  const overallRpeOk = avgRpe === null || avgRpe <= rpeMax

  // Too hard — reduce load
  if (avgRpe !== null && avgRpe > rpeMax + 1) {
    const reduced = roundToIncrement(lastLoad - increment * 2, increment)
    return {
      loadKg: reduced,
      rationale: 'reduce',
      note: `RPE ${avgRpe.toFixed(1)} was above target. Reduce load to stay in range.`,
    }
  }

  // Hit top of rep range at or under target RPE — increase
  if (allHitTopRange && overallRpeOk) {
    const increased = roundToIncrement(lastLoad + increment, increment)
    return {
      loadKg: increased,
      rationale: 'increase',
      note: `Hit ${repMax} reps at acceptable RPE. Increase load.`,
    }
  }

  // Otherwise maintain
  const missedSets = setsWithData.filter(s => (s.reps ?? 0) < repMin).length
  const note =
    missedSets > 0
      ? `${missedSets} set(s) below ${repMin} reps. Maintain load and build consistency.`
      : null

  return { loadKg: lastLoad, rationale: 'maintain', note }
}

export function generatePrescription(
  exercise: ExerciseLibraryItem,
  phaseType: PhaseType,
  trainingFocus: TrainingFocus,
  positionIndex: number,
  sessions: StrengthSession[],
  increment: number = DEFAULT_INCREMENT_KG,
): ExercisePrescription {
  const base = getPhaseDefaults(phaseType, trainingFocus, exercise.exerciseCategory)

  // Reduce sets for later exercises in the session (after 3rd slot, min 2)
  const sets = positionIndex >= 3 ? Math.max(2, base.sets - 1) : base.sets

  const history = analyzePerformanceHistory(exercise.id, sessions)
  const lastRecord = history[0]

  const { loadKg, rationale, note } = computeRecommendedLoad(
    lastRecord,
    base.repMin,
    base.repMax,
    base.rpeMax,
    increment,
  )

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    sets,
    repMin: base.repMin,
    repMax: base.repMax,
    rpeMin: base.rpeMin,
    rpeMax: base.rpeMax,
    recommendedLoadKg: loadKg,
    isEstimated: rationale === 'no-history' || rationale === 'estimated',
    loadRationale: rationale,
    progressionNote: note,
  }
}
