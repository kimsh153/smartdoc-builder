'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { Trash2, Clock } from 'lucide-react'
import type { Document } from '@/lib/types'

interface DocumentCardProps {
  document: Document
}

const statusConfig: Record<Document['status'], { label: string; color: string; bg: string }> = {
  draft:     { label: '작성중',   color: '#f59e0b', bg: '#fffbeb' },
  reviewed:  { label: '검토완료', color: '#3b82f6', bg: '#eff6ff' },
  confirmed: { label: '확정',    color: '#10b981', bg: '#ecfdf5' },
}

export function DocumentCard({ document }: DocumentCardProps) {
  const router = useRouter()
  const { loadDocument, deleteDocument } = useDocumentStore()

  const handleClick = () => {
    loadDocument(document.id)
    router.push(document.quotationData ? '/quotation/editor' : '/editor')
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteDocument(document.id)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  const filledFields = document.quotationData
    ? document.quotationData.clientName?.trim()
      ? '고객사 입력됨'
      : '작성 중'
    : `${Object.values(document.values).filter(Boolean).length}개 필드 작성됨`
  const status = statusConfig[document.status]

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="group w-full text-left rounded-xl border border-border bg-white shadow-none transition-all hover:shadow-md hover:border-transparent hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
            style={{ background: status.bg, color: status.color }}
          >
            {status.label}
          </span>
          <button
            onClick={handleDelete}
            className="flex h-6 w-6 items-center justify-center rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10"
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </div>

        <p className="text-sm font-semibold text-foreground leading-snug">{document.templateName}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{filledFields}</span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {new Date(document.updatedAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    </div>
  )
}
