'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'
import { useTemplateStore } from '@/stores/template-store'
import { Input } from '@/components/ui'
import type { ActivityType } from '@/types'

const ACTIVITY_TYPES: ActivityType[] = ['run', 'swim', 'cycle', 'walk', 'row']

export default function NewCardioSessionPage() {
  const router = useRouter()
  const reset = useSessionWizard(s => s.reset)
  const { addCardioTemplate } = useTemplateStore()

  const [name, setName] = useState('')
  const [activityType, setActivityType] = useState<ActivityType>('run')
  const [targetDuration, setTargetDuration] = useState('')
  const [targetDistance, setTargetDistance] = useState('')

  const canSave = name.trim().length> 0

  function handleClose() {
    reset()
    router.push('/programmes?tab=sessions')
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!canSave) return
    addCardioTemplate({
      name: name.trim(),
      activityType,
      targetDurationMinutes: targetDuration ? parseInt(targetDuration) : null,
      targetDistanceKm: targetDistance ? parseFloat(targetDistance) : null,
    })
    reset()
    router.push('/programmes?tab=sessions')
  }

  return (
    <div>

      {/* Header */}
      <div>
        <h1>New cardio session</h1>
        <button onClick={handleClose}>
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSave}>
        <div>
          <label>Session name</label>
          <Input autoFocus placeholder="e.g. Morning run" value={name} onChange={e => setName(e.target.value)} />
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

        <button type="submit"
          disabled={!canSave}>
          Create session plan
        </button>
      </form>
    </div>
  )
}
