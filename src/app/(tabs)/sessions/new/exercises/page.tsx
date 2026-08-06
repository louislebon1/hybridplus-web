'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { X, Check, Plus, Search } from 'lucide-react'
import { Page } from '@/components/feed'
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
      <button
        className="w-full flex items-center justify-between gap-3 py-3.5 border-b border-scrim/8 bg-transparent text-left cursor-pointer"
        onClick={() => {
          if (added) {
            const blockId = blockIdByExerciseId.get(id)
            if (blockId) removeBlock(blockId)
          } else {
            addExercise({ id, name, muscles })
          }
        }}>
        <span className="text-body text-scrim truncate">
          {name}
        </span>
        <div className={['w-9 h-9 rounded-pill flex items-center justify-center flex-shrink-0', added ? 'bg-scrim text-void' : 'matt text-scrim'].join(' ')}>
          {added
            ? <Check size={16} />
            : <Plus size={16} />
          }
        </div>
      </button>
    )
  }

  return (
    <Page>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-4 flex-shrink-0">
        <h1 className="display text-display m-0 flex-1 min-w-0">New session</h1>
        <button onClick={handleClose} aria-label="Close" className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Search bar */}
      <div className="px-5 flex gap-2.5 flex-shrink-0">
        <div className="flex-1 h-12 rounded-card matt flex items-center gap-2.5 px-3.5 focus-within:border-scrim/45">
          <Search size={16} className="text-fog flex-shrink-0" />
          <input className="flex-1 min-w-0 bg-transparent border-0 outline-none text-body text-scrim placeholder:text-fog" placeholder="Search for exercises"
            value={search}
            onChange={e => setSearch(e.target.value)} />
        </div>
        <button onClick={handleAddCustom}
          disabled={!search.trim()}
          className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer w-12 h-12 disabled:opacity-30"
          title="Add your own exercise">
          <Plus size={16} />
        </button>
      </div>

      {/* Exercise list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-4 pb-[200px]">
        {grouped
          ? Array.from(grouped.entries()).map(([letter, exercises]) => (
              <div key={letter}>
                <div className="sticky top-0 bg-void/95 py-2">
                  <span className="meta">{letter}</span>
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
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] z-40 px-5 py-3 bg-void/95 border-t border-scrim/10">
        <button className="w-full h-14 rounded-pill bg-scrim text-void inline-flex items-center justify-center border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] display text-figure disabled:opacity-35 disabled:active:scale-100" onClick={() => router.push('/sessions/new/configure')}
          disabled={!canProceed}>
          Create session plan
        </button>
      </div>

    </Page>
  )
}
