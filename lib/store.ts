'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Document, Template, AIReviewResult, Field, CustomTemplate } from './types'
import { defaultTemplates } from './templates'

interface DocumentStore {
  // 템플릿
  templates: Template[]
  selectedTemplate: Template | null

  // 현재 문서 편집 상태
  currentDocument: Document | null
  values: Record<string, string>
  activeSection: string | null

  // 커스텀 에디터 상태 (Phase 1, 2)
  customContent: string | null       // MD 편집 탭에서 수정된 documentContent
  customFields: Field[]              // 동적으로 추가된 커스텀 필드

  // 저장된 커스텀 템플릿 (Phase 3)
  savedCustomTemplates: CustomTemplate[]

  // AI 검토
  reviewResult: AIReviewResult | null
  isReviewing: boolean

  // 저장된 문서
  documents: Document[]

  // 액션
  setSelectedTemplate: (template: Template | null) => void
  setValue: (fieldId: string, value: string) => void
  setActiveSection: (sectionId: string | null) => void
  setReviewResult: (result: AIReviewResult | null) => void
  setIsReviewing: (isReviewing: boolean) => void

  // 커스텀 콘텐츠/필드 액션
  setCustomContent: (content: string | null) => void
  addCustomField: (field: Field) => void
  updateCustomFields: (fields: Field[]) => void
  removeCustomField: (fieldId: string) => void

  // 커스텀 템플릿 저장/불러오기
  saveCustomTemplate: (name: string) => void
  loadCustomTemplate: (id: string) => void
  deleteCustomTemplate: (id: string) => void

  // 문서 관리
  createDocument: (templateId: string) => void
  saveDocument: () => void
  loadDocument: (documentId: string) => void
  updateDocumentStatus: (status: Document['status']) => void
  deleteDocument: (documentId: string) => void

  // 템플릿 관리
  addTemplate: (template: Template) => void

  // 초기화
  reset: () => void
}

export const useDocumentStore = create<DocumentStore>()(
  persist(
    (set, get) => ({
      templates: defaultTemplates,
      selectedTemplate: null,
      currentDocument: null,
      values: {},
      activeSection: null,
      customContent: null,
      customFields: [],
      savedCustomTemplates: [],
      reviewResult: null,
      isReviewing: false,
      documents: [],

      setSelectedTemplate: (template) => set({ selectedTemplate: template }),

      setValue: (fieldId, value) => set((state) => ({
        values: { ...state.values, [fieldId]: value }
      })),

      setActiveSection: (sectionId) => set({ activeSection: sectionId }),

      setReviewResult: (result) => set({ reviewResult: result }),

      setIsReviewing: (isReviewing) => set({ isReviewing }),

      setCustomContent: (content) => set({ customContent: content }),

      addCustomField: (field) => set((state) => ({
        customFields: [...state.customFields, field],
        customContent: (() => {
          const base = state.customContent ?? state.selectedTemplate?.documentContent ?? ''
          return base + `\n{{${field.id}}}`
        })(),
      })),

      updateCustomFields: (fields) => set({ customFields: fields }),

      removeCustomField: (fieldId) => set((state) => ({
        customFields: state.customFields.filter(f => f.id !== fieldId),
        customContent: (state.customContent ?? state.selectedTemplate?.documentContent ?? '')
          .replace(new RegExp(`\\{\\{${fieldId}\\}\\}`, 'g'), ''),
      })),

      saveCustomTemplate: (name) => {
        const { selectedTemplate, customContent, customFields, savedCustomTemplates } = get()
        if (!selectedTemplate) return
        const tpl: CustomTemplate = {
          id: crypto.randomUUID(),
          name,
          baseTemplateId: selectedTemplate.id,
          createdAt: new Date().toISOString(),
          content: customContent ?? selectedTemplate.documentContent,
          fields: customFields,
        }
        set({ savedCustomTemplates: [...savedCustomTemplates, tpl] })
      },

      loadCustomTemplate: (id) => {
        const { savedCustomTemplates } = get()
        const tpl = savedCustomTemplates.find(t => t.id === id)
        if (!tpl) return
        set({ customContent: tpl.content, customFields: tpl.fields })
      },

      deleteCustomTemplate: (id) => set((state) => ({
        savedCustomTemplates: state.savedCustomTemplates.filter(t => t.id !== id),
      })),

      createDocument: (templateId) => {
        const template = get().templates.find(t => t.id === templateId)
        if (!template) return
        
        const newDoc: Document = {
          id: crypto.randomUUID(),
          templateId,
          templateName: template.name,
          values: {},
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        set({
          currentDocument: newDoc,
          selectedTemplate: template,
          values: {},
          activeSection: template.sections[0]?.id || null,
          reviewResult: null,
        })
      },

      saveDocument: () => {
        const { currentDocument, values, documents } = get()
        if (!currentDocument) return
        
        const updatedDoc = {
          ...currentDocument,
          values,
          updatedAt: new Date().toISOString(),
        }
        
        const existingIndex = documents.findIndex(d => d.id === currentDocument.id)
        const updatedDocs = existingIndex >= 0
          ? documents.map((d, i) => i === existingIndex ? updatedDoc : d)
          : [...documents, updatedDoc]
        
        set({ currentDocument: updatedDoc, documents: updatedDocs })
      },

      loadDocument: (documentId) => {
        const { documents, templates } = get()
        const doc = documents.find(d => d.id === documentId)
        if (!doc) return
        
        const template = templates.find(t => t.id === doc.templateId)
        set({
          currentDocument: doc,
          selectedTemplate: template || null,
          values: doc.values,
          activeSection: template?.sections[0]?.id || null,
          reviewResult: null,
        })
      },

      updateDocumentStatus: (status) => set((state) => ({
        currentDocument: state.currentDocument 
          ? { ...state.currentDocument, status }
          : null
      })),

      deleteDocument: (documentId) => set((state) => ({
        documents: state.documents.filter(d => d.id !== documentId)
      })),

      addTemplate: (template) => set((state) => ({
        templates: [...state.templates, template]
      })),

      reset: () => set({
        selectedTemplate: null,
        currentDocument: null,
        values: {},
        activeSection: null,
        customContent: null,
        customFields: [],
        reviewResult: null,
      }),
    }),
    {
      name: 'document-store',
    }
  )
)
