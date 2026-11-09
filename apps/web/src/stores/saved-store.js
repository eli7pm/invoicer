import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const SAVED_KINDS = ['billTo', 'bankDetails']
const MAX_SAVED = 20

export const useSavedStore = create()(
  persist(
    (set) => ({
      billTo: [],
      bankDetails: [],
      save: (kind, text) => {
        const value = text.trim()
        if (!SAVED_KINDS.includes(kind) || !value) return
        set((s) => ({ [kind]: [value, ...s[kind].filter((v) => v !== value)].slice(0, MAX_SAVED) }))
      },
      remove: (kind, text) => set((s) => ({ [kind]: s[kind].filter((v) => v !== text.trim()) })),
    }),
    { name: 'invoicer-saved', version: 1 },
  ),
)
