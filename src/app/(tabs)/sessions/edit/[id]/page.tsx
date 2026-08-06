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

  const canSave = strength ? sName.trim().length> 0 : cName.trim().length> 0

  return (
    <div>

      {/* Header */}
      <div>
        <div>
          <button onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </button>
          <h1>Edit Session</h1>
        </div>
        <button onClick={handleDelete}>
          <Trash2 size={20} />
        </button>
      </div>

      <form onSubmit={handleSave}>

        {/* Strength form */}
        {strength && (
          <>
            <div>
              <label>Session name</label>
              <Input autoFocus value={sName} onChange={e => setSName(e.target.value)} />
            </div>

            <button type="button"
              onClick={handleEditExercises}>
              <div>
                <p>Edit exercises &amp; sets</p>
                <p>
                  {strength.exerciseBlocks.length} exercise{strength.exerciseBlocks.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Cardio form */}
        {cardio && (
          <>
            <div>
              <label>Session name</label>
              <Input autoFocus value={cName} onChange={e => setCName(e.target.value)} />
            </div>

            <div>
              <label>Activity</label>
              <div>
                {ACTIVITY_TYPES.map(a => {
                  const isActive = a === activityType
                  return (
                    <button key={a}
                      type="button"
                      onClick={() => setActivityType(a)}>
                      {a.charAt(0).toUpperCase() + a.slice(1)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <div>
                <label>
                  Target duration <span>(mins)</span>
                </label>
                <Input type="number" min="1" placeholder="30" value={targetDuration} onChange={e => setTargetDuration(e.target.value)} />
              </div>
              <div>
                <label>
                  Target distance <span>(km)</span>
                </label>
                <Input type="number" min="0.1" step="0.1" placeholder="5.0" value={targetDistance} onChange={e => setTargetDistance(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Save */}
        <button type="submit"
          disabled={!canSave}>
          Save Changes
        </button>

      </form>
    </div>
  )
}
