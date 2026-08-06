'use client'

import { useRouter } from 'next/navigation'
import { X, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { Page } from '@/components/feed'
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
    <Page>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-4 flex-shrink-0">
        <h1 className="display text-display m-0 flex-1 min-w-0">Edit session</h1>
        <button onClick={handleClose} aria-label="Close" className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 pt-2 pb-[200px] flex flex-col gap-3">

        {blocks.map((block, blockIdx) => (
          <div key={block.id} className="matt rounded-card p-4 flex flex-col gap-3">

            {/* Exercise header */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="display text-figure truncate">{block.exerciseName}</span>
                <div className="flex gap-1.5 flex-shrink-0">
                  <button aria-label="Move up" className="w-9 h-9 rounded-pill matt flex items-center justify-center text-scrim cursor-pointer" onClick={() => moveBlock(block.id, 'up')}>
                    <ChevronUp size={16} />
                  </button>
                  <button aria-label="Move down" className="w-9 h-9 rounded-pill matt flex items-center justify-center text-scrim cursor-pointer" onClick={() => moveBlock(block.id, 'down')}>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              {/* Muscle tags */}
              {block.muscles.length> 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {block.muscles.map(m => (
                    <div key={m}>
                      <span className="meta px-2.5 py-1 rounded-pill matt">{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sets */}
            <div>
              {block.sets.map((ws, setIdx) => (
                <div key={ws.id}>
                  <span>
                    {String(setIdx + 1).padStart(2, '0')}
                  </span>

                  <div>
                    <input type="number" min="0" step="0.5" placeholder="0"
                      value={ws.weight}
                      onChange={e => updateSet(block.id, ws.id, 'weight', e.target.value)} />
                    <span>KG</span>
                  </div>

                  <div>
                    <input type="number" min="0" placeholder="0"
                      value={ws.reps}
                      onChange={e => updateSet(block.id, ws.id, 'reps', e.target.value)} />
                    <span>reps</span>
                  </div>

                  <div>
                    <input type="number" min="1" max="10" step="0.5" placeholder="0"
                      value={ws.rpe}
                      onChange={e => updateSet(block.id, ws.id, 'rpe', e.target.value)} />
                    <span>RPE</span>
                  </div>

                  {block.sets.length> 1 && (
                    <button onClick={() => removeSet(block.id, ws.id)}>
                      <Minus size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add set + Delete exercise */}
            <div>
              <button onClick={() => addSet(block.id)}>
                Add set to exercise
              </button>
              <button onClick={() => removeBlock(block.id)}>
                <X size={16} />
              </button>
            </div>
          </div>
        ))}

        {/* Add more exercises */}
        <div>
          <button onClick={() => router.push('/sessions/new/exercises')}>
            Add exercises to workout
          </button>
        </div>

      </div>

      {/* Save footer */}
      <div className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+84px)] z-40 px-5 py-3 bg-void/95 border-t border-scrim/10">
        <button className="w-full h-14 rounded-pill bg-scrim text-void inline-flex items-center justify-center border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] display text-figure disabled:opacity-35 disabled:active:scale-100" onClick={handleSave}
          disabled={blocks.length === 0}>
          Save session
        </button>
      </div>

    </Page>
  )
}
