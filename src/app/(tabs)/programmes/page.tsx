'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Plus } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { useTemplateStore } from '@/stores/template-store'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'
import { estimateDuration } from '@/lib/duration'
import type { StrengthSessionTemplate, CardioSessionTemplate } from '@/types'

type MainTab    = 'programmes' | 'sessions'
type ProgSubTab = 'active' | 'inactive'
type SessSubTab = 'strength' | 'cardio'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tmplDuration(tmpl: StrengthSessionTemplate): string | null {
  if (tmpl.exerciseBlocks.length === 0) return null
  const totalSets = tmpl.exerciseBlocks.reduce((s, b) => s + b.targetSets, 0)
  return estimateDuration(totalSets)
}

function tmplMuscles(tmpl: StrengthSessionTemplate): string[] {
  const seen = new Set<string>()
  for (const b of tmpl.exerciseBlocks) {
    const ex = EXERCISE_LIBRARY.find(e => e.id === b.exerciseId)
    if (ex) seen.add(ex.category)
  }
  return Array.from(seen).slice(0, 3).map(c => MUSCLE_GROUP_LABELS[c] ?? c)
}

function fmtStartDate(d: string): string {
  return new Date(d + 'T00:00:00')
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    .toLowerCase()
}

// ─── Shared bits ────────────────────────────────────────────────────────────────

const tag = 'text-tag uppercase inline-flex items-center'
const chevronCircle = 'w-7 h-7 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0'

// ─── Session cards ─────────────────────────────────────────────────────────────

