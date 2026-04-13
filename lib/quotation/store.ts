import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { Document } from '@/lib/types'
import { todayString } from './engine'
import type { QuotationData, QuotationGroup, QuotationItem, QuotationTemplateMeta, StaffItem } from './types'

// ─── 기본값 (fallback) ───────────────────────────────────────────────────────

function createDefaultData(): QuotationData {
  const today = todayString()
  return {
    clientName: '',
    quoteDate: today,
    validDays: 30,
    salesPerson: '',
    salesContact: '',
    salesEmail: '',

    overheadRate: 0.25,
    profitRate: 0.20,
    discount: 0,

    deliverable: '',
    devPeriodStart: today,
    devPeriodEnd: '',
    paymentMethod: '선금 40% / 중도금 30% / 잔금 30%',
    hasInterimPayment: true,
    billingMethod: '전자세금계산서 발행',

    groups: [
      {
        id: uuid(),
        name: '프로젝트 관리 및 기획',
        items: [
          {
            id: uuid(),
            category: '프로젝트 관리',
            description: '프로젝트 세팅, 프로젝트 매니지먼트, 서비스 기획',
            startDate: today,
            endDate: '',
            monthlyCost: 15000000,
          },
        ],
      },
      {
        id: uuid(),
        name: '개발',
        items: [
          {
            id: uuid(),
            category: '백엔드 개발',
            description: '',
            startDate: today,
            endDate: '',
            monthlyCost: 30000000,
          },
          {
            id: uuid(),
            category: '프론트엔드 개발',
            description: '',
            startDate: today,
            endDate: '',
            monthlyCost: 25000000,
          },
        ],
      },
    ],

    staffItems: [
      {
        id: uuid(),
        role: 'PMO',
        description: '프로젝트 관리',
        startDate: today,
        endDate: '',
        monthlyCost: 15000000,
        mm: 1.5,
      },
    ],

    notes: '',
  }
}

/** 템플릿 메타 기준으로 새 견적 초안 (매번 새 id·오늘 날짜) */
export function buildFreshQuotationFromTemplate(template: QuotationTemplateMeta): QuotationData {
  const raw = JSON.parse(JSON.stringify(template.defaultData)) as QuotationData
  const today = todayString()
  raw.quoteDate = today
  raw.devPeriodStart = today
  raw.groups = raw.groups.map(g => ({
    ...g,
    id: uuid(),
    items: g.items.map(i => ({
      ...i,
      id: uuid(),
      startDate: today,
    })),
  }))
  raw.staffItems = raw.staffItems.map(s => ({
    ...s,
    id: uuid(),
    startDate: today,
  }))
  return raw
}

// ─── 스토어 타입 ─────────────────────────────────────────────────────────────

interface QuotationStore {
  data: QuotationData
  /** 내 문서에 이미 저장된 항목을 수정 중이면 해당 문서 id, 신규 작성이면 null */
  editingDocumentId: string | null
  /** 대시보드에서 선택한 견적 템플릿 id (저장 시 templateId로 사용) */
  activeTemplateId: string

  updateField: <K extends keyof QuotationData>(key: K, value: QuotationData[K]) => void

  addGroup: () => void
  removeGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  moveGroupUp: (groupId: string) => void
  moveGroupDown: (groupId: string) => void

  addItem: (groupId: string) => void
  removeItem: (groupId: string, itemId: string) => void
  updateItem: (groupId: string, itemId: string, patch: Partial<QuotationItem>) => void

  addStaffItem: () => void
  removeStaffItem: (itemId: string) => void
  updateStaffItem: (itemId: string, patch: Partial<StaffItem>) => void

  /** 홈에서 템플릿 카드 선택 시 — 항상 초기 상태 */
  resetFromTemplate: (template: QuotationTemplateMeta) => void
  /** 내 문서에서 불러온 견적 */
  loadFromSavedDocument: (doc: Document) => void
}

// ─── 스토어 구현 (persist 없음 — 초안은 세션만, 저장은 document-store) ─────────

