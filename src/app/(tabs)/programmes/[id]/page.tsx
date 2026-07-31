'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight, Check, Link2, Unlink, ArrowUp, ArrowDown, Calendar, RefreshCw, Trash2 } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { useCalendarStore } from '@/stores/calendar-store'
import { Button, Input, Sheet } from '@/components/ui'
import { localDateStr } from '@/lib/date'
import type { ExerciseTemplateBlock, PhaseExerciseOverride, ActivityType, CalendarEventType, PhaseType } from '@/types'
import { EXERCISE_LIBRARY } from '@/lib/exercise-library'

const FONT = 'var(--font-geist-sans)'

const PHASE_TYPE_LABELS: Record<PhaseType, string> = {
  foundation: 'Foundation',
  build:      'Build',
  peak:       'Peak',
  deload:     'Deload',
  recovery:   'Recovery',
}

const CARDIO_ICONS: Record<ActivityType, string> = { run: '🏃', swim: '🏊', cycle: '🚴', walk: '🚶', row: '🚣' }

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
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
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

  const programme = programmes.find(p => p.id === id)

  const [detailTab,         setDetailTab]         = useState<'phases' | 'sessions'>('phases')
  const [expandedPhases,    setExpandedPhases]    = useState<Set<string>>(new Set())
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const [showAddTemplate,   setShowAddTemplate]   = useState(false)
  const [templateName,      setTemplateName]      = useState('')
  const [addExerciseFor,    setAddExerciseFor]    = useState<string | null>(null)
  const [exerciseSearch,    setExerciseSearch]    = useState('')
  const [assignWorkoutFor,  setAssignWorkoutFor]  = useState<string | null>(null)
  const [assignCardioFor,   setAssignCardioFor]   = useState<string | null>(null)
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
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center', gap: '16px', fontFamily: FONT }}>
        <p style={{ color: 'rgba(17,17,17,0.5)', fontSize: '14px' }}>Programme not found</p>
        <button onClick={() => router.back()} style={{ fontSize: '14px', color: '#3B948F', background: 'none', border: 'none', cursor: 'pointer' }}>Go back</button>
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
    const hasValue = Object.values(override).some((v, i) => i > 0 && v !== null)
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
            addCalendarEvent({ eventType: 'strength', date: localDateStr(cur), name: template.name, isCompleted: false, workoutTemplateId: template.id, programmeId: programme.id, durationMinutes: null, distanceKm: null, distanceMeters: null, runType: null, swimType: null, targetPaceSecs: null, notes: null, colorHex: '#3B948F' })
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
            addCalendarEvent({ eventType: ct.activityType as CalendarEventType, date: localDateStr(cur), name: ct.name, isCompleted: false, workoutTemplateId: null, programmeId: programme.id, durationMinutes: ct.targetDurationMinutes, distanceKm: ct.targetDistanceKm, distanceMeters: null, runType: null, swimType: null, targetPaceSecs: null, notes: null, colorHex: '#3B948F' })
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

  function handleSetStartDate(dateStr: string | null) {
    if (!programme) return
    if (dateStr) {
      const otherActive = programmes.find(p => p.id !== programme.id && !!p.startDate)
      if (otherActive) {
        if (!window.confirm(
          `"${otherActive.name}" is already your active programme. Only one programme can be active at a time. Do you want to activate "${programme.name}" instead?`
        )) return
        updateProgramme(otherActive.id, { startDate: null })
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

  const isActive = !!programme.startDate

  const sortedPhases = [...programme.phases].sort((a, b) => a.orderIndex - b.orderIndex)
  const filteredExercises = exerciseSearch.trim()
    ? EXERCISE_LIBRARY.filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
    : EXERCISE_LIBRARY

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT, background: '#FFFEFA' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
          <button
            onClick={() => router.back()}
            style={{ width: '32px', height: '32px', borderRadius: '200px', background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            <ArrowLeft size={16} color="#3B948F" />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 500, lineHeight: '26px', color: '#111111', margin: 0, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {programme.name}
          </h1>
        </div>
        <button
          onClick={handleDeleteProgramme}
          style={{ width: '40px', height: '40px', borderRadius: '200px', background: '#D24F4F', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: '12px' }}
        >
          <Trash2 size={18} color="#FFFEFA" />
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(17,17,17,0.05)', margin: '20px 0 0', flexShrink: 0 }} />

      {/* Start date row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', flexShrink: 0 }}>
        <div style={{ flex: 1, position: 'relative' }}>
          {/* Visual pill */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '0 24px', height: '48px', borderRadius: '40px',
            background: 'rgba(17,17,17,0.05)',
            pointerEvents: 'none',
          }}>
            <Calendar size={20} color="#111111" />
            <span style={{ fontSize: '16px', fontWeight: 500, color: '#111111', lineHeight: '24px' }}>
              {programme.startDate ? formatDate(programme.startDate) : 'Select start date'}
            </span>
          </div>
          {/* Transparent native date input covering the pill */}
          <input
            type="date"
            value={programme.startDate ?? ''}
            onChange={e => handleSetStartDate(e.target.value || null)}
            style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
          />
        </div>
        <button
          onClick={syncToCalendar}
          style={{ width: '48px', height: '48px', borderRadius: '40px', background: '#3B948F', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <RefreshCw size={18} color="#FFFEFA" />
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(17,17,17,0.05)', flexShrink: 0 }} />

      {/* Tabs */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', padding: '0 16px', borderBottom: '1px solid rgba(17,17,17,0.05)', flexShrink: 0 }}>
        {(['phases', 'sessions'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setDetailTab(tab)}
            style={{
              padding: '8px 0',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: detailTab === tab ? '2px solid #111111' : '2px solid transparent',
              marginBottom: '-1px',
              fontFamily: FONT,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '24px',
              color: '#111111',
              opacity: detailTab === tab ? 1 : 0.4,
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px' }}>

        {/* ── PHASES TAB ──────────────────────────────────────────────────── */}
        {detailTab === 'phases' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {sortedPhases.map((phase, idx) => {
              const expanded = expandedPhases.has(phase.id)
              const phaseTemplates = phase.templateIds
                .map(tid => programme.templates.find(t => t.id === tid))
                .filter(Boolean) as typeof programme.templates

              function movePhase(dir: -1 | 1) {
                if (!programme) return
                const ids = sortedPhases.map(p => p.id)
                const to = idx + dir
                if (to < 0 || to >= ids.length) return
                ;[ids[idx], ids[to]] = [ids[to], ids[idx]]
                reorderPhases(programme.id, ids)
              }

              return (
                <div key={phase.id} style={{ borderRadius: '12px', overflow: 'hidden', background: 'rgba(17,17,17,0.03)' }}>
                  {/* Card row */}
                  <button
                    onClick={() => togglePhase(phase.id)}
                    style={{
                      width: '100%', padding: '12px 16px', border: 'none', background: 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 500, lineHeight: '24px', color: '#111111' }}>
                        {phase.name}
                      </span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {(phase.phaseType || phase.isDeload) && (
                          <span style={{
                            padding: '4px 12px', borderRadius: '200px', background: '#3B948F',
                            color: '#FFFDF5', fontSize: '11px', fontWeight: 500, lineHeight: '14px',
                            letterSpacing: '0.02em', textTransform: 'uppercase',
                          }}>
                            {phase.phaseType ? PHASE_TYPE_LABELS[phase.phaseType] : 'Deload'}
                          </span>
                        )}
                        <span style={{
                          padding: '4px 8px', borderRadius: '4px', background: 'rgba(17,17,17,0.05)',
                          color: '#3B948F', fontSize: '11px', fontWeight: 500, lineHeight: '14px',
                          letterSpacing: '0.02em', textTransform: 'uppercase',
                        }}>
                          {phase.durationWeeks} {phase.durationWeeks === 1 ? 'week' : 'weeks'}
                        </span>
                        {phase.isActive && (
                          <span style={{
                            padding: '4px 8px', borderRadius: '4px', background: 'rgba(59,148,143,0.12)',
                            color: '#3B948F', fontSize: '11px', fontWeight: 500, lineHeight: '14px',
                            letterSpacing: '0.02em', textTransform: 'uppercase',
                          }}>
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight
                      size={16}
                      color="rgba(17,17,17,0.4)"
                      style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}
                    />
                  </button>

                  {/* Expanded management section */}
                  {expanded && (
                    <div style={{ borderTop: '1px solid rgba(17,17,17,0.06)' }}>

                      {/* Phase actions */}
                      <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {!phase.isActive && (
                          <button
                            onClick={() => setActivePhase(programme.id, phase.id)}
                            style={{ fontSize: '12px', color: '#3B948F', border: '1px solid rgba(59,148,143,0.3)', borderRadius: '200px', padding: '4px 12px', background: 'none', cursor: 'pointer' }}
                          >
                            Set active
                          </button>
                        )}
                        <button
                          onClick={() => setAssignWorkoutFor(phase.id)}
                          style={{ fontSize: '12px', color: 'rgba(17,17,17,0.6)', border: '1px solid rgba(17,17,17,0.12)', borderRadius: '200px', padding: '4px 12px', background: 'none', cursor: 'pointer' }}
                        >
                          + Workout
                        </button>
                        <button
                          onClick={() => setAssignCardioFor(phase.id)}
                          style={{ fontSize: '12px', color: 'rgba(17,17,17,0.6)', border: '1px solid rgba(17,17,17,0.12)', borderRadius: '200px', padding: '4px 12px', background: 'none', cursor: 'pointer' }}
                        >
                          + Cardio
                        </button>
                        <div style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
                          <button onClick={() => movePhase(-1)} disabled={idx === 0} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', opacity: idx === 0 ? 0.2 : 1 }}>
                            <ArrowUp size={12} color="#111111" />
                          </button>
                          <button onClick={() => movePhase(1)} disabled={idx === sortedPhases.length - 1} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', opacity: idx === sortedPhases.length - 1 ? 0.2 : 1 }}>
                            <ArrowDown size={12} color="#111111" />
                          </button>
                          <button
                            onClick={() => { if (window.confirm('Delete this phase?')) deletePhase(programme.id, phase.id) }}
                            style={{ fontSize: '12px', color: 'rgba(200,40,40,0.8)', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      {/* Assigned cardio */}
                      {(phase.cardioTemplateIds ?? []).length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(17,17,17,0.06)' }}>
                          {(phase.cardioTemplateIds ?? []).map(cid => {
                            const ct = (programme.cardioTemplates ?? []).find(c => c.id === cid)
                            if (!ct) return null
                            return (
                              <div key={ct.id} style={{ padding: '12px 16px', background: 'rgba(17,17,17,0.02)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px' }}>{CARDIO_ICONS[ct.activityType]}</span>
                                    <div>
                                      <p style={{ fontSize: '12px', color: '#111111', margin: 0 }}>{ct.name}</p>
                                      <p style={{ fontSize: '10px', color: 'rgba(17,17,17,0.4)', margin: 0, textTransform: 'capitalize' }}>
                                        {ct.activityType}
                                        {ct.targetDurationMinutes ? ` · ${ct.targetDurationMinutes} min` : ''}
                                        {ct.targetDistanceKm ? ` · ${ct.targetDistanceKm} km` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <button onClick={() => removeCardioTemplateFromPhase(programme.id, phase.id, ct.id)} style={{ fontSize: '12px', color: 'rgba(200,40,40,0.8)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                    Remove
                                  </button>
                                </div>
                                {/* Day toggles */}
                                {(() => {
                                  const days = (phase.cardioTemplateDays ?? {})[ct.id] ?? []
                                  return (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                      {['M','T','W','T','F','S','S'].map((d, i) => (
                                        <button
                                          key={i}
                                          onClick={() => {
                                            const next = days.includes(i) ? days.filter(x => x !== i) : [...days, i]
                                            setCardioTemplateDays(programme.id, phase.id, ct.id, next)
                                          }}
                                          style={{
                                            width: '28px', height: '28px', borderRadius: '200px', border: 'none',
                                            background: days.includes(i) ? '#3B948F' : 'rgba(17,17,17,0.05)',
                                            color: days.includes(i) ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
                                            fontSize: '10px', fontWeight: 500, cursor: 'pointer', fontFamily: FONT,
                                          }}
                                        >
                                          {d}
                                        </button>
                                      ))}
                                    </div>
                                  )
                                })()}
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* Assigned workouts */}
                      {phaseTemplates.length > 0 && (
                        <div style={{ borderTop: '1px solid rgba(17,17,17,0.06)' }}>
                          {phaseTemplates.map(template => {
                            const templateOverride = phase.overrides.find(o => o.templateId === template.id)
                            const overriddenCount = templateOverride?.exerciseOverrides.length ?? 0
                            return (
                              <div key={template.id} style={{ borderTop: '1px solid rgba(17,17,17,0.06)' }}>
                                <div style={{ padding: '12px 16px', background: 'rgba(17,17,17,0.02)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <p style={{ fontSize: '12px', color: '#111111', margin: 0 }}>{template.name}</p>
                                      {overriddenCount > 0 && (
                                        <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '200px', background: 'rgba(59,148,143,0.12)', color: '#3B948F' }}>
                                          {overriddenCount} overridden
                                        </span>
                                      )}
                                    </div>
                                    <button onClick={() => removeTemplateFromPhase(programme.id, phase.id, template.id)} style={{ fontSize: '12px', color: 'rgba(200,40,40,0.8)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                      Remove
                                    </button>
                                  </div>
                                  {/* Day toggles */}
                                  {(() => {
                                    const days = phase.templateDays?.[template.id] ?? []
                                    return (
                                      <div style={{ display: 'flex', gap: '4px' }}>
                                        {['M','T','W','T','F','S','S'].map((d, i) => (
                                          <button
                                            key={i}
                                            onClick={() => {
                                              const next = days.includes(i) ? days.filter(x => x !== i) : [...days, i]
                                              setTemplateDays(programme.id, phase.id, template.id, next)
                                            }}
                                            style={{
                                              width: '28px', height: '28px', borderRadius: '200px', border: 'none',
                                              background: days.includes(i) ? '#3B948F' : 'rgba(17,17,17,0.05)',
                                              color: days.includes(i) ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
                                              fontSize: '10px', fontWeight: 500, cursor: 'pointer', fontFamily: FONT,
                                            }}
                                          >
                                            {d}
                                          </button>
                                        ))}
                                      </div>
                                    )
                                  })()}
                                </div>
                                {/* Exercise override rows */}
                                {template.exerciseBlocks.map(block => {
                                  const exOverride = templateOverride?.exerciseOverrides.find(e => e.blockId === block.id)
                                  return (
                                    <div
                                      key={block.id}
                                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderTop: '1px solid rgba(17,17,17,0.04)' }}
                                    >
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '12px', color: '#111111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.exerciseName}</p>
                                        {exOverride ? (
                                          <p style={{ fontSize: '10px', color: '#3B948F', margin: 0, marginTop: '2px' }}>
                                            {[
                                              exOverride.targetSetsOverride != null && `${exOverride.targetSetsOverride} sets`,
                                              exOverride.targetRepsMinOverride != null && `${exOverride.targetRepsMinOverride} reps`,
                                              exOverride.intensityPct != null && `${exOverride.intensityPct}%`,
                                              exOverride.targetRpeOverride != null && `RPE ${exOverride.targetRpeOverride}`,
                                            ].filter(Boolean).join(' · ')}
                                          </p>
                                        ) : (
                                          <p style={{ fontSize: '10px', color: 'rgba(17,17,17,0.4)', margin: 0, marginTop: '2px' }}>
                                            {fmtSets(block)}{block.targetWeightKg ? ` @ ${block.targetWeightKg} kg` : ''}
                                          </p>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => openOverrideEditor(phase.id, template.id, block.id)}
                                        style={{ fontSize: '12px', color: '#3B948F', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '12px', flexShrink: 0 }}
                                      >
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
            <button
              onClick={() => router.push(`/programmes/${id}/add-phase`)}
              style={{
                width: '100%', height: '48px', borderRadius: '40px',
                border: '1px solid #3B948F', background: '#3B948F',
                fontFamily: FONT, fontSize: '14px', fontWeight: 500, lineHeight: '24px',
                color: '#FFFEFA', cursor: 'pointer',
                marginTop: sortedPhases.length > 0 ? '4px' : 0,
              }}
            >
              Add new phase
            </button>
          </div>
        )}

        {/* ── SESSIONS TAB ───────────────────────────────────────────────── */}
        {detailTab === 'sessions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Template list */}
            {programme.templates.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ fontSize: '14px', color: 'rgba(17,17,17,0.4)', margin: 0 }}>No workouts yet</p>
                <button
                  onClick={() => setShowAddTemplate(true)}
                  style={{ marginTop: '12px', fontSize: '14px', color: '#3B948F', background: 'none', border: 'none', cursor: 'pointer' }}
                >
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
                    <div key={t.id} style={{ borderRadius: '12px', overflow: 'hidden', background: 'rgba(17,17,17,0.03)' }}>
                      <button
                        onClick={() => toggleTemplate(t.id)}
                        style={{
                          width: '100%', padding: '12px 16px', border: 'none', background: 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left',
                        }}
                      >
                        <div>
                          <p style={{ fontSize: '18px', fontWeight: 500, lineHeight: '24px', color: '#111111', margin: 0 }}>{t.name}</p>
                          <p style={{ fontSize: '12px', color: 'rgba(17,17,17,0.5)', margin: '2px 0 0' }}>
                            {t.exerciseBlocks.length} exercise{t.exerciseBlocks.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <ChevronRight
                          size={16}
                          color="rgba(17,17,17,0.4)"
                          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
                        />
                      </button>

                      {expanded && (
                        <div style={{ borderTop: '1px solid rgba(17,17,17,0.06)' }}>
                          {sortedBlocks.length > 0 && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 44px 64px 28px 24px', gap: '6px', padding: '8px 16px 4px' }}>
                              {['Exercise', 'Sets', 'Reps', 'kg', '', ''].map((h, i) => (
                                <span key={i} style={{ fontSize: '10px', color: 'rgba(17,17,17,0.4)', fontFamily: 'monospace', textAlign: i === 0 ? 'left' : 'center' }}>{h}</span>
                              ))}
                            </div>
                          )}
                          {sortedBlocks.map(block => {
                            const label = block.supersetGroupId ? ssLabels[block.supersetGroupId] : null
                            const inSS = !!block.supersetGroupId
                            return (
                              <div
                                key={block.id}
                                style={{
                                  display: 'grid', gridTemplateColumns: '1fr 44px 44px 64px 28px 24px', gap: '6px',
                                  alignItems: 'center', padding: '6px 16px',
                                  borderTop: '1px solid rgba(17,17,17,0.04)',
                                  background: inSS ? 'rgba(59,148,143,0.04)' : 'transparent',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0 }}>
                                  {label && <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: '#3B948F', flexShrink: 0, width: '12px' }}>{label}</span>}
                                  <p style={{ fontSize: '12px', color: '#111111', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.exerciseName}</p>
                                </div>
                                <input
                                  type="number" min="1" max="20"
                                  value={block.targetSets || ''}
                                  onChange={e => updateBlock(block.id, { targetSets: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                  style={{ height: '28px', textAlign: 'center', fontSize: '12px', color: '#111111', background: 'rgba(17,17,17,0.05)', border: '1px solid rgba(17,17,17,0.1)', borderRadius: '6px', outline: 'none', width: '100%', fontFamily: FONT }}
                                />
                                <input
                                  type="number" min="1" max="100"
                                  value={block.targetRepsMin || ''}
                                  onChange={e => {
                                    const v = e.target.value === '' ? 0 : parseInt(e.target.value)
                                    updateBlock(block.id, { targetRepsMin: v, targetRepsMax: v })
                                  }}
                                  style={{ height: '28px', textAlign: 'center', fontSize: '12px', color: '#111111', background: 'rgba(17,17,17,0.05)', border: '1px solid rgba(17,17,17,0.1)', borderRadius: '6px', outline: 'none', width: '100%', fontFamily: FONT }}
                                />
                                <input
                                  type="number" min="0" step="0.5"
                                  value={block.targetWeightKg ?? ''}
                                  placeholder="—"
                                  onChange={e => updateBlock(block.id, { targetWeightKg: e.target.value ? parseFloat(e.target.value) : null })}
                                  style={{ height: '28px', textAlign: 'center', fontSize: '12px', color: '#111111', background: 'rgba(17,17,17,0.05)', border: '1px solid rgba(17,17,17,0.1)', borderRadius: '6px', outline: 'none', width: '100%', fontFamily: FONT }}
                                />
                                <button
                                  onClick={() => removeBlock(block.id)}
                                  style={{ height: '28px', width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(17,17,17,0.4)', fontSize: '14px' }}
                                >
                                  ✕
                                </button>
                                <button
                                  onClick={() => inSS ? handleUnlinkBlock(block.id, t.id) : setLinkingFor({ templateId: t.id, blockId: block.id })}
                                  style={{ height: '28px', width: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                  {inSS ? <Unlink size={11} color="#3B948F" /> : <Link2 size={11} color="rgba(17,17,17,0.3)" />}
                                </button>
                              </div>
                            )
                          })}
                          <div style={{ display: 'flex', gap: '8px', padding: '12px 16px', borderTop: '1px solid rgba(17,17,17,0.06)' }}>
                            <button
                              onClick={() => { setAddExerciseFor(t.id); setExerciseSearch('') }}
                              style={{ flex: 1, fontSize: '12px', color: '#3B948F', padding: '8px', border: '1px dashed rgba(59,148,143,0.4)', borderRadius: '8px', background: 'none', cursor: 'pointer' }}
                            >
                              + Add exercise
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Delete this workout?')) deleteTemplate(t.id) }}
                              style={{ fontSize: '12px', color: 'rgba(200,40,40,0.8)', background: 'none', border: 'none', cursor: 'pointer', padding: '8px' }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}

                <button
                  onClick={() => setShowAddTemplate(true)}
                  style={{
                    width: '100%', height: '48px', borderRadius: '40px',
                    border: '1px solid rgba(17,17,17,0.1)', background: 'rgba(17,17,17,0.03)',
                    fontFamily: FONT, fontSize: '14px', fontWeight: 500,
                    color: '#111111', cursor: 'pointer',
                  }}
                >
                  + Add workout
                </button>
              </>
            )}

            {/* Inline add-template form */}
            {showAddTemplate && (
              <form onSubmit={handleAddTemplate} style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <Input placeholder="Workout name (e.g. Upper A)" value={templateName} onChange={e => setTemplateName(e.target.value)} autoFocus />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button type="submit" size="sm" style={{ flex: 1 }} disabled={!templateName.trim()}>Create</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTemplate(false)}>Cancel</Button>
                </div>
              </form>
            )}

            {/* Cardio sessions */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <p style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(17,17,17,0.5)', margin: 0 }}>Cardio Sessions</p>
                <button onClick={() => setShowAddCardio(true)} style={{ fontSize: '12px', color: '#3B948F', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add</button>
              </div>
              {(programme.cardioTemplates ?? []).map(ct => (
                <div key={ct.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '12px', background: 'rgba(17,17,17,0.03)', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '20px' }}>{CARDIO_ICONS[ct.activityType]}</span>
                    <div>
                      <p style={{ fontSize: '14px', fontWeight: 500, color: '#111111', margin: 0 }}>{ct.name}</p>
                      <p style={{ fontSize: '12px', color: 'rgba(17,17,17,0.5)', margin: 0, textTransform: 'capitalize' }}>
                        {ct.activityType}
                        {ct.targetDurationMinutes ? ` · ${ct.targetDurationMinutes} min` : ''}
                        {ct.targetDistanceKm ? ` · ${ct.targetDistanceKm} km` : ''}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => { if (window.confirm('Delete this cardio session?')) deleteCardioTemplate(ct.id) }} style={{ fontSize: '14px', color: 'rgba(17,17,17,0.3)', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
              ))}
              {showAddCardio && (
                <form onSubmit={handleAddCardio} style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <Input placeholder="Session name (e.g. Easy Run)" value={cardioName} onChange={e => setCardioName(e.target.value)} autoFocus />
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {(['run', 'swim', 'cycle', 'walk', 'row'] as ActivityType[]).map(type => (
                      <button key={type} type="button" onClick={() => setCardioType(type)}
                        style={{ padding: '4px 12px', borderRadius: '200px', fontSize: '12px', cursor: 'pointer', fontFamily: FONT, border: 'none', background: cardioType === type ? '#3B948F' : 'rgba(17,17,17,0.05)', color: cardioType === type ? '#FFFEFA' : '#111111' }}>
                        {CARDIO_ICONS[type]} {type}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <Input label="Duration (min)" type="number" min="1" placeholder="30" value={cardioMinutes} onChange={e => setCardioMinutes(e.target.value)} />
                    <Input label="Distance (km)" type="number" step="0.1" placeholder="5" value={cardioKm} onChange={e => setCardioKm(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Button type="submit" size="sm" style={{ flex: 1 }} disabled={!cardioName.trim()}>Create</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddCardio(false)}>Cancel</Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── SHEETS ──────────────────────────────────────────────────────── */}

      <Sheet visible={!!assignCardioFor} onClose={() => setAssignCardioFor(null)} title="Assign Cardio">
        {assignCardioFor && (
          <div className="divide-y divide-border">
            {unassignedCardioTemplates(assignCardioFor).length === 0 ? (
              <p className="text-text-secondary text-sm px-5 py-8 text-center">All cardio sessions are already assigned</p>
            ) : (
              unassignedCardioTemplates(assignCardioFor).map(ct => (
                <button key={ct.id} className="w-full text-left px-5 py-4 hover:bg-bg-element transition-colors flex items-center gap-3"
                  onClick={() => { addCardioTemplateToPhase(programme.id, assignCardioFor, ct.id); setAssignCardioFor(null) }}>
                  <span className="text-xl">{CARDIO_ICONS[ct.activityType]}</span>
                  <div>
                    <p className="text-sm text-text">{ct.name}</p>
                    <p className="text-xs text-text-tertiary capitalize">{ct.activityType}{ct.targetDurationMinutes ? ` · ${ct.targetDurationMinutes} min` : ''}{ct.targetDistanceKm ? ` · ${ct.targetDistanceKm} km` : ''}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </Sheet>

      <Sheet visible={!!assignWorkoutFor} onClose={() => setAssignWorkoutFor(null)} title="Assign Workout">
        {assignWorkoutFor && (
          <div className="divide-y divide-border">
            {unassignedTemplates(assignWorkoutFor).length === 0 ? (
              <p className="text-text-secondary text-sm px-5 py-8 text-center">All workouts are already assigned</p>
            ) : (
              unassignedTemplates(assignWorkoutFor).map(t => (
                <button key={t.id} className="w-full text-left px-5 py-4 hover:bg-bg-element transition-colors"
                  onClick={() => { addTemplateToPhase(programme.id, assignWorkoutFor, t.id); setAssignWorkoutFor(null) }}>
                  <p className="text-sm text-text">{t.name}</p>
                  <p className="text-xs text-text-tertiary">{t.exerciseBlocks.length} exercises</p>
                </button>
              ))
            )}
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
            <p className="px-5 py-8 text-sm text-text-secondary text-center">Add more exercises to this workout first</p>
          ) : (
            <div className="divide-y divide-border pb-4">
              {source && <div className="px-5 py-3 bg-accent/5"><p className="text-xs text-text-tertiary mb-0.5">Linking</p><p className="text-sm text-accent">{source.exerciseName}</p></div>}
              {candidates.map(b => {
                const existingLabel = b.supersetGroupId ? labels[b.supersetGroupId] : null
                const alreadyLinked = source?.supersetGroupId && b.supersetGroupId === source.supersetGroupId
                return (
                  <button key={b.id} className="w-full text-left px-5 py-3.5 hover:bg-bg-element transition-colors flex items-center justify-between"
                    onClick={() => handleLinkSuperset(linkingFor.blockId, b.id, linkingFor.templateId)} disabled={!!alreadyLinked}>
                    <div>
                      <p className="text-sm text-text">{b.exerciseName}</p>
                      {existingLabel && <p className="text-xs text-accent mt-0.5">In superset {existingLabel} — will merge</p>}
                    </div>
                    {alreadyLinked && <Check size={14} className="text-accent flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          )
        })()}
      </Sheet>

      <Sheet visible={!!addExerciseFor} onClose={() => setAddExerciseFor(null)} title="Add Exercise">
        <div className="px-5 pt-4 pb-2">
          <Input placeholder="Search exercises…" value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} autoFocus />
        </div>
        <div className="divide-y divide-border">
          {exerciseSearch.trim() && !filteredExercises.some(e => e.name.toLowerCase() === exerciseSearch.trim().toLowerCase()) && (
            <button className="w-full text-left px-5 py-3.5 text-sm text-accent hover:bg-bg-element flex items-center gap-2"
              onClick={() => {
                const name = exerciseSearch.trim()
                if (addExerciseFor) addBlock(addExerciseFor, { id: `custom-${Date.now()}`, name })
                setAddExerciseFor(null); setExerciseSearch('')
              }}>
              <span className="text-lg leading-none">+</span>
              Add &ldquo;{exerciseSearch.trim()}&rdquo;
            </button>
          )}
          {filteredExercises.slice(0, 50).map(ex => (
            <button key={ex.id} className="w-full text-left px-5 py-3.5 text-sm text-text hover:bg-bg-element"
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
            <div className="px-5 py-4 flex flex-col gap-5 pb-8">
              <div>
                <p className="text-text text-sm">{block?.exerciseName}</p>
                <p className="text-text-tertiary text-xs mt-0.5">
                  Default: {block ? fmtSets(block) : '—'}{block?.targetWeightKg ? ` @ ${block.targetWeightKg} kg` : ''}{block?.targetRpe ? ` · RPE ${block.targetRpe}` : ''}
                </p>
                <p className="text-text-secondary text-xs mt-2">Leave blank to keep the default value.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Sets" type="number" placeholder={`Default: ${block?.targetSets ?? '—'}`} value={overrideForm.sets} onChange={e => setOverrideForm(f => ({ ...f, sets: e.target.value }))} />
                <Input label="Intensity %" type="number" min="1" max="150" placeholder="e.g. 80" value={overrideForm.intensityPct} onChange={e => setOverrideForm(f => ({ ...f, intensityPct: e.target.value }))} />
                <Input label="Reps" type="number" min="1" placeholder={`Default: ${block?.targetRepsMin ?? '—'}`} value={overrideForm.repsMin} onChange={e => setOverrideForm(f => ({ ...f, repsMin: e.target.value, repsMax: e.target.value }))} />
                <Input label="Target RPE" type="number" min="1" max="10" step="0.5" placeholder="e.g. 8" value={overrideForm.rpe} onChange={e => setOverrideForm(f => ({ ...f, rpe: e.target.value }))} />
              </div>
              <Button size="lg" className="w-full" onClick={saveOverride}>
                <Check size={16} /> SAVE OVERRIDES
              </Button>
            </div>
          )
        })()}
      </Sheet>

    </div>
  )
}
