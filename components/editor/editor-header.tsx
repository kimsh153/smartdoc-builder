'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Sparkles, Save } from 'lucide-react'
import { toast } from 'sonner'

export function EditorHeader() {
  const router = useRouter()
  const { selectedTemplate, values, saveDocument, reset, isReviewing, setIsReviewing, setReviewResult } = useDocumentStore()

  const handleSave = () => {
    saveDocument()
    toast.success('문서가 저장되었습니다')
  }

  const handleBack = () => {
    reset()
    router.push('/')
  }

  const handleReview = async () => {
    if (!selectedTemplate) return

    const fields = selectedTemplate.sections
      .flatMap((s) => s.fields)
      .filter((f) => (f.type === 'text' || f.type === 'textarea') && values[f.id]?.trim())
      .map((f) => ({ id: f.id, label: f.label, value: values[f.id] }))

    if (fields.length === 0) {
      toast.warning('검토할 텍스트 필드를 먼저 입력해주세요')
      return
    }

    setIsReviewing(true)
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields }),
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || 'AI 검토 요청 실패')
      }

      const result = await res.json()
      setReviewResult(result)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'AI 검토 중 오류가 발생했습니다')
    } finally {
      setIsReviewing(false)
    }
  }

  const handleDownload = async () => {
    const element = document.getElementById('document-preview')
    if (!element) return

    const html2pdf = (await import('html2pdf.js')).default
    const filename = `${selectedTemplate?.name || '문서'}_${new Date().toISOString().slice(0, 10)}.pdf`

    toast.info('PDF 생성 중...')
    await html2pdf()
      .set({
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(element)
      .save()
    toast.success('PDF가 다운로드되었습니다')
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
        <Button variant="outline" size="sm" onClick={handleReview} disabled={isReviewing}>
          <Sparkles className="mr-2 h-4 w-4" />
          {isReviewing ? 'AI 검토 중...' : 'AI 검토'}
        </Button>
        <Button size="sm" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          다운로드
        </Button>
      </div>
    </header>
  )
}
