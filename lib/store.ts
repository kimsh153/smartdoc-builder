'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Document, Template, AIReviewResult, Field, CustomTemplate } from './types'
import { defaultTemplates } from './templates'
import { defaultQuotationTemplates } from './quotation/templates'
import { useQuotationStore } from './quotation/store'

interface DocumentStore {
  // 템플릿
  templates: Template[]
  userTemplates: Template[] // 사용자가 가져온 템플릿 (Persist됨)
  selectedTemplate: Template | null

  // 현재 문서 편집 상태
  currentDocument: Document | null
  values: Record<string, string>
  activeSection: string | null

  // 커스텀 에디터 상태 (Phase 1, 2)
  customTitle: string | null         // 명시적으로 수정한 제목
  customContent: string | null       // MD 편집 탭에서 수정된 documentContent
  customFields: Field[]              // 동적으로 추가된 커스텀 필드
  customContractOptions: Field[]     // 사용자가 추가한 계약 조건 옵션 (radio)

  // 변경 히스토리 (undo/redo)
  historyStack: string[]
  historyIndex: number

  // 저장된 커스텀 템플릿 (Phase 3)
  savedCustomTemplates: CustomTemplate[]

  // 사용자 API 키
  anthropicApiKey: string | null
  setAnthropicApiKey: (key: string | null) => void

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
  setCustomTitle: (title: string | null) => void
  setCustomContent: (content: string | null) => void
  undoContent: () => void
  redoContent: () => void
  addCustomField: (field: Field) => void
  updateCustomFields: (fields: Field[]) => void
  removeCustomField: (fieldId: string) => void

  // 계약 조건 옵션 관리
  addContractOption: (field: Field, clause1: string, clause2: string) => void
  removeContractOption: (fieldId: string) => void

  // 커스텀 템플릿 저장/불러오기
  saveCustomTemplate: (name: string, opts?: { scope?: CustomTemplate['scope']; versionTag?: string }) => void
  loadCustomTemplate: (id: string) => void
  deleteCustomTemplate: (id: string) => void
  toggleStarCustomTemplate: (id: string) => void

  // 문서 관리
  createDocument: (templateId: string) => void
  saveDocument: () => void
  loadDocument: (documentId: string) => void
  /** 견적서 에디터 → 내 문서 목록에 추가/갱신 */
  saveQuotationDocument: () => void
  /** 내 문서에서 견적서 열기 */
  loadQuotationDocument: (documentId: string) => void
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
      userTemplates: [],
      selectedTemplate: null,
      currentDocument: null,
      values: {},
      activeSection: null,
      customTitle: null,
      customContent: null,
      customFields: [],
      customContractOptions: [],
      historyStack: [],
      historyIndex: -1,
      savedCustomTemplates: [],
      anthropicApiKey: null,
      setAnthropicApiKey: (key) => set({ anthropicApiKey: key }),
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

      setCustomTitle: (title) => set({ customTitle: title }),

      setCustomContent: (content) => set((state) => {
        if (content === null) {
          return { customContent: null, historyStack: [], historyIndex: -1 }
        }
        // Truncate redo stack and push new content (avoid duplicate consecutive entry)
        const newStack = state.historyStack.slice(0, state.historyIndex + 1)
        if (newStack[newStack.length - 1] === content) {
          return { customContent: content }
        }
        newStack.push(content)
        return { customContent: content, historyStack: newStack, historyIndex: newStack.length - 1 }
      }),

      undoContent: () => {
        const { historyStack, historyIndex } = get()
        if (historyIndex <= 0) return
        const newIndex = historyIndex - 1
        set({ customContent: historyStack[newIndex], historyIndex: newIndex })
      },

      redoContent: () => {
        const { historyStack, historyIndex } = get()
        if (historyIndex >= historyStack.length - 1) return
        const newIndex = historyIndex + 1
        set({ customContent: historyStack[newIndex], historyIndex: newIndex })
      },

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

      addContractOption: (field, clause1, clause2) => set((state) => {
        const v1 = field.options?.[0]?.value ?? 'yes'
        const v2 = field.options?.[1]?.value ?? 'no'
        // clause2가 비어있으면 else 블록 자체를 생략
        const elseBlock = clause2.trim()
          ? `\n{{#elif ${field.id} == "${v2}"}}\n${clause2.trim()}`
          : ''
        const block = `\n\n{{#if ${field.id} == "${v1}"}}\n${clause1.trim()}${elseBlock}\n{{/if}}\n`
        const base = state.customContent ?? state.selectedTemplate?.documentContent ?? ''
        return {
          customContractOptions: [...state.customContractOptions, field],
          customContent: base + block,
        }
      }),

