'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { ChevronRight, Plus } from 'lucide-react'
import { Page } from '@/components/feed'
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

const CARD = 'w-full matt rounded-card px-4 py-4 flex items-center gap-3 text-left cursor-pointer transition-transform duration-150 ease-out active:scale-[0.99]'
const CHIP = 'meta px-2.5 py-1 rounded-pill matt'

// ─── Session cards ─────────────────────────────────────────────────────────────

function StrengthCard({ tmpl, onEdit }: { tmpl: StrengthSessionTemplate; onEdit: () => void }) {
  const dur     = tmplDuration(tmpl)
  const muscles = tmplMuscles(tmpl)
  const count   = tmpl.exerciseBlocks.length
  return (
    <button onClick={onEdit} className={CARD}>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="display text-figure truncate">{tmpl.name}</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="meta px-2.5 py-1 rounded-pill bg-scrim text-void">Strength</span>
            {muscles.map(m => (
              <span key={m} className={CHIP}>{m}</span>
            ))}
          </div>
        </div>
        {(dur || count> 0) && (
          <div className="flex gap-4 items-center">
            {dur && (
              <div className="flex items-center gap-1.5">
                <Image src="/icon-clock.svg" alt="" width={12} height={12} />
                <span className="meta">{dur}</span>
              </div>
            )}
            {count> 0 && (
              <div className="flex items-center gap-1.5">
                <Image src="/icon-exercise.svg" alt="" width={12} height={12} />
                <span className="meta">{count} exercise{count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <span className="w-9 h-9 rounded-pill matt flex items-center justify-center flex-shrink-0 text-fog">
        <ChevronRight size={15} />
      </span>
    </button>
  )
}

function CardioTemplateCard({ t, onEdit }: { t: CardioSessionTemplate; onEdit: () => void }) {
  return (
    <button onClick={onEdit} className={CARD}>
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex flex-col gap-1.5">
          <span className="display text-figure truncate">{t.name}</span>
          <div className="flex flex-wrap gap-1.5">
            <span className="meta px-2.5 py-1 rounded-pill bg-scrim text-void">Cardio</span>
            <span className={CHIP}>{t.activityType}</span>
          </div>
        </div>
        {(t.targetDurationMinutes || t.targetDistanceKm) && (
          <div className="flex gap-4 items-center">
            {t.targetDurationMinutes && (
              <div className="flex items-center gap-1.5">
                <Image src="/icon-clock.svg" alt="" width={12} height={12} />
                <span className="meta">{t.targetDurationMinutes} Mins</span>
              </div>
            )}
            {t.targetDistanceKm && <span className="meta">{t.targetDistanceKm.toFixed(1)} km</span>}
          </div>
        )}
      </div>
      <span className="w-9 h-9 rounded-pill matt flex items-center justify-center flex-shrink-0 text-fog">
        <ChevronRight size={15} />
      </span>
    </button>
  )
}

// ─── Sub-tab bar ─────────────────────────────────────────────────────────────

function SubTabBar<T extends string>({ tabs, active, onChange }: {
  tabs: readonly T[]; active: T; onChange: (t: T) => void
}) {
  return (
    <div className="flex gap-2">
      {tabs.map(t => {
        const isActive = t === active
        return (
          <button key={t}
            onClick={() => onChange(t)}
            className={['px-4 py-2 rounded-pill border cursor-pointer meta transition-colors duration-150', isActive ? 'bg-scrim text-void border-transparent' : 'matt'].join(' ')}>
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
    <button onClick={onClick} className="w-full h-14 rounded-pill bg-scrim text-void inline-flex items-center justify-center gap-2.5 border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]">
      <Plus size={18} />
      <span className="display text-figure">{label}</span>
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
    <Page>

      {/* ── Title ── */}
      <header className="px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-4 flex-shrink-0">
        <h1 className="display text-display m-0">Workouts</h1>
      </header>

      {/* ── Main tab pill switcher ── */}
      <div className="px-5 flex-shrink-0">
        <div className="flex p-1 rounded-pill matt gap-1">
          {(['programmes', 'sessions'] as const).map(t => {
            const isActive = t === mainTab
            return (
              <button key={t}
                onClick={() => setMainTab(t)}
                className={['flex-1 py-2.5 rounded-pill cursor-pointer transition-colors duration-150 display text-label', isActive ? 'bg-scrim text-void' : 'text-stone'].join(' ')}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-5 pb-32 flex flex-col gap-4">

        {/* ──────────── PROGRAMMES ──────────── */}
        {mainTab === 'programmes' && (
          <>
            <SubTabBar tabs={['active', 'inactive'] as const} active={progSubTab} onChange={setProgSubTab} />

            <div className="flex flex-col gap-2.5">

              {filteredProgrammes.map(p => {
                const phases = p.phases.length
                const weeks  = p.phases.reduce((sum, ph) => sum + ph.durationWeeks, 0)
                return (
                  <button key={p.id}
                    onClick={() => router.push(`/programmes/${p.id}`)}
                    className={CARD}>
                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex flex-col gap-1">
                        <span className="display text-figure truncate">{p.name}</span>
                        {p.startDate && (
                          <span className="meta">Started {fmtStartDate(p.startDate)}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={CHIP}>
                          {phases} phase{phases !== 1 ? 's' : ''}
                        </span>
                        {weeks> 0 && (
                          <span className={CHIP}>
                            {weeks} week{weeks !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="w-9 h-9 rounded-pill matt flex items-center justify-center flex-shrink-0 text-fog">
                      <ChevronRight size={15} />
                    </span>
                  </button>
                )
              })}

              {filteredProgrammes.length === 0 && (
                <div className="matt rounded-card p-5">
                  <div>
                    <p className="text-label text-stone m-0">
                      {progSubTab === 'active'
                        ? 'No active programme – open a programme and set a start date to activate it.'
                        : 'No programmes yet – add one to get started.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="mt-2">
                <CtaButton label="Add new programme" onClick={() => router.push('/programmes/new')} />
              </div>

              <div />
            </div>
          </>
        )}

        {/* ──────────── SESSIONS ──────────── */}
        {mainTab === 'sessions' && (
          <>
            <SubTabBar tabs={['strength', 'cardio'] as const} active={sessSubTab} onChange={setSessSubTab} />

            <div>
              <div>
                <CtaButton label={sessSubTab === 'strength' ? 'Add new session' : 'Add cardio session'}
                  onClick={() => router.push(`/sessions/new?type=${sessSubTab}`)} />
              </div>

              <div>
                {sessSubTab === 'strength' ? (
                  strengthTemplates.length === 0 ? (
                    <div>
                      <p>
                        No session templates yet – create a new session to get started.
                      </p>
                    </div>
                  ) : (
                    strengthTemplates.map(t => <StrengthCard key={t.id} tmpl={t} onEdit={() => router.push(`/sessions/edit/${t.id}`)} />)
                  )
                ) : (
                  cardioTemplates.length === 0 ? (
                    <div className="matt rounded-card p-5">
                      <p className="text-label text-stone m-0">
                        No cardio templates yet – create a new cardio session to add it to a programme.
                      </p>
                    </div>
                  ) : (
                    cardioTemplates.map(t => <CardioTemplateCard key={t.id} t={t} onEdit={() => router.push(`/sessions/edit/${t.id}`)} />)
                  )
                )}
              </div>

              <div />
            </div>
          </>
        )}

      </div>
    </Page>
  )
}
