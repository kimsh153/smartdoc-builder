'use client'

import { useTemplateStore } from '@/lib/stores/templateStore'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import type { VariableField } from '@/types/document'

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation: '견적서',
  proposal: '제안서',
  contract: '계약서',
  report: '보고서',
  minutes: '회의록',
  unknown: '문서',
}

function FieldInput({ field }: { field: VariableField }) {
  const { values, setValue } = useTemplateStore()
  const value = values[field.id] ?? ''

  const inputType =
    field.type === 'date' ? 'date' :
    field.type === 'number' || field.type === 'currency' ? 'number' :
    'text'

  return (
    <div className="space-y-1.5">
      <Label htmlFor={field.id} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      <Input
        id={field.id}
        type={inputType}
        value={value}
        placeholder={field.placeholder ?? ''}
        onChange={(e) => setValue(field.id, e.target.value)}
      />
    </div>
  )
}

interface DynamicFormProps {
  onSubmit?: () => void
}

export function DynamicForm({ onSubmit }: DynamicFormProps) {
  const { schema } = useTemplateStore()

  if (!schema) return null

  const docTypeLabel = DOC_TYPE_LABEL[schema.documentType] ?? '문서'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-foreground">{schema.title}</h2>
        <p className="text-sm text-muted-foreground">
          {docTypeLabel} · 신뢰도 {Math.round(schema.confidence * 100)}%
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {schema.variableFields.map((field) => (
          <FieldInput key={field.id} field={field} />
        ))}
      </div>

      {onSubmit && (
        <Button onClick={onSubmit} className="w-full" size="lg">
          문서 작성하기
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
