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
    <div>

      {/* Header */}
      <div>
        <h1>New session</h1>
        <button onClick={handleClose}>
          <X size={16} />
        </button>
      </div>

      {/* Type toggle */}
      <div>
        <div>
          {(['strength', 'cardio'] as const).map(t => {
            const active = t === sessionType
            return (
              <button key={t}
                onClick={() => setSessionType(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div>
        <button onClick={() => router.push(sessionType === 'cardio' ? '/sessions/new/cardio' : '/sessions/new/exercises')}>
          {sessionType === 'cardio' ? 'Continue' : 'Add exercises to workout'}
        </button>
      </div>

    </div>
  )
}
