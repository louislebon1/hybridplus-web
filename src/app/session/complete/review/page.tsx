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
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="flex items-center justify-center px-5 screen-top pb-6 border-b border-border flex-shrink-0">
        <p className="text-h3 font-bold leading-[26px] text-text">{activeSession.name}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {completed.exercises.map((ex, i) => {
          const libEntry = EXERCISE_LIBRARY.find(e => e.id === ex.exerciseId)
          const tags = [
            libEntry && MUSCLE_GROUP_LABELS[libEntry.category],
            ...(libEntry?.secondaryMuscles ?? []),
          ].filter(Boolean) as string[]
          return (
            <div key={`${ex.exerciseId}-${i}`} className="p-4 border-b border-border">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-body font-medium leading-6 text-text">{ex.exerciseName}</p>
                  {tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {tags.slice(0, 2).map(t => (
                        <span key={t} className="text-tag uppercase text-text bg-bg-element px-2 py-1 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {ex.sets.map((set, si) => (
                    <div key={si} className="flex gap-2 items-center w-full">
                      <span className="w-8 text-center text-label text-text flex-shrink-0">{String(si + 1).padStart(2, '0')}</span>
                      <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-bg-element rounded">
                        <span className="text-label text-text">{set.weight ?? '—'}</span>
                        <span className="text-tag text-text/40 uppercase">KG</span>
                      </div>
                      <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-bg-element rounded">
                        <span className="text-label text-text">{set.reps ?? '—'}</span>
                        <span className="text-tag text-text/40 uppercase">reps</span>
                      </div>
                      <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-bg-element rounded">
                        <span className="text-label text-text">{set.rpe ?? '—'}</span>
                        <span className="text-tag text-text/40 uppercase">Rpe</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="p-4 flex-shrink-0">
        <Button size="lg" className="w-full" onClick={handleDone}>Done</Button>
      </div>
    </div>
  )
}
