'use client'

import { useRouter } from 'next/navigation'
import { X, ChevronUp, ChevronDown, Minus } from 'lucide-react'
import { useSessionWizard } from '@/stores/session-wizard-store'
import { useTemplateStore } from '@/stores/template-store'
import type { ExerciseTemplateBlock } from '@/types'

const FONT = 'var(--font-geist-sans)'

const cellStyle: React.CSSProperties = {
  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '6px 12px', background: 'rgba(17,17,17,0.05)', borderRadius: '4px',
}

const unitLabel: React.CSSProperties = {
  fontFamily: FONT, fontSize: '11px', fontWeight: 500, lineHeight: '14px',
  textTransform: 'uppercase', letterSpacing: '0.02em', color: 'rgba(17,17,17,0.4)', flexShrink: 0,
}

const numInput: React.CSSProperties = {
  width: 0, flex: 1, border: 'none', background: 'transparent', outline: 'none',
  fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px', color: '#111111',
}

export default function NewSessionConfigurePage() {
  const router = useRouter()
  const { blocks, removeBlock, moveBlock, addSet, removeSet, updateSet, reset } = useSessionWizard()
  const { addStrengthTemplate } = useTemplateStore()

  function handleClose() {
    reset()
    router.push('/sessions')
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

    addStrengthTemplate({
      name: blocks[0].exerciseName + ' Session',
      notes: null,
    })

    // Attach exercise blocks to the just-created template
    const { strengthTemplates, updateStrengthTemplate } = useTemplateStore.getState()
    const newTemplate = strengthTemplates[strengthTemplates.length - 1]
    if (newTemplate) {
      updateStrengthTemplate(newTemplate.id, { exerciseBlocks })
    }

    reset()
    router.push('/sessions')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT, background: '#FFFEFA' }}>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '28px 16px 24px', borderBottom: '1px solid rgba(17,17,17,0.05)', flexShrink: 0,
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
          Edit session
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={handleClose}
            style={{ width: '32px', height: '32px', borderRadius: '200px', background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color="#3B948F" />
          </button>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '88px' }}>

        {blocks.map((block, blockIdx) => (
          <div
            key={block.id}
            style={{
              padding: '24px 16px', borderBottom: '1px solid rgba(17,17,17,0.05)',
              display: 'flex', flexDirection: 'column', gap: '16px',
            }}
          >
            {/* Exercise header */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '18px', fontWeight: 500, lineHeight: '24px', color: '#111111' }}>
                  {block.exerciseName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {/* Up */}
                  <button
                    onClick={() => moveBlock(block.id, 'up')}
                    style={{
                      width: '32px', height: '32px', borderRadius: '200px',
                      background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: blockIdx === 0 ? 0.4 : 1,
                    }}
                  >
                    <ChevronUp size={16} color="#111111" />
                  </button>
                  {/* Down */}
                  <button
                    onClick={() => moveBlock(block.id, 'down')}
                    style={{
                      width: '32px', height: '32px', borderRadius: '200px',
                      background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      opacity: blockIdx === blocks.length - 1 ? 0.4 : 1,
                    }}
                  >
                    <ChevronDown size={16} color="#111111" />
                  </button>
                </div>
              </div>

              {/* Muscle tags */}
              {block.muscles.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {block.muscles.map(m => (
                    <div
                      key={m}
                      style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(17,17,17,0.05)' }}
                    >
                      <span style={{ fontFamily: FONT, fontSize: '11px', fontWeight: 500, lineHeight: '14px', textTransform: 'uppercase', letterSpacing: '0.02em', color: '#3B948F' }}>
                        {m}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sets */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {block.sets.map((ws, setIdx) => (
                <div key={ws.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Set number */}
                  <span style={{
                    width: '32px', textAlign: 'center', flexShrink: 0,
                    fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px', color: '#3B948F',
                  }}>
                    {String(setIdx + 1).padStart(2, '0')}
                  </span>

                  {/* Weight */}
                  <div style={cellStyle}>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      placeholder="0"
                      value={ws.weight}
                      onChange={e => updateSet(block.id, ws.id, 'weight', e.target.value)}
                      style={numInput}
                    />
                    <span style={unitLabel}>KG</span>
                  </div>

                  {/* Reps */}
                  <div style={cellStyle}>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={ws.reps}
                      onChange={e => updateSet(block.id, ws.id, 'reps', e.target.value)}
                      style={numInput}
                    />
                    <span style={unitLabel}>reps</span>
                  </div>

                  {/* RPE */}
                  <div style={cellStyle}>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      step="0.5"
                      placeholder="0"
                      value={ws.rpe}
                      onChange={e => updateSet(block.id, ws.id, 'rpe', e.target.value)}
                      style={numInput}
                    />
                    <span style={unitLabel}>RPE</span>
                  </div>

                  {/* Remove set */}
                  {block.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(block.id, ws.id)}
                      style={{ width: '24px', height: '24px', borderRadius: '200px', background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                    >
                      <Minus size={12} color="rgba(17,17,17,0.4)" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add set + Delete exercise */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={() => addSet(block.id)}
                style={{
                  flex: 1, height: '40px', borderRadius: '40px',
                  background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer',
                  fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px', color: '#3B948F',
                }}
              >
                Add set to exercise
              </button>
              <button
                onClick={() => removeBlock(block.id)}
                style={{
                  width: '40px', height: '40px', borderRadius: '200px',
                  background: '#D24F4F', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <X size={16} color="#FFFEFA" />
              </button>
            </div>
          </div>
        ))}

        {/* Add more exercises */}
        <div style={{ padding: '24px 16px', borderBottom: '1px solid rgba(17,17,17,0.05)' }}>
          <button
            onClick={() => router.push('/sessions/new/exercises')}
            style={{
              width: '100%', height: '48px', borderRadius: '40px',
              border: '1px solid #3B948F', background: '#3B948F',
              cursor: 'pointer', fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px',
              color: '#FFFEFA',
            }}
          >
            Add exercises to workout
          </button>
        </div>

      </div>

      {/* Save footer */}
      <div style={{
        position: 'fixed', bottom: 80, left: 0, right: 0,
        padding: '16px', background: '#FFFEFA', borderTop: '1px solid rgba(17,17,17,0.05)',
      }}>
        <button
          onClick={handleSave}
          disabled={blocks.length === 0}
          style={{
            width: '100%', height: '48px', borderRadius: '40px',
            border: blocks.length > 0 ? '1px solid #3B948F' : 'none',
            background: blocks.length > 0 ? '#3B948F' : 'rgba(17,17,17,0.1)',
            cursor: blocks.length > 0 ? 'pointer' : 'default',
            fontFamily: FONT, fontSize: '16px', fontWeight: 500, lineHeight: '24px',
            color: blocks.length > 0 ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
          }}
        >
          Save session
        </button>
      </div>

    </div>
  )
}
