import { create } from 'zustand'

export interface WizardSet {
  id: string
  weight: string
  reps: string
  rpe: string
}

export interface WizardBlock {
  id: string
  exerciseId: string
  exerciseName: string
  muscles: string[]
  orderIndex: number
  sets: WizardSet[]
}

interface SessionWizardStore {
  sessionType: 'strength' | 'cardio'
  blocks: WizardBlock[]
  setSessionType: (type: 'strength' | 'cardio') => void
  addExercise: (ex: { id: string; name: string; muscles: string[] }) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, dir: 'up' | 'down') => void
  addSet: (blockId: string) => void
  removeSet: (blockId: string, setId: string) => void
  updateSet: (blockId: string, setId: string, field: 'weight' | 'reps' | 'rpe', value: string) => void
  reset: () => void
}

export const useSessionWizard = create<SessionWizardStore>((set, get) => ({
  sessionType: 'strength',
  blocks: [],

  setSessionType: (sessionType) => set({ sessionType }),

  addExercise: (ex) => {
    const blocks = get().blocks
    if (blocks.some(b => b.exerciseId === ex.id)) return
    set({
      blocks: [...blocks, {
        id: crypto.randomUUID(),
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscles: ex.muscles,
        orderIndex: blocks.length,
        sets: [{ id: crypto.randomUUID(), weight: '', reps: '', rpe: '' }],
      }],
    })
  },

  removeBlock: (id) => set(s => ({
    blocks: s.blocks.filter(b => b.id !== id).map((b, i) => ({ ...b, orderIndex: i })),
  })),

  moveBlock: (id, dir) => set(s => {
    const idx = s.blocks.findIndex(b => b.id === id)
    if ((dir === 'up' && idx === 0) || (dir === 'down' && idx === s.blocks.length - 1)) return s
    const next = [...s.blocks]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    return { blocks: next.map((b, i) => ({ ...b, orderIndex: i })) }
  }),

  addSet: (blockId) => set(s => ({
    blocks: s.blocks.map(b => b.id !== blockId ? b : {
      ...b,
      sets: [...b.sets, { id: crypto.randomUUID(), weight: '', reps: '', rpe: '' }],
    }),
  })),

  removeSet: (blockId, setId) => set(s => ({
    blocks: s.blocks.map(b => b.id !== blockId ? b : {
      ...b,
      sets: b.sets.filter(ws => ws.id !== setId),
    }),
  })),

  updateSet: (blockId, setId, field, value) => set(s => ({
    blocks: s.blocks.map(b => b.id !== blockId ? b : {
      ...b,
      sets: b.sets.map(ws => ws.id !== setId ? ws : { ...ws, [field]: value }),
    }),
  })),

  reset: () => set({ sessionType: 'strength', blocks: [] }),
}))
