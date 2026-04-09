// 문서 자동화 앱 타입 정의

export type FieldType = 'text' | 'textarea' | 'select' | 'radio' | 'date' | 'number' | 'tel'

/** 조건부 표시 규칙 — fieldId가 value일 때만 이 필드를 표시 */
export interface ShowIfRule {
  fieldId: string
  value: string
}

export interface CustomTemplate {
  id: string
  name: string
  baseTemplateId: string
  createdAt: string
  content: string
  fields: Field[]
  /** 저장 범위 (초기엔 로컬 persist) */
  scope?: 'personal' | 'team' | 'company'
  /** 즐겨찾기 플래그 */
  starred?: boolean
  /** 버전 태그 (예: "v1", "draft") */
  versionTag?: string
}

export interface FieldOption {
  label: string
  value: string
}

export interface Field {
  id: string
  label: string
  type: FieldType
  placeholder?: string
  options?: FieldOption[]
  required?: boolean
  guide?: string // ⓘ 작성 가이드
  showIf?: ShowIfRule // 조건부 표시 규칙
}

export interface Section {
  id: string
  title: string
  fields: Field[]
}

export type DocumentType = 'contract' | 'quotation' | 'proposal' | 'service-contract'

export interface Template {
  id: string
  name: string
  description: string
  icon: string
  documentType?: DocumentType
  sections: Section[]
  documentContent: string // 문서 본문 템플릿 ({{fieldId}} 플레이스홀더)
}

export interface Document {
  id: string
  templateId: string
  templateName: string
  values: Record<string, string>
  status: 'draft' | 'reviewed' | 'confirmed'
  createdAt: string
  updatedAt: string
}

export interface AIReviewSuggestion {
  id: string
  fieldId: string
  original: string
  suggested: string
  reason: string
  type: 'spelling' | 'tone' | 'consistency'
}

export interface AIReviewResult {
  score: number
  suggestions: AIReviewSuggestion[]
}
