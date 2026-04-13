import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import type { Template } from '@/lib/types'
import { Share2, Download } from 'lucide-react'
import { getShareableUrl, exportTemplateAsJson } from '@/lib/share'
import { toast } from 'sonner'
import { Button } from './ui/button'

interface TemplateCardProps {
  template: Template
}

const docTypeConfig: Record<string, { label: string; accent: string; bg: string }> = {
  contract:         { label: '계약서', accent: '#3b82f6', bg: '#eff6ff' },
  'service-contract': { label: '계약서', accent: '#3b82f6', bg: '#eff6ff' },
  quotation:        { label: '견적서', accent: '#10b981', bg: '#ecfdf5' },
  proposal:         { label: '제안서', accent: '#8b5cf6', bg: '#f5f3ff' },
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter()
  const { createDocument } = useDocumentStore()

  const handleSelect = () => {
    createDocument(template.id)
    router.push('/editor')
  }

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = getShareableUrl(template)
    navigator.clipboard.writeText(url)
    toast.success('공유 링크가 클립보드에 복사되었습니다.')
  }

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation()
    exportTemplateAsJson(template)
    toast.success('템플릿 파일(.json)이 다운로드되었습니다.')
  }

  const type = template.documentType ?? 'contract'
  const config = docTypeConfig[type] ?? docTypeConfig.contract
  const fieldCount = template.sections.reduce((acc, s) => acc + s.fields.length, 0)

  return (
    <div
      onClick={handleSelect}
      className="group relative w-full cursor-pointer text-left rounded-xl border border-border bg-white shadow-none transition-all hover:shadow-md hover:border-transparent hover:-translate-y-0.5"
    >
      {/* color bar */}
      <div
        className="h-1.5 w-full rounded-t-xl"
        style={{ background: config.accent }}
      />
      
      {/* Quick Actions (Appear on hover) */}
      <div className="absolute top-4 right-4 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white"
          onClick={handleShare}
          title="링크 공유"
        >
          <Share2 className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm hover:bg-white"
          onClick={handleExport}
          title="파일 내보내기"
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

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
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all duration-300 group-hover:-translate-x-20"
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
    </div>
  )
}
