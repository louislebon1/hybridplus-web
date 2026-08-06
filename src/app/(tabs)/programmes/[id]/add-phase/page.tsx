'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Minus, Plus } from 'lucide-react'
import { Page } from '@/components/feed'
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
    <Page>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-5 flex-shrink-0">
        <h1 className="display text-title m-0 flex-1 min-w-0">Add new phase</h1>
        <button onClick={() => router.back()} aria-label="Close" className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-5 pb-32 flex flex-col gap-5">

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="meta">Name</label>
          <Input autoFocus placeholder="Phase name" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Type */}
        <div className="flex flex-col gap-2">
          <label className="meta">Type</label>
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
        <div className="flex flex-col gap-2">
          <label className="meta">Duration</label>
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
        <button type="submit" className="mt-2 w-full h-14 rounded-pill inline-flex items-center justify-center border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] display text-figure disabled:opacity-35 disabled:active:scale-100 bg-scrim text-void"
          disabled={!canSubmit}>
          Add phase
        </button>

      </form>
    </Page>
  )
}
