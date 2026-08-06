'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'

export default function NewSessionPage() {
  return (
    <Suspense fallback={null}>
      <NewSessionPageInner />
    </Suspense>
  )
}

function NewSessionPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sessionType, setSessionType, reset } = useSessionWizard()

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'cardio' || type === 'strength') setSessionType(type)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleClose() {
    reset()
    router.back()
  }

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-5 screen-top pb-6 border-b border-border flex-shrink-0">
        <h1 className="text-h2 font-bold leading-[30px] text-text m-0">New session</h1>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-bg-element flex items-center justify-center">
          <X size={16} className="text-text" />
        </button>
      </div>

      {/* Type toggle */}
      <div className="px-5 pt-6 pb-3 flex-shrink-0">
        <div className="flex p-1 rounded-full bg-bg-element gap-1">
          {(['strength', 'cardio'] as const).map(t => {
            const active = t === sessionType
            return (
              <button
                key={t}
                onClick={() => setSessionType(t)}
                className={`flex-1 py-2 px-6 rounded-full text-body font-medium ${active ? 'bg-bg text-text' : 'text-text opacity-40'}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pt-3 flex-shrink-0">
        <button
          onClick={() => router.push(sessionType === 'cardio' ? '/sessions/new/cardio' : '/sessions/new/exercises')}
          className="w-full h-12 rounded-full border border-border-strong bg-fill-strong text-body font-medium text-fill-strong-fg"
        >
          {sessionType === 'cardio' ? 'Continue' : 'Add exercises to workout'}
        </button>
      </div>

    </div>
  )
}
