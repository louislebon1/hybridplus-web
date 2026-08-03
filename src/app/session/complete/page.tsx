'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useSessionStore } from '@/stores/session-store'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { Button } from '@/components/ui'

function fmtVolume(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toFixed(1)}t` : `${Math.round(kg)}kg`
}

function fmtDuration(secs: number) {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function countNewPRs(sessionId: string, exerciseIds: string[], allSessions: ReturnType<typeof useSessionHistoryStore.getState>['sessions']) {
  const current = allSessions.find(s => s.id === sessionId)
  if (!current) return 0
  let count = 0
  for (const exerciseId of exerciseIds) {
    const currentBest = Math.max(0, ...(current.exercises.find(e => e.exerciseId === exerciseId)?.sets.map(s => s.e1rm ?? 0) ?? []))
    if (currentBest <= 0) continue
    const priorBest = Math.max(0, ...allSessions
      .filter(s => s.id !== sessionId)
      .flatMap(s => s.exercises.filter(e => e.exerciseId === exerciseId))
      .flatMap(e => e.sets.map(s => s.e1rm ?? 0)))
    if (currentBest > priorBest) count++
  }
  return count
}

export default function SessionCompletePage() {
  const router = useRouter()
  const activeSession = useSessionStore(s => s.activeSession)
  const abandonSession = useSessionStore(s => s.abandonSession)
  const sessions = useSessionHistoryStore(s => s.sessions)

  const completed = activeSession ? sessions.find(s => s.id === activeSession.id) : null

  useEffect(() => {
    if (!activeSession || !completed) router.replace('/home')
  }, [activeSession, completed, router])

  if (!activeSession || !completed) return null

  const setsCompleted = completed.exercises.reduce((acc, e) => acc + e.sets.length, 0)
  const exerciseIds = completed.exercises.map(e => e.exerciseId)
  const newPRs = countNewPRs(completed.id, exerciseIds, sessions)

  function handleDone() {
    abandonSession()
    router.replace('/home')
  }

  return (
    <div className="flex flex-col h-full bg-bg">
      {/* Header */}
      <div className="flex items-center justify-center px-4 pt-7 pb-6 border-b border-border flex-shrink-0">
        <p className="text-h3 font-medium leading-[26px] text-text">{activeSession.name}</p>
      </div>

      <div className="flex-1 flex flex-col gap-12 items-center justify-center px-4 py-6">
        <div className="flex flex-col gap-3 items-center">
          <CheckCircle2 size={48} className="text-accent" />
          <p className="text-h1 text-text text-center">Session Complete!</p>
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex gap-4 items-center w-full">
            <div className="flex-1 bg-bg-element rounded-xl p-4 flex flex-col gap-3">
              <p className="text-tag uppercase text-text/40">Duration</p>
              <p className="text-h3 font-medium text-text tabular">{fmtDuration(completed.durationSeconds)}</p>
            </div>
            <div className="flex-1 bg-bg-element rounded-xl p-4 flex flex-col gap-3">
              <p className="text-tag uppercase text-text/40">Total volume</p>
              <p className="text-h3 font-medium text-text tabular">{fmtVolume(completed.totalVolume)}</p>
            </div>
          </div>
          <div className="flex gap-4 items-center w-full">
            <div className="flex-1 bg-bg-element rounded-xl p-4 flex flex-col gap-3">
              <p className="text-tag uppercase text-text/40">Sets completed</p>
              <p className="text-h3 font-medium text-text tabular">{setsCompleted}</p>
            </div>
            <div className="flex-1 bg-bg-element rounded-xl p-4 flex flex-col gap-3">
              <p className="text-tag uppercase text-text/40">Personal records</p>
              <p className="text-h3 font-medium text-accent tabular">{newPRs > 0 ? `${newPRs} NEW PR${newPRs !== 1 ? "'S" : "'S"}` : '—'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-shrink-0">
        <Button variant="secondary" size="lg" className="w-full" onClick={() => router.push('/session/complete/review')}>
          Review session
        </Button>
        <Button size="lg" className="w-full" onClick={handleDone}>
          Done
        </Button>
      </div>
    </div>
  )
}
