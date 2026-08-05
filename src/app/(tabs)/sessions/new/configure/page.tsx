'use client'

import { useRouter } from 'next/navigation'
import { X, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'
import { useTemplateStore } from '@/stores/template-store'
import type { ExerciseTemplateBlock } from '@/types'

export default function NewSessionConfigurePage() {
  const router = useRouter()
  const { blocks, editingTemplateId, removeBlock, moveBlock, addSet, removeSet, updateSet, reset } = useSessionWizard()
  const { addStrengthTemplate, updateStrengthTemplate } = useTemplateStore()

  function handleClose() {
    reset()
    router.push('/programmes?tab=sessions')
  }

  function handleSave() {
    if (blocks.length === 0) return

    const exerciseBlocks: ExerciseTemplateBlock[] = blocks.map((b, i) => {
      const firstSet = b.sets[0]
      return {
        id: crypto.randomUUID(),
        exerciseId: b.exerciseId,
        exerciseName: b.exerciseName,
        orderIndex: i,
        setType: 'working' as const,
        targetSets: b.sets.length,
        targetRepsMin: firstSet?.reps ? parseInt(firstSet.reps) : 0,
        targetRepsMax: firstSet?.reps ? parseInt(firstSet.reps) : 0,
        targetWeightKg: firstSet?.weight ? parseFloat(firstSet.weight) : null,
        targetRpe: firstSet?.rpe ? parseFloat(firstSet.rpe) : null,
        restSeconds: 90,
        supersetGroupId: null,
        notes: null,
      }
    })

    if (editingTemplateId) {
      updateStrengthTemplate(editingTemplateId, { exerciseBlocks })
    } else {
      const newTemplate = addStrengthTemplate({
        name: blocks[0].exerciseName + ' Session',
        notes: null,
      })
      updateStrengthTemplate(newTemplate.id, { exerciseBlocks })
    }

    reset()
    router.push('/programmes?tab=sessions')
  }

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-5 screen-top pb-6 border-b border-border flex-shrink-0">
        <h1 className="text-h2 font-bold leading-[30px] text-text m-0">Edit session</h1>
        <button onClick={handleClose} className="w-8 h-8 rounded-full bg-bg-element flex items-center justify-center">
          <X size={16} className="text-accent" />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto pb-[96px]">

        {blocks.map((block, blockIdx) => (
          <div key={block.id} className="px-4 py-6 border-b border-border flex flex-col gap-4">

            {/* Exercise header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-h4 font-medium leading-6 text-text">{block.exerciseName}</span>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => moveBlock(block.id, 'up')} className={`w-8 h-8 rounded-full bg-bg-element flex items-center justify-center ${blockIdx === 0 ? 'opacity-40' : ''}`}>
                    <ChevronUp size={16} className="text-text" />
                  </button>
                  <button onClick={() => moveBlock(block.id, 'down')} className={`w-8 h-8 rounded-full bg-bg-element flex items-center justify-center ${blockIdx === blocks.length - 1 ? 'opacity-40' : ''}`}>
                    <ChevronDown size={16} className="text-text" />
                  </button>
                </div>
              </div>

              {/* Muscle tags */}
              {block.muscles.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {block.muscles.map(m => (
                    <div key={m} className="px-2 py-1 rounded bg-bg-element">
                      <span className="text-tag uppercase text-accent">{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sets */}
            <div className="flex flex-col gap-2">
              {block.sets.map((ws, setIdx) => (
                <div key={ws.id} className="flex items-center gap-2">
                  <span className="w-8 text-center flex-shrink-0 text-body font-medium leading-6 text-accent">
                    {String(setIdx + 1).padStart(2, '0')}
                  </span>

                  <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-bg-element rounded">
                    <input
                      type="number" min="0" step="0.5" placeholder="0"
                      value={ws.weight}
                      onChange={e => updateSet(block.id, ws.id, 'weight', e.target.value)}
                      className="w-0 flex-1 border-none bg-transparent outline-none text-body font-medium text-text"
                    />
                    <span className="text-tag uppercase text-text/40 flex-shrink-0">KG</span>
                  </div>

                  <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-bg-element rounded">
                    <input
                      type="number" min="0" placeholder="0"
                      value={ws.reps}
                      onChange={e => updateSet(block.id, ws.id, 'reps', e.target.value)}
                      className="w-0 flex-1 border-none bg-transparent outline-none text-body font-medium text-text"
                    />
                    <span className="text-tag uppercase text-text/40 flex-shrink-0">reps</span>
                  </div>

                  <div className="flex-1 flex items-center justify-between px-3 py-1.5 bg-bg-element rounded">
                    <input
                      type="number" min="1" max="10" step="0.5" placeholder="0"
                      value={ws.rpe}
                      onChange={e => updateSet(block.id, ws.id, 'rpe', e.target.value)}
                      className="w-0 flex-1 border-none bg-transparent outline-none text-body font-medium text-text"
                    />
                    <span className="text-tag uppercase text-text/40 flex-shrink-0">RPE</span>
                  </div>

                  {block.sets.length > 1 && (
                    <button onClick={() => removeSet(block.id, ws.id)} className="w-6 h-6 rounded-full bg-bg-element flex items-center justify-center flex-shrink-0">
                      <Minus size={12} className="text-text/40" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add set + Delete exercise */}
            <div className="flex items-center gap-4">
              <button onClick={() => addSet(block.id)} className="flex-1 h-10 rounded-full bg-bg-element text-body font-medium text-accent">
                Add set to exercise
              </button>
              <button onClick={() => removeBlock(block.id)} className="w-10 h-10 rounded-full bg-error flex items-center justify-center flex-shrink-0">
                <X size={16} className="text-accent-fg" />
              </button>
            </div>
          </div>
        ))}

        {/* Add more exercises */}
        <div className="px-4 py-6 border-b border-border">
          <button
            onClick={() => router.push('/sessions/new/exercises')}
            className="w-full h-12 rounded-full border border-accent bg-accent text-body font-medium text-accent-fg"
          >
            Add exercises to workout
          </button>
        </div>

      </div>

      {/* Save footer */}
      <div className="fixed bottom-20 left-0 right-0 px-5 pt-4 pb-6 bg-bg border-t border-border">
        <button
          onClick={handleSave}
          disabled={blocks.length === 0}
          className={`w-full h-12 rounded-full text-body font-medium ${blocks.length > 0 ? 'border border-accent bg-accent text-accent-fg' : 'bg-text/10 text-text/40'}`}
        >
          Save session
        </button>
      </div>

    </div>
  )
}
