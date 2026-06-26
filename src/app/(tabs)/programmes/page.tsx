'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Plus } from 'lucide-react'
import { useProgrammeStore } from '@/stores/programme-store'
import { Button, Input, EmptyState } from '@/components/ui'

export default function ProgrammesPage() {
  const router = useRouter()
  const { programmes, createProgramme, setActiveProgramme, deleteProgramme, updateProgramme } = useProgrammeStore()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    createProgramme({ name: newName.trim(), description: newDesc.trim() })
    setNewName(''); setNewDesc(''); setShowCreate(false)
  }

  function handleDelete(id: string) {
    setMenuOpen(null)
    if (window.confirm('Delete this programme? This cannot be undone.')) {
      deleteProgramme(id)
    }
  }

  function startEdit(id: string, name: string) {
    setMenuOpen(null); setEditingId(id); setEditName(name)
  }

  function saveEdit(id: string) {
    if (editName.trim()) updateProgramme(id, { name: editName.trim() })
    setEditingId(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0">
        <h1 className="text-2xl font-normal text-text">Programmes</h1>
        <Button size="sm" onClick={() => setShowCreate((v) => !v)}>
          <Plus size={16} />
          NEW
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 flex flex-col gap-3">
        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate} className="bg-bg-element border border-border rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm font-normal text-text">New programme</p>
            <Input
              placeholder="Programme name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
            />
            <Input
              placeholder="Description (optional)"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="flex gap-2">
              <Button type="submit" size="sm" className="flex-1" disabled={!newName.trim()}>CREATE</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {programmes.length === 0 && !showCreate ? (
          <EmptyState
            icon="📋"
            title="No programmes yet"
            description="Create your first training programme to get started"
            action={{ label: 'Create Programme', onClick: () => setShowCreate(true) }}
          />
        ) : (
          programmes.map((p) => (
            <div
              key={p.id}
              className="bg-bg-element border border-border rounded-2xl p-4 relative"
              onClick={() => { if (menuOpen !== p.id) router.push(`/programmes/${p.id}`) }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {p.isActive && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-normal bg-accent/15 text-accent">ACTIVE</span>
                    )}
                    {editingId === p.id ? (
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => saveEdit(p.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(p.id) }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-base font-normal text-text bg-bg border border-accent rounded-lg px-2 py-0.5 w-full focus:outline-none"
                      />
                    ) : (
                      <p className="text-base font-normal text-text truncate">{p.name}</p>
                    )}
                  </div>
                  {p.description && (
                    <p className="text-sm text-text-secondary mt-0.5 truncate">{p.description}</p>
                  )}
                  <p className="text-xs text-text-tertiary mt-2">
                    {p.phases.length} phase{p.phases.length !== 1 ? 's' : ''} · {p.templates.length} workout{p.templates.length !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* 3-dot menu */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-bg-hover text-text-secondary"
                    onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {menuOpen === p.id && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                      <div className="absolute right-0 top-9 z-20 bg-bg border border-border rounded-xl shadow-lg py-1 min-w-[160px]">
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-bg-hover"
                          onClick={() => { setActiveProgramme(p.id); setMenuOpen(null) }}
                        >
                          Set active
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-text hover:bg-bg-hover"
                          onClick={() => startEdit(p.id, p.name)}
                        >
                          Edit name
                        </button>
                        <button
                          className="w-full text-left px-4 py-2.5 text-sm text-error hover:bg-bg-hover"
                          onClick={() => handleDelete(p.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
