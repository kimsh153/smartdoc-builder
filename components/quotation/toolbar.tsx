'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Download, Save, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface QuotationToolbarProps {
  title: string
  onSave: () => void
  onExportXlsx: () => void
  isSaving?: boolean
}

export function QuotationToolbar({ title, onSave, onExportXlsx, isSaving }: QuotationToolbarProps) {
  const router = useRouter()

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        height: 52,
        borderBottom: '1px solid #e0e0e0',
        background: '#ffffff',
        flexShrink: 0,
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Button variant="ghost" size="icon" onClick={() => router.push('/')} title="대시보드로 돌아가기">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FileSpreadsheet className="h-4 w-4" style={{ color: '#10b981' }} />
          <span style={{ fontWeight: 600, fontSize: 15 }}>{title}</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 20,
              background: '#ecfdf5',
              color: '#10b981',
            }}
          >
            견적서
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
          <Save className="mr-1.5 h-3.5 w-3.5" />
          저장
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Download className="mr-1.5 h-3.5 w-3.5" />
              내보내기
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onExportXlsx}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel (.xlsx) 다운로드
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
