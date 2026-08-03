'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Plus, Search } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'
import { EXERCISE_LIBRARY } from '@/lib/exercise-library'

const FONT = 'var(--font-geist-sans)'

// One letter label per unique category in library order
const CATEGORIES = [...new Set(EXERCISE_LIBRARY.map(e => e.category))]
const CATEGORY_LETTER: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((cat, i) => [cat, String.fromCharCode(65 + i)])
)

const rowBtn: React.CSSProperties = {
  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '20px 16px', background: 'transparent',
  borderTop: 'none', borderLeft: 'none', borderRight: 'none',
  borderBottom: '1px solid rgba(17,17,17,0.05)',
  cursor: 'pointer', textAlign: 'left', boxSizing: 'border-box',
}

export default function NewSessionExercisesPage() {
  const router = useRouter()
  const { blocks, addExercise, reset } = useSessionWizard()
  const [search, setSearch] = useState('')

  const addedIds = useMemo(() => new Set(blocks.map(b => b.exerciseId)), [blocks])
  const canProceed = blocks.length > 0
  const query = search.trim().toLowerCase()

  const filtered = useMemo(() =>
    query
      ? EXERCISE_LIBRARY.filter(e =>
          e.name.toLowerCase().includes(query) ||
          e.primaryMuscles.some(m => m.toLowerCase().includes(query))
        )
      : EXERCISE_LIBRARY,
  [query])

  const grouped = useMemo(() => {
    if (query) return null
    const map = new Map<string, typeof EXERCISE_LIBRARY>()
    for (const ex of filtered) {
      if (!map.has(ex.category)) map.set(ex.category, [])
      map.get(ex.category)!.push(ex)
    }
    return map
  }, [filtered, query])

  function handleClose() {
    reset()
    router.push('/sessions')
  }

  const ExerciseRow = ({ id, name, muscles }: { id: string; name: string; muscles: string[] }) => {
    const added = addedIds.has(id)
    return (
      <button
        onClick={() => { if (!added) addExercise({ id, name, muscles }) }}
        style={rowBtn}
      >
        <span style={{ fontSize: '18px', fontWeight: 500, lineHeight: '24px', color: '#111111', fontFamily: FONT, maxWidth: '179px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name}
        </span>
        <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {added
            ? <Check size={16} color="#3B948F" />
            : <Plus size={16} color="rgba(17,17,17,0.4)" />
          }
        </div>
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT, background: '#FFFEFA' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 16px 24px', borderBottom: '1px solid rgba(17,17,17,0.05)', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
          New session
        </h1>
        <button
          onClick={handleClose}
          style={{ width: '32px', height: '32px', borderRadius: '200px', background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} color="#3B948F" />
        </button>
      </div>

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '16px', padding: '24px 16px 12px', flexShrink: 0 }}>
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: '8px',
          height: '48px', padding: '8px 12px', borderRadius: '6px',
          background: 'rgba(17,17,17,0.05)', boxSizing: 'border-box',
        }}>
          <Search size={16} color="rgba(17,17,17,0.4)" style={{ flexShrink: 0 }} />
          <input
            placeholder="Search for exercises"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              flex: 1, border: 'none', background: 'transparent', outline: 'none',
              fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px', color: '#111111',
            }}
          />
        </div>
        <button
          onClick={() => setSearch('')}
          style={{
            width: '48px', height: '48px', borderRadius: '40px', background: '#3B948F',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}
        >
          <Check size={16} color="#FFFEFA" />
        </button>
      </div>

      {/* Exercise list */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '104px' }}>
        {grouped
          ? Array.from(grouped.entries()).map(([category, exercises]) => (
              <div key={category}>
                <div style={{ padding: '20px 16px 0' }}>
                  <span style={{ fontFamily: FONT, fontSize: '18px', fontWeight: 500, lineHeight: '24px', color: '#111111' }}>
                    {CATEGORY_LETTER[category]}
                  </span>
                </div>
                {exercises.map(ex => (
                  <ExerciseRow key={ex.id} id={ex.id} name={ex.name} muscles={ex.primaryMuscles} />
                ))}
              </div>
            ))
          : filtered.map(ex => (
              <ExerciseRow key={ex.id} id={ex.id} name={ex.name} muscles={ex.primaryMuscles} />
            ))
        }
      </div>

      {/* Footer CTA */}
      <div style={{
        position: 'fixed', bottom: 80, left: 0, right: 0,
        padding: '16px 16px 24px', background: '#FFFEFA',
        borderTop: '1px solid rgba(17,17,17,0.05)',
      }}>
        <button
          onClick={() => router.push('/sessions/new/configure')}
          disabled={!canProceed}
          style={{
            width: '100%', height: '48px', borderRadius: '40px',
            border: canProceed ? '1px solid #3B948F' : 'none',
            background: canProceed ? '#3B948F' : 'rgba(17,17,17,0.1)',
            cursor: canProceed ? 'pointer' : 'default',
            fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px',
            color: canProceed ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
          }}
        >
          Create session plan
        </button>
      </div>

    </div>
  )
}
