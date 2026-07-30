'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Plus } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { useCardioStore } from '@/stores/cardio-store'
import { EXERCISE_LIBRARY, MUSCLE_GROUP_LABELS } from '@/lib/exercise-library'
import Image from 'next/image'
import type { WorkoutTemplate, CardioSession } from '@/types'

type MainTab   = 'programmes' | 'sessions'
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

function fmtSecs(secs: number): string {
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m} Mins`
}

function fmtStartDate(d: string): string {
  return new Date(d + 'T00:00:00')
    .toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    .toLowerCase()
}

function fmtShortDate(d: string): string {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
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

function CardioCard({ s }: { s: CardioSession }) {
  const label = [s.runType?.replace('_', ' '), s.activityType].filter(Boolean).join(' ')
  return (
    <div style={{ background: 'rgba(17,17,17,0.03)', borderRadius: '12px', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <span style={{ ...bodyStyle, color: '#111111', textTransform: 'capitalize' }}>{label}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          <span style={{ ...tagStyle, color: '#FFFDF5', background: '#111111', padding: '4px 12px', borderRadius: '200px' }}>Cardio</span>
          <span style={{ ...tagStyle, color: '#3B948F', background: 'rgba(17,17,17,0.05)', padding: '4px 8px', borderRadius: '4px' }}>{s.activityType}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        {s.durationSeconds > 0 && (
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <Image src="/icon-clock.svg" alt="" width={12} height={12} />
            <span style={{ ...tagStyle, color: 'rgba(17,17,17,0.4)' }}>{fmtSecs(s.durationSeconds)}</span>
          </div>
        )}
        {s.distanceKm && (
          <span style={{ ...tagStyle, color: 'rgba(17,17,17,0.4)' }}>{s.distanceKm.toFixed(2)} km</span>
        )}
        <span style={{ ...tagStyle, color: 'rgba(17,17,17,0.4)' }}>{fmtShortDate(s.sessionDate)}</span>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function WorkoutsPage() {
  const router = useRouter()
  const { programmes, createProgramme } = useProgrammeStore()
  const { sessions: cardioSessions } = useCardioStore()

  const [mainTab,    setMainTab]    = useState<MainTab>('programmes')
  const [progSubTab, setProgSubTab] = useState<ProgSubTab>('active')
  const [sessSubTab, setSessSubTab] = useState<SessSubTab>('strength')
  const [showCreate, setShowCreate] = useState(false)
  const [newName,    setNewName]    = useState('')
  const [newDesc,    setNewDesc]    = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    createProgramme({ name: newName.trim(), description: newDesc.trim() })
    setNewName(''); setNewDesc(''); setShowCreate(false)
  }

  const filteredProgrammes = programmes.filter(p =>
    progSubTab === 'active' ? p.isActive : !p.isActive
  )
  const strengthSessions = programmes.flatMap(p => p.templates)
  const sortedCardio     = [...cardioSessions].sort((a, b) => b.sessionDate.localeCompare(a.sessionDate))

  // ─── Sub-tab bar (shared) ────────────────────────────────────────────────────

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

  // ─── CTA button (shared) ─────────────────────────────────────────────────────

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

              {/* Programme rows */}
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

              {/* Empty state */}
              {filteredProgrammes.length === 0 && !showCreate && (
                <div style={{ padding: '40px 16px', textAlign: 'center' }}>
                  <p style={{ ...bodyStyle, color: 'rgba(17,17,17,0.4)' }}>
                    No {progSubTab} programmes
                  </p>
                </div>
              )}

              {/* Inline create form */}
              {showCreate && (
                <form onSubmit={handleCreate} style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    autoFocus
                    placeholder="Programme name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    style={{
                      padding: '12px 16px', borderRadius: '12px',
                      border: '1px solid rgba(17,17,17,0.1)', background: 'rgba(17,17,17,0.03)',
                      ...bodyStyle, color: '#111111', outline: 'none',
                      width: '100%', boxSizing: 'border-box',
                    }}
                  />
                  <input
                    placeholder="Description (optional)"
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    style={{
                      padding: '12px 16px', borderRadius: '12px',
                      border: '1px solid rgba(17,17,17,0.1)', background: 'rgba(17,17,17,0.03)',
                      ...bodyStyle, color: '#111111', outline: 'none',
                      width: '100%', boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="submit"
                      disabled={!newName.trim()}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '40px', border: 'none',
                        background: newName.trim() ? '#3B948F' : 'rgba(17,17,17,0.1)',
                        cursor: newName.trim() ? 'pointer' : 'default',
                        fontFamily: FONT, fontSize: '14px', fontWeight: 500,
                        color: newName.trim() ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
                      }}
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowCreate(false); setNewName(''); setNewDesc('') }}
                      style={{
                        padding: '12px 20px', borderRadius: '40px',
                        background: 'transparent', border: '1px solid rgba(17,17,17,0.1)',
                        cursor: 'pointer', fontFamily: FONT, fontSize: '14px', fontWeight: 500, color: '#111111',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {/* Add new programme CTA */}
              {!showCreate && (
                <div style={{ padding: '16px' }}>
                  <CtaButton label="Add new programme" onClick={() => setShowCreate(true)} />
                </div>
              )}

              <div style={{ height: '88px' }} />
            </div>
          </>
        )}

        {/* ──────────── SESSIONS ──────────── */}
        {mainTab === 'sessions' && (
          <>
            <SubTabBar tabs={['strength', 'cardio'] as const} active={sessSubTab} onChange={setSessSubTab} />

            {/* CTA above list */}
            <div style={{ padding: '20px 16px 0', flexShrink: 0 }}>
              <CtaButton
                label={sessSubTab === 'strength' ? 'Add new session' : 'Log cardio session'}
                onClick={() => { if (sessSubTab === 'cardio') router.push('/cardio') }}
              />
            </div>

            {/* Session cards */}
            <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {sessSubTab === 'strength' ? (
                  strengthSessions.length === 0 ? (
                    <p style={{ ...bodyStyle, color: 'rgba(17,17,17,0.4)' }}>
                      No sessions yet — add workouts to a programme first
                    </p>
                  ) : (
                    strengthSessions.map(t => <StrengthCard key={t.id} tmpl={t} />)
                  )
                ) : (
                  sortedCardio.length === 0 ? (
                    <p style={{ ...bodyStyle, color: 'rgba(17,17,17,0.4)' }}>
                      No cardio sessions logged yet
                    </p>
                  ) : (
                    sortedCardio.map(s => <CardioCard key={s.id} s={s} />)
                  )
                )}
              </div>
              <div style={{ height: '88px' }} />
            </div>
          </>
        )}

      </div>
    </div>
  )
}