export const useQuotationStore = create<QuotationStore>((set, get) => ({
  data: createDefaultData(),
  editingDocumentId: null,
  activeTemplateId: 'qt-it-project',

  updateField: (key, value) =>
    set(state => ({
      data: { ...state.data, [key]: value },
    })),

  resetFromTemplate: template => {
    set({
      data: buildFreshQuotationFromTemplate(template),
      editingDocumentId: null,
      activeTemplateId: template.id,
    })
  },

  loadFromSavedDocument: doc => {
    if (!doc.quotationData) return
    set({
      data: JSON.parse(JSON.stringify(doc.quotationData)),
      editingDocumentId: doc.id,
      activeTemplateId: doc.templateId,
    })
  },

  addGroup: () => {
    const today = todayString()
    set(state => ({
      data: {
        ...state.data,
        groups: [
          ...state.data.groups,
          {
            id: uuid(),
            name: '새 대분류',
            items: [
              {
                id: uuid(),
                category: '',
                description: '',
                startDate: today,
                endDate: '',
                monthlyCost: 0,
              },
            ],
          } satisfies QuotationGroup,
        ],
      },
    }))
  },

  removeGroup: groupId =>
    set(state => ({
      data: {
        ...state.data,
        groups: state.data.groups.filter(g => g.id !== groupId),
      },
    })),

  renameGroup: (groupId, name) =>
    set(state => ({
      data: {
        ...state.data,
        groups: state.data.groups.map(g => (g.id === groupId ? { ...g, name } : g)),
      },
    })),

  moveGroupUp: groupId =>
    set(state => {
      const groups = [...state.data.groups]
      const idx = groups.findIndex(g => g.id === groupId)
      if (idx <= 0) return state
      ;[groups[idx - 1], groups[idx]] = [groups[idx], groups[idx - 1]]
      return { data: { ...state.data, groups } }
    }),

  moveGroupDown: groupId =>
    set(state => {
      const groups = [...state.data.groups]
      const idx = groups.findIndex(g => g.id === groupId)
      if (idx < 0 || idx >= groups.length - 1) return state
      ;[groups[idx], groups[idx + 1]] = [groups[idx + 1], groups[idx]]
      return { data: { ...state.data, groups } }
    }),

  addItem: groupId => {
    const today = todayString()
    set(state => ({
      data: {
        ...state.data,
        groups: state.data.groups.map(g =>
          g.id === groupId
            ? {
                ...g,
                items: [
                  ...g.items,
                  {
                    id: uuid(),
                    category: '',
                    description: '',
                    startDate: today,
                    endDate: '',
                    monthlyCost: 0,
                  } satisfies QuotationItem,
                ],
              }
            : g,
        ),
      },
    }))
  },

  removeItem: (groupId, itemId) =>
    set(state => ({
      data: {
        ...state.data,
        groups: state.data.groups.map(g =>
          g.id === groupId
            ? { ...g, items: g.items.filter(item => item.id !== itemId) }
            : g,
        ),
      },
    })),

  updateItem: (groupId, itemId, patch) =>
    set(state => ({
      data: {
        ...state.data,
        groups: state.data.groups.map(g =>
          g.id === groupId
            ? {
                ...g,
                items: g.items.map(item =>
                  item.id === itemId ? { ...item, ...patch } : item,
                ),
              }
            : g,
        ),
      },
    })),

  addStaffItem: () => {
    const today = todayString()
    set(state => ({
      data: {
        ...state.data,
        staffItems: [
          ...state.data.staffItems,
          {
            id: uuid(),
            role: '',
            description: '',
            startDate: today,
            endDate: '',
            monthlyCost: 0,
            mm: 1,
          } satisfies StaffItem,
        ],
      },
    }))
  },

  removeStaffItem: itemId =>
    set(state => ({
      data: {
        ...state.data,
        staffItems: state.data.staffItems.filter(s => s.id !== itemId),
      },
    })),

  updateStaffItem: (itemId, patch) =>
    set(state => ({
      data: {
        ...state.data,
        staffItems: state.data.staffItems.map(s =>
          s.id === itemId ? { ...s, ...patch } : s,
        ),
      },
    })),
}))
