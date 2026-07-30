import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StrengthSessionTemplate, CardioSessionTemplate, ActivityType } from '@/types'

interface TemplateStore {
  strengthTemplates: StrengthSessionTemplate[]
  cardioTemplates: CardioSessionTemplate[]
  addStrengthTemplate(input: { name: string; notes?: string | null }): StrengthSessionTemplate
  addCardioTemplate(input: {
    name: string
    activityType: ActivityType
    targetDurationMinutes?: number | null
    targetDistanceKm?: number | null
    notes?: string | null
  }): CardioSessionTemplate
  updateStrengthTemplate(id: string, updates: Partial<Pick<StrengthSessionTemplate, 'name' | 'notes' | 'exerciseBlocks' | 'updatedAt'>>): void
  updateCardioTemplate(id: string, updates: Partial<Pick<CardioSessionTemplate, 'name' | 'activityType' | 'targetDurationMinutes' | 'targetDistanceKm' | 'notes'>>): void
  deleteStrengthTemplate(id: string): void
  deleteCardioTemplate(id: string): void
}

function now() { return new Date().toISOString() }

export const useTemplateStore = create<TemplateStore>()(
  persist(
    (set) => ({
      strengthTemplates: [],
      cardioTemplates: [],

      addStrengthTemplate(input) {
        const t: StrengthSessionTemplate = {
          id: crypto.randomUUID(),
          name: input.name,
          notes: input.notes ?? null,
          exerciseBlocks: [],
          createdAt: now(),
          updatedAt: now(),
        }
        set(s => ({ strengthTemplates: [...s.strengthTemplates, t] }))
        return t
      },

      addCardioTemplate(input) {
        const t: CardioSessionTemplate = {
          id: crypto.randomUUID(),
          name: input.name,
          activityType: input.activityType,
          targetDurationMinutes: input.targetDurationMinutes ?? null,
          targetDistanceKm: input.targetDistanceKm ?? null,
          notes: input.notes ?? null,
          createdAt: now(),
        }
        set(s => ({ cardioTemplates: [...s.cardioTemplates, t] }))
        return t
      },

      updateStrengthTemplate(id, updates) {
        set(s => ({
          strengthTemplates: s.strengthTemplates.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: now() } : t
          ),
        }))
      },

      updateCardioTemplate(id, updates) {
        set(s => ({
          cardioTemplates: s.cardioTemplates.map(t =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }))
      },

      deleteStrengthTemplate(id) {
        set(s => ({ strengthTemplates: s.strengthTemplates.filter(t => t.id !== id) }))
      },

      deleteCardioTemplate(id) {
        set(s => ({ cardioTemplates: s.cardioTemplates.filter(t => t.id !== id) }))
      },
    }),
    {
      name: 'hp-session-templates',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
)
