import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface WeightLog {
  id: string
  date: string // YYYY-MM-DD
  weightKg: number
}

interface BodyMetricsStore {
  heightCm: number | null
  weightLogs: WeightLog[]
  setHeight(cm: number | null): void
  logWeight(date: string, weightKg: number): void
  deleteWeightLog(id: string): void
}

export const useBodyMetricsStore = create<BodyMetricsStore>()(
  persist(
    (set) => ({
      heightCm: null,
      weightLogs: [],

      setHeight(cm) {
        set({ heightCm: cm })
      },

      logWeight(date, weightKg) {
        set(s => ({
          weightLogs: [
            ...s.weightLogs.filter(w => w.date !== date),
            { id: crypto.randomUUID(), date, weightKg },
          ].sort((a, b) => a.date.localeCompare(b.date)),
        }))
      },

      deleteWeightLog(id) {
        set(s => ({ weightLogs: s.weightLogs.filter(w => w.id !== id) }))
      },
    }),
    {
      name: 'hp-body-metrics',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
