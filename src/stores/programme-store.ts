import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type {
  Programme,
  WorkoutTemplate,
  ExerciseTemplateBlock,
  Phase,
  PhaseTemplateOverride,
  PhaseExerciseOverride,
  ExerciseLibraryItem,
  WorkoutTemplateRef,
  CardioTemplate,
  ActivityType,
} from '@/types'
import { syncProgrammes, deleteProgrammeFromCloud, loadProgrammes } from '@/lib/sync'

interface ProgrammeStore {
  programmes: Programme[]

  // Programme CRUD
  createProgramme(input: { name: string; description: string; startDate?: string | null }): Programme
  updateProgramme(id: string, updates: Partial<Pick<Programme, 'name' | 'description' | 'startDate'>>): void
  deleteProgramme(id: string): void
  setActiveProgramme(id: string): void

  // Template CRUD
  addTemplate(programmeId: string, name: string): WorkoutTemplate
  updateTemplate(templateId: string, updates: Partial<Pick<WorkoutTemplate, 'name' | 'orderIndex' | 'notes'>>): void
  deleteTemplate(templateId: string): void
  duplicateTemplate(templateId: string): WorkoutTemplate | null
  reorderTemplates(programmeId: string, orderedIds: string[]): void

  // Block CRUD
  addBlock(templateId: string, exercise: Pick<ExerciseLibraryItem, 'id' | 'name'>): ExerciseTemplateBlock | null
  updateBlock(blockId: string, updates: Partial<ExerciseTemplateBlock>): void
  removeBlock(blockId: string): void
  moveBlockUp(templateId: string, blockId: string): void
  moveBlockDown(templateId: string, blockId: string): void

  // Phase CRUD
  addPhase(programmeId: string, input: { name: string; description?: string; durationWeeks: number; colorHex?: string }): Phase
  updatePhase(programmeId: string, phaseId: string, updates: Partial<Pick<Phase, 'name' | 'description' | 'durationWeeks' | 'colorHex' | 'orderIndex'>>): void
  deletePhase(programmeId: string, phaseId: string): void
  reorderPhases(programmeId: string, orderedIds: string[]): void
  setActivePhase(programmeId: string, phaseId: string): void
  addTemplateToPhase(programmeId: string, phaseId: string, templateId: string): void
  removeTemplateFromPhase(programmeId: string, phaseId: string, templateId: string): void
  setTemplateDays(programmeId: string, phaseId: string, templateId: string, days: number[]): void

  // Phase overrides (per exercise)
  setExerciseOverride(programmeId: string, phaseId: string, templateId: string, override: PhaseExerciseOverride): void
  removeExerciseOverride(programmeId: string, phaseId: string, templateId: string, blockId: string): void

  // Cardio template CRUD
  addCardioTemplate(programmeId: string, input: { name: string; activityType: ActivityType; targetDurationMinutes?: number | null; targetDistanceKm?: number | null }): CardioTemplate
  updateCardioTemplate(id: string, updates: Partial<Pick<CardioTemplate, 'name' | 'activityType' | 'targetDurationMinutes' | 'targetDistanceKm' | 'notes'>>): void
  deleteCardioTemplate(id: string): void
  addCardioTemplateToPhase(programmeId: string, phaseId: string, cardioTemplateId: string): void
  removeCardioTemplateFromPhase(programmeId: string, phaseId: string, cardioTemplateId: string): void

  // Selectors
  getActiveProgramme(): Programme | null
  getActivePhase(programmeId: string): Phase | null
  getTemplateRef(templateId: string): WorkoutTemplateRef | null
  getTemplateRefWithOverrides(templateId: string, programmeId: string): WorkoutTemplateRef | null

  // Cloud sync
  loadFromCloud(userId: string): Promise<void>
  syncToCloud(userId: string): Promise<void>
}

function now(): string {
  return new Date().toISOString()
}

