'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Plus } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'
import Image from 'next/image'
import type { WorkoutTemplate, CardioTemplate } from '@/types'

type MainTab    = 'programmes' | 'sessions'
type ProgSubTab = 'active' | 'inactive'
type SessSubTab = 'strength' | 'cardio'

const FONT = 'var(--font-geist-sans)'

const tagStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: '11px', fontWeight: 500,
  textTransform: 'uppercase', letterSpacing: '0.02em', lineHeight: '14px',
}
const bodyStyle: React.CSSProperties = {
  fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function tmplDuration(tmpl: WorkoutTemplate): string | null {
  if (tmpl.exerciseBlocks.length === 0) return null
  const totalSets = tmpl.exerciseBlocks.reduce((s, b) => s + b.targetSets, 0)
  const est = totalSets * 3
  const lo = Math.max(15, Math.round(est * 0.85 / 5) * 5)
  const hi = Math.round(est * 1.15 / 5) * 5
  return lo === hi ? `${lo} Mins` : `${lo} – ${hi} Mins`
}

function tmplMuscles(tmpl: WorkoutTemplate): string[] {
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

// ─── Session cards ─────────────────────────────────────────────────────────────

function StrengthCard({ tmpl }: { tmpl: WorkoutTemplate }) {
  const dur     = tmplDuration(tmpl)
  const muscles = tmplMuscles(tmpl)
  const count   = tmpl.exerciseBlocks.length
  return (
    <div style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ ...bodyStyle, color: '#111111' }}>{tmpl.name}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ ...tagStyle, color: '#FFFDF5', background: '#3B948F', padding: '4px 12px', borderRadius: '200px' }}>Strength</span>
          {muscles.map(m => (
            <span key={m} style={{ ...tagStyle, color: '#3B948F', background: 'rgba(17,17,17,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{m}</span>
          ))}
        </div>
      </div>
      {(dur || count > 0) && (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {dur && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Image src="/icon-clock.svg" alt="" width={12} height={12} />
              <span style={{ ...tagStyle, color: 'rgba(17,17,17,0.4)' }}>{dur}</span>
            </div>
          )}
          {count > 0 && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Image src="/icon-exercise.svg" alt="" width={12} height={12} />
              <span style={{ ...tagStyle, color: 'rgba(17,17,17,0.4)' }}>{count} exercise{count !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function CardioTemplateCard({ t }: { t: CardioTemplate }) {
  return (
    <div style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ ...bodyStyle, color: '#111111' }}>{t.name}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ ...tagStyle, color: '#FFFDF5', background: '#111111', padding: '4px 12px', borderRadius: '200px' }}>Cardio</span>
          <span style={{ ...tagStyle, color: '#3B948F', background: 'rgba(17,17,17,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{t.activityType}</span>
        </div>
      </div>
      {(t.targetDurationMinutes || t.targetDistanceKm) && (
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {t.targetDurationMinutes && (
            <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
              <Image src="/icon-clock.svg" alt="" width={12} height={12} />
              <span style={{ ...tagStyle, color: 'rgba(17,17,17,0.4)' }}>{t.targetDurationMinutes} Mins</span>
            </div>
          )}
          {t.targetDistanceKm && (
            <span style={{ ...tagStyle, color: 'rgba(17,17,17,0.4)' }}>{t.targetDistanceKm.toFixed(1)} km</span>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const router = useRouter()
  const { programmes } = useProgrammeStore()

  const [mainTab,    setMainTab]    = useState<MainTab>('programmes')
  const [progSubTab, setProgSubTab] = useState<ProgSubTab>('active')
  const [sessSubTab, setSessSubTab] = useState<SessSubTab>('strength')

  const filteredProgrammes = programmes.filter(p =>
    progSubTab === 'active' ? p.isActive : !p.isActive
  )
  const strengthSessions = programmes.flatMap(p => p.templates)
  const cardioTemplates  = programmes.flatMap(p => p.cardioTemplates)

  // ─── Sub-tab bar ─────────────────────────────────────────────────────────────

  function SubTabBar<T extends string>({ tabs, active, onChange }: {
    tabs: readonly T[]; active: T; onChange: (t: T) => void
  }) {
    return (
      <div style={{
        display: 'flex', gap: '16px', padding: '0 16px',
        borderBottom: '1px solid rgba(17,17,17,0.05)', flexShrink: 0,
      }}>
        {tabs.map(tab => {
          const isActive = tab === active
          return (
            <button
              key={tab}
              onClick={() => onChange(tab)}
              style={{
                padding: '0 0 8px', background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid #111111' : '2px solid transparent',
                marginBottom: '-1px',
                opacity: isActive ? 1 : 0.4, cursor: 'pointer',
                ...bodyStyle, color: '#111111',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', height: '48px',
          background: '#3B948F', borderRadius: '40px', border: 'none', cursor: 'pointer',
        }}
      >
        <Plus size={24} color="#FFFEFA" />
        <span style={{ ...bodyStyle, color: '#FFFEFA' }}>{label}</span>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Title ── */}
      <div style={{ padding: '28px 16px 0', flexShrink: 0 }}>
        <h1 style={{ fontFamily: FONT, fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
          Workouts
        </h1>
      </div>

      {/* ── Main tab pill switcher ── */}
      <div style={{ margin: '20px 16px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', padding: '4px', borderRadius: '40px', background: 'rgba(17,17,17,0.05)', gap: '4px' }}>
          {(['programmes', 'sessions'] as const).map(tab => {
            const isActive = tab === mainTab
            return (
              <button
                key={tab}
                onClick={() => setMainTab(tab)}
                style={{
                  flex: 1, padding: '8px 24px', borderRadius: '40px',
                  background: isActive ? '#FFFEFA' : 'transparent',
                  border: isActive ? '1px solid rgba(252,253,255,0.04)' : '1px solid transparent',
                  opacity: isActive ? 1 : 0.4, cursor: 'pointer',
                  ...bodyStyle, color: isActive ? '#3B948F' : '#111111',
                }}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: '20px', overflow: 'hidden' }}>

        {/* ──────────── PROGRAMMES ──────────── */}
        {mainTab === 'programmes' && (
          <>
            <SubTabBar tabs={['active', 'inactive'] as const} active={progSubTab} onChange={setProgSubTab} />

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }}>

              {filteredProgrammes.map(p => {
                const phases = p.phases.length
                const weeks  = p.phases.reduce((sum, ph) => sum + ph.durationWeeks, 0)
                return (
                  <button
                    key={p.id}
                    onClick={() => router.push(`/programmes/${p.id}`)}
                    style={{
                      display: 'flex', width: '100%', alignItems: 'center', gap: '16px',
                      padding: '20px 16px', background: 'none', border: 'none',
                      borderBottom: '1px solid rgba(17,17,17,0.05)',
                      cursor: 'pointer', textAlign: 'left',
                    }}
                  >
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontFamily: FONT, fontSize: '18px', fontWeight: 500, lineHeight: '24px', color: '#111111' }}>
                          {p.name}
                        </span>
                        {p.startDate && (
                          <span style={{ ...tagStyle, color: 'rgba(17,17,17,0.5)' }}>
                            Started: {fmtStartDate(p.startDate)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                        <span style={{ ...tagStyle, color: '#FFFDF5', background: '#3B948F', padding: '4px 12px', borderRadius: '200px' }}>
                          {phases} phase{phases !== 1 ? 's' : ''}
                        </span>
                        {weeks > 0 && (
                          <span style={{ ...tagStyle, color: '#3B948F', background: 'rgba(17,17,17,0.05)', padding: '4px 8px', borderRadius: '4px' }}>
                            {weeks} week{weeks !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '200px',
                      background: 'rgba(17,17,17,0.05)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <ChevronRight size={16} color="#111111" />
                    </div>
                  </button>
                )
              })}

              {filteredProgrammes.length === 0 && (
                <div style={{ padding: '16px 16px 0' }}>
                  <div style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', padding: '16px' }}>
                    <p style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 500, lineHeight: '18px', color: 'rgba(17,17,17,0.5)', margin: 0 }}>
                      {progSubTab === 'active'
                        ? 'No active programmes – add a new programme to get started.'
                        : 'No inactive programmes – all your programmes are currently active.'}
                    </p>
                  </div>
                </div>
              )}

              <div style={{ padding: '16px' }}>
                <CtaButton label="Add new programme" onClick={() => router.push('/programmes/new')} />
              </div>

              <div style={{ height: '88px' }} />
            </div>
          </>
        )}

        {/* ──────────── SESSIONS ──────────── */}
        {mainTab === 'sessions' && (
          <>
            <SubTabBar tabs={['strength', 'cardio'] as const} active={sessSubTab} onChange={setSessSubTab} />

            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessSubTab === 'strength' ? (
                  strengthSessions.length === 0 ? (
                    <div style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 500, lineHeight: '18px', color: 'rgba(17,17,17,0.5)', margin: 0 }}>
                        No session templates yet – create a new session to add it to a programme.
                      </p>
                    </div>
                  ) : (
                    strengthSessions.map(t => <StrengthCard key={t.id} tmpl={t} />)
                  )
                ) : (
                  cardioTemplates.length === 0 ? (
                    <div style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', padding: '16px' }}>
                      <p style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 500, lineHeight: '18px', color: 'rgba(17,17,17,0.5)', margin: 0 }}>
                        No cardio templates yet – create a new cardio session to add it to a programme.
                      </p>
                    </div>
                  ) : (
                    cardioTemplates.map(t => <CardioTemplateCard key={t.id} t={t} />)
                  )
                )}
              </div>

              <div style={{ padding: '16px 0 0' }}>
                <CtaButton
                  label={sessSubTab === 'strength' ? 'Add new session' : 'Add cardio session'}
                  onClick={() => router.push(`/sessions/new?type=${sessSubTab}`)}
                />
              </div>

              <div style={{ height: '88px' }} />
            </div>
          </>
        )}

      </div>
    </div>
  )
}
