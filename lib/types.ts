// 문서 자동화 앱 타입 정의

export type FieldType = 'text' | 'textarea' | 'select' | 'radio' | 'date' | 'number'

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
}

export interface Section {
  id: string
  title: string
  fields: Field[]
}

export interface Template {
  id: string
  name: string
  description: string
  icon: string
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
