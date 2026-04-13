'use client'

import { useRouter } from 'next/navigation'
import { useQuotationStore } from '@/lib/quotation/store'
import type { QuotationTemplateMeta } from '@/lib/quotation/types'
import { FileSpreadsheet } from 'lucide-react'

interface QuotationTemplateCardProps {
  template: QuotationTemplateMeta
}

export function QuotationTemplateCard({ template }: QuotationTemplateCardProps) {
  const router = useRouter()
  const { resetFromTemplate } = useQuotationStore()

  const handleSelect = () => {
    resetFromTemplate(template)
    router.push('/quotation/editor')
  }

  const accent = '#10b981'
  const bg = '#ecfdf5'

  return (
    <div
      onClick={handleSelect}
      className="group relative w-full cursor-pointer text-left rounded-xl border border-border bg-white shadow-none transition-all hover:shadow-md hover:border-transparent hover:-translate-y-0.5"
    >
      <div className="h-1.5 w-full rounded-t-xl" style={{ background: accent }} />

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
            style={{ background: bg }}
          >
            {template.icon}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all duration-300 group-hover:-translate-x-20"
            style={{ background: bg, color: accent }}
          >
            견적서
          </span>
        </div>

        <p className="text-sm font-semibold text-foreground leading-snug">{template.name}</p>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <FileSpreadsheet className="h-3 w-3" />
            2시트 (모듈별/MM별)
          </span>
          <span
            className="text-xs font-medium opacity-0 transition-opacity group-hover:opacity-100"
            style={{ color: accent }}
          >
            선택 →
          </span>
        </div>
      </div>
    </div>
  )
}
