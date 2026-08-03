'use client'

import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'

export default function NewSessionPage() {
  const router = useRouter()
  const { sessionType, setSessionType, reset } = useSessionWizard()

  function handleClose() {
    reset()
    router.back()
  }

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-7 pb-6 border-b border-border flex-shrink-0">
        <h1 className="text-h2 font-medium leading-[30px] text-text m-0">New session</h1>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center">
          <X size={16} className="text-accent" />
        </button>
      </div>

      {/* Type toggle */}
      <div className="px-4 pt-6 pb-3 flex-shrink-0">
        <div className="flex p-1 rounded-full bg-text/5 gap-1">
          {(['strength', 'cardio'] as const).map(t => {
            const active = t === sessionType
            return (
              <button
                key={t}
                onClick={() => setSessionType(t)}
                className={`flex-1 py-2 px-6 rounded-full text-body font-medium ${active ? 'bg-bg text-accent' : 'text-text opacity-40'}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pt-3 flex-shrink-0">
        <button
          onClick={() => router.push('/sessions/new/exercises')}
          className="w-full h-12 rounded-full border border-accent bg-accent text-body font-medium text-accent-fg"
        >
          Add exercises to workout
        </button>
      </div>

    </div>
  )
}
