export type FieldType = 'text' | 'number' | 'date' | 'currency' | 'table'

export interface VariableField {
  id: string
  label: string
  type: FieldType
  placeholder?: string
  required: boolean
  value?: string
}

export interface TemplateSchema {
  documentType: 'quotation' | 'proposal' | 'contract' | 'report' | 'minutes' | 'unknown'
  title: string
  variableFields: VariableField[]
  fixedStructure: {
    companyInfo: boolean
    tableStructure: boolean
    logoPosition?: 'top-left' | 'top-right'
    colorScheme?: string
  }
  rawText: string
  confidence: number
}

export interface ParseResult {
  success: boolean
  schema?: TemplateSchema
  error?: string
}
