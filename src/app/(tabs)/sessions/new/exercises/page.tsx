'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Plus, Search } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'
import { EXERCISE_LIBRARY } from '@/lib/exercise-library'

// One letter label per unique category in library order
const CATEGORIES = [...new Set(EXERCISE_LIBRARY.map(e => e.category))]
const CATEGORY_LETTER: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((cat, i) => [cat, String.fromCharCode(65 + i)])
)

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
        className="w-full flex items-center justify-between px-4 py-5 border-b border-border text-left"
      >
        <span className="text-h4 font-medium leading-6 text-text max-w-[calc(100%-32px)] overflow-hidden text-ellipsis whitespace-nowrap">
          {name}
        </span>
        <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
          {added
            ? <Check size={16} className="text-accent" />
            : <Plus size={16} className="text-text/40" />
          }
        </div>
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-7 pb-6 border-b border-border flex-shrink-0">
        <h1 className="text-h2 font-medium leading-[30px] text-text m-0">New session</h1>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center">
          <X size={16} className="text-accent" />
        </button>
      </div>

      {/* Search bar */}
      <div className="flex gap-4 px-4 pt-6 pb-3 flex-shrink-0">
        <div className="flex-1 flex items-center gap-2 h-12 px-3 rounded-md bg-text/5">
          <Search size={16} className="text-text/40 flex-shrink-0" />
          <input
            placeholder="Search for exercises"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border-none bg-transparent outline-none text-body font-medium text-text"
          />
        </div>
        <button onClick={() => setSearch('')} className="w-12 h-12 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <Check size={16} className="text-accent-fg" />
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex-1 overflow-y-auto pb-[104px]">
        {grouped
          ? Array.from(grouped.entries()).map(([category, exercises]) => (
              <div key={category}>
                <div className="px-4 pt-5">
                  <span className="text-h4 font-medium leading-6 text-text">{CATEGORY_LETTER[category]}</span>
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
      <div className="fixed bottom-20 left-0 right-0 px-4 pt-4 pb-6 bg-bg border-t border-border">
        <button
          onClick={() => router.push('/sessions/new/configure')}
          disabled={!canProceed}
          className={`w-full h-12 rounded-full text-body font-medium ${canProceed ? 'border border-accent bg-accent text-accent-fg' : 'bg-text/10 text-text/40'}`}
        >
          Create session plan
        </button>
      </div>

    </div>
  )
}
