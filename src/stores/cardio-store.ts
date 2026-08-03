import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CardioSession } from '@/types'

interface CardioStore {
  sessions: CardioSession[]
  addSession(draft: Omit<CardioSession, 'id' | 'isPersonalRecord'>): CardioSession
  updateSession(id: string, updates: Partial<CardioSession>): void
  deleteSession(id: string): void
}

function detectPR(
  sessions: CardioSession[],
  draft: Omit<CardioSession, 'id' | 'isPersonalRecord'>
): boolean {
  if (!draft.distanceKm || !draft.avgPaceSecs) return false
  const similar = sessions.filter(s => {
    if (s.activityType !== draft.activityType) return false
    if (!s.distanceKm || !s.avgPaceSecs) return false
    const pct = Math.abs(s.distanceKm - draft.distanceKm!) / draft.distanceKm!
    return pct <= 0.05
  })
  if (similar.length === 0) return true
  const bestPace = Math.min(...similar.map(s => s.avgPaceSecs!))
  return draft.avgPaceSecs < bestPace
}

export const useCardioStore = create<CardioStore>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession(draft) {
        const isPersonalRecord = detectPR(get().sessions, draft)
        const session: CardioSession = { ...draft, id: crypto.randomUUID(), isPersonalRecord }
        set(s => ({ sessions: [session, ...s.sessions] }))
        return session
      },

      updateSession(id, updates) {
        set(s => ({
          sessions: s.sessions.map(session =>
            session.id === id ? { ...session, ...updates } : session
          ),
        }))
      },

      deleteSession(id) {
        set(s => ({ sessions: s.sessions.filter(session => session.id !== id) }))
      },
    }),
    {
      name: 'hp-cardio',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
