'use client'

import { useEffect } from 'react'
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
    <div>
      {/* Header */}
      <div>
        <p>{activeSession.name}</p>
      </div>

      <div>
        {completed.exercises.map((ex, i) => {
          const libEntry = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
          const tags = [
            libEntry && MUSCLE_GROUP_LABELS[libEntry.category],
            ...(libEntry?.secondaryMuscles ?? []),
          ].filter(Boolean) as string[]
          return (
            <div key={`${ex.exerciseId}-${i}`}>
              <div>
                <div>
                  <p>{ex.exerciseName}</p>
                  {tags.length> 0 && (
                    <div>
                      {tags.slice(0, 2).map(t => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  {ex.sets.map((set, si) => (
                    <div key={si}>
                      <span>{String(si + 1).padStart(2, '0')}</span>
                      <div>
                        <span>{set.weight ?? '—'}</span>
                        <span>KG</span>
                      </div>
                      <div>
                        <span>{set.reps ?? '—'}</span>
                        <span>reps</span>
                      </div>
                      <div>
                        <span>{set.rpe ?? '—'}</span>
                        <span>Rpe</span>
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
    </div>
  )
}
