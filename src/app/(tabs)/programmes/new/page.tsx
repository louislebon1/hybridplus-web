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

  const canSubmit = name.trim().length> 0

  return (
    <div>

      {/* Header */}
      <div>
        <h1>Add new programme</h1>
        <button onClick={() => router.back()}>
          <X size={16} />
        </button>
      </div>

      <div />

      {/* Form */}
      <form onSubmit={handleSubmit}>

        {/* Name */}
        <div>
          <label>Name</label>
          <Input autoFocus placeholder="Ultimate Hybrid Build" value={name} onChange={e => setName(e.target.value)} />
        </div>

        {/* Description */}
        <div>
          <label>Description</label>
          <textarea placeholder="Add description here..."
            value={description}
            onChange={e => setDescription(e.target.value)} />
        </div>

        {/* CTA */}
        <button type="submit"
          disabled={!canSubmit}>
          Add new programme
        </button>

      </form>
    </div>
  )
}
