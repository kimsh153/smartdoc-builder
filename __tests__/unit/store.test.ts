/**
 * Unit tests for Zustand document store.
 * The store uses `persist` middleware (localStorage), so we test the logic
 * by importing and exercising the store actions directly.
 */

// Mock localStorage for the persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// crypto.randomUUID is available in Node 19+; polyfill for older envs
if (!globalThis.crypto?.randomUUID) {
  Object.defineProperty(globalThis, 'crypto', {
    value: { randomUUID: () => Math.random().toString(36).slice(2) },
  })
}

import { useDocumentStore } from '@/lib/store'
import { defaultTemplates } from '@/lib/templates'

beforeEach(() => {
  localStorageMock.clear()
  useDocumentStore.setState({
    templates: defaultTemplates,
    selectedTemplate: null,
    currentDocument: null,
    values: {},
    activeSection: null,
    reviewResult: null,
    isReviewing: false,
    documents: [],
  })
})

describe('useDocumentStore — setValue', () => {
  it('stores a value by fieldId', () => {
    useDocumentStore.getState().setValue('company_name', 'Acme Corp')
    expect(useDocumentStore.getState().values['company_name']).toBe('Acme Corp')
  })

  it('merges multiple field values', () => {
    useDocumentStore.getState().setValue('field_a', 'A')
    useDocumentStore.getState().setValue('field_b', 'B')
    const { values } = useDocumentStore.getState()
    expect(values['field_a']).toBe('A')
    expect(values['field_b']).toBe('B')
  })
})

describe('useDocumentStore — createDocument', () => {
  it('creates a document for a valid templateId', () => {
    const templateId = defaultTemplates[0].id
    useDocumentStore.getState().createDocument(templateId)

    const { currentDocument, selectedTemplate, values, activeSection } =
      useDocumentStore.getState()

    expect(currentDocument).not.toBeNull()
    expect(currentDocument!.templateId).toBe(templateId)
    expect(currentDocument!.status).toBe('draft')
    expect(selectedTemplate!.id).toBe(templateId)
    expect(values).toEqual({})
    expect(activeSection).toBe(defaultTemplates[0].sections[0].id)
  })

  it('does nothing for an invalid templateId', () => {
    useDocumentStore.getState().createDocument('non-existent-id')
    expect(useDocumentStore.getState().currentDocument).toBeNull()
  })
})

describe('useDocumentStore — saveDocument', () => {
  it('adds the current document to the saved documents list', () => {
    useDocumentStore.getState().createDocument(defaultTemplates[0].id)
    useDocumentStore.getState().setValue('company_name', 'Test Corp')
    useDocumentStore.getState().saveDocument()

    const { documents, currentDocument } = useDocumentStore.getState()
    expect(documents).toHaveLength(1)
    expect(documents[0].values['company_name']).toBe('Test Corp')
    expect(documents[0].id).toBe(currentDocument!.id)
  })

  it('updates an existing document on second save', () => {
    useDocumentStore.getState().createDocument(defaultTemplates[0].id)
    useDocumentStore.getState().saveDocument()
    useDocumentStore.getState().setValue('company_name', 'Updated Corp')
    useDocumentStore.getState().saveDocument()

    const { documents } = useDocumentStore.getState()
    expect(documents).toHaveLength(1)
    expect(documents[0].values['company_name']).toBe('Updated Corp')
  })

  it('does nothing when there is no current document', () => {
    useDocumentStore.getState().saveDocument()
    expect(useDocumentStore.getState().documents).toHaveLength(0)
  })
})

describe('useDocumentStore — loadDocument', () => {
  it('loads a previously saved document', () => {
    useDocumentStore.getState().createDocument(defaultTemplates[0].id)
    useDocumentStore.getState().setValue('author', '홍길동')
    useDocumentStore.getState().saveDocument()

    const docId = useDocumentStore.getState().currentDocument!.id

    // Reset and reload
    useDocumentStore.getState().reset()
    useDocumentStore.getState().loadDocument(docId)

    const { currentDocument, values } = useDocumentStore.getState()
    expect(currentDocument!.id).toBe(docId)
    expect(values['author']).toBe('홍길동')
  })

  it('does nothing for an unknown documentId', () => {
    useDocumentStore.getState().loadDocument('unknown-id')
    expect(useDocumentStore.getState().currentDocument).toBeNull()
  })
})

describe('useDocumentStore — deleteDocument', () => {
  it('removes the document from the list', () => {
    useDocumentStore.getState().createDocument(defaultTemplates[0].id)
    useDocumentStore.getState().saveDocument()
    const docId = useDocumentStore.getState().currentDocument!.id

    useDocumentStore.getState().deleteDocument(docId)
    expect(useDocumentStore.getState().documents).toHaveLength(0)
  })
})

describe('useDocumentStore — updateDocumentStatus', () => {
  it('updates the status of the current document', () => {
    useDocumentStore.getState().createDocument(defaultTemplates[0].id)
    useDocumentStore.getState().updateDocumentStatus('reviewed')
    expect(useDocumentStore.getState().currentDocument!.status).toBe('reviewed')
  })
})

describe('useDocumentStore — reset', () => {
  it('clears current editing state without touching saved documents', () => {
    useDocumentStore.getState().createDocument(defaultTemplates[0].id)
    useDocumentStore.getState().setValue('company_name', 'Foo')
    useDocumentStore.getState().saveDocument()
    useDocumentStore.getState().reset()

    const state = useDocumentStore.getState()
    expect(state.currentDocument).toBeNull()
    expect(state.selectedTemplate).toBeNull()
    expect(state.values).toEqual({})
    // saved documents remain intact
    expect(state.documents).toHaveLength(1)
  })
})

describe('useDocumentStore — addTemplate', () => {
  it('appends a new template to the list', () => {
    const before = useDocumentStore.getState().templates.length
    useDocumentStore.getState().addTemplate({
      id: 'custom-template',
      name: '커스텀 템플릿',
      description: '테스트용',
      icon: '🧪',
      sections: [],
      documentContent: '',
    })
    expect(useDocumentStore.getState().templates).toHaveLength(before + 1)
  })
})
