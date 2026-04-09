'use client'

import { useDocumentStore } from '@/lib/store'
import { SectionCard } from './section-card'
import { ContractOptionsCard } from './contract-options-card'
import { DynamicFieldPanel } from './DynamicFieldPanel'

export function InputPanel() {
  const { selectedTemplate, customFields, values, setValue } = useDocumentStore()

  if (!selectedTemplate) return null

  // contract-options 섹션을 분리
  const optionsSection = selectedTemplate.sections.find(s => s.id === 'contract-options')
  const regularSections = selectedTemplate.sections.filter(s => s.id !== 'contract-options')

  return (
    <div className="p-6 pb-4">
      {/* 계약 옵션 섹션 (스마트 질문) */}
      {optionsSection && (
        <div className="mb-6">
          <ContractOptionsCard section={optionsSection} />
        </div>
      )}

      <div className="space-y-6">
        {regularSections.map((section, index) => (
          <SectionCard
            key={section.id}
            section={section}
            index={index + 1}
            total={regularSections.length}
          />
        ))}
      </div>

      {/* 커스텀 필드 (Phase 2) — showIf 조건 필터링 적용 */}
      {customFields.length > 0 && (
        <div className="mt-6 space-y-4">
          {customFields.filter(field => {
            if (!field.showIf) return true
            return values[field.showIf.fieldId] === field.showIf.value
          }).map((field) => (
            <div key={field.id} className="space-y-2 px-0">
              <label className="text-sm font-medium text-foreground flex items-center gap-1">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
                <span className="ml-1 text-xs text-muted-foreground font-mono">[커스텀]</span>
              </label>
              <input
                type={field.type === 'tel' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
                value={values[field.id] || ''}
                onChange={(e) => setValue(field.id, e.target.value)}
                placeholder={field.placeholder}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          ))}
        </div>
      )}

      <DynamicFieldPanel />
    </div>
  )
}
