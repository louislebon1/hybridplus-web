'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { Input } from '@/components/ui'

export default function NewProgrammePage() {
  const router = useRouter()
  const { createProgramme } = useProgrammeStore()

  const [name,        setName]        = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createProgramme({ name: name.trim(), description: description.trim() })
    router.push('/programmes')
  }

  const canSubmit = name.trim().length > 0

  return (
    <div className="flex flex-col h-full bg-bg">

      {/* Header */}
      <div className="flex items-center justify-between px-5 screen-top flex-shrink-0">
        <h1 className="text-h2 font-bold leading-[30px] text-text m-0">Add new programme</h1>
        <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-text/5 flex items-center justify-center flex-shrink-0">
          <X size={16} className="text-accent" />
        </button>
      </div>

      <div className="h-px bg-border mt-5 flex-shrink-0" />

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-6 flex flex-col gap-4">

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="text-label font-medium leading-[18px] text-text">Name</label>
          <Input autoFocus placeholder="Ultimate Hybrid Build" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="text-label font-medium leading-[18px] text-text">Description</label>
          <textarea
            placeholder="Add description here..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="h-24 px-3 py-3 rounded-md bg-text/5 text-text text-body outline-none w-full resize-none"
          />
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`mt-2 w-full h-12 rounded-full text-body font-medium ${canSubmit ? 'border border-accent bg-accent text-accent-fg' : 'bg-text/10 text-text/40'}`}
        >
          Add new programme
        </button>

      </form>
    </div>
  )
}
