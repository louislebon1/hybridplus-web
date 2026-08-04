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

  const canSave = name.trim().length > 0

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
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-7 pb-6 border-b border-border flex-shrink-0">
        <h1 className="text-h2 font-bold leading-[30px] text-text m-0">New cardio session</h1>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center">
          <X size={16} className="text-accent" />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-label font-medium leading-[18px] text-text">Session name</label>
          <Input autoFocus placeholder="e.g. Morning run" value={name} onChange={e => setName(e.target.value)} />
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

        <button
          type="submit"
          disabled={!canSave}
          className={`mt-2 w-full h-12 rounded-full text-body font-medium ${canSave ? 'bg-accent text-accent-fg' : 'bg-text/10 text-text/40'}`}
        >
          Create session plan
        </button>
      </form>
    </div>
  )
}
