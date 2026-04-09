import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import { todayString } from './engine'
import type { QuotationData, QuotationGroup, QuotationItem, StaffItem, SavedQuotation } from './types'

// ─── 기본값 ──────────────────────────────────────────────────────────────────

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

// ─── 스토어 타입 ─────────────────────────────────────────────────────────────

interface QuotationStore {
  data: QuotationData
  savedQuotations: SavedQuotation[]

  // 견적 헤더 / 비용 구성 / 프로젝트 정보 업데이트
  updateField: <K extends keyof QuotationData>(key: K, value: QuotationData[K]) => void

  // 대분류 CRUD
  addGroup: () => void
  removeGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  moveGroupUp: (groupId: string) => void
  moveGroupDown: (groupId: string) => void

  // 중분류 항목 CRUD
  addItem: (groupId: string) => void
  removeItem: (groupId: string, itemId: string) => void
  updateItem: (groupId: string, itemId: string, patch: Partial<QuotationItem>) => void

  // 인력 CRUD
  addStaffItem: () => void
  removeStaffItem: (itemId: string) => void
  updateStaffItem: (itemId: string, patch: Partial<StaffItem>) => void

  // 저장/불러오기/초기화
  saveQuotation: (name: string) => void
  loadQuotation: (id: string) => void
  deleteSavedQuotation: (id: string) => void
  resetData: () => void
}

// ─── 스토어 구현 ─────────────────────────────────────────────────────────────

export const useQuotationStore = create<QuotationStore>()(
  persist(
    (set, get) => ({
      data: createDefaultData(),
      savedQuotations: [],

      updateField: (key, value) =>
        set(state => ({
          data: { ...state.data, [key]: value },
        })),

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

      saveQuotation: (name: string) => {
        const { data } = get()
        const newEntry: SavedQuotation = {
          id: uuid(),
          name,
          savedAt: new Date().toISOString(),
          data: JSON.parse(JSON.stringify(data)),
        }
        set(state => ({
          savedQuotations: [newEntry, ...state.savedQuotations].slice(0, 50),
        }))
      },

      loadQuotation: (id: string) => {
        const { savedQuotations } = get()
        const found = savedQuotations.find(q => q.id === id)
        if (found) set({ data: JSON.parse(JSON.stringify(found.data)) })
      },

      deleteSavedQuotation: (id: string) =>
        set(state => ({
          savedQuotations: state.savedQuotations.filter(q => q.id !== id),
        })),

      resetData: () => set({ data: createDefaultData() }),
    }),
    {
      name: 'quotation-store',
      version: 2,
      migrate: () => ({ data: createDefaultData(), savedQuotations: [] }),
    },
  ),
)
