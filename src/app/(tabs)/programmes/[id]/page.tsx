'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Plus, ChevronDown, ChevronRight, Check } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { Button, Input, EmptyState, Sheet } from '@/components/ui'
import type { ExerciseTemplateBlock, PhaseExerciseOverride } from '@/types'

const PHASE_COLORS = ['#1DB954', '#06b6d4', '#f59e0b', '#a855f7', '#F15E6C', '#84cc16']

function fmtSets(block: ExerciseTemplateBlock) {
  const reps = `${block.targetRepsMin}`
  return `${block.targetSets} × ${reps}`
}

export default function ProgrammeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const {
    programmes, addTemplate, addPhase, deleteTemplate, deletePhase,
    addBlock, updateBlock, removeBlock, setActivePhase, addTemplateToPhase,
    removeTemplateFromPhase, setTemplateDays, setExerciseOverride, removeExerciseOverride,
    updateProgramme,
  } = useProgrammeStore()

  const programme = programmes.find((p) => p.id === id)

  // UI state
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set())
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set())
  const [showAddTemplate, setShowAddTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [showAddPhase, setShowAddPhase] = useState(false)
  const [phaseName, setPhaseName] = useState('')
  const [phaseWeeks, setPhaseWeeks] = useState('4')
  const [addExerciseFor, setAddExerciseFor] = useState<string | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [assignWorkoutFor, setAssignWorkoutFor] = useState<string | null>(null) // phaseId
  // Override editing: { phaseId, templateId, blockId }
  const [editingOverride, setEditingOverride] = useState<{ phaseId: string; templateId: string; blockId: string } | null>(null)
  const [overrideForm, setOverrideForm] = useState<{
    sets: string; repsMin: string; repsMax: string; rpe: string; intensityPct: string
  }>({ sets: '', repsMin: '', repsMax: '', rpe: '', intensityPct: '' })

  const EXERCISES = [
    'Squat', 'Bench Press', 'Deadlift', 'Overhead Press', 'Barbell Row',
    'Pull Up', 'Romanian Deadlift', 'Leg Press', 'Incline Press', 'Cable Fly',
    'Barbell Curl', 'Tricep Pushdown', 'Lat Pulldown', 'Shrug', 'Face Pull',
    'Calf Raise', 'Lunge', 'Dip', 'Hammer Curl', 'Leg Extension',
  ]

  if (!programme) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4">
        <p className="text-text-secondary">Programme not found</p>
        <Button variant="ghost" onClick={() => router.back()}>Go back</Button>
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
    if (!templateName.trim() || !programme) return
    addTemplate(programme.id, templateName.trim())
    setTemplateName(''); setShowAddTemplate(false)
  }

  function handleAddPhase(e: React.FormEvent) {
    e.preventDefault()
    if (!phaseName.trim() || !programme) return
    addPhase(programme.id, {
      name: phaseName.trim(),
      durationWeeks: parseInt(phaseWeeks) || 4,
      colorHex: PHASE_COLORS[programme.phases.length % PHASE_COLORS.length],
    })
    setPhaseName(''); setPhaseWeeks('4'); setShowAddPhase(false)
  }

  function openOverrideEditor(phaseId: string, templateId: string, blockId: string) {
    if (!programme) return
    const phase = programme.phases.find(ph => ph.id === phaseId)
    const existing = phase?.overrides.find(o => o.templateId === templateId)
      ?.exerciseOverrides.find(e => e.blockId === blockId)
    setOverrideForm({
      sets: existing?.targetSetsOverride?.toString() ?? '',
      repsMin: existing?.targetRepsMinOverride?.toString() ?? '',
      repsMax: existing?.targetRepsMinOverride?.toString() ?? '',
      rpe: existing?.targetRpeOverride?.toString() ?? '',
      intensityPct: existing?.intensityPct?.toString() ?? '',
    })
    setEditingOverride({ phaseId, templateId, blockId })
  }

  function saveOverride() {
    if (!editingOverride || !programme) return
    const override: PhaseExerciseOverride = {
      blockId: editingOverride.blockId,
      targetSetsOverride: overrideForm.sets ? parseInt(overrideForm.sets) : null,
      targetRepsMinOverride: overrideForm.repsMin ? parseInt(overrideForm.repsMin) : null,
      targetRepsMaxOverride: overrideForm.repsMin ? parseInt(overrideForm.repsMin) : null,
      targetRpeOverride: overrideForm.rpe ? parseFloat(overrideForm.rpe) : null,
      intensityPct: overrideForm.intensityPct ? parseFloat(overrideForm.intensityPct) : null,
    }
    const hasAnyValue = Object.values(override).some((v, i) => i > 0 && v !== null)
    if (hasAnyValue) {
      setExerciseOverride(programme.id, editingOverride.phaseId, editingOverride.templateId, override)
    } else {
      removeExerciseOverride(programme.id, editingOverride.phaseId, editingOverride.templateId, editingOverride.blockId)
    }
    setEditingOverride(null)
  }

  const filteredExercises = exerciseSearch
    ? EXERCISES.filter(e => e.toLowerCase().includes(exerciseSearch.toLowerCase()))
    : EXERCISES

  // Templates not yet in the selected phase
  const unassignedTemplates = (phaseId: string) => {
    const phase = programme.phases.find(ph => ph.id === phaseId)
    if (!phase) return programme.templates
    return programme.templates.filter(t => !phase.templateIds.includes(t.id))
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 flex-shrink-0 border-b border-border">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-element">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl text-text truncate">{programme.name}</h1>
          {programme.description && <p className="text-xs text-text-secondary truncate">{programme.description}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-6">

        {/* ── PHASES ─────────────────────────────────────────────────────── */}
        <div className="px-5 pt-5">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Phases</p>
            <button onClick={() => setShowAddPhase(true)} className="text-accent text-xs">+ ADD</button>
          </div>

          {/* Start date */}
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs text-text-secondary">Start date</p>
            <input
              type="date"
              value={programme.startDate ?? ''}
              onChange={e => updateProgramme(programme.id, { startDate: e.target.value || null })}
              className="text-xs text-text bg-bg-element border border-border rounded-lg px-2 py-1 focus:outline-none focus:border-accent"
            />
          </div>

          {programme.phases.length === 0 ? (
            <button
              onClick={() => setShowAddPhase(true)}
              className="w-full border border-dashed border-border rounded-xl py-4 text-sm text-text-tertiary hover:border-accent hover:text-accent transition-colors"
            >
              + Add a phase
            </button>
          ) : (
            <div className="flex flex-col gap-2">
              {programme.phases.map(phase => {
                const expanded = expandedPhases.has(phase.id)
                const phaseTemplates = phase.templateIds
                  .map(tid => programme.templates.find(t => t.id === tid))
                  .filter(Boolean) as typeof programme.templates

                return (
                  <div key={phase.id} className="border border-border rounded-xl overflow-hidden">
                    {/* Phase header row */}
                    <div className="flex items-center gap-0 bg-bg-element">
                      <div className="w-1 self-stretch flex-shrink-0" style={{ backgroundColor: phase.colorHex ?? '#1DB954' }} />
                      <button
                        className="flex-1 flex items-center justify-between px-4 py-3 text-left"
                        onClick={() => togglePhase(phase.id)}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-text">{phase.name}</p>
                            {phase.isActive && (
                              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-accent/15 text-accent">ACTIVE</span>
                            )}
                          </div>
                          <p className="text-xs text-text-secondary">{phase.durationWeeks} wks · {phaseTemplates.length} workouts</p>
                        </div>
                        {expanded
                          ? <ChevronDown size={16} className="text-text-tertiary" />
                          : <ChevronRight size={16} className="text-text-tertiary" />}
                      </button>
                    </div>

                    {expanded && (
                      <div className="border-t border-border">
                        {/* Phase actions */}
                        <div className="flex gap-2 px-4 pt-3 pb-2">
                          {!phase.isActive && (
                            <button
                              onClick={() => setActivePhase(programme.id, phase.id)}
                              className="text-xs text-accent border border-accent/30 px-3 py-1 rounded-full hover:bg-accent/5"
                            >
                              Set active
                            </button>
                          )}
                          <button
                            onClick={() => { setAssignWorkoutFor(phase.id) }}
                            className="text-xs text-text-secondary border border-border px-3 py-1 rounded-full hover:bg-bg-hover"
                          >
                            + Assign workout
                          </button>
                          <button
                            onClick={() => { if (window.confirm('Delete this phase?')) deletePhase(programme.id, phase.id) }}
                            className="text-xs text-error ml-auto"
                          >
                            Delete
                          </button>
                        </div>

                        {/* Assigned workouts */}
                        {phaseTemplates.length === 0 ? (
                          <p className="text-xs text-text-tertiary px-4 pb-3">No workouts assigned yet</p>
                        ) : (
                          <div className="divide-y divide-border border-t border-border">
                            {phaseTemplates.map(template => {
                              const templateOverride = phase.overrides.find(o => o.templateId === template.id)
                              const overriddenCount = templateOverride?.exerciseOverrides.length ?? 0
                              return (
                                <div key={template.id}>
                                  {/* Template header */}
                                  <div className="px-4 py-2.5 bg-bg-subtle">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-text">{template.name}</p>
                                        {overriddenCount > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/15 text-accent">
                                            {overriddenCount} overridden
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => removeTemplateFromPhase(programme.id, phase.id, template.id)}
                                        className="text-xs text-error"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                    {/* Day-of-week toggles */}
                                    {(() => {
                                      const days = phase.templateDays?.[template.id] ?? []
                                      const DAYS = ['M','T','W','T','F','S','S']
                                      return (
                                        <div className="flex gap-1">
                                          {DAYS.map((d, i) => (
                                            <button
                                              key={i}
                                              onClick={() => {
                                                const next = days.includes(i) ? days.filter(x => x !== i) : [...days, i]
                                                setTemplateDays(programme.id, phase.id, template.id, next)
                                              }}
                                              className={[
                                                'w-7 h-7 text-[10px] rounded-full flex items-center justify-center transition-colors',
                                                days.includes(i)
                                                  ? 'bg-accent text-accent-fg'
                                                  : 'bg-bg-hover text-text-tertiary',
                                              ].join(' ')}
                                            >
                                              {d}
                                            </button>
                                          ))}
                                        </div>
                                      )
                                    })()}
                                  </div>

                                  {/* Per-exercise rows */}
                                  {template.exerciseBlocks.map(block => {
                                    const exOverride = templateOverride?.exerciseOverrides.find(e => e.blockId === block.id)
                                    return (
                                      <div key={block.id} className="flex items-center justify-between px-4 py-2 border-t border-border/50">
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs text-text truncate">{block.exerciseName}</p>
                                          {exOverride ? (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {exOverride.targetSetsOverride != null && (
                                                <span className="text-[10px] text-accent">{exOverride.targetSetsOverride} sets</span>
                                              )}
                                              {exOverride.targetRepsMinOverride != null && (
                                                <span className="text-[10px] text-accent">
                                                  · {exOverride.targetRepsMinOverride} reps
                                                </span>
                                              )}
                                              {exOverride.intensityPct != null && (
                                                <span className="text-[10px] text-accent">· {exOverride.intensityPct}%</span>
                                              )}
                                              {exOverride.targetRpeOverride != null && (
                                                <span className="text-[10px] text-accent">· RPE {exOverride.targetRpeOverride}</span>
                                              )}
                                            </div>
                                          ) : (
                                            <p className="text-[10px] text-text-tertiary">{fmtSets(block)}{block.targetWeightKg ? ` @ ${block.targetWeightKg} kg` : ''}</p>
                                          )}
                                        </div>
                                        <button
                                          onClick={() => openOverrideEditor(phase.id, template.id, block.id)}
                                          className="text-[10px] text-accent ml-3 flex-shrink-0"
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
            </div>
          )}

          {/* Add phase form */}
          {showAddPhase && (
            <form onSubmit={handleAddPhase} className="mt-3 bg-bg-element border border-border rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm text-text">New phase</p>
              <Input placeholder="Phase name" value={phaseName} onChange={e => setPhaseName(e.target.value)} autoFocus />
              <Input label="Duration (weeks)" type="number" min="1" max="52" value={phaseWeeks} onChange={e => setPhaseWeeks(e.target.value)} />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1" disabled={!phaseName.trim()}>ADD</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddPhase(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </div>

        {/* ── WORKOUTS ───────────────────────────────────────────────────── */}
        <div className="px-5 pt-6">
          <div className="flex items-center justify-between mb-3">
            <p className="eyebrow">Workouts</p>
            <button onClick={() => setShowAddTemplate(true)} className="text-accent text-xs">+ ADD</button>
          </div>

          {programme.templates.length === 0 ? (
            <EmptyState
              icon="🏋️"
              title="No workouts yet"
              description="Add workout templates to build your programme"
              action={{ label: 'Add Workout', onClick: () => setShowAddTemplate(true) }}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {programme.templates.map(t => {
                const expanded = expandedTemplates.has(t.id)
                return (
                  <div key={t.id} className="border border-border rounded-xl overflow-hidden">
                    <button
                      className="w-full flex items-center justify-between px-4 py-3 bg-bg-element"
                      onClick={() => toggleTemplate(t.id)}
                    >
                      <div className="text-left">
                        <p className="text-sm text-text">{t.name}</p>
                        <p className="text-xs text-text-secondary">{t.exerciseBlocks.length} exercise{t.exerciseBlocks.length !== 1 ? 's' : ''}</p>
                      </div>
                      {expanded
                        ? <ChevronDown size={16} className="text-text-tertiary" />
                        : <ChevronRight size={16} className="text-text-tertiary" />}
                    </button>

                    {expanded && (
                      <div className="border-t border-border">
                        {/* Column headers */}
                        {t.exerciseBlocks.length > 0 && (
                          <div className="grid grid-cols-[1fr_44px_44px_64px_28px] gap-1.5 px-4 pt-2 pb-1">
                            {['Exercise', 'Sets', 'Reps', 'kg', ''].map((h) => (
                              <span key={h} className="text-[10px] text-text-tertiary font-mono text-center first:text-left">{h}</span>
                            ))}
                          </div>
                        )}
                        {t.exerciseBlocks.map(block => (
                          <div key={block.id} className="grid grid-cols-[1fr_44px_44px_64px_28px] gap-1.5 items-center px-4 py-1.5 border-t border-border/50">
                            <p className="text-xs text-text truncate pr-1">{block.exerciseName}</p>
                            <input
                              type="number" min="1" max="20"
                              value={block.targetSets || ''}
                              onChange={e => updateBlock(block.id, { targetSets: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                              onBlur={() => { if (!block.targetSets || block.targetSets < 1) updateBlock(block.id, { targetSets: 1 }) }}
                              className="h-7 w-full text-center text-xs text-text bg-bg-hover border border-border rounded-lg focus:outline-none focus:border-accent tabular"
                            />
                            <input
                              type="number" min="1" max="100"
                              value={block.targetRepsMin || ''}
                              onChange={e => {
                                const v = e.target.value === '' ? 0 : parseInt(e.target.value)
                                updateBlock(block.id, { targetRepsMin: v, targetRepsMax: v })
                              }}
                              onBlur={() => { if (!block.targetRepsMin || block.targetRepsMin < 1) updateBlock(block.id, { targetRepsMin: 1, targetRepsMax: 1 }) }}
                              className="h-7 w-full text-center text-xs text-text bg-bg-hover border border-border rounded-lg focus:outline-none focus:border-accent tabular"
                            />
                            <input
                              type="number" min="0" step="0.5"
                              value={block.targetWeightKg ?? ''}
                              placeholder="—"
                              onChange={e => updateBlock(block.id, { targetWeightKg: e.target.value ? parseFloat(e.target.value) : null })}
                              className="h-7 w-full text-center text-xs text-text bg-bg-hover border border-border rounded-lg focus:outline-none focus:border-accent tabular placeholder:text-text-tertiary"
                            />
                            <button
                              className="h-7 w-7 flex items-center justify-center text-text-tertiary hover:text-error transition-colors"
                              onClick={() => removeBlock(block.id)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <div className="flex gap-2 px-4 py-3 border-t border-border/50 mt-1">
                          <button
                            className="flex-1 text-xs text-accent py-2 border border-dashed border-accent/40 rounded-xl hover:bg-accent/5"
                            onClick={() => { setAddExerciseFor(t.id); setExerciseSearch('') }}
                          >
                            + Add exercise
                          </button>
                          <button
                            className="text-xs text-error px-3"
                            onClick={() => { if (window.confirm('Delete this workout?')) deleteTemplate(t.id) }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {showAddTemplate && (
            <form onSubmit={handleAddTemplate} className="mt-3 bg-bg-element border border-border rounded-xl p-4 flex flex-col gap-3">
              <p className="text-sm text-text">New workout</p>
              <Input placeholder="Workout name (e.g. Upper A)" value={templateName} onChange={e => setTemplateName(e.target.value)} autoFocus />
              <div className="flex gap-2">
                <Button type="submit" size="sm" className="flex-1" disabled={!templateName.trim()}>CREATE</Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowAddTemplate(false)}>Cancel</Button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Assign workout to phase sheet */}
      <Sheet visible={!!assignWorkoutFor} onClose={() => setAssignWorkoutFor(null)} title="Assign Workout">
        {assignWorkoutFor && (
          <div className="divide-y divide-border">
            {unassignedTemplates(assignWorkoutFor).length === 0 ? (
              <p className="text-text-secondary text-sm px-5 py-8 text-center">All workouts are already assigned to this phase</p>
            ) : (
              unassignedTemplates(assignWorkoutFor).map(t => (
                <button
                  key={t.id}
                  className="w-full text-left px-5 py-4 hover:bg-bg-element transition-colors"
                  onClick={() => {
                    addTemplateToPhase(programme.id, assignWorkoutFor, t.id)
                    setAssignWorkoutFor(null)
                  }}
                >
                  <p className="text-sm text-text">{t.name}</p>
                  <p className="text-xs text-text-tertiary">{t.exerciseBlocks.length} exercises</p>
                </button>
              ))
            )}
          </div>
        )}
      </Sheet>

      {/* Add exercise sheet */}
      <Sheet visible={!!addExerciseFor} onClose={() => setAddExerciseFor(null)} title="Add Exercise">
        <div className="px-5 pt-4 pb-2">
          <Input placeholder="Search or type a new name…" value={exerciseSearch} onChange={e => setExerciseSearch(e.target.value)} autoFocus />
        </div>
        <div className="divide-y divide-border">
          {/* Add custom — shown when search text doesn't exactly match a built-in */}
          {exerciseSearch.trim() && !filteredExercises.some(n => n.toLowerCase() === exerciseSearch.trim().toLowerCase()) && (
            <button
              className="w-full text-left px-5 py-3.5 text-sm text-accent hover:bg-bg-element flex items-center gap-2"
              onClick={() => {
                const name = exerciseSearch.trim()
                if (addExerciseFor) addBlock(addExerciseFor, { id: `custom-${Date.now()}`, name })
                setAddExerciseFor(null)
                setExerciseSearch('')
              }}
            >
              <span className="text-lg leading-none">+</span>
              Add &ldquo;{exerciseSearch.trim()}&rdquo;
            </button>
          )}
          {filteredExercises.map(name => (
            <button
              key={name}
              className="w-full text-left px-5 py-3.5 text-sm text-text hover:bg-bg-element"
              onClick={() => {
                if (addExerciseFor) addBlock(addExerciseFor, { id: name.toLowerCase().replace(/\s+/g, '-'), name })
                setAddExerciseFor(null)
                setExerciseSearch('')
              }}
            >
              {name}
            </button>
          ))}
          {filteredExercises.length === 0 && !exerciseSearch.trim() && (
            <p className="px-5 py-4 text-sm text-text-tertiary">Type to search or create a custom exercise</p>
          )}
        </div>
      </Sheet>

      {/* Per-exercise override editor sheet */}
      <Sheet visible={!!editingOverride} onClose={() => setEditingOverride(null)} title="Override Exercise">
        {editingOverride && (() => {
          const template = programme.templates.find(t => t.id === editingOverride.templateId)
          const block = template?.exerciseBlocks.find(b => b.id === editingOverride.blockId)
          return (
            <div className="px-5 py-4 flex flex-col gap-5 pb-8">
              <div>
                <p className="text-text text-sm">{block?.exerciseName}</p>
                <p className="text-text-tertiary text-xs mt-0.5">
                  Default: {block ? fmtSets(block) : '—'}{block?.targetWeightKg ? ` @ ${block.targetWeightKg} kg` : ''}
                  {block?.targetRpe ? ` · RPE ${block.targetRpe}` : ''}
                </p>
                <p className="text-text-secondary text-xs mt-2">Leave blank to keep the default value.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Sets"
                  type="number"
                  placeholder={`Default: ${template?.exerciseBlocks[0]?.targetSets ?? '—'}`}
                  value={overrideForm.sets}
                  onChange={e => setOverrideForm(f => ({ ...f, sets: e.target.value }))}
                />
                <Input
                  label="Intensity %"
                  type="number"
                  min="1" max="150"
                  placeholder="e.g. 80"
                  value={overrideForm.intensityPct}
                  onChange={e => setOverrideForm(f => ({ ...f, intensityPct: e.target.value }))}
                />
                <Input
                  label="Reps"
                  type="number"
                  min="1"
                  placeholder={`Default: ${block?.targetRepsMin ?? '—'}`}
                  value={overrideForm.repsMin}
                  onChange={e => setOverrideForm(f => ({ ...f, repsMin: e.target.value, repsMax: e.target.value }))}
                />
                <Input
                  label="Target RPE"
                  type="number"
                  min="1" max="10" step="0.5"
                  placeholder="e.g. 8"
                  value={overrideForm.rpe}
                  onChange={e => setOverrideForm(f => ({ ...f, rpe: e.target.value }))}
                />
              </div>

              <div className="bg-bg-element border border-border rounded-xl p-3 text-xs text-text-secondary">
                <p className="text-text mb-1">How overrides work</p>
                <p>Sets and reps replace the template values for all exercises in this workout during this phase. Intensity % scales the target weight (e.g. 80% of 100 kg = 80 kg). RPE replaces the target RPE for all exercises.</p>
              </div>

              <Button size="lg" className="w-full" onClick={saveOverride}>
                <Check size={16} />
                SAVE OVERRIDES
              </Button>
            </div>
          )
        })()}
      </Sheet>
    </div>
  )
}
