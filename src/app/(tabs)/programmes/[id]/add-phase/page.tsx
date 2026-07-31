'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Minus, Plus } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import type { PhaseType } from '@/types'

const FONT = 'var(--font-geist-sans)'

const PHASE_TYPES: { value: PhaseType; label: string }[] = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'build',      label: 'Build'      },
  { value: 'peak',       label: 'Peak'       },
  { value: 'deload',     label: 'Deload'     },
  { value: 'recovery',   label: 'Recovery'   },
]

const labelStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '18px',
  color: '#111111',
}

export default function AddPhasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addPhase } = useProgrammeStore()

  const [name,      setName]      = useState('')
  const [phaseType, setPhaseType] = useState<PhaseType | null>(null)
  const [weeks,     setWeeks]     = useState(4)

  const canSubmit = name.trim().length > 0 && phaseType !== null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !phaseType) return
    addPhase(id, {
      name:         name.trim(),
      durationWeeks: weeks,
      phaseType,
      trainingFocus: null,
      colorHex:     '#3B948F',
    })
    router.back()
  }

  const stepperCircle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '200px',
    background: 'rgba(17,17,17,0.05)',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT, background: '#FFFEFA' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 16px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
          Add new phase
        </h1>
        <button
          onClick={() => router.back()}
          style={{ width: '32px', height: '32px', borderRadius: '200px', background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <X size={16} color="#3B948F" />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}
      >

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>Name</label>
          <input
            autoFocus
            placeholder="Phase name"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{
              height: '48px',
              padding: '0 12px',
              borderRadius: '6px',
              border: 'none',
              background: 'rgba(17,17,17,0.05)',
              fontFamily: FONT,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '24px',
              color: '#111111',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>Type</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 6px' }}>
            {PHASE_TYPES.map(pt => {
              const active = phaseType === pt.value
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setPhaseType(pt.value)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '40px',
                    border: active ? '1px solid #3B948F' : 'none',
                    background: active ? '#3B948F' : 'rgba(17,17,17,0.05)',
                    fontFamily: FONT,
                    fontSize: '12px',
                    fontWeight: 500,
                    lineHeight: '16px',
                    color: active ? '#FFFEFA' : '#111111',
                    cursor: 'pointer',
                  }}
                >
                  {pt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>Duration</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setWeeks(w => Math.max(1, w - 1))}
              style={stepperCircle}
            >
              <Minus size={16} color="#111111" />
            </button>
            <div style={{
              flex: 1,
              height: '48px',
              borderRadius: '6px',
              background: 'rgba(17,17,17,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '24px',
              color: '#111111',
            }}>
              {weeks} {weeks === 1 ? 'week' : 'weeks'}
            </div>
            <button
              type="button"
              onClick={() => setWeeks(w => Math.min(52, w + 1))}
              style={stepperCircle}
            >
              <Plus size={16} color="#111111" />
            </button>
          </div>
        </div>

        {/* Submit */}
        <div style={{ marginTop: '8px' }}>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '40px',
              border: canSubmit ? '1px solid #3B948F' : 'none',
              background: canSubmit ? '#3B948F' : 'rgba(17,17,17,0.1)',
              fontFamily: FONT,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '24px',
              color: canSubmit ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
              cursor: canSubmit ? 'pointer' : 'default',
            }}
          >
            Add phase
          </button>
        </div>

      </form>
    </div>
  )
}