function StrengthCard({ tmpl, onEdit }: { tmpl: StrengthSessionTemplate; onEdit: () => void }) {
  const dur     = tmplDuration(tmpl)
  const muscles = tmplMuscles(tmpl)
  const count   = tmpl.exerciseBlocks.length
  return (
    <button onClick={onEdit} className="bg-bg-element rounded-xl px-4 py-3 flex items-start gap-3 w-full text-left">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex flex-col gap-1">
          <span className="text-body font-medium leading-6 text-text">{tmpl.name}</span>
          <div className="flex flex-wrap gap-1">
            <span className={`${tag} text-accent-fg bg-accent px-3 py-1 rounded-full`}>Strength</span>
            {muscles.map(m => (
              <span key={m} className={`${tag} text-accent bg-text/5 px-2 py-1 rounded`}>{m}</span>
            ))}
          </div>
        </div>
        {(dur || count > 0) && (
          <div className="flex gap-4 items-center">
            {dur && (
              <div className="flex items-center gap-1">
                <Image src="/icon-clock.svg" alt="" width={12} height={12} />
                <span className={`${tag} text-text/40`}>{dur}</span>
              </div>
            )}
            {count > 0 && (
              <div className="flex items-center gap-1">
                <Image src="/icon-exercise.svg" alt="" width={12} height={12} />
                <span className={`${tag} text-text/40`}>{count} exercise{count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div className={chevronCircle}>
        <ChevronRight size={14} className="text-text" />
      </div>
    </button>
  )
}

function CardioTemplateCard({ t, onEdit }: { t: CardioSessionTemplate; onEdit: () => void }) {
  return (
    <button onClick={onEdit} className="bg-bg-element rounded-xl px-4 py-3 flex items-start gap-3 w-full text-left">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex flex-col gap-1">
          <span className="text-body font-medium leading-6 text-text">{t.name}</span>
          <div className="flex flex-wrap gap-1">
            <span className={`${tag} text-accent-fg bg-text px-3 py-1 rounded-full`}>Cardio</span>
            <span className={`${tag} text-accent bg-text/5 px-2 py-1 rounded`}>{t.activityType}</span>
          </div>
        </div>
        {(t.targetDurationMinutes || t.targetDistanceKm) && (
          <div className="flex gap-4 items-center">
            {t.targetDurationMinutes && (
              <div className="flex items-center gap-1">
                <Image src="/icon-clock.svg" alt="" width={12} height={12} />
                <span className={`${tag} text-text/40`}>{t.targetDurationMinutes} Mins</span>
              </div>
            )}
            {t.targetDistanceKm && <span className={`${tag} text-text/40`}>{t.targetDistanceKm.toFixed(1)} km</span>}
          </div>
        )}
      </div>
      <div className={chevronCircle}>
        <ChevronRight size={14} className="text-text" />
      </div>
    </button>
  )
}

// ─── Sub-tab bar ─────────────────────────────────────────────────────────────

function SubTabBar<T extends string>({ tabs, active, onChange }: {
  tabs: readonly T[]; active: T; onChange: (t: T) => void
}) {
  return (
    <div className="flex gap-4 px-4 border-b border-border flex-shrink-0">
      {tabs.map(t => {
        const isActive = t === active
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`pb-2 -mb-px text-body font-medium leading-6 text-text border-b-2 ${isActive ? 'border-text opacity-100' : 'border-transparent opacity-40'}`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        )
      })}
    </div>
  )
}

// ─── CTA button ──────────────────────────────────────────────────────────────

function CtaButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center gap-2 w-full h-12 bg-accent rounded-full outline-none transition-[opacity,transform] duration-150 ease-out hover:opacity-90 active:scale-[0.97] active:opacity-80 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <Plus size={24} className="text-accent-fg" />
      <span className="text-body font-medium leading-6 text-accent-fg">{label}</span>
    </button>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  return (
    <Suspense fallback={null}>
      <WorkoutsPageInner />
    </Suspense>
  )
}

function WorkoutsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { programmes } = useProgrammeStore()
  const { strengthTemplates, cardioTemplates } = useTemplateStore()

  const initialTab: MainTab = searchParams.get('tab') === 'sessions' ? 'sessions' : 'programmes'
  const [mainTab,    setMainTab]    = useState<MainTab>(initialTab)
  const [progSubTab, setProgSubTab] = useState<ProgSubTab>('active')
  const [sessSubTab, setSessSubTab] = useState<SessSubTab>('strength')

  const filteredProgrammes = programmes.filter(p =>
    progSubTab === 'active' ? !!p.startDate : !p.startDate
  )

  return (
    <div className="flex flex-col h-full">

      {/* ── Title ── */}
      <div className="px-4 pt-7 flex-shrink-0">
        <h1 className="text-h2 font-bold leading-[30px] text-text m-0">Workouts</h1>
      </div>

      {/* ── Main tab pill switcher ── */}
      <div className="mx-4 mt-5 flex-shrink-0">
        <div className="flex p-1 rounded-full bg-text/5 gap-1">
          {(['programmes', 'sessions'] as const).map(t => {
            const isActive = t === mainTab
            return (
              <button
                key={t}
                onClick={() => setMainTab(t)}
                className={`flex-1 py-2 px-6 rounded-full text-body font-medium leading-6 ${isActive ? 'bg-bg text-accent border border-bg' : 'text-text opacity-40 border border-transparent'}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 flex flex-col mt-5 overflow-hidden">

        {/* ──────────── PROGRAMMES ──────────── */}
        {mainTab === 'programmes' && (
          <>
            <SubTabBar tabs={['active', 'inactive'] as const} active={progSubTab} onChange={setProgSubTab} />

            <div className="no-scrollbar flex-1 overflow-y-auto">

              {filteredProgrammes.map(p => {
                const phases = p.phases.length
                const weeks  = p.phases.reduce((sum, ph) => sum + ph.durationWeeks, 0)
                return (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/programmes/${p.id}`)}
                    className="flex w-full items-center gap-4 py-5 px-4 border-b border-border text-left"
                  >
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                      <div className="flex flex-col gap-1">
                        <span className="text-h4 font-medium leading-6 text-text">{p.name}</span>
                        {p.startDate && (
                          <span className={`${tag} text-text/50`}>Started: {fmtStartDate(p.startDate)}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <span className={`${tag} text-accent-fg bg-accent px-3 py-1 rounded-full`}>
                          {phases} phase{phases !== 1 ? 's' : ''}
                        </span>
                        {weeks > 0 && (
                          <span className={`${tag} text-accent bg-text/5 px-2 py-1 rounded`}>
                            {weeks} week{weeks !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0">
                      <ChevronRight size={16} className="text-text" />
                    </div>
                  </button>
                )
              })}

              {filteredProgrammes.length === 0 && (
                <div className="px-4">
                  <div className="bg-bg-element rounded-xl p-4">
                    <p className="text-label font-medium leading-[18px] text-text/50 m-0">
                      {progSubTab === 'active'
                        ? 'No active programme – open a programme and set a start date to activate it.'
                        : 'No programmes yet – add one to get started.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="p-4">
                <CtaButton label="Add new programme" onClick={() => router.push('/programmes/new')} />
              </div>

              <div className="h-[88px]" />
            </div>
          </>
        )}

        {/* ──────────── SESSIONS ──────────── */}
        {mainTab === 'sessions' && (
          <>
            <SubTabBar tabs={['strength', 'cardio'] as const} active={sessSubTab} onChange={setSessSubTab} />

            <div className="no-scrollbar flex-1 overflow-y-auto px-4 pt-4">
              <div className="mb-3">
                <CtaButton
                  label={sessSubTab === 'strength' ? 'Add new session' : 'Add cardio session'}
                  onClick={() => router.push(`/sessions/new?type=${sessSubTab}`)}
                />
              </div>

              <div className="flex flex-col gap-3">
                {sessSubTab === 'strength' ? (
                  strengthTemplates.length === 0 ? (
                    <div className="bg-bg-element rounded-xl p-4">
                      <p className="text-label font-medium leading-[18px] text-text/50 m-0">
                        No session templates yet – create a new session to get started.
                      </p>
                    </div>
                  ) : (
                    strengthTemplates.map(t => <StrengthCard key={t.id} tmpl={t} onEdit={() => router.push(`/sessions/edit/${t.id}`)} />)
                  )
                ) : (
                  cardioTemplates.length === 0 ? (
                    <div className="bg-bg-element rounded-xl p-4">
                      <p className="text-label font-medium leading-[18px] text-text/50 m-0">
                        No cardio templates yet – create a new cardio session to add it to a programme.
                      </p>
                    </div>
                  ) : (
                    cardioTemplates.map(t => <CardioTemplateCard key={t.id} t={t} onEdit={() => router.push(`/sessions/edit/${t.id}`)} />)
                  )
                )}
              </div>

              <div className="h-[88px]" />
            </div>
          </>
        )}

      </div>
    </div>
  )
}
