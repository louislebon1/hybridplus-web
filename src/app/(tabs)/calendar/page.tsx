'use client'

import { useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { useCalendarStore } from '@/stores/calendar-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { Button, Input, Sheet } from '@/components/ui'
import type { CalendarEventType } from '@/types'
import { localDateStr } from '@/lib/date'
import { ActivityIcon } from '@/lib/activity-icons'

// Tonal, not hued. The accent is reserved for live training and PRs, so a
// month grid separates its marks by value: strength solid, conditioning
// mid-tone, rest barely there.
const EVENT_COLORS: Record<CalendarEventType, string> = {
  strength: 'var(--zone-1)', run: 'var(--zone-3)', swim: 'var(--zone-3)', cycle: 'var(--zone-3)',
  walk: 'var(--zone-3)', row: 'var(--zone-3)', rest: 'var(--zone-5)', other: 'var(--zone-4)',
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const isoDate = localDateStr

function formatDayHeading(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

const EMPTY_FORM = {
  eventType: 'strength' as CalendarEventType,
  name: '',
  durationMinutes: '',
  notes: '',
  workoutTemplateId: null as string | null,
  programmeId: null as string | null,
}

export default function CalendarPage() {
  const today = isoDate(new Date())
  const { events, selectedDate, setSelectedDate, addEvent, deleteEvent, completeEvent } = useCalendarStore()
  const { programmes } = useProgrammeStore()

  const [viewDate, setViewDate] = useState(() => new Date())
  const [showAddEvent, setShowAddEvent] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  // Flat list of all templates with their programme name
  const allTemplates = programmes.flatMap((p) =>
    p.templates.map((t) => ({ id: t.id, name: t.name, programmeId: p.id, programmeName: p.name, exerciseCount: t.exerciseBlocks.length }))
  )

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()

  const cells: { dateStr: string; currentMonth: boolean }[] = []
  for (let i = firstDay - 1; i>= 0; i--) {
    const d = new Date(year, month - 1, daysInPrev - i)
    cells.push({ dateStr: isoDate(d), currentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ dateStr: isoDate(new Date(year, month, d)), currentMonth: true })
  }
  while (cells.length % 7 !== 0) {
    const d = new Date(year, month + 1, cells.length - firstDay - daysInMonth + 1)
    cells.push({ dateStr: isoDate(d), currentMonth: false })
  }

  function prevMonth() { setViewDate(new Date(year, month - 1, 1)) }
  function nextMonth() { setViewDate(new Date(year, month + 1, 1)) }

  function selectTemplate(templateId: string, programmeId: string, templateName: string) {
    setForm((f) => ({
      ...f,
      workoutTemplateId: templateId,
      programmeId,
      name: f.name || templateName,
    }))
  }

  function handleAddEvent(e: React.FormEvent) {
    e.preventDefault()
    addEvent({
      eventType: form.eventType,
      date: selectedDate,
      name: form.name || null,
      isCompleted: false,
      workoutTemplateId: form.workoutTemplateId,
      programmeId: form.programmeId,
      durationMinutes: form.durationMinutes ? parseInt(form.durationMinutes) : null,
      distanceKm: null,
      distanceMeters: null,
      runType: null,
      swimType: null,
      targetPaceSecs: null,
      notes: form.notes || null,
      colorHex: EVENT_COLORS[form.eventType],
    })
    setForm(EMPTY_FORM)
    setShowAddEvent(false)
  }

  // Look up template name for display on event cards
  function getTemplateName(templateId: string | null) {
    if (!templateId) return null
    return allTemplates.find((t) => t.id === templateId)?.name ?? null
  }

  const selectedEvents = events[selectedDate] ?? []

  return (
    <div>
      {/* Month nav */}
      <div>
        <button onClick={prevMonth}>
          <ChevronLeft size={20} />
        </button>
        <h2>{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth}>
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Day labels */}
      <div>
        {DAYS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div>
        {cells.map(({ dateStr, currentMonth }) => {
          const dayEvents = events[dateStr] ?? []
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          return (
            <button key={dateStr}
              onClick={() => setSelectedDate(dateStr)}>
              <span>
                {new Date(dateStr + 'T00:00:00').getDate()}
              </span>
              <div>
                {dayEvents.slice(0, 3).map((ev) => (
                  <span key={ev.id} />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected day */}
      <div>
        <div>
          <p>{formatDayHeading(selectedDate)}</p>
          <button onClick={() => { setForm(EMPTY_FORM); setShowAddEvent(true) }}>
            <Plus size={16} />
            ADD
          </button>
        </div>

        <div>
          {selectedEvents.length === 0 ? (
            <p>No events — rest or add one above</p>
          ) : (
            selectedEvents.map((ev) => {
              const linkedWorkout = getTemplateName(ev.workoutTemplateId)
              return (
                <div key={ev.id}>
                  <ActivityIcon type={ev.eventType} size={20} />
                  <div>
                    <p>{ev.name ?? ev.eventType}</p>
                    <p>
                      {linkedWorkout && <span>{linkedWorkout}</span>}
                      {linkedWorkout && ev.durationMinutes && ' · '}
                      {ev.durationMinutes && `${ev.durationMinutes} min`}
                    </p>
                  </div>
                  <div>
                    {!ev.isCompleted ? (
                      <button onClick={() => completeEvent(ev.id, selectedDate)}>
                        <Check size={16} />
                      </button>
                    ) : (
                      <span><Check size={16} /></span>
                    )}
                    <button onClick={() => deleteEvent(ev.id, selectedDate)}>
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Add event sheet */}
      <Sheet visible={showAddEvent} onClose={() => setShowAddEvent(false)} title="Add Event">
        <form onSubmit={handleAddEvent}>
          {/* Event type */}
          <div>
            <p>Type</p>
            <div>
              {(['strength','run','swim','cycle','walk','rest'] as CalendarEventType[]).map((type) => (
                <button key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, eventType: type, workoutTemplateId: null, programmeId: null }))}>
                  <span><ActivityIcon type={type} size={14} />{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Workout picker — only for strength */}
          {form.eventType === 'strength' && (
            <div>
              <p>Workout</p>
              {allTemplates.length === 0 ? (
                <p>No workouts yet — create one in Programmes</p>
              ) : (
                <div>
                  {allTemplates.map((t) => {
                    const selected = form.workoutTemplateId === t.id
                    return (
                      <button key={t.id}
                        type="button"
                        onClick={() => selectTemplate(t.id, t.programmeId, t.name)}>
                        <div>
                          <p>{t.name}</p>
                          <p>{t.programmeName} · {t.exerciseCount} exercises</p>
                        </div>
                        {selected && <Check size={16} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <Input label="Name (optional)"
            placeholder={form.workoutTemplateId ? 'Leave blank to use workout name' : 'e.g. Morning run'}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input label="Duration (minutes)"
            type="number"
            placeholder="60"
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))} />
          <Input label="Notes"
            placeholder="Optional notes…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          <Button type="submit" size="lg">ADD EVENT</Button>
        </form>
      </Sheet>
    </div>
  )
}
