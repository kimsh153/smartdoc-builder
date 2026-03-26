'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Document, Template, AIReviewResult } from './types'
import { defaultTemplates } from './templates'

interface DocumentStore {
  // 템플릿
  templates: Template[]
  selectedTemplate: Template | null
  
  // 현재 문서 편집 상태
  currentDocument: Document | null
  values: Record<string, string>
  activeSection: string | null
  
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
        reviewResult: null,
      }),
    }),
    {
      name: 'document-store',
    }
  )
)
