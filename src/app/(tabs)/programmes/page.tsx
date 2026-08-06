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
const chevronCircle = 'w-7 h-7 rounded-full bg-bg-element flex items-center justify-center flex-shrink-0'

// ─── Session cards ─────────────────────────────────────────────────────────────

function StrengthCard({ tmpl, onEdit }: { tmpl: StrengthSessionTemplate; onEdit: () => void }) {
  const dur     = tmplDuration(tmpl)
  const muscles = tmplMuscles(tmpl)
  const count   = tmpl.exerciseBlocks.length
  return (
    <button onClick={onEdit}>
      <div>
        <div>
          <span>{tmpl.name}</span>
          <div>
            <span>Strength</span>
            {muscles.map(m => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>
        {(dur || count> 0) && (
          <div>
            {dur && (
              <div>
                <Image src="/icon-clock.svg" alt="" width={12} height={12} />
                <span>{dur}</span>
              </div>
            )}
            {count> 0 && (
              <div>
                <Image src="/icon-exercise.svg" alt="" width={12} height={12} />
                <span>{count} exercise{count !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div>
        <ChevronRight size={14} />
      </div>
    </button>
  )
}

function CardioTemplateCard({ t, onEdit }: { t: CardioSessionTemplate; onEdit: () => void }) {
  return (
    <button onClick={onEdit}>
      <div>
        <div>
          <span>{t.name}</span>
          <div>
            <span>Cardio</span>
            <span>{t.activityType}</span>
          </div>
        </div>
        {(t.targetDurationMinutes || t.targetDistanceKm) && (
          <div>
            {t.targetDurationMinutes && (
              <div>
                <Image src="/icon-clock.svg" alt="" width={12} height={12} />
                <span>{t.targetDurationMinutes} Mins</span>
              </div>
            )}
            {t.targetDistanceKm && <span>{t.targetDistanceKm.toFixed(1)} km</span>}
          </div>
        )}
      </div>
      <div>
        <ChevronRight size={14} />
      </div>
    </button>
  )
}

// ─── Sub-tab bar ─────────────────────────────────────────────────────────────

function SubTabBar<T extends string>({ tabs, active, onChange }: {
  tabs: readonly T[]; active: T; onChange: (t: T) => void
}) {
  return (
    <div>
      {tabs.map(t => {
        const isActive = t === active
        return (
          <button key={t}
            onClick={() => onChange(t)}>
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
    <button onClick={onClick}>
      <Plus size={24} />
      <span>{label}</span>
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
    <div>

      {/* ── Title ── */}
      <div>
        <h1>Workouts</h1>
      </div>

      {/* ── Main tab pill switcher ── */}
      <div>
        <div>
          {(['programmes', 'sessions'] as const).map(t => {
            const isActive = t === mainTab
            return (
              <button key={t}
                onClick={() => setMainTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div>

        {/* ──────────── PROGRAMMES ──────────── */}
        {mainTab === 'programmes' && (
          <>
            <SubTabBar tabs={['active', 'inactive'] as const} active={progSubTab} onChange={setProgSubTab} />

            <div>

              {filteredProgrammes.map(p => {
                const phases = p.phases.length
                const weeks  = p.phases.reduce((sum, ph) => sum + ph.durationWeeks, 0)
                return (
                  <button key={p.id}
                    onClick={() => router.push(`/programmes/${p.id}`)}>
                    <div>
                      <div>
                        <span>{p.name}</span>
                        {p.startDate && (
                          <span>Started: {fmtStartDate(p.startDate)}</span>
                        )}
                      </div>
                      <div>
                        <span>
                          {phases} phase{phases !== 1 ? 's' : ''}
                        </span>
                        {weeks> 0 && (
                          <span>
                            {weeks} week{weeks !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                )
              })}

              {filteredProgrammes.length === 0 && (
                <div>
                  <div>
                    <p>
                      {progSubTab === 'active'
                        ? 'No active programme – open a programme and set a start date to activate it.'
                        : 'No programmes yet – add one to get started.'}
                    </p>
                  </div>
                </div>
              )}

              <div>
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
                    <div>
                      <p>
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
    </div>
  )
}
