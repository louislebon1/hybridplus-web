'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Minus, Plus } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { Input } from '@/components/ui'
import type { PhaseType } from '@/types'

const PHASE_TYPES: { value: PhaseType; label: string }[] = [
  { value: 'foundation', label: 'Foundation' },
  { value: 'build',      label: 'Build'      },
  { value: 'peak',       label: 'Peak'       },
  { value: 'deload',     label: 'Deload'     },
  { value: 'recovery',   label: 'Recovery'   },
]

export default function AddPhasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { addPhase } = useProgrammeStore()

  const [name,      setName]      = useState('')
  const [phaseType, setPhaseType] = useState<PhaseType | null>(null)
  const [weeks,     setWeeks]     = useState(4)

  const canSubmit = name.trim().length> 0 && phaseType !== null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit || !phaseType) return
    addPhase(id, {
      name:         name.trim(),
      durationWeeks: weeks,
      phaseType,
      trainingFocus: null,
      colorHex:     '#00ABFE',
    })
    router.back()
  }

  return (
    <div>

      {/* Header */}
      <div>
        <h1>Add new phase</h1>
        <button onClick={() => router.back()}>
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>

        {/* Name */}
        <div>
          <label>Name</label>
          <Input autoFocus placeholder="Phase name" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Type */}
        <div>
          <label>Type</label>
          <div>
            {PHASE_TYPES.map(pt => {
              const active = phaseType === pt.value
              return (
                <button key={pt.value}
                  type="button"
                  onClick={() => setPhaseType(pt.value)}>
                  {pt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration */}
        <div>
          <label>Duration</label>
          <div>
            <button type="button" onClick={() => setWeeks(w => Math.max(1, w - 1))}>
              <Minus size={16} />
            </button>
            <div>
              {weeks} {weeks === 1 ? 'week' : 'weeks'}
            </div>
            <button type="button" onClick={() => setWeeks(w => Math.min(52, w + 1))}>
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button type="submit"
          disabled={!canSubmit}>
          Add phase
        </button>

      </form>
    </div>
  )
}
