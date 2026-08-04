'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ChevronRight, Trash2 } from 'lucide-react'
import { useTemplateStore } from '@/stores/template-store'
import { useSessionWizard, type WizardBlock } from '@/stores/session-wizard-store'
import { Input } from '@/components/ui'
import { EXERCISE_LIBRARY } from '@/lib/exercise-library'
import type { ActivityType, StrengthSessionTemplate } from '@/types'

function templateToWizardBlocks(template: StrengthSessionTemplate): WizardBlock[] {
  return [...template.exerciseBlocks]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map((b, i) => ({
      id: crypto.randomUUID(),
      exerciseId: b.exerciseId,
      exerciseName: b.exerciseName,
      muscles: EXERCISE_LIBRARY.find(e => e.id === b.exerciseId)?.primaryMuscles ?? [],
      orderIndex: i,
      sets: Array.from({ length: Math.max(1, b.targetSets) }, () => ({
        id: crypto.randomUUID(),
        weight: b.targetWeightKg != null ? String(b.targetWeightKg) : '',
        reps: b.targetRepsMin != null ? String(b.targetRepsMin) : '',
        rpe: b.targetRpe != null ? String(b.targetRpe) : '',
      })),
    }))
}

const ACTIVITY_TYPES: ActivityType[] = ['run', 'swim', 'cycle', 'walk', 'row']

export default function EditSessionPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { strengthTemplates, cardioTemplates, updateStrengthTemplate, updateCardioTemplate, deleteStrengthTemplate, deleteCardioTemplate } = useTemplateStore()
  const loadForEdit = useSessionWizard(s => s.loadForEdit)

  const strength = strengthTemplates.find(t => t.id === id)
  const cardio   = cardioTemplates.find(t => t.id === id)

  // Strength state
  const [sName, setSName] = useState(strength?.name ?? '')

  // Cardio state
  const [cName,           setCName]           = useState(cardio?.name ?? '')
  const [activityType,    setActivityType]    = useState<ActivityType>(cardio?.activityType ?? 'run')
  const [targetDuration,  setTargetDuration]  = useState(cardio?.targetDurationMinutes?.toString() ?? '')
  const [targetDistance,  setTargetDistance]  = useState(cardio?.targetDistanceKm?.toString() ?? '')

  if (!strength && !cardio) {
    router.back()
    return null
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (strength) {
      if (!sName.trim()) return
      updateStrengthTemplate(id, { name: sName.trim() })
    } else if (cardio) {
      if (!cName.trim()) return
      updateCardioTemplate(id, {
        name:                  cName.trim(),
        activityType,
        targetDurationMinutes: targetDuration ? parseInt(targetDuration) : null,
        targetDistanceKm:      targetDistance ? parseFloat(targetDistance) : null,
      })
    }
    router.back()
  }

  function handleDelete() {
    if (!window.confirm('Delete this session template? This cannot be undone.')) return
    if (strength) deleteStrengthTemplate(id)
    else if (cardio) deleteCardioTemplate(id)
    router.back()
  }

  function handleEditExercises() {
    if (!strength) return
    loadForEdit(strength.id, templateToWizardBlocks(strength))
    router.push('/sessions/new/configure')
  }

  const canSave = strength ? sName.trim().length > 0 : cName.trim().length > 0

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-7 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0">
            <ArrowLeft size={16} className="text-accent" />
          </button>
          <h1 className="text-h2 font-bold leading-[30px] text-text m-0">Edit Session</h1>
        </div>
        <button onClick={handleDelete} className="p-1 rounded-lg">
          <Trash2 size={20} className="text-text/40" />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">

        {/* Strength form */}
        {strength && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-label font-medium leading-[18px] text-text">Session name</label>
              <Input autoFocus value={sName} onChange={e => setSName(e.target.value)} />
            </div>

            <button
              type="button"
              onClick={handleEditExercises}
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-bg-element text-left"
            >
              <div>
                <p className="text-label font-medium text-text m-0">Edit exercises &amp; sets</p>
                <p className="text-caption text-text/50 mt-0.5 mb-0">
                  {strength.exerciseBlocks.length} exercise{strength.exerciseBlocks.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight size={16} className="text-text/40 flex-shrink-0" />
            </button>
          </>
        )}

        {/* Cardio form */}
        {cardio && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-label font-medium leading-[18px] text-text">Session name</label>
              <Input autoFocus value={cName} onChange={e => setCName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-label font-medium leading-[18px] text-text">Activity</label>
              <div className="flex gap-2 flex-wrap">
                {ACTIVITY_TYPES.map(a => {
                  const isActive = a === activityType
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setActivityType(a)}
                      className={`px-4 py-2 rounded-full text-label font-medium ${isActive ? 'bg-accent text-accent-fg' : 'bg-text/5 text-text opacity-60'}`}
                    >
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-label font-medium leading-[18px] text-text">
                  Target duration <span className="text-text/40">(mins)</span>
                </label>
                <Input type="number" min="1" placeholder="30" value={targetDuration} onChange={e => setTargetDuration(e.target.value)} />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <label className="text-label font-medium leading-[18px] text-text">
                  Target distance <span className="text-text/40">(km)</span>
                </label>
                <Input type="number" min="0.1" step="0.1" placeholder="5.0" value={targetDistance} onChange={e => setTargetDistance(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Save */}
        <button
          type="submit"
          disabled={!canSave}
          className={`mt-2 w-full h-12 rounded-full text-body font-medium ${canSave ? 'bg-accent text-accent-fg' : 'bg-text/10 text-text/40'}`}
        >
          Save Changes
        </button>

      </form>
    </div>
  )
}