      removeContractOption: (fieldId) => set((state) => ({
        customContractOptions: state.customContractOptions.filter(f => f.id !== fieldId),
      })),

      saveCustomTemplate: (name, opts) => {
        const { selectedTemplate, customContent, customFields, savedCustomTemplates } = get()
        if (!selectedTemplate) return
        const tpl: CustomTemplate = {
          id: crypto.randomUUID(),
          name,
          baseTemplateId: selectedTemplate.id,
          createdAt: new Date().toISOString(),
          content: customContent ?? selectedTemplate.documentContent,
          fields: customFields,
          scope: opts?.scope ?? 'personal',
          starred: false,
          versionTag: opts?.versionTag,
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

      toggleStarCustomTemplate: (id) => set((state) => ({
        savedCustomTemplates: state.savedCustomTemplates.map(t =>
          t.id === id ? { ...t, starred: !t.starred } : t
        ),
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

        if (doc.quotationData) {
          get().loadQuotationDocument(documentId)
          return
        }

        const template = templates.find(t => t.id === doc.templateId)
        set({
          currentDocument: doc,
          selectedTemplate: template || null,
          values: doc.values,
          activeSection: template?.sections[0]?.id || null,
          reviewResult: null,
        })
      },

      saveQuotationDocument: () => {
        const { data, editingDocumentId, activeTemplateId } = useQuotationStore.getState()
        const tpl =
          defaultQuotationTemplates.find(t => t.id === activeTemplateId) ?? defaultQuotationTemplates[0]
        const name = data.clientName?.trim()
          ? `${data.clientName.trim()} 견적서`
          : `${tpl.name} · ${new Date().toLocaleDateString('ko-KR')}`
        const now = new Date().toISOString()
        const { documents } = get()
        const existing = editingDocumentId ? documents.find(d => d.id === editingDocumentId) : undefined
        const doc: Document = {
          id: editingDocumentId ?? crypto.randomUUID(),
          templateId: tpl.id,
          templateName: name,
          values: {},
          quotationData: JSON.parse(JSON.stringify(data)),
          status: existing?.status ?? 'draft',
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }
        const idx = documents.findIndex(d => d.id === doc.id)
        const updatedDocs =
          idx >= 0 ? documents.map((d, i) => (i === idx ? doc : d)) : [...documents, doc]
        set({ documents: updatedDocs })
        useQuotationStore.setState({ editingDocumentId: doc.id, activeTemplateId: doc.templateId })
      },

      loadQuotationDocument: (documentId) => {
        const doc = get().documents.find(d => d.id === documentId)
        if (!doc?.quotationData) return
        useQuotationStore.getState().loadFromSavedDocument(doc)
        set({
          currentDocument: doc,
          selectedTemplate: null,
          values: {},
          activeSection: null,
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

      addTemplate: (template) => set((state) => {
        const existingIndex = state.userTemplates.findIndex(t => t.id === template.id)
        let newUserTemplates = [...state.userTemplates]
        
        if (existingIndex >= 0) {
          newUserTemplates[existingIndex] = template
        } else {
          newUserTemplates = [...newUserTemplates, template]
        }
        
        return {
          userTemplates: newUserTemplates,
          templates: [...defaultTemplates, ...newUserTemplates]
        }
      }),

      reset: () => set({
        selectedTemplate: null,
        currentDocument: null,
        values: {},
        activeSection: null,
        customContent: null,
        customFields: [],
        customContractOptions: [],
        historyStack: [],
        historyIndex: -1,
        reviewResult: null,
      }),
    }),
    {
      name: 'document-store',
      partialize: (state) => {
        const { templates, ...rest } = state
        return rest
      },
      // @ts-ignore
      onRehydrateStorage: (state) => {
        return (rehydratedState) => {
          if (rehydratedState) {
            // 공식 템플릿(defaultTemplates)과 사용자 템플릿(userTemplates)을 병합
            const userAdded = rehydratedState.userTemplates || []
            rehydratedState.templates = [...defaultTemplates, ...userAdded]
          }
        }
      },
    }
  )
)
