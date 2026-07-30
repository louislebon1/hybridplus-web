'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'

const FONT = 'var(--font-geist-sans)'

const inputStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid rgba(17,17,17,0.1)',
  background: 'rgba(17,17,17,0.03)',
  fontFamily: FONT,
  fontSize: '16px',
  fontWeight: 500,
  lineHeight: '24px',
  color: '#111111',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  fontFamily: FONT,
  fontSize: '14px',
  fontWeight: 500,
  lineHeight: '18px',
  color: '#111111',
}

export default function NewProgrammePage() {
  const router = useRouter()
  const { createProgramme } = useProgrammeStore()

  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    createProgramme({ name: name.trim(), description: description.trim() })
    router.push('/programmes')
  }

  const canSubmit = name.trim().length > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: FONT }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '28px 16px 0', flexShrink: 0 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', borderRadius: '8px' }}
        >
          <ArrowLeft size={20} color="#111111" />
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: 500, lineHeight: '30px', color: '#111111', margin: 0 }}>
          New Programme
        </h1>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>Programme name</label>
          <input
            autoFocus
            placeholder="e.g. Strength Block A"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={labelStyle}>
            Description{' '}
            <span style={{ color: 'rgba(17,17,17,0.4)' }}>(optional)</span>
          </label>
          <textarea
            placeholder="What is this programme for?"
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
          <button
            type="submit"
            disabled={!canSubmit}
            style={{
              width: '100%',
              height: '48px',
              borderRadius: '40px',
              border: 'none',
              background: canSubmit ? '#3B948F' : 'rgba(17,17,17,0.1)',
              cursor: canSubmit ? 'pointer' : 'default',
              fontFamily: FONT,
              fontSize: '16px',
              fontWeight: 500,
              lineHeight: '24px',
              color: canSubmit ? '#FFFEFA' : 'rgba(17,17,17,0.4)',
            }}
          >
            Create Programme
          </button>
        </div>
      </form>

    </div>
  )
}
