import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StrengthSession } from '@/types'

interface SessionHistoryStore {
  sessions: StrengthSession[]
  addSession(s: StrengthSession): void
  deleteSession(id: string): void
  clearAll(): void
}

export const useSessionHistoryStore = create<SessionHistoryStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession(s) {
        if (get().sessions.some(existing => existing.id === s.id)) return
        set(state => ({ sessions: [s, ...state.sessions] }))
      },

      deleteSession(id) {
        set(state => ({ sessions: state.sessions.filter(s => s.id !== id) }))
      },

      clearAll() {
        set({ sessions: [] })
      },
    }),
    {
      name: 'hp-session-history',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
