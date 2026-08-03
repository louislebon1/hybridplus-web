import { createClient } from '@/lib/supabase'
import type { Programme, CalendarEventData, CardioSession, StrengthSession } from '@/types'

type EventMap = Record<string, CalendarEventData[]>

const client = () => createClient()

// ── Programmes ────────────────────────────────────────────────────────────────

export async function syncProgrammes(userId: string, programmes: Programme[]) {
  const sb = client()
  if (programmes.length === 0) return
  const rows = programmes.map(p => ({ id: p.id, user_id: userId, data: p, updated_at: new Date().toISOString() }))
  const { error } = await sb.from('programmes').upsert(rows, { onConflict: 'id' })
  if (error) console.error('[sync] failed to upsert programmes:', error.message)
}

export async function deleteProgrammeFromCloud(programmeId: string) {
  const { error } = await client().from('programmes').delete().eq('id', programmeId)
  if (error) console.error('[sync] failed to delete programme:', error.message)
}

export async function loadProgrammes(userId: string): Promise<Programme[]> {
  const { data, error } = await client().from('programmes').select('data').eq('user_id', userId)
  if (error) console.error('[sync] failed to load programmes:', error.message)
  return (data ?? []).map(r => r.data as Programme)
}

// ── Calendar events ───────────────────────────────────────────────────────────

export async function syncCalendarEvents(userId: string, events: EventMap) {
  const sb = client()
  const flat = Object.values(events).flat()
  if (flat.length === 0) return
  const rows = flat.map(e => ({ id: e.id, user_id: userId, date: e.date, data: e }))
  const { error } = await sb.from('calendar_events').upsert(rows, { onConflict: 'id' })
  if (error) console.error('[sync] failed to upsert calendar events:', error.message)
}

export async function deleteCalendarEventFromCloud(eventId: string) {
  const { error } = await client().from('calendar_events').delete().eq('id', eventId)
  if (error) console.error('[sync] failed to delete calendar event:', error.message)
}

export async function loadCalendarEvents(userId: string): Promise<EventMap> {
  const { data, error } = await client().from('calendar_events').select('data').eq('user_id', userId)
  if (error) console.error('[sync] failed to load calendar events:', error.message)
  const map: EventMap = {}
  for (const r of data ?? []) {
    const e = r.data as CalendarEventData
    if (!map[e.date]) map[e.date] = []
    map[e.date].push(e)
  }
  return map
}

// ── Cardio sessions ───────────────────────────────────────────────────────────

export async function syncCardioSessions(userId: string, sessions: CardioSession[]) {
  const sb = client()
  if (sessions.length === 0) return
  const rows = sessions.map(s => ({ id: s.id, user_id: userId, data: s }))
  const { error } = await sb.from('cardio_sessions').upsert(rows, { onConflict: 'id' })
  if (error) console.error('[sync] failed to upsert cardio sessions:', error.message)
}

export async function deleteCardioSessionFromCloud(sessionId: string) {
  const { error } = await client().from('cardio_sessions').delete().eq('id', sessionId)
  if (error) console.error('[sync] failed to delete cardio session:', error.message)
}

export async function loadCardioSessions(userId: string): Promise<CardioSession[]> {
  const { data, error } = await client().from('cardio_sessions').select('data').eq('user_id', userId)
  if (error) console.error('[sync] failed to load cardio sessions:', error.message)
  return (data ?? []).map(r => r.data as CardioSession)
}

// ── Strength sessions ─────────────────────────────────────────────────────────

export async function syncStrengthSessions(userId: string, sessions: StrengthSession[]) {
  const sb = client()
  if (sessions.length === 0) return
  const rows = sessions.map(s => ({ id: s.id, user_id: userId, data: s }))
  const { error } = await sb.from('strength_sessions').upsert(rows, { onConflict: 'id' })
  if (error) console.error('[sync] failed to upsert strength sessions:', error.message)
}

export async function deleteStrengthSessionFromCloud(sessionId: string) {
  const { error } = await client().from('strength_sessions').delete().eq('id', sessionId)
  if (error) console.error('[sync] failed to delete strength session:', error.message)
}

export async function loadStrengthSessions(userId: string): Promise<StrengthSession[]> {
  const { data, error } = await client().from('strength_sessions').select('data').eq('user_id', userId)
  if (error) console.error('[sync] failed to load strength sessions:', error.message)
  return (data ?? []).map(r => r.data as StrengthSession)
}
