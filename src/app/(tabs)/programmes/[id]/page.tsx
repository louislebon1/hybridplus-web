'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowDown, ArrowLeft, ArrowUp, Calendar, Check, ChevronDown, ChevronRight, Link2, RefreshCw, Trash2, Unlink, X } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { useTemplateStore } from '@/stores/template-store'
import { Button, Input, Sheet } from '@/components/ui'
import { localDateStr } from '@/lib/date'
import type { ExerciseTemplateBlock, PhaseExerciseOverride, ActivityType, CalendarEventType, PhaseType } from '@/types'
import { EXERCISE_LIBRARY_SORTED } from '@/lib/exercise-library'
import { ActivityIcon } from '@/lib/activity-icons'

const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  foundation: 'Foundation',
  build:      'Build',
  peak:       'Peak',
  deload:     'Deload',
  recovery:   'Recovery',
}

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

const tag = 'text-tag uppercase inline-flex items-center'

function getSupersetLabels(blocks: ExerciseTemplateBlock[]): Record<string, string> {
  const labels: Record<string, string> = {}
  let idx = 0
  for (const b of [...blocks].sort((a, c) => a.orderIndex - c.orderIndex)) {
    if (b.supersetGroupId && !labels[b.supersetGroupId]) {
      labels[b.supersetGroupId] = String.fromCharCode(65 + idx++)
    }
  }
  return labels
}

