'use client'

import { useEffect } from 'react'
import { Page } from '@/components/feed'
import { useRouter } from 'next/navigation'
import { useSessionStore } from '@/stores/session-store'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { Button } from '@/components/ui'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'

export default function SessionCompleteReviewPage() {
  const router = useRouter()
  const activeSession = useSessionStore(s => s.activeSession)
  const abandonSession = useSessionStore(s => s.abandonSession)
  const sessions = useSessionHistoryStore(s => s.sessions)

  const completed = activeSession ? sessions.find(s => s.id === activeSession.id) : null

  useEffect(() => {
    if (!activeSession || !completed) router.replace('/home')
  }, [activeSession, completed, router])

  if (!activeSession || !completed) return null

  function handleDone() {
    abandonSession()
    router.replace('/home')
  }

  return (
    <Page>
      {/* Header */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-4 flex-shrink-0">
        <p className="meta m-0">Session review</p>
        <p className="display text-display m-0 mt-1 truncate">{activeSession.name}</p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-32 flex flex-col gap-2.5">
        {completed.exercises.map((ex, i) => {
          const libEntry = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
          const tags = [
            libEntry && MUSCLE_GROUP_LABELS[libEntry.category],
            ...(libEntry?.secondaryMuscles ?? []),
          ].filter(Boolean) as string[]
          return (
            <div key={`${ex.exerciseId}-${i}`} className="matt rounded-card p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  <p className="display text-figure m-0 truncate">{ex.exerciseName}</p>
                  {tags.length> 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {tags.slice(0, 2).map(t => (
                        <span key={t} className="meta px-2.5 py-1 rounded-pill matt">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {ex.sets.map((set, si) => (
                    <div key={si} className="flex items-baseline gap-4 py-2 border-t border-scrim/8">
                      <span className="meta tabular w-6 flex-shrink-0">{String(si + 1).padStart(2, '0')}</span>
                      <div className="flex items-baseline gap-1.5 flex-1">
                        <span className="display text-figure tabular">{set.weight ?? '—'}</span>
                        <span className="meta">kg</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 flex-1">
                        <span className="display text-figure tabular">{set.reps ?? '—'}</span>
                        <span className="meta">reps</span>
                      </div>
                      <div className="flex items-baseline gap-1.5 flex-1">
                        <span className="display text-figure tabular">{set.rpe ?? '—'}</span>
                        <span className="meta">rpe</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <Button size="lg"  onClick={handleDone}>Done</Button>
      </div>
    </Page>
  )
}
