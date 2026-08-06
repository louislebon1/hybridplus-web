'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Page } from '@/components/feed'
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
    <Page>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-5 flex-shrink-0">
        <h1 className="display text-title m-0 flex-1 min-w-0">New cardio session</h1>
        <button onClick={handleClose}>
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSave} className="flex-1 min-h-0 overflow-y-auto px-5 pb-32 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className="meta">Session name</label>
          <Input autoFocus placeholder="e.g. Morning run" value={name} onChange={e => setName(e.target.value)} />
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

        <button type="submit" className="mt-2 w-full h-14 rounded-pill inline-flex items-center justify-center border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] display text-figure disabled:opacity-35 disabled:active:scale-100 bg-scrim text-void"
          disabled={!canSave}>
          Create session plan
        </button>
      </form>
    </Page>
  )
}
