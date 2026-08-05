'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { useSessionStore } from '@/stores/session-store'
import { useSessionHistoryStore } from '@/stores/session-history-store'
import { Button } from '@/components/ui'
import { HeroGlow, StatCard, SectionLabel } from '@/components/dash'

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
    <div className="relative flex flex-col h-full bg-bg overflow-hidden">
      <HeroGlow color="#00ABFE" />

      <div className="relative no-scrollbar flex-1 overflow-y-auto px-5 pt-8">
        {/* ── Hero ── */}
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-accent" />
          <p className="text-tag uppercase tracking-[0.08em] text-accent m-0">Session complete</p>
        </div>

        <div className="mt-7 flex items-start gap-1">
          <span className="text-metric font-bold text-text tabular">{fmtVolume(completed.totalVolume)}</span>
        </div>

        <h1 className="text-h2 font-bold text-text m-0 mt-3">{activeSession.name}</h1>
        <p className="text-label text-white/70 m-0 mt-2 max-w-[34ch]">
          {setsCompleted} set{setsCompleted !== 1 ? 's' : ''} logged in {fmtDuration(completed.durationSeconds)}
          {newPRs > 0 ? ` — and you set ${newPRs} new personal record${newPRs !== 1 ? 's' : ''}.` : '. Volume is banked toward this week’s total.'}
        </p>

        {/* ── Compact stat row ── */}
        <div className="mt-7 flex gap-2.5">
          <StatCard label="Duration" value={fmtDuration(completed.durationSeconds)} caption="elapsed" />
          <StatCard label="Sets" value={String(setsCompleted)} caption="completed" />
          <StatCard
            label="Records"
            value={newPRs > 0 ? String(newPRs) : '—'}
            caption={newPRs > 0 ? `new PR${newPRs !== 1 ? 's' : ''}` : 'no new PRs'}
            valueColor={newPRs > 0 ? 'var(--accent)' : undefined}
          />
        </div>

        {/* ── Per-exercise breakdown ── */}
        <div className="mt-7">
          <SectionLabel>Exercises</SectionLabel>
          <div className="mt-3 flex flex-col gap-2">
            {completed.exercises.map(ex => (
              <div key={ex.exerciseId} className="bg-bg-card border border-border rounded-[16px] px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-label font-medium text-text m-0 truncate">{ex.exerciseName}</p>
                  <p className="text-tag text-text-tertiary m-0 mt-0.5">
                    {ex.sets.length} set{ex.sets.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <p className="text-label font-medium text-text tabular m-0 flex-shrink-0">{fmtVolume(ex.totalVolume)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="h-6" />
      </div>

      <div className="relative px-5 pt-3 pb-6 flex flex-col gap-2.5 flex-shrink-0">
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
