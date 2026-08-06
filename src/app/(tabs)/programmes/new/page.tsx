'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { Page } from '@/components/feed'
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

  const canSubmit = name.trim().length> 0

  return (
    <Page>

      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 pt-[calc(env(safe-area-inset-top,0px)+20px)] pb-5 flex-shrink-0">
        <h1 className="display text-title m-0 flex-1 min-w-0">Add new programme</h1>
        <button onClick={() => router.back()} aria-label="Close" className="w-10 h-10 rounded-pill matt flex items-center justify-center text-scrim flex-shrink-0 cursor-pointer">
          <X size={16} />
        </button>
      </div>

      <div />

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto px-5 pb-32 flex flex-col gap-5">

        {/* Name */}
        <div className="flex flex-col gap-2">
          <label className="meta">Name</label>
          <Input autoFocus placeholder="Ultimate Hybrid Build" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <label className="meta">Description</label>
          <textarea className="min-h-24 px-4 py-3 rounded-card matt text-scrim text-body w-full outline-none focus:border-scrim/45 placeholder:text-fog resize-none" placeholder="Add description here..."
            value={description}
            onChange={e => setDescription(e.target.value)} />
        </div>

        {/* CTA */}
        <button type="submit" className="mt-2 w-full h-14 rounded-pill inline-flex items-center justify-center border-0 cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97] display text-figure disabled:opacity-35 disabled:active:scale-100 bg-scrim text-void"
          disabled={!canSubmit}>
          Add new programme
        </button>

      </form>
    </Page>
  )
}
