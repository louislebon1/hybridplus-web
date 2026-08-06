'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X } from 'lucide-react'
import { Page } from '@/components/feed'
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
    <Page>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-4 flex-shrink-0">
        <h1 className="display text-display m-0 flex-1 min-w-0">New session</h1>
        <button onClick={handleClose} aria-label="Close" className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Type toggle */}
      <div className="px-5 flex-shrink-0">
        <div className="flex p-1 rounded-pill matt gap-1">
          {(['strength', 'cardio'] as const).map(t => {
            const active = t === sessionType
            return (
              <button key={t}
                onClick={() => setSessionType(t)}
                className={['flex-1 py-2.5 rounded-pill cursor-pointer transition-colors duration-150 display text-label', active ? 'bg-scrim text-void' : 'text-stone'].join(' ')}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pt-5 flex-shrink-0">
        <button className="w-full h-14 rounded-pill bg-scrim text-void inline-flex items-center justify-center border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] display text-figure" onClick={() => router.push(sessionType === 'cardio' ? '/sessions/new/cardio' : '/sessions/new/exercises')}>
          {sessionType === 'cardio' ? 'Continue' : 'Add exercises to workout'}
        </button>
      </div>

    </Page>
  )
}
