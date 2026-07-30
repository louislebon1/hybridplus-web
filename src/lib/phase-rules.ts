import type { PhaseType, TrainingFocus, ExerciseCategory } from '@/types'

interface PrescriptionDefaults {
  sets: number
  repMin: number
  repMax: number
  rpeMin: number
  rpeMax: number
}

interface PhaseDefaults {
  compound: PrescriptionDefaults
  isolation: PrescriptionDefaults
}

// Lookup table: phaseType → trainingFocus → compound/isolation defaults
const RULES: Record<PhaseType, Partial<Record<TrainingFocus, PhaseDefaults>> & { _default: PhaseDefaults }> = {
  foundation: {
    _default: {
      compound: { sets: 3, repMin: 10, repMax: 15, rpeMin: 6, rpeMax: 7 },
      isolation: { sets: 3, repMin: 12, repMax: 20, rpeMin: 6, rpeMax: 7 },
    },
    hypertrophy: {
      compound: { sets: 3, repMin: 10, repMax: 15, rpeMin: 6, rpeMax: 7 },
      isolation: { sets: 3, repMin: 12, repMax: 20, rpeMin: 6, rpeMax: 7 },
    },
    strength: {
      compound: { sets: 3, repMin: 6, repMax: 10, rpeMin: 6, rpeMax: 8 },
      isolation: { sets: 3, repMin: 10, repMax: 15, rpeMin: 6, rpeMax: 7 },
    },
    power: {
      compound: { sets: 3, repMin: 8, repMax: 12, rpeMin: 6, rpeMax: 7 },
      isolation: { sets: 3, repMin: 10, repMax: 15, rpeMin: 6, rpeMax: 7 },
    },
    endurance: {
      compound: { sets: 3, repMin: 15, repMax: 20, rpeMin: 5, rpeMax: 7 },
      isolation: { sets: 3, repMin: 15, repMax: 20, rpeMin: 5, rpeMax: 7 },
    },
    conditioning: {
      compound: { sets: 3, repMin: 12, repMax: 20, rpeMin: 6, rpeMax: 7 },
      isolation: { sets: 3, repMin: 15, repMax: 20, rpeMin: 6, rpeMax: 7 },
    },
    'general-fitness': {
      compound: { sets: 3, repMin: 10, repMax: 15, rpeMin: 6, rpeMax: 7 },
      isolation: { sets: 3, repMin: 12, repMax: 15, rpeMin: 6, rpeMax: 7 },
    },
    'fat-loss': {
      compound: { sets: 3, repMin: 10, repMax: 15, rpeMin: 6, rpeMax: 7 },
      isolation: { sets: 3, repMin: 12, repMax: 15, rpeMin: 6, rpeMax: 7 },
    },
    maintenance: {
      compound: { sets: 3, repMin: 8, repMax: 12, rpeMin: 6, rpeMax: 7 },
      isolation: { sets: 3, repMin: 10, repMax: 15, rpeMin: 6, rpeMax: 7 },
    },
  },

  build: {
    _default: {
      compound: { sets: 4, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 9 },
      isolation: { sets: 3, repMin: 10, repMax: 15, rpeMin: 7, rpeMax: 9 },
    },
    hypertrophy: {
      compound: { sets: 4, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 9 },
      isolation: { sets: 3, repMin: 10, repMax: 15, rpeMin: 7, rpeMax: 9 },
    },
    strength: {
      compound: { sets: 4, repMin: 4, repMax: 6, rpeMin: 8, rpeMax: 9 },
      isolation: { sets: 3, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 8 },
    },
    power: {
      compound: { sets: 4, repMin: 3, repMax: 5, rpeMin: 7, rpeMax: 8 },
      isolation: { sets: 3, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 8 },
    },
    endurance: {
      compound: { sets: 3, repMin: 12, repMax: 20, rpeMin: 6, rpeMax: 8 },
      isolation: { sets: 3, repMin: 15, repMax: 20, rpeMin: 6, rpeMax: 8 },
    },
    conditioning: {
      compound: { sets: 3, repMin: 10, repMax: 15, rpeMin: 7, rpeMax: 8 },
      isolation: { sets: 3, repMin: 12, repMax: 15, rpeMin: 7, rpeMax: 8 },
    },
    'general-fitness': {
      compound: { sets: 3, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 8 },
      isolation: { sets: 3, repMin: 10, repMax: 15, rpeMin: 7, rpeMax: 8 },
    },
    'fat-loss': {
      compound: { sets: 3, repMin: 10, repMax: 15, rpeMin: 7, rpeMax: 8 },
      isolation: { sets: 3, repMin: 12, repMax: 15, rpeMin: 7, rpeMax: 8 },
    },
    maintenance: {
      compound: { sets: 3, repMin: 6, repMax: 10, rpeMin: 7, rpeMax: 8 },
      isolation: { sets: 3, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 8 },
    },
  },

  peak: {
    _default: {
      compound: { sets: 4, repMin: 3, repMax: 6, rpeMin: 8, rpeMax: 9 },
      isolation: { sets: 3, repMin: 8, repMax: 12, rpeMin: 8, rpeMax: 9 },
    },
    hypertrophy: {
      compound: { sets: 3, repMin: 6, repMax: 10, rpeMin: 8, rpeMax: 9 },
      isolation: { sets: 3, repMin: 8, repMax: 12, rpeMin: 8, rpeMax: 9 },
    },
    strength: {
      compound: { sets: 4, repMin: 1, repMax: 3, rpeMin: 9, rpeMax: 10 },
      isolation: { sets: 2, repMin: 6, repMax: 8, rpeMin: 7, rpeMax: 8 },
    },
    power: {
      compound: { sets: 4, repMin: 1, repMax: 3, rpeMin: 8, rpeMax: 9 },
      isolation: { sets: 2, repMin: 6, repMax: 10, rpeMin: 7, rpeMax: 8 },
    },
    endurance: {
      compound: { sets: 3, repMin: 12, repMax: 15, rpeMin: 7, rpeMax: 8 },
      isolation: { sets: 3, repMin: 12, repMax: 15, rpeMin: 7, rpeMax: 8 },
    },
    conditioning: {
      compound: { sets: 3, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 8 },
      isolation: { sets: 3, repMin: 10, repMax: 15, rpeMin: 7, rpeMax: 8 },
    },
    'general-fitness': {
      compound: { sets: 3, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 9 },
      isolation: { sets: 3, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 9 },
    },
    'fat-loss': {
      compound: { sets: 3, repMin: 8, repMax: 12, rpeMin: 7, rpeMax: 9 },
      isolation: { sets: 3, repMin: 10, repMax: 15, rpeMin: 7, rpeMax: 9 },
    },
    maintenance: {
      compound: { sets: 3, repMin: 5, repMax: 8, rpeMin: 7, rpeMax: 8 },
      isolation: { sets: 3, repMin: 8, repMax: 10, rpeMin: 7, rpeMax: 8 },
    },
  },

  deload: {
    _default: {
      compound: { sets: 2, repMin: 10, repMax: 15, rpeMin: 5, rpeMax: 6 },
      isolation: { sets: 2, repMin: 12, repMax: 15, rpeMin: 5, rpeMax: 6 },
    },
  },

  recovery: {
    _default: {
      compound: { sets: 2, repMin: 12, repMax: 15, rpeMin: 4, rpeMax: 5 },
      isolation: { sets: 2, repMin: 12, repMax: 15, rpeMin: 4, rpeMax: 5 },
    },
  },
}

export function getPhaseDefaults(
  phaseType: PhaseType,
  trainingFocus: TrainingFocus,
  exerciseCategory: ExerciseCategory,
): PrescriptionDefaults {
  const phaseRules = RULES[phaseType]
  const focusRules = phaseRules[trainingFocus] ?? phaseRules._default
  return focusRules[exerciseCategory]
}
