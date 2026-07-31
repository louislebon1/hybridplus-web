'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'

const FONT = 'var(--font-geist-sans)'

const labelStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '18px',
  color: '#111111',
}

const fieldStyle: React.CSSProperties = {
  padding: '8px 12px',
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
}

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT, background: '#FFFEFA' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 16px 0', flexShrink: 0 }}>
        <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
          Add new programme
        </h1>
        <button
          onClick={() => router.back()}
          style={{ width: '32px', height: '32px', borderRadius: '200px', background: 'rgba(17,17,17,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
        >
          <X size={16} color="#3B948F" />
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: '1px', background: 'rgba(17,17,17,0.05)', margin: '20px 0 0', flexShrink: 0 }} />

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ flex: 1, overflowY: 'auto', padding: '24px 16px 100px', display: 'flex', flexDirection: 'column', gap: '24px' }}
      >

        {/* Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>Name</label>
          <input
            autoFocus
            placeholder="Ultimate Hybrid Build"
            value={name}
            onChange={e => setName(e.target.value)}
            style={{ ...fieldStyle, height: '48px' }}
          />
        </div>

        {/* Description */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>Description</label>
          <textarea
            placeholder="Add description here..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{ ...fieldStyle, height: '96px', resize: 'none', paddingTop: '12px' }}
          />
        </div>

        {/* CTA */}
        <button
          type="submit"
          disabled={!canSubmit}
          style={{
            width: '100%',
            height: '48px',
            borderRadius: '40px',
            border: canSubmit ? '1px solid #3B948F' : 'none',
            background: canSubmit ? '#3B948F' : 'rgba(17,17,17,0.1)',
            cursor: canSubmit ? 'pointer' : 'default',
            fontFamily: FONT,
            fontSize: '16px',
            fontWeight: 500,
            lineHeight: '24px',
            color: canSubmit ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
          }}
        >
          Add new programme
        </button>

      </form>
    </div>
  )
}
