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

  const canSubmit = name.trim().length > 0 && phaseType !== null

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
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-5 screen-top flex-shrink-0">
        <h1 className="text-h2 font-bold leading-[30px] text-text m-0">Add new phase</h1>
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-bg-element flex items-center justify-center">
          <X size={16} className="text-text" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-label font-medium leading-[18px] text-text">Name</label>
          <Input autoFocus placeholder="Phase name" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-2">
          <label className="text-label font-medium leading-[18px] text-text">Type</label>
          <div className="flex flex-wrap gap-1.5">
            {PHASE_TYPES.map(pt => {
              const active = phaseType === pt.value
              return (
                <button
                  key={pt.value}
                  type="button"
                  onClick={() => setPhaseType(pt.value)}
                  className={`px-3 py-1.5 rounded-full text-caption font-medium ${active ? 'bg-fill-strong text-fill-strong-fg border border-border-strong' : 'bg-bg-element text-text border border-transparent'}`}
                >
                  {pt.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration */}
        <div className="flex flex-col gap-2">
          <label className="text-label font-medium leading-[18px] text-text">Duration</label>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setWeeks(w => Math.max(1, w - 1))} className="w-9 h-9 rounded-full bg-bg-element flex items-center justify-center flex-shrink-0">
              <Minus size={16} className="text-text" />
            </button>
            <div className="flex-1 h-12 rounded-inner bg-bg-element flex items-center justify-center text-body font-medium text-text">
              {weeks} {weeks === 1 ? 'week' : 'weeks'}
            </div>
            <button type="button" onClick={() => setWeeks(w => Math.min(52, w + 1))} className="w-9 h-9 rounded-full bg-bg-element flex items-center justify-center flex-shrink-0">
              <Plus size={16} className="text-text" />
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`mt-2 w-full h-12 rounded-full text-body font-medium ${canSubmit ? 'border border-border-strong bg-fill-strong text-fill-strong-fg' : 'bg-text/10 text-text/40'}`}
        >
          Add phase
        </button>

      </form>
    </div>
  )
}
