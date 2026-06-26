import { createClient } from '@/lib/supabase'
import type { Programme, CalendarEventData, CardioSession, StrengthSession } from '@/types'

type EventMap = Record<string, CalendarEventData[]>

const client = () => createClient()

// ── Programmes ────────────────────────────────────────────────────────────────

export async function syncProgrammes(userId: string, programmes: Programme[]) {
  const sb = client()
  if (programmes.length === 0) return
  const rows = programmes.map(p => ({ id: p.id, user_id: userId, data: p, updated_at: new Date().toISOString() }))
  await sb.from('programmes').upsert(rows, { onConflict: 'id' })
}

export async function deleteProgrammeFromCloud(programmeId: string) {
  await client().from('programmes').delete().eq('id', programmeId)
}

export async function loadProgrammes(userId: string): Promise<Programme[]> {
  const { data } = await client().from('programmes').select('data').eq('user_id', userId)
  return (data ?? []).map(r => r.data as Programme)
}

// ── Calendar events ───────────────────────────────────────────────────────────

export async function syncCalendarEvents(userId: string, events: EventMap) {
  const sb = client()
  const flat = Object.values(events).flat()
  if (flat.length === 0) return
  const rows = flat.map(e => ({ id: e.id, user_id: userId, date: e.date, data: e }))
  await sb.from('calendar_events').upsert(rows, { onConflict: 'id' })
}

export async function deleteCalendarEventFromCloud(eventId: string) {
  await client().from('calendar_events').delete().eq('id', eventId)
}

export async function loadCalendarEvents(userId: string): Promise<EventMap> {
  const { data } = await client().from('calendar_events').select('data').eq('user_id', userId)
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
  await sb.from('cardio_sessions').upsert(rows, { onConflict: 'id' })
}

export async function deleteCardioSessionFromCloud(sessionId: string) {
  await client().from('cardio_sessions').delete().eq('id', sessionId)
}

export async function loadCardioSessions(userId: string): Promise<CardioSession[]> {
  const { data } = await client().from('cardio_sessions').select('data').eq('user_id', userId)
  return (data ?? []).map(r => r.data as CardioSession)
}

// ── Strength sessions ─────────────────────────────────────────────────────────

export async function syncStrengthSessions(userId: string, sessions: StrengthSession[]) {
  const sb = client()
  if (sessions.length === 0) return
  const rows = sessions.map(s => ({ id: s.id, user_id: userId, data: s }))
  await sb.from('strength_sessions').upsert(rows, { onConflict: 'id' })
}

export async function deleteStrengthSessionFromCloud(sessionId: string) {
  await client().from('strength_sessions').delete().eq('id', sessionId)
}

export async function loadStrengthSessions(userId: string): Promise<StrengthSession[]> {
  const { data } = await client().from('strength_sessions').select('data').eq('user_id', userId)
  return (data ?? []).map(r => r.data as StrengthSession)
}
