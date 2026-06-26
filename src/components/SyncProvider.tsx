'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { useCardioStore } from '@/stores/cardio-store'
import { useSessionHistoryStore } from '@/stores/session-history-store'

const DEBOUNCE_MS = 3000

export default function SyncProvider() {
  const user = useAuthStore(s => s.user)
  const programmes = useProgrammeStore(s => s.programmes)
  const calendarEvents = useCalendarStore(s => s.events)
  const cardioSessions = useCardioStore(s => s.sessions)
  const strengthSessions = useSessionHistoryStore(s => s.sessions)

  const syncTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const initialSyncDone = useRef(false)

  function debounceSync(key: string, fn: () => void) {
    clearTimeout(syncTimers.current[key])
    syncTimers.current[key] = setTimeout(fn, DEBOUNCE_MS)
  }

  // On sign-in: load from cloud then mark done
  useEffect(() => {
    if (!user) {
      initialSyncDone.current = false
      return
    }
    const userId = user.id
    Promise.all([
      useProgrammeStore.getState().loadFromCloud(userId),
      useCalendarStore.getState().loadFromCloud(userId),
      useCardioStore.getState().loadFromCloud(userId),
      useSessionHistoryStore.getState().loadFromCloud(userId),
    ]).finally(() => {
      initialSyncDone.current = true
    })
  }, [user?.id])

  // Debounced sync on data change (only after initial load)
  useEffect(() => {
    if (!user || !initialSyncDone.current) return
    debounceSync('programmes', () => useProgrammeStore.getState().syncToCloud(user.id))
  }, [programmes, user?.id])

  useEffect(() => {
    if (!user || !initialSyncDone.current) return
    debounceSync('calendar', () => useCalendarStore.getState().syncToCloud(user.id))
  }, [calendarEvents, user?.id])

  useEffect(() => {
    if (!user || !initialSyncDone.current) return
    debounceSync('cardio', () => useCardioStore.getState().syncToCloud(user.id))
  }, [cardioSessions, user?.id])

  useEffect(() => {
    if (!user || !initialSyncDone.current) return
    debounceSync('strength', () => useSessionHistoryStore.getState().syncToCloud(user.id))
  }, [strengthSessions, user?.id])

  return null
}
