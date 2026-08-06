'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Plus, Search } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'
import { EXERCISE_LIBRARY_SORTED } from '@/lib/exercise-library'

export default function NewSessionExercisesPage() {
  const router = useRouter()
  const { blocks, addExercise, removeBlock, reset } = useSessionWizard()
  const [search, setSearch] = useState('')

  const blockIdByExerciseId = useMemo(() => new Map(blocks.map(b => [b.exerciseId, b.id])), [blocks])
  const addedIds = useMemo(() => new Set(blocks.map(b => b.exerciseId)), [blocks])
  const canProceed = blocks.length> 0
  const query = search.trim().toLowerCase()

  const filtered = useMemo(() =>
    query
      ? EXERCISE_LIBRARY_SORTED.filter(e =>
          e.name.toLowerCase().includes(query) ||
          e.primaryMuscles.some(m => m.toLowerCase().includes(query))
        )
      : EXERCISE_LIBRARY_SORTED,
  [query])

  // Group alphabetically by first letter, A-Z, like a contacts list
  const grouped = useMemo(() => {
    if (query) return null
    const map = new Map<string, typeof EXERCISE_LIBRARY_SORTED>()
    for (const ex of filtered) {
      const letter = ex.name[0].toUpperCase()
      if (!map.has(letter)) map.set(letter, [])
      map.get(letter)!.push(ex)
    }
    return map
  }, [filtered, query])

  function handleClose() {
    reset()
    router.push('/programmes?tab=sessions')
  }

  function handleAddCustom() {
    const name = search.trim()
    if (!name) return
    addExercise({ id: `custom-${Date.now()}`, name, muscles: [] })
    setSearch('')
  }

  const ExerciseRow = ({ id, name, muscles }: { id: string; name: string; muscles: string[] }) => {
    const added = addedIds.has(id)
    return (
      <button onClick={() => {
          if (added) {
            const blockId = blockIdByExerciseId.get(id)
            if (blockId) removeBlock(blockId)
          } else {
            addExercise({ id, name, muscles })
          }
        }}>
        <span>
          {name}
        </span>
        <div>
          {added
            ? <Check size={16} />
            : <Plus size={16} />
          }
        </div>
      </button>
    )
  }

  return (
    <div>

      {/* Header */}
      <div>
        <h1>New session</h1>
        <button onClick={handleClose}>
          <X size={16} />
        </button>
      </div>

      {/* Search bar */}
      <div>
        <div>
          <Search size={16} />
          <input placeholder="Search for exercises"
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={handleAddCustom}
          disabled={!search.trim()}
          title="Add your own exercise">
          <Plus size={16} />
        </button>
      </div>

      {/* Exercise list */}
      <div>
        {grouped
          ? Array.from(grouped.entries()).map(([letter, exercises]) => (
              <div key={letter}>
                <div>
                  <span>{letter}</span>
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
      <div>
        <button onClick={() => router.push('/sessions/new/configure')}
          disabled={!canProceed}>
          Create session plan
        </button>
      </div>

    </div>
  )
}