function fmtSets(block: ExerciseTemplateBlock) {
  return `${block.targetSets} × ${block.targetRepsMin}`
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  if (isNaN(d.getTime())) return 'Select start date'
  return d.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function DayToggle({ days, onToggle }: { days: number[]; onToggle: (next: number[]) => void }) {
  return (
    <div>
      {DAY_LETTERS.map((d, i) => (
        <button key={i}
          onClick={() => onToggle(days.includes(i) ? days.filter(x => x !== i) : [...days, i])}>
          {d}
        </button>
      ))}
    </div>
  )
}

export default function ProgrammeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    programmes, addTemplate, deleteTemplate,
    addBlock, updateBlock, removeBlock, setActivePhase, addTemplateToPhase,
    removeTemplateFromPhase, setTemplateDays, setExerciseOverride, removeExerciseOverride,
    updateProgramme, addCardioTemplate, deleteCardioTemplate,
    addCardioTemplateToPhase, removeCardioTemplateFromPhase, setCardioTemplateDays,
    reorderPhases, deletePhase, deleteProgramme,
  } = useProgrammeStore()

  const { events: calendarEvents, addEvent: addCalendarEvent, deleteEvent: deleteCalendarEvent } = useCalendarStore()
  const { strengthTemplates: libraryStrengthTemplates, cardioTemplates: libraryCardioTemplates } = useTemplateStore()

  const programme = programmes.find(p => p.id === id)

  const [detailTab,         setDetailTab]         = useState<'phases' | 'sessions'>('phases')
  const [expandedPhases,    setExpandedPhases]    = useState<Set<string>>(new Set())
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const [showAddTemplate,   setShowAddTemplate]   = useState(false)
  const [templateName,      setTemplateName]      = useState('')
  const [addExerciseFor,    setAddExerciseFor]    = useState<string | null>(null)
  const [exerciseSearch,    setExerciseSearch]    = useState('')
  const [addSessionFor,     setAddSessionFor]     = useState<string | null>(null)
  const [addSessionType,    setAddSessionType]    = useState<'strength' | 'cardio'>('strength')
  const [addSessionId,      setAddSessionId]      = useState('')
  const [linkingFor,        setLinkingFor]        = useState<{ templateId: string; blockId: string } | null>(null)
  const [showAddCardio,     setShowAddCardio]     = useState(false)
  const [cardioName,        setCardioName]        = useState('')
  const [cardioType,        setCardioType]        = useState<ActivityType>('run')
  const [cardioMinutes,     setCardioMinutes]     = useState('')
  const [cardioKm,          setCardioKm]          = useState('')
  const [editingOverride,   setEditingOverride]   = useState<{ phaseId: string; templateId: string; blockId: string } | null>(null)
  const [overrideForm,      setOverrideForm]      = useState<{
    sets: string; repsMin: string; repsMax: string; rpe: string; intensityPct: string
  }>({ sets: '', repsMin: '', repsMax: '', rpe: '', intensityPct: '' })

  if (!programme) {
    return (
      <div>
        <p>Programme not found</p>
        <button onClick={() => router.back()}>Go back</button>
      </div>
    )
  }

  function togglePhase(phaseId: string) {
    setExpandedPhases(prev => {
      const next = new Set(prev)
      next.has(phaseId) ? next.delete(phaseId) : next.add(phaseId)
      return next
    })
  }

  function toggleTemplate(templateId: string) {
    setExpandedTemplates(prev => {
      const next = new Set(prev)
      next.has(templateId) ? next.delete(templateId) : next.add(templateId)
      return next
    })
  }

  function handleAddTemplate(e: React.FormEvent) {
    e.preventDefault()
    if (!programme || !templateName.trim()) return
    addTemplate(programme.id, templateName.trim())
    setTemplateName(''); setShowAddTemplate(false)
  }

  function openOverrideEditor(phaseId: string, templateId: string, blockId: string) {
    if (!programme) return
    const phase = programme.phases.find(ph => ph.id === phaseId)
    const existing = phase?.overrides.find(o => o.templateId === templateId)
      ?.exerciseOverrides.find(e => e.blockId === blockId)
    setOverrideForm({
      sets:         existing?.targetSetsOverride?.toString()    ?? '',
      repsMin:      existing?.targetRepsMinOverride?.toString() ?? '',
      repsMax:      existing?.targetRepsMaxOverride?.toString() ?? '',
      rpe:          existing?.targetRpeOverride?.toString()     ?? '',
      intensityPct: existing?.intensityPct?.toString()          ?? '',
    })
    setEditingOverride({ phaseId, templateId, blockId })
  }

  function saveOverride() {
    if (!editingOverride || !programme) return
    const override: PhaseExerciseOverride = {
      blockId:               editingOverride.blockId,
      targetSetsOverride:    overrideForm.sets         ? parseInt(overrideForm.sets)           : null,
      targetRepsMinOverride: overrideForm.repsMin      ? parseInt(overrideForm.repsMin)         : null,
      targetRepsMaxOverride: overrideForm.repsMax      ? parseInt(overrideForm.repsMax)         : null,
      targetRpeOverride:     overrideForm.rpe          ? parseFloat(overrideForm.rpe)           : null,
      intensityPct:          overrideForm.intensityPct ? parseFloat(overrideForm.intensityPct)  : null,
    }
    const hasValue = Object.values(override).some((v, i) => i> 0 && v !== null)
    if (hasValue) {
      setExerciseOverride(programme.id, editingOverride.phaseId, editingOverride.templateId, override)
    } else {
      removeExerciseOverride(programme.id, editingOverride.phaseId, editingOverride.templateId, editingOverride.blockId)
    }
    setEditingOverride(null)
  }

  function handleUnlinkBlock(blockId: string, templateId: string) {
    if (!programme) return
    const template = programme.templates.find(t => t.id === templateId)
    const block = template?.exerciseBlocks.find(b => b.id === blockId)
    if (!block?.supersetGroupId) return
    const members = template!.exerciseBlocks.filter(b => b.supersetGroupId === block.supersetGroupId)
    const toUnlink = members.length <= 2 ? members.map(b => b.id) : [blockId]
    toUnlink.forEach(bid => updateBlock(bid, { supersetGroupId: null }))
  }

  function handleLinkSuperset(sourceId: string, targetId: string, templateId: string) {
    if (!programme) return
    const template = programme.templates.find(t => t.id === templateId)
    const source = template?.exerciseBlocks.find(b => b.id === sourceId)
    const target = template?.exerciseBlocks.find(b => b.id === targetId)
    if (!source || !target) return
    const groupId = source.supersetGroupId || target.supersetGroupId || crypto.randomUUID()
    updateBlock(sourceId, { supersetGroupId: groupId })
    updateBlock(targetId, { supersetGroupId: groupId })
    setLinkingFor(null)
  }

  function handleAddCardio(e: React.FormEvent) {
    e.preventDefault()
    if (!programme || !cardioName.trim()) return
    addCardioTemplate(programme.id, {
      name: cardioName.trim(),
      activityType: cardioType,
      targetDurationMinutes: cardioMinutes ? parseInt(cardioMinutes) : null,
      targetDistanceKm:      cardioKm      ? parseFloat(cardioKm)   : null,
    })
    setCardioName(''); setCardioMinutes(''); setCardioKm(''); setShowAddCardio(false)
  }

  function syncToCalendar() {
    if (!programme || !programme.startDate) {
      window.alert('Set a programme start date first')
      return
    }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    Object.entries(calendarEvents).forEach(([date, evs]) => {
      if (new Date(date + 'T00:00:00') < today) return
      evs.forEach(ev => {
        if (ev.programmeId === programme.id && !ev.isCompleted) deleteCalendarEvent(ev.id, date)
      })
    })
    const sortedPhases = [...programme.phases].sort((a, b) => a.orderIndex - b.orderIndex)
    let weekOffset = 0
    for (const phase of sortedPhases) {
      const phaseStart = new Date(programme.startDate! + 'T00:00:00')
      phaseStart.setDate(phaseStart.getDate() + weekOffset * 7)
      const phaseEnd = new Date(phaseStart)
      phaseEnd.setDate(phaseEnd.getDate() + phase.durationWeeks * 7 - 1)
      for (const templateId of phase.templateIds) {
        const template = programme.templates.find(t => t.id === templateId)
        if (!template) continue
        const days = (phase.templateDays ?? {})[templateId] ?? []
        if (days.length === 0) continue
        const cur = new Date(phaseStart)
        while (cur <= phaseEnd) {
          const dow = (cur.getDay() + 6) % 7
          if (days.includes(dow)) {
            addCalendarEvent({ eventType: 'strength', date: localDateStr(cur), name: template.name, isCompleted: false, workoutTemplateId: template.id, programmeId: programme.id, durationMinutes: null, distanceKm: null, distanceMeters: null, runType: null, swimType: null, targetPaceSecs: null, notes: null, colorHex: '#00ABFE' })
          }
          cur.setDate(cur.getDate() + 1)
        }
      }
      for (const cid of (phase.cardioTemplateIds ?? [])) {
        const ct = (programme.cardioTemplates ?? []).find(c => c.id === cid)
        if (!ct) continue
        const days = (phase.cardioTemplateDays ?? {})[cid] ?? []
        if (days.length === 0) continue
        const cur = new Date(phaseStart)
        while (cur <= phaseEnd) {
          const dow = (cur.getDay() + 6) % 7
          if (days.includes(dow)) {
            addCalendarEvent({ eventType: ct.activityType as CalendarEventType, date: localDateStr(cur), name: ct.name, isCompleted: false, workoutTemplateId: null, programmeId: programme.id, durationMinutes: ct.targetDurationMinutes, distanceKm: ct.targetDistanceKm, distanceMeters: null, runType: null, swimType: null, targetPaceSecs: null, notes: null, colorHex: '#00ABFE' })
          }
          cur.setDate(cur.getDate() + 1)
        }
      }
      weekOffset += phase.durationWeeks
    }
  }

  const unassignedTemplates = (phaseId: string) => {
    if (!programme) return []
    const phase = programme.phases.find(ph => ph.id === phaseId)
    if (!phase) return programme.templates
    return programme.templates.filter(t => !phase.templateIds.includes(t.id))
  }

  const unassignedCardioTemplates = (phaseId: string) => {
    if (!programme) return []
    const phase = programme.phases.find(ph => ph.id === phaseId)
    if (!phase) return programme.cardioTemplates ?? []
    return (programme.cardioTemplates ?? []).filter(ct => !(phase.cardioTemplateIds ?? []).includes(ct.id))
  }

  function openAddSession(phaseId: string) {
    setAddSessionFor(phaseId)
    setAddSessionType('strength')
    setAddSessionId('')
  }

  function handleAddSession() {
    if (!programme || !addSessionFor || !addSessionId) return

    if (addSessionId.startsWith('lib:')) {
      const libraryId = addSessionId.slice('lib:'.length)
      if (addSessionType === 'strength') {
        const src = libraryStrengthTemplates.find(t => t.id === libraryId)
        if (!src) return
        const newTemplate = addTemplate(programme.id, src.name)
        for (const b of src.exerciseBlocks) {
          const block = addBlock(newTemplate.id, { id: b.exerciseId, name: b.exerciseName })
          if (block) {
            updateBlock(block.id, {
              setType: b.setType,
              targetSets: b.targetSets,
              targetRepsMin: b.targetRepsMin,
              targetRepsMax: b.targetRepsMax,
              targetWeightKg: b.targetWeightKg,
              targetRpe: b.targetRpe,
              restSeconds: b.restSeconds,
              supersetGroupId: b.supersetGroupId,
              notes: b.notes,
            })
          }
        }
        addTemplateToPhase(programme.id, addSessionFor, newTemplate.id)
      } else {
        const src = libraryCardioTemplates.find(t => t.id === libraryId)
        if (!src) return
        const newCardioTemplate = addCardioTemplate(programme.id, {
          name: src.name,
          activityType: src.activityType,
          targetDurationMinutes: src.targetDurationMinutes,
          targetDistanceKm: src.targetDistanceKm,
        })
        addCardioTemplateToPhase(programme.id, addSessionFor, newCardioTemplate.id)
      }
    } else if (addSessionType === 'strength') {
      addTemplateToPhase(programme.id, addSessionFor, addSessionId)
    } else {
      addCardioTemplateToPhase(programme.id, addSessionFor, addSessionId)
    }
    setAddSessionFor(null)
  }

  function handleSetStartDate(dateStr: string | null) {
    if (!programme) return
    if (dateStr) {
      const otherActive = programmes.find(p => p.id !== programme.id && !!p.startDate)
      if (otherActive) {
        if (!window.confirm(
          `"${otherActive.name}" is already your active programme. Only one programme can be active at a time. Do you want to activate "${programme.name}" instead?`
        )) return
        updateProgramme(otherActive.id, { startDate: null })
        const today = new Date(); today.setHours(0, 0, 0, 0)
        Object.entries(calendarEvents).forEach(([date, evs]) => {
          if (new Date(date + 'T00:00:00') < today) return
          evs.forEach(ev => {
            if (ev.programmeId === otherActive.id && !ev.isCompleted) deleteCalendarEvent(ev.id, date)
          })
        })
      }
    }
    updateProgramme(programme.id, { startDate: dateStr })
  }

  function handleDeleteProgramme() {
    if (!programme) return
    if (!window.confirm(`Delete "${programme.name}"? This cannot be undone.`)) return
    deleteProgramme(programme.id)
    router.replace('/programmes')
  }

  const sortedPhases = [...programme.phases].sort((a, b) => a.orderIndex - b.orderIndex)
  const filteredExercises = exerciseSearch.trim()
    ? EXERCISE_LIBRARY_SORTED.filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
    : EXERCISE_LIBRARY_SORTED
  const sessionOptions: { id: string; name: string }[] = addSessionFor
    ? addSessionType === 'strength'
      ? [
          ...unassignedTemplates(addSessionFor).map(t => ({ id: t.id, name: t.name })),
          ...libraryStrengthTemplates.map(t => ({ id: `lib:${t.id}`, name: `${t.name} (Library)` })),
        ]
      : [
          ...unassignedCardioTemplates(addSessionFor).map(t => ({ id: t.id, name: t.name })),
          ...libraryCardioTemplates.map(t => ({ id: `lib:${t.id}`, name: `${t.name} (Library)` })),
        ]
    : []

  return (
    <div>

      {/* Header */}
      <div>
        <div>
          <button onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </button>
          <h1>
            {programme.name}
          </h1>
        </div>
        <button onClick={handleDeleteProgramme}>
          <Trash2 size={18} />
        </button>
      </div>

      {/* Start date row */}
      <div>
        <div>
          <div>
            <Calendar size={20} />
            <span>
              {programme.startDate ? formatDate(programme.startDate) : 'Select start date'}
            </span>
          </div>
          <input type="date"
            value={programme.startDate ?? ''}
            onChange={e => handleSetStartDate(e.target.value || null)} />
        </div>
        <button onClick={syncToCalendar}>
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div>
        {(['phases', 'sessions'] as const).map(tab => (
          <button key={tab}
            onClick={() => setDetailTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div>

        {/* ── PHASES TAB ──────────────────────────────────────────────────── */}
        {detailTab === 'phases' && (
          <div>

            {sortedPhases.map((phase, idx) => {
              const expanded = expandedPhases.has(phase.id)
              const phaseTemplates = phase.templateIds
                .map(tid => programme.templates.find(t => t.id === tid))
                .filter(Boolean) as typeof programme.templates

              function movePhase(dir: -1 | 1) {
                if (!programme) return
                const ids = sortedPhases.map(p => p.id)
                const to = idx + dir
                if (to < 0 || to>= ids.length) return
                ;[ids[idx], ids[to]] = [ids[to], ids[idx]]
                reorderPhases(programme.id, ids)
              }

              return (
                <div key={phase.id}>
                  {/* Card row */}
                  <button onClick={() => togglePhase(phase.id)}>
                    <div>
                      <span>{phase.name}</span>
                      <div>
                        {(phase.phaseType || phase.isDeload) && (
                          <span>
                            {phase.phaseType ? PHASE_TYPE_LABELS[phase.phaseType] : 'Deload'}
                          </span>
                        )}
                        <span>
                          {phase.durationWeeks} {phase.durationWeeks === 1 ? 'week' : 'weeks'}
                        </span>
                        {phase.isActive && (
                          <span>Active</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight size={16} />
                  </button>

                  {/* Expanded management section */}
                  {expanded && (
                    <div>

                      {/* Phase actions */}
                      <div>
                        {!phase.isActive && (
                          <button onClick={() => setActivePhase(programme.id, phase.id)}>
                            Set active
                          </button>
                        )}
                        <button onClick={() => openAddSession(phase.id)}>
                          + Session
                        </button>
                        <div>
                          <button onClick={() => movePhase(-1)} disabled={idx === 0}>
                            <ArrowUp size={12} />
                          </button>
                          <button onClick={() => movePhase(1)} disabled={idx === sortedPhases.length - 1}>
                            <ArrowDown size={12} />
                          </button>
                          <button onClick={() => { if (window.confirm('Delete this phase?')) deletePhase(programme.id, phase.id) }}>
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Assigned cardio */}
                      {(phase.cardioTemplateIds ?? []).length> 0 && (
                        <div>
                          {(phase.cardioTemplateIds ?? []).map(cid => {
                            const ct = (programme.cardioTemplates ?? []).find(c => c.id === cid)
                            if (!ct) return null
                            const days = (phase.cardioTemplateDays ?? {})[ct.id] ?? []
                            return (
                              <div key={ct.id}>
                                <div>
                                  <div>
                                    <ActivityIcon type={ct.activityType} size={16} />
                                    <div>
                                      <p>{ct.name}</p>
                                      <p>
                                        {ct.activityType}
                                        {ct.targetDurationMinutes ? ` · ${ct.targetDurationMinutes} min` : ''}
                                        {ct.targetDistanceKm ? ` · ${ct.targetDistanceKm} km` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <button onClick={() => removeCardioTemplateFromPhase(programme.id, phase.id, ct.id)}>
                                    Remove
                                  </button>
                                </div>
                                <DayToggle days={days} onToggle={next => setCardioTemplateDays(programme.id, phase.id, ct.id, next)} />
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Assigned workouts */}
                      {phaseTemplates.length> 0 && (
                        <div>
                          {phaseTemplates.map(template => {
                            const templateOverride = phase.overrides.find(o => o.templateId === template.id)
                            const overriddenCount = templateOverride?.exerciseOverrides.length ?? 0
                            const days = phase.templateDays?.[template.id] ?? []
                            return (
                              <div key={template.id}>
                                <div>
                                  <div>
                                    <div>
                                      <p>{template.name}</p>
                                      {overriddenCount> 0 && (
                                        <span>
                                          {overriddenCount} overridden
                                        </span>
                                      )}
                                    </div>
                                    <button onClick={() => removeTemplateFromPhase(programme.id, phase.id, template.id)}>
                                      Remove
                                    </button>
                                  </div>
                                  <DayToggle days={days} onToggle={next => setTemplateDays(programme.id, phase.id, template.id, next)} />
                                </div>
                                {/* Exercise override rows */}
                                {template.exerciseBlocks.map(block => {
                                  const exOverride = templateOverride?.exerciseOverrides.find(e => e.blockId === block.id)
                                  return (
                                    <div key={block.id}>
                                      <div>
                                        <p>{block.exerciseName}</p>
                                        {exOverride ? (
                                          <p>
                                            {[
                                              exOverride.targetSetsOverride != null && `${exOverride.targetSetsOverride} sets`,
                                              exOverride.targetRepsMinOverride != null && `${exOverride.targetRepsMinOverride} reps`,
                                              exOverride.intensityPct != null && `${exOverride.intensityPct}%`,
                                              exOverride.targetRpeOverride != null && `RPE ${exOverride.targetRpeOverride}`,
                                            ].filter(Boolean).join(' · ')}
                                          </p>
                                        ) : (
                                          <p>
                                            {fmtSets(block)}{block.targetWeightKg ? ` @ ${block.targetWeightKg} kg` : ''}
                                          </p>
                                        )}
                                      </div>
                                      <button onClick={() => openOverrideEditor(phase.id, template.id, block.id)}>
                                        {exOverride ? 'Edit' : 'Override'}
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Add new phase CTA */}
            <button onClick={() => router.push(`/programmes/${id}/add-phase`)}>
              Add new phase
            </button>
          </div>
        )}

        {/* ── SESSIONS TAB ───────────────────────────────────────────────── */}
        {detailTab === 'sessions' && (
          <div>

            {/* Template list */}
            {programme.templates.length === 0 ? (
              <div>
                <p>No workouts yet</p>
                <button onClick={() => setShowAddTemplate(true)}>
                  + Add workout
                </button>
              </div>
            ) : (
              <>
                {programme.templates.map(t => {
                  const expanded = expandedTemplates.has(t.id)
                  const ssLabels = getSupersetLabels(t.exerciseBlocks)
                  const sortedBlocks = [...t.exerciseBlocks].sort((a, b) => a.orderIndex - b.orderIndex)
                  return (
                    <div key={t.id}>
                      <button onClick={() => toggleTemplate(t.id)}>
                        <div>
                          <p>{t.name}</p>
                          <p>
                            {t.exerciseBlocks.length} exercise{t.exerciseBlocks.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronDown size={16} />
                      </button>

                      {expanded && (
                        <div>
                          {sortedBlocks.length> 0 && (
                            <div>
                              {['Exercise', 'Sets', 'Reps', 'kg', '', ''].map((h, i) => (
                                <span key={i}>{h}</span>
                              ))}
                            </div>
                          )}
                          {sortedBlocks.map(block => {
                            const label = block.supersetGroupId ? ssLabels[block.supersetGroupId] : null
                            const inSS = !!block.supersetGroupId
                            return (
                              <div key={block.id}>
                                <div>
                                  {label && <span>{label}</span>}
                                  <p>{block.exerciseName}</p>
                                </div>
                                <input type="number" min="1" max="20"
                                  value={block.targetSets || ''}
                                  onChange={e => updateBlock(block.id, { targetSets: e.target.value === '' ? 0 : parseInt(e.target.value) })} />
                                <input type="number" min="1" max="100"
                                  value={block.targetRepsMin || ''}
                                  onChange={e => {
                                    const v = e.target.value === '' ? 0 : parseInt(e.target.value)
                                    updateBlock(block.id, { targetRepsMin: v, targetRepsMax: v })
                                  }} />
                                <input type="number" min="0" step="0.5"
                                  value={block.targetWeightKg ?? ''}
                                  placeholder="—"
                                  onChange={e => updateBlock(block.id, { targetWeightKg: e.target.value ? parseFloat(e.target.value) : null })} />
                                <button onClick={() => removeBlock(block.id)}>
                                  <X size={14} />
                                </button>
                                <button onClick={() => inSS ? handleUnlinkBlock(block.id, t.id) : setLinkingFor({ templateId: t.id, blockId: block.id })}>
                                  {inSS ? <Unlink size={11} /> : <Link2 size={11} />}
                                </button>
                              </div>
                            )
                          })}
                          <div>
                            <button onClick={() => { setAddExerciseFor(t.id); setExerciseSearch('') }}>
                              + Add exercise
                            </button>
                            <button onClick={() => { if (window.confirm('Delete this workout?')) deleteTemplate(t.id) }}>
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                <button onClick={() => setShowAddTemplate(true)}>
                  + Add workout
                </button>
              </>
            )}

            {/* Inline add-template form */}
            {showAddTemplate && (
              <form onSubmit={handleAddTemplate}>
                <Input placeholder="Workout name (e.g. Upper A)" value={templateName} onChange={e => setTemplateName(e.target.value)} autoFocus />
                <div>
                  <Button type="submit" size="sm"  disabled={!templateName.trim()}>Create</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTemplate(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {/* Cardio sessions */}
            <div>
              <div>
                <p>Cardio Sessions</p>
                <button onClick={() => setShowAddCardio(true)}>+ Add</button>
              </div>
              {(programme.cardioTemplates ?? []).map(ct => (
                <div key={ct.id}>
                  <div>
                    <ActivityIcon type={ct.activityType} size={20} />
                    <div>
                      <p>{ct.name}</p>
                      <p>
                        {ct.activityType}
                        {ct.targetDurationMinutes ? ` · ${ct.targetDurationMinutes} min` : ''}
                        {ct.targetDistanceKm ? ` · ${ct.targetDistanceKm} km` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { if (window.confirm('Delete this cardio session?')) deleteCardioTemplate(ct.id) }}>✕</button>
                </div>
              ))}
              {showAddCardio && (
                <form onSubmit={handleAddCardio}>
                  <Input placeholder="Session name (e.g. Easy Run)" value={cardioName} onChange={e => setCardioName(e.target.value)} autoFocus />
                  <div>
                    {(['run', 'swim', 'cycle', 'walk', 'row'] as ActivityType[]).map(type => (
                      <button key={type} type="button" onClick={() => setCardioType(type)}>
                        <span><ActivityIcon type={type} size={14} />{type}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <Input label="Duration (min)" type="number" min="1" placeholder="30" value={cardioMinutes} onChange={e => setCardioMinutes(e.target.value)} />
                    <Input label="Distance (km)" type="number" step="0.1" placeholder="5" value={cardioKm} onChange={e => setCardioKm(e.target.value)} />
                  </div>
                  <div>
                    <Button type="submit" size="sm"  disabled={!cardioName.trim()}>Create</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddCardio(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── SHEETS ──────────────────────────────────────────────────────── */}

      <Sheet visible={!!addSessionFor} onClose={() => setAddSessionFor(null)} title="Add session">
        {addSessionFor && (
          <div>
            <div>
              {(['strength', 'cardio'] as const).map(type => (
                <button key={type}
                  onClick={() => { setAddSessionType(type); setAddSessionId('') }}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>

            <div>
              <select value={addSessionId}
                onChange={e => setAddSessionId(e.target.value)}>
                <option value="">Select session</option>
                {sessionOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
              <ChevronDown size={16} />
            </div>

            {sessionOptions.length === 0 && (
              <p>
                {addSessionType === 'strength' ? 'All workouts are already assigned' : 'All cardio sessions are already assigned'}
              </p>
            )}

            <Button size="lg"  disabled={!addSessionId} onClick={handleAddSession}>
              Add session
            </Button>
          </div>
        )}
      </Sheet>

      <Sheet visible={!!linkingFor} onClose={() => setLinkingFor(null)} title="Superset With">
        {linkingFor && (() => {
          const template = programme.templates.find(t => t.id === linkingFor.templateId)
          const source = template?.exerciseBlocks.find(b => b.id === linkingFor.blockId)
          const labels = getSupersetLabels(template?.exerciseBlocks ?? [])
          const candidates = (template?.exerciseBlocks ?? []).filter(b => b.id !== linkingFor.blockId).sort((a, b) => a.orderIndex - b.orderIndex)
          return candidates.length === 0 ? (
            <p>Add more exercises to this workout first</p>
          ) : (
            <div>
              {source && <div><p>Linking</p><p>{source.exerciseName}</p></div>}
              {candidates.map(b => {
                const existingLabel = b.supersetGroupId ? labels[b.supersetGroupId] : null
                const alreadyLinked = source?.supersetGroupId && b.supersetGroupId === source.supersetGroupId
                return (
                  <button key={b.id} 
                    onClick={() => handleLinkSuperset(linkingFor.blockId, b.id, linkingFor.templateId)} disabled={!!alreadyLinked}>
                    <div>
                      <p>{b.exerciseName}</p>
                      {existingLabel && <p>In superset {existingLabel} — will merge</p>}
                    </div>
                    {alreadyLinked && <Check size={14} />}
                  </button>
                )
              })}
            </div>
          )
        })()}
      </Sheet>

      <Sheet visible={!!addExerciseFor} onClose={() => setAddExerciseFor(null)} title="Add Exercise">
        <div>
          <Input placeholder="Search exercises…" value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} autoFocus />
        </div>
        <div>
          {exerciseSearch.trim() && !filteredExercises.some(e => e.name.toLowerCase() === exerciseSearch.trim().toLowerCase()) && (
            <button onClick={() => {
                const name = exerciseSearch.trim()
                if (addExerciseFor) addBlock(addExerciseFor, { id: `custom-${Date.now()}`, name })
                setAddExerciseFor(null); setExerciseSearch('')
              }}>
              <span>+</span>
              Add &ldquo;{exerciseSearch.trim()}&rdquo;
            </button>
          )}
          {filteredExercises.slice(0, 50).map(ex => (
            <button key={ex.id} 
              onClick={() => {
                if (addExerciseFor) addBlock(addExerciseFor, { id: ex.id, name: ex.name })
                setAddExerciseFor(null); setExerciseSearch('')
              }}>
              {ex.name}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet visible={!!editingOverride} onClose={() => setEditingOverride(null)} title="Override Exercise">
        {editingOverride && (() => {
          const template = programme.templates.find(t => t.id === editingOverride.templateId)
          const block = template?.exerciseBlocks.find(b => b.id === editingOverride.blockId)
          return (
            <div>
              <div>
                <p>{block?.exerciseName}</p>
                <p>
                  Default: {block ? fmtSets(block) : '—'}{block?.targetWeightKg ? ` @ ${block.targetWeightKg} kg` : ''}{block?.targetRpe ? ` · RPE ${block.targetRpe}` : ''}
                </p>
                <p>Leave blank to keep the default value.</p>
              </div>
              <div>
                <Input label="Sets" type="number" placeholder={`Default: ${block?.targetSets ?? '—'}`} value={overrideForm.sets} onChange={e => setOverrideForm(f => ({ ...f, sets: e.target.value }))} />
                <Input label="Intensity %" type="number" min="1" max="150" placeholder="e.g. 80" value={overrideForm.intensityPct} onChange={e => setOverrideForm(f => ({ ...f, intensityPct: e.target.value }))} />
                <Input label="Reps" type="number" min="1" placeholder={`Default: ${block?.targetRepsMin ?? '—'}`} value={overrideForm.repsMin} onChange={e => setOverrideForm(f => ({ ...f, repsMin: e.target.value, repsMax: e.target.value }))} />
                <Input label="Target RPE" type="number" min="1" max="10" step="0.5" placeholder="e.g. 8" value={overrideForm.rpe} onChange={e => setOverrideForm(f => ({ ...f, rpe: e.target.value }))} />
              </div>
              <Button size="lg"  onClick={saveOverride}>
                <Check size={16} /> SAVE OVERRIDES
              </Button>
            </div>
          )
        })()}
      </Sheet>

    </div>
  )
}
