import { create } from 'zustand'
import type { TemplateSchema } from '@/types/document'

interface TemplateState {
  schema: TemplateSchema | null
  values: Record<string, string>
  isLoading: boolean
  error: string | null

  setSchema: (schema: TemplateSchema) => void
  setValue: (fieldId: string, value: string) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  reset: () => void
}

export const useTemplateStore = create<TemplateState>((set) => ({
  schema: null,
  values: {},
  isLoading: false,
  error: null,

  setSchema: (schema) => set({ schema, values: {}, error: null }),
  setValue: (fieldId, value) =>
    set((state) => ({ values: { ...state.values, [fieldId]: value } })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ schema: null, values: {}, error: null }),
}))
