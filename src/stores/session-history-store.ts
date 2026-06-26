import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { StrengthSession } from '@/types'
import { syncStrengthSessions, deleteStrengthSessionFromCloud, loadStrengthSessions } from '@/lib/sync'

interface SessionHistoryStore {
  sessions: StrengthSession[]
  addSession(s: StrengthSession): void
  deleteSession(id: string): void
  clearAll(): void
  loadFromCloud(userId: string): Promise<void>
  syncToCloud(userId: string): Promise<void>
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
        deleteStrengthSessionFromCloud(id)
      },

      clearAll() {
        set({ sessions: [] })
      },

      async loadFromCloud(userId) {
        const sessions = await loadStrengthSessions(userId)
        if (sessions.length > 0) set({ sessions })
      },

      async syncToCloud(userId) {
        await syncStrengthSessions(userId, get().sessions)
      },
    }),
    {
      name: 'hp-session-history',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
