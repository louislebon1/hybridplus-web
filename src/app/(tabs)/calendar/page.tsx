'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Check } from 'lucide-react'
import { useCalendarStore } from '@/stores/calendar-store'
import { useProgrammeStore } from '@/stores/programme-store'
import { Button, Input, Sheet } from '@/components/ui'
import type { CalendarEventType } from '@/types'
import { localDateStr } from '@/lib/date'

const EVENT_COLORS: Record<CalendarEventType, string> = {
  strength: '#1DB954', run: '#fefefe', swim: '#fefefe', cycle: '#fefefe',
  walk: '#fefefe', row: '#fefefe', rest: '#3E3E3E', other: '#A7A7A7',
}

const EVENT_ICONS: Record<CalendarEventType, string> = {
  strength: '🏋️', run: '🏃', swim: '🏊', cycle: '🚴',
  walk: '🚶', row: '🚣', rest: '😴', other: '📅',
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
  for (let i = firstDay - 1; i >= 0; i--) {
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
    <div className="flex flex-col h-full">
      {/* Month nav */}
      <div className="flex items-center justify-between px-5 pt-12 pb-3 flex-shrink-0">
        <button onClick={prevMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-bg-element">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <h2 className="text-lg text-text">{MONTHS[month]} {year}</h2>
        <button onClick={nextMonth} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-bg-element">
          <ChevronRight size={20} className="text-text" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-3 flex-shrink-0">
        {DAYS.map((d, i) => (
          <div key={i} className="text-center text-xs text-text-tertiary py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 px-3 flex-shrink-0">
        {cells.map(({ dateStr, currentMonth }) => {
          const dayEvents = events[dateStr] ?? []
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className="flex flex-col items-center py-1.5 gap-0.5"
            >
              <span className={[
                'w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors',
                isSelected ? 'bg-accent text-accent-fg' : isToday ? 'underline text-text' : currentMonth ? 'text-text' : 'text-text-tertiary',
              ].join(' ')}>
                {new Date(dateStr + 'T00:00:00').getDate()}
              </span>
              <div className="flex gap-0.5 h-1.5 items-center">
                {dayEvents.slice(0, 3).map((ev) => (
                  <span
                    key={ev.id}
                    className="w-1 h-1 rounded-full"
                    style={{ backgroundColor: EVENT_COLORS[ev.eventType] }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected day */}
      <div className="flex-1 overflow-y-auto border-t border-border mt-1">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="text-sm text-text">{formatDayHeading(selectedDate)}</p>
          <button
            onClick={() => { setForm(EMPTY_FORM); setShowAddEvent(true) }}
            className="flex items-center gap-1 text-accent text-sm"
          >
            <Plus size={16} />
            ADD
          </button>
        </div>

        <div className="px-5 pb-6 flex flex-col gap-2">
          {selectedEvents.length === 0 ? (
            <p className="text-text-secondary text-sm py-4 text-center">No events — rest or add one above</p>
          ) : (
            selectedEvents.map((ev) => {
              const linkedWorkout = getTemplateName(ev.workoutTemplateId)
              return (
                <div key={ev.id} className="bg-bg-element border border-border rounded-2xl p-3 flex items-center gap-3">
                  <span className="text-xl">{EVENT_ICONS[ev.eventType]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text">{ev.name ?? ev.eventType}</p>
                    <p className="text-xs text-text-secondary">
                      {linkedWorkout && <span className="text-accent">{linkedWorkout}</span>}
                      {linkedWorkout && ev.durationMinutes && ' · '}
                      {ev.durationMinutes && `${ev.durationMinutes} min`}
                    </p>
                  </div>
                  <div className="flex gap-3 items-center">
                    {!ev.isCompleted ? (
                      <button
                        onClick={() => completeEvent(ev.id, selectedDate)}
                        className="text-xs text-text-tertiary hover:text-success transition-colors"
                      >
                        <Check size={16} />
                      </button>
                    ) : (
                      <span className="text-success"><Check size={16} /></span>
                    )}
                    <button
                      onClick={() => deleteEvent(ev.id, selectedDate)}
                      className="text-xs text-text-tertiary hover:text-error transition-colors"
                    >
                      ✕
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
        <form onSubmit={handleAddEvent} className="px-5 py-4 flex flex-col gap-5 pb-8">
          {/* Event type */}
          <div>
            <p className="eyebrow mb-2">Type</p>
            <div className="flex flex-wrap gap-2">
              {(['strength','run','swim','cycle','walk','rest'] as CalendarEventType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, eventType: type, workoutTemplateId: null, programmeId: null }))}
                  className={[
                    'px-3 py-1.5 rounded-full text-sm border transition-colors',
                    form.eventType === type
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-border text-text-secondary hover:bg-bg-element',
                  ].join(' ')}
                >
                  {EVENT_ICONS[type]} {type}
                </button>
              ))}
            </div>
          </div>

          {/* Workout picker — only for strength */}
          {form.eventType === 'strength' && (
            <div>
              <p className="eyebrow mb-2">Workout</p>
              {allTemplates.length === 0 ? (
                <p className="text-text-tertiary text-sm">No workouts yet — create one in Programmes</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {allTemplates.map((t) => {
                    const selected = form.workoutTemplateId === t.id
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => selectTemplate(t.id, t.programmeId, t.name)}
                        className={[
                          'flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors',
                          selected
                            ? 'border-accent bg-accent/10'
                            : 'border-border bg-bg-element hover:bg-bg-hover',
                        ].join(' ')}
                      >
                        <div>
                          <p className={`text-sm ${selected ? 'text-accent' : 'text-text'}`}>{t.name}</p>
                          <p className="text-xs text-text-tertiary">{t.programmeName} · {t.exerciseCount} exercises</p>
                        </div>
                        {selected && <Check size={16} className="text-accent flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <Input
            label="Name (optional)"
            placeholder={form.workoutTemplateId ? 'Leave blank to use workout name' : 'e.g. Morning run'}
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            placeholder="60"
            value={form.durationMinutes}
            onChange={(e) => setForm((f) => ({ ...f, durationMinutes: e.target.value }))}
          />
          <Input
            label="Notes"
            placeholder="Optional notes…"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
          <Button type="submit" size="lg" className="w-full">ADD EVENT</Button>
        </form>
      </Sheet>
    </div>
  )
}
