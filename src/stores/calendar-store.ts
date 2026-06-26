import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { CalendarEventData } from '@/types'
import { syncCalendarEvents, deleteCalendarEventFromCloud, loadCalendarEvents } from '@/lib/sync'

type EventMap = Record<string, CalendarEventData[]>

interface CalendarStore {
  events: EventMap
  selectedDate: string
  viewMode: 'month' | 'week' | 'day'

  setSelectedDate(date: string): void
  setViewMode(mode: 'month' | 'week' | 'day'): void
  addEvent(event: Omit<CalendarEventData, 'id'>): CalendarEventData
  updateEvent(id: string, date: string, updates: Partial<CalendarEventData>): void
  deleteEvent(id: string, date: string): void
  completeEvent(id: string, date: string): void
  moveEvent(id: string, fromDate: string, toDate: string): void

  loadFromCloud(userId: string): Promise<void>
  syncToCloud(userId: string): Promise<void>
}

export const useCalendarStore = create<CalendarStore>()(
  persist(
    (set, get) => ({
      events: {},
      selectedDate: new Date().toISOString().split('T')[0],
      viewMode: 'month',

      setSelectedDate(date) {
        set({ selectedDate: date })
      },

      setViewMode(mode) {
        set({ viewMode: mode })
      },

      addEvent(event) {
        const newEvent: CalendarEventData = { ...event, id: crypto.randomUUID() }
        const { date } = newEvent
        set(s => ({
          events: {
            ...s.events,
            [date]: [...(s.events[date] ?? []), newEvent],
          },
        }))
        return newEvent
      },

      updateEvent(id, date, updates) {
        set(s => ({
          events: {
            ...s.events,
            [date]: (s.events[date] ?? []).map(e =>
              e.id === id ? { ...e, ...updates } : e
            ),
          },
        }))
      },

      deleteEvent(id, date) {
        set(s => ({
          events: {
            ...s.events,
            [date]: (s.events[date] ?? []).filter(e => e.id !== id),
          },
        }))
        deleteCalendarEventFromCloud(id)
      },

      completeEvent(id, date) {
        get().updateEvent(id, date, { isCompleted: true })
      },

      moveEvent(id, fromDate, toDate) {
        const fromEvents = get().events[fromDate] ?? []
        const event = fromEvents.find(e => e.id === id)
        if (!event) return

        const updatedEvent: CalendarEventData = { ...event, date: toDate }
        const newFromEvents = fromEvents.filter(e => e.id !== id)
        const toEvents = get().events[toDate] ?? []

        set(s => ({
          events: {
            ...s.events,
            [fromDate]: newFromEvents,
            [toDate]: [...toEvents, updatedEvent],
          },
        }))
      },

      async loadFromCloud(userId) {
        const events = await loadCalendarEvents(userId)
        if (Object.keys(events).length > 0) set({ events })
      },

      async syncToCloud(userId) {
        await syncCalendarEvents(userId, get().events)
      },
    }),
    {
      name: 'hp-calendar',
      storage: createJSONStorage(() => localStorage),
    }
  )
)
