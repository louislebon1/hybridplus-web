'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, ChevronRight, Trash2 } from 'lucide-react'
import { Page } from '@/components/feed'
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
    <Page>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-5 flex-shrink-0">
        <div>
          <button onClick={() => router.back()} aria-label="Close" className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer">
            <ArrowLeft size={16} />
          </button>
          <h1 className="display text-title m-0 flex-1 min-w-0">Edit Session</h1>
        </div>
        <button onClick={handleDelete}>
          <Trash2 size={20} />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-5 pb-32 flex flex-col gap-5">

        {/* Strength form */}
        {strength && (
          <>
            <div className="flex flex-col gap-2">
              <label className="meta">Session name</label>
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
            <div className="flex flex-col gap-2">
              <label className="meta">Session name</label>
              <Input autoFocus value={cName} onChange={e => setCName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="meta">Activity</label>
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
              <div className="flex flex-col gap-2">
                <label className="meta">
                  Target duration <span>(mins)</span>
                </label>
                <Input type="number" min="1" placeholder="30" value={targetDuration} onChange={e => setTargetDuration(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="meta">
                  Target distance <span>(km)</span>
                </label>
                <Input type="number" min="0.1" step="0.1" placeholder="5.0" value={targetDistance} onChange={e => setTargetDistance(e.target.value)} />
              </div>
            </div>
          </>
        )}

        {/* Save */}
        <button type="submit" className="mt-2 w-full h-14 rounded-pill inline-flex items-center justify-center border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] display text-figure disabled:opacity-35 disabled:active:scale-100 bg-scrim text-void"
          disabled={!canSave}>
          Save Changes
        </button>

      </form>
    </Page>
  )
}
