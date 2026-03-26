'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Sparkles, Save } from 'lucide-react'
import { toast } from 'sonner'

export function EditorHeader() {
  const router = useRouter()
  const { selectedTemplate, saveDocument, reset, setIsReviewing } = useDocumentStore()

  const handleSave = () => {
    saveDocument()
    toast.success('문서가 저장되었습니다')
  }

  const handleBack = () => {
    reset()
    router.push('/')
  }

  const handleReview = () => {
    setIsReviewing(true)
    // AI 검토 로직은 추후 구현
    toast.info('AI 검토 기능은 준비 중입니다')
  }

  const handleDownload = () => {
    toast.info('PDF 다운로드 기능은 준비 중입니다')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-4">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-foreground">
            {selectedTemplate?.name}
          </h1>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          저장
        </Button>
        <Button variant="outline" size="sm" onClick={handleReview}>
          <Sparkles className="mr-2 h-4 w-4" />
          AI 검토
        </Button>
        <Button size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          다운로드
        </Button>
      </div>
    </header>
  )
}
