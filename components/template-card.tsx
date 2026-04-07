'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import type { Template } from '@/lib/types'

interface TemplateCardProps {
  template: Template
}

const docTypeConfig: Record<string, { label: string; accent: string; bg: string }> = {
  contract: { label: '계약서', accent: '#3b82f6', bg: '#eff6ff' },
  quotation: { label: '견적서', accent: '#10b981', bg: '#ecfdf5' },
  proposal: { label: '제안서', accent: '#8b5cf6', bg: '#f5f3ff' },
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter()
  const { createDocument } = useDocumentStore()

  const handleSelect = () => {
    createDocument(template.id)
    router.push('/editor')
  }

  const type = template.documentType ?? 'contract'
  const config = docTypeConfig[type] ?? docTypeConfig.contract
  const fieldCount = template.sections.reduce((acc, s) => acc + s.fields.length, 0)

  return (
    <button
      onClick={handleSelect}
      className="group w-full text-left rounded-xl border border-border bg-white shadow-none transition-all hover:shadow-md hover:border-transparent hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      {/* color bar */}
      <div
        className="h-1.5 w-full rounded-t-xl"
        style={{ background: config.accent }}
      />
      <div className="p-4">
        {/* icon + type badge */}
        <div className="mb-3 flex items-start justify-between">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{ background: config.bg }}
          >
            {template.icon}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: config.bg, color: config.accent }}
          >
            {config.label}
          </span>
        </div>

        {/* name */}
        <p className="text-sm font-semibold text-foreground leading-snug">{template.name}</p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.description}</p>

        {/* meta */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {template.sections.length}섹션 · {fieldCount}필드
          </span>
          <span
            className="text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: config.accent }}
          >
            선택 →
          </span>
        </div>
      </div>
    </button>
  )
}