function updateProgrammeTimestamp(programmes: Programme[], id: string): Programme[] {
  return programmes.map(p => (p.id === id ? { ...p, updatedAt: now() } : p))
}

export const useProgrammeStore = create<ProgrammeStore>()(
  persist(
    (set, get) => ({
      programmes: [],

      // ── Programme CRUD ──────────────────────────────────────────────────────

      createProgramme({ name, description, startDate = null }) {
        const timestamp = now()
        const programme: Programme = {
          id: crypto.randomUUID(),
          name,
          description,
          isActive: false,
          startDate: startDate ?? null,
          createdAt: timestamp,
          updatedAt: timestamp,
          phases: [],
          templates: [],
          cardioTemplates: [],
        }
        set(s => ({ programmes: [...s.programmes, programme] }))
        return programme
      },

      updateProgramme(id, updates) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id === id ? { ...p, ...updates, updatedAt: now() } : p
          ),
        }))
      },

      deleteProgramme(id) {
        set(s => ({ programmes: s.programmes.filter(p => p.id !== id) }))
        deleteProgrammeFromCloud(id)
      },

      setActiveProgramme(id) {
        set(s => ({
          programmes: s.programmes.map(p => ({
            ...p,
            isActive: p.id === id,
            updatedAt: p.id === id ? now() : p.updatedAt,
          })),
        }))
      },

      // ── Template CRUD ───────────────────────────────────────────────────────

      addTemplate(programmeId, name) {
        const programme = get().programmes.find(p => p.id === programmeId)
        const template: WorkoutTemplate = {
          id: crypto.randomUUID(),
          programmeId,
          name,
          orderIndex: programme ? programme.templates.length : 0,
          notes: null,
          exerciseBlocks: [],
        }
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id === programmeId
              ? { ...p, templates: [...p.templates, template], updatedAt: now() }
              : p
          ),
        }))
        return template
      },

      updateTemplate(templateId, updates) {
        set(s => ({
          programmes: s.programmes.map(p => {
            if (!p.templates.some(t => t.id === templateId)) return p
            return {
              ...p,
              updatedAt: now(),
              templates: p.templates.map(t => t.id === templateId ? { ...t, ...updates } : t),
            }
          }),
        }))
      },

      deleteTemplate(templateId) {
        set(s => ({
          programmes: s.programmes.map(p => {
            if (!p.templates.some(t => t.id === templateId)) return p
            return {
              ...p,
              updatedAt: now(),
              templates: p.templates.filter(t => t.id !== templateId),
              phases: p.phases.map(ph => ({
                ...ph,
                templateIds: ph.templateIds.filter(id => id !== templateId),
                overrides: ph.overrides.filter(o => o.templateId !== templateId),
              })),
            }
          }),
        }))
      },

      duplicateTemplate(templateId) {
        const programme = get().programmes.find(p => p.templates.some(t => t.id === templateId))
        if (!programme) return null
        const original = programme.templates.find(t => t.id === templateId)
        if (!original) return null
        const duplicate: WorkoutTemplate = {
          ...original,
          id: crypto.randomUUID(),
          name: `${original.name} (Copy)`,
          orderIndex: programme.templates.length,
          exerciseBlocks: original.exerciseBlocks.map(b => ({ ...b, id: crypto.randomUUID() })),
        }
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id === programme.id
              ? { ...p, templates: [...p.templates, duplicate], updatedAt: now() }
              : p
          ),
        }))
        return duplicate
      },

      reorderTemplates(programmeId, orderedIds) {
        set(s => ({
          programmes: s.programmes.map(p => {
            if (p.id !== programmeId) return p
            const reordered = orderedIds
              .map(id => p.templates.find(t => t.id === id))
              .filter((t): t is WorkoutTemplate => t !== undefined)
              .map((t, i) => ({ ...t, orderIndex: i }))
            return { ...p, templates: reordered, updatedAt: now() }
          }),
        }))
      },

      // ── Block CRUD ──────────────────────────────────────────────────────────

      addBlock(templateId, exercise) {
        let newBlock: ExerciseTemplateBlock | null = null
        set(s => ({
          programmes: s.programmes.map(p => {
            const template = p.templates.find(t => t.id === templateId)
            if (!template) return p
            const block: ExerciseTemplateBlock = {
              id: crypto.randomUUID(),
              exerciseId: exercise.id,
              exerciseName: exercise.name,
              orderIndex: template.exerciseBlocks.length,
              setType: 'working',
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 12,
              targetWeightKg: null,
              targetRpe: null,
              restSeconds: 120,
              supersetGroupId: null,
              notes: null,
            }
            newBlock = block
            return {
              ...p,
              updatedAt: now(),
              templates: p.templates.map(t =>
                t.id === templateId ? { ...t, exerciseBlocks: [...t.exerciseBlocks, block] } : t
              ),
            }
          }),
        }))
        return newBlock
      },

      updateBlock(blockId, updates) {
        set(s => ({
          programmes: s.programmes.map(p => {
            if (!p.templates.some(t => t.exerciseBlocks.some(b => b.id === blockId))) return p
            return {
              ...p,
              updatedAt: now(),
              templates: p.templates.map(t => ({
                ...t,
                exerciseBlocks: t.exerciseBlocks.map(b => b.id === blockId ? { ...b, ...updates } : b),
              })),
            }
          }),
        }))
      },

      removeBlock(blockId) {
        set(s => ({
          programmes: s.programmes.map(p => {
            if (!p.templates.some(t => t.exerciseBlocks.some(b => b.id === blockId))) return p
            return {
              ...p,
              updatedAt: now(),
              templates: p.templates.map(t => {
                const filtered = t.exerciseBlocks.filter(b => b.id !== blockId)
                return { ...t, exerciseBlocks: filtered.map((b, i) => ({ ...b, orderIndex: i })) }
              }),
            }
          }),
        }))
      },

      moveBlockUp(templateId, blockId) {
        set(s => ({
          programmes: s.programmes.map(p => ({
            ...p,
            updatedAt: now(),
            templates: p.templates.map(t => {
              if (t.id !== templateId) return t
              const blocks = [...t.exerciseBlocks]
              const idx = blocks.findIndex(b => b.id === blockId)
              if (idx <= 0) return t
              ;[blocks[idx - 1], blocks[idx]] = [blocks[idx], blocks[idx - 1]]
              return { ...t, exerciseBlocks: blocks.map((b, i) => ({ ...b, orderIndex: i })) }
            }),
          })),
        }))
      },

      moveBlockDown(templateId, blockId) {
        set(s => ({
          programmes: s.programmes.map(p => ({
            ...p,
            updatedAt: now(),
            templates: p.templates.map(t => {
              if (t.id !== templateId) return t
              const blocks = [...t.exerciseBlocks]
              const idx = blocks.findIndex(b => b.id === blockId)
              if (idx === -1 || idx >= blocks.length - 1) return t
              ;[blocks[idx], blocks[idx + 1]] = [blocks[idx + 1], blocks[idx]]
              return { ...t, exerciseBlocks: blocks.map((b, i) => ({ ...b, orderIndex: i })) }
            }),
          })),
        }))
      },

      // ── Phase CRUD ──────────────────────────────────────────────────────────

      addPhase(programmeId, input) {
        const programme = get().programmes.find(p => p.id === programmeId)
        const phase: Phase = {
          id: crypto.randomUUID(),
          programmeId,
          name: input.name,
          description: input.description ?? null,
          durationWeeks: input.durationWeeks,
          orderIndex: programme ? programme.phases.length : 0,
          colorHex: input.colorHex ?? null,
          templateIds: [],
          cardioTemplateIds: [],
          templateDays: {},
          overrides: [],
          isActive: false,
        }
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id === programmeId ? { ...p, phases: [...p.phases, phase], updatedAt: now() } : p
          ),
        }))
        return phase
      },

      updatePhase(programmeId, phaseId, updates) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph => ph.id === phaseId ? { ...ph, ...updates } : ph),
            }
          ),
        }))
      },

      deletePhase(programmeId, phaseId) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.filter(ph => ph.id !== phaseId),
            }
          ),
        }))
      },

      reorderPhases(programmeId, orderedIds) {
        set(s => ({
          programmes: s.programmes.map(p => {
            if (p.id !== programmeId) return p
            const reordered = orderedIds
              .map(id => p.phases.find(ph => ph.id === id))
              .filter((ph): ph is Phase => ph !== undefined)
              .map((ph, i) => ({ ...ph, orderIndex: i }))
            return { ...p, phases: reordered, updatedAt: now() }
          }),
        }))
      },

      setActivePhase(programmeId, phaseId) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph => ({ ...ph, isActive: ph.id === phaseId })),
            }
          ),
        }))
      },

      addTemplateToPhase(programmeId, phaseId, templateId) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph =>
                ph.id !== phaseId || ph.templateIds.includes(templateId)
                  ? ph
                  : { ...ph, templateIds: [...ph.templateIds, templateId] }
              ),
            }
          ),
        }))
      },

      removeTemplateFromPhase(programmeId, phaseId, templateId) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph => {
                if (ph.id !== phaseId) return ph
                const { [templateId]: _, ...restDays } = ph.templateDays ?? {}
                return {
                  ...ph,
                  templateIds: ph.templateIds.filter(id => id !== templateId),
                  templateDays: restDays,
                  overrides: ph.overrides.filter(o => o.templateId !== templateId),
                }
              }),
            }
          ),
        }))
      },

      setTemplateDays(programmeId, phaseId, templateId, days) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph =>
                ph.id !== phaseId ? ph : {
                  ...ph,
                  templateDays: { ...(ph.templateDays ?? {}), [templateId]: days },
                }
              ),
            }
          ),
        }))
      },

      // ── Phase overrides (per exercise) ──────────────────────────────────────

      setExerciseOverride(programmeId, phaseId, templateId, exerciseOverride) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph => {
                if (ph.id !== phaseId) return ph
                const tIdx = ph.overrides.findIndex(o => o.templateId === templateId)
                if (tIdx >= 0) {
                  // Template entry exists — update or add the exercise override
                  const templateOverride = ph.overrides[tIdx]
                  const eIdx = templateOverride.exerciseOverrides.findIndex(e => e.blockId === exerciseOverride.blockId)
                  const exerciseOverrides = eIdx >= 0
                    ? templateOverride.exerciseOverrides.map((e, i) => i === eIdx ? exerciseOverride : e)
                    : [...templateOverride.exerciseOverrides, exerciseOverride]
                  return {
                    ...ph,
                    overrides: ph.overrides.map((o, i) => i === tIdx ? { ...o, exerciseOverrides } : o),
                  }
                }
                // No template entry yet — create one
                const newEntry: PhaseTemplateOverride = { templateId, exerciseOverrides: [exerciseOverride] }
                return { ...ph, overrides: [...ph.overrides, newEntry] }
              }),
            }
          ),
        }))
      },

      removeExerciseOverride(programmeId, phaseId, templateId, blockId) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph => {
                if (ph.id !== phaseId) return ph
                return {
                  ...ph,
                  overrides: ph.overrides.map(o =>
                    o.templateId !== templateId ? o : {
                      ...o,
                      exerciseOverrides: o.exerciseOverrides.filter(e => e.blockId !== blockId),
                    }
                  ).filter(o => o.exerciseOverrides.length > 0),
                }
              }),
            }
          ),
        }))
      },

      // ── Cardio template CRUD ────────────────────────────────────────────────

      addCardioTemplate(programmeId, input) {
        const ct: CardioTemplate = {
          id: crypto.randomUUID(),
          programmeId,
          name: input.name,
          activityType: input.activityType,
          targetDurationMinutes: input.targetDurationMinutes ?? null,
          targetDistanceKm: input.targetDistanceKm ?? null,
          notes: null,
        }
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id === programmeId
              ? { ...p, cardioTemplates: [...(p.cardioTemplates ?? []), ct], updatedAt: now() }
              : p
          ),
        }))
        return ct
      },

      updateCardioTemplate(id, updates) {
        set(s => ({
          programmes: s.programmes.map(p => {
            if (!(p.cardioTemplates ?? []).some(ct => ct.id === id)) return p
            return {
              ...p,
              updatedAt: now(),
              cardioTemplates: p.cardioTemplates.map(ct => ct.id === id ? { ...ct, ...updates } : ct),
            }
          }),
        }))
      },

      deleteCardioTemplate(id) {
        set(s => ({
          programmes: s.programmes.map(p => {
            if (!(p.cardioTemplates ?? []).some(ct => ct.id === id)) return p
            return {
              ...p,
              updatedAt: now(),
              cardioTemplates: p.cardioTemplates.filter(ct => ct.id !== id),
              phases: p.phases.map(ph => ({
                ...ph,
                cardioTemplateIds: (ph.cardioTemplateIds ?? []).filter(cid => cid !== id),
              })),
            }
          }),
        }))
      },

      addCardioTemplateToPhase(programmeId, phaseId, cardioTemplateId) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph =>
                ph.id !== phaseId || (ph.cardioTemplateIds ?? []).includes(cardioTemplateId)
                  ? ph
                  : { ...ph, cardioTemplateIds: [...(ph.cardioTemplateIds ?? []), cardioTemplateId] }
              ),
            }
          ),
        }))
      },

      removeCardioTemplateFromPhase(programmeId, phaseId, cardioTemplateId) {
        set(s => ({
          programmes: s.programmes.map(p =>
            p.id !== programmeId ? p : {
              ...p,
              updatedAt: now(),
              phases: p.phases.map(ph =>
                ph.id !== phaseId ? ph : {
                  ...ph,
                  cardioTemplateIds: (ph.cardioTemplateIds ?? []).filter(id => id !== cardioTemplateId),
                }
              ),
            }
          ),
        }))
      },

      // ── Selectors ───────────────────────────────────────────────────────────

      getActiveProgramme() {
        return get().programmes.find(p => p.isActive) ?? null
      },

      getActivePhase(programmeId) {
        const programme = get().programmes.find(p => p.id === programmeId)
        return programme?.phases.find(ph => ph.isActive) ?? null
      },

      getTemplateRef(templateId) {
        for (const programme of get().programmes) {
          const template = programme.templates.find(t => t.id === templateId)
          if (template) {
            return {
              id: template.id,
              name: template.name,
              programmeId: template.programmeId,
              exerciseBlocks: template.exerciseBlocks.map(b => ({
                id: b.id, exerciseId: b.exerciseId, exerciseName: b.exerciseName,
                orderIndex: b.orderIndex, setType: b.setType, targetSets: b.targetSets,
                targetRepsMin: b.targetRepsMin, targetRepsMax: b.targetRepsMax,
                targetWeightKg: b.targetWeightKg, targetRpe: b.targetRpe,
                restSeconds: b.restSeconds, supersetGroupId: b.supersetGroupId, notes: b.notes,
              })),
            } satisfies WorkoutTemplateRef
          }
        }
        return null
      },

      async loadFromCloud(userId) {
        const programmes = await loadProgrammes(userId)
        if (programmes.length > 0) set({ programmes })
      },

      async syncToCloud(userId) {
        await syncProgrammes(userId, get().programmes)
      },

      getTemplateRefWithOverrides(templateId, programmeId) {
        const programme = get().programmes.find(p => p.id === programmeId)
        if (!programme) return get().getTemplateRef(templateId)

        const template = programme.templates.find(t => t.id === templateId)
        if (!template) return null

        const activePhase = programme.phases.find(ph => ph.isActive)
        const templateOverride = activePhase?.overrides.find(o => o.templateId === templateId) ?? null

        return {
          id: template.id,
          name: template.name,
          programmeId: template.programmeId,
          exerciseBlocks: template.exerciseBlocks.map(b => {
            const ex = templateOverride?.exerciseOverrides.find(e => e.blockId === b.id) ?? null
            const sets = ex?.targetSetsOverride ?? b.targetSets
            const repsMin = ex?.targetRepsMinOverride ?? b.targetRepsMin
            const repsMax = ex?.targetRepsMaxOverride ?? b.targetRepsMax
            const rpe = ex?.targetRpeOverride ?? b.targetRpe
            const weight = ex?.intensityPct != null && b.targetWeightKg != null
              ? Math.round((b.targetWeightKg * ex.intensityPct / 100) * 4) / 4
              : b.targetWeightKg
            return {
              id: b.id, exerciseId: b.exerciseId, exerciseName: b.exerciseName,
              orderIndex: b.orderIndex, setType: b.setType, targetSets: sets,
              targetRepsMin: repsMin, targetRepsMax: repsMax,
              targetWeightKg: weight, targetRpe: rpe,
              restSeconds: b.restSeconds, supersetGroupId: b.supersetGroupId, notes: b.notes,
            }
          }),
        } satisfies WorkoutTemplateRef
      },
    }),
    {
      name: 'hp-programme',
      storage: createJSONStorage(() => localStorage),
      version: 6,
      migrate(persistedState, version) {
        const state = persistedState as { programmes: Programme[] }
        if (version < 1) {
          state.programmes = (state.programmes ?? []).map(p => ({ ...p, phases: p.phases ?? [] }))
        }
        if (version < 2) {
          state.programmes = (state.programmes ?? []).map(p => ({
            ...p,
            phases: (p.phases ?? []).map(ph => ({
              ...ph,
              overrides: [],
              isActive: (ph as Phase & { isActive?: boolean }).isActive ?? false,
            })),
          }))
        }
        if (version < 3) {
          state.programmes = (state.programmes ?? []).map(p => ({
            ...p,
            startDate: (p as Programme & { startDate?: string | null }).startDate ?? null,
            phases: (p.phases ?? []).map(ph => ({
              ...ph,
              templateDays: (ph as Phase & { templateDays?: Record<string, number[]> }).templateDays ?? {},
            })),
          }))
        }
        if (version < 4) {
          state.programmes = (state.programmes ?? []).map(p => ({
            ...p,
            cardioTemplates: (p as Programme & { cardioTemplates?: CardioTemplate[] }).cardioTemplates ?? [],
            phases: (p.phases ?? []).map(ph => ({
              ...ph,
              cardioTemplateIds: (ph as Phase & { cardioTemplateIds?: string[] }).cardioTemplateIds ?? [],
            })),
          }))
        }
        if (version < 5) {
          const GREEN_PHASES = ['#00BD44', '#00A43B', '#008A32', '#007028', '#00571F', '#003C16']
          state.programmes = (state.programmes ?? []).map(p => {
            const sorted = [...(p.phases ?? [])].sort((a, b) => a.orderIndex - b.orderIndex).map(ph => ph.id)
            return {
              ...p,
              phases: (p.phases ?? []).map(ph => ({
                ...ph,
                colorHex: GREEN_PHASES[sorted.indexOf(ph.id) % GREEN_PHASES.length],
              })),
            }
          })
        }
        if (version < 6) {
          state.programmes = (state.programmes ?? []).map(p => ({
            ...p,
            phases: (p.phases ?? []).map(ph => ({ ...ph, colorHex: '#00BD44' })),
          }))
        }
        return state
      },
    }
  )
)

export { updateProgrammeTimestamp }
