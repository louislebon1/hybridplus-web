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
    <div>

      {/* Header */}
      <div>
        <h1>Edit session</h1>
        <button onClick={handleClose}>
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div>

        {blocks.map((block, blockIdx) => (
          <div key={block.id}>

            {/* Exercise header */}
            <div>
              <div>
                <span>{block.exerciseName}</span>
                <div>
                  <button onClick={() => moveBlock(block.id, 'up')}>
                    <ChevronUp size={16} />
                  </button>
                  <button onClick={() => moveBlock(block.id, 'down')}>
                    <ChevronDown size={16} />
                  </button>
                </div>
              </div>

              {/* Muscle tags */}
              {block.muscles.length> 0 && (
                <div>
                  {block.muscles.map(m => (
                    <div key={m}>
                      <span>{m}</span>
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
      <div>
        <button onClick={handleSave}
          disabled={blocks.length === 0}>
          Save session
        </button>
      </div>

    </div>
  )
}
