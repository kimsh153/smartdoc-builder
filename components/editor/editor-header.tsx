'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Sparkles, Save } from 'lucide-react'
import { toast } from 'sonner'

export function EditorHeader() {
  const router = useRouter()
  const { selectedTemplate, customContent, customFields, values, saveDocument, reset, isReviewing, setIsReviewing, setReviewResult } = useDocumentStore()

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

    const allFields = [
      ...selectedTemplate.sections.flatMap((s) => s.fields),
      ...customFields,
    ]
    const fields = allFields
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

  const handleDownload = () => {
    const element = document.getElementById('document-preview')
    if (!element) return

    const filename = `${selectedTemplate?.name || '문서'}_${new Date().toISOString().slice(0, 10)}`
    const docType = (selectedTemplate as any)?.documentType ?? 'contract'

    // 스타일 태그 포함 전체 innerHTML 복사
    const content = element.innerHTML

    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      toast.error('팝업이 차단되었습니다. 브라우저 팝업 허용 후 다시 시도해주세요.')
      return
    }

    const isProposal = docType === 'proposal'
    const isQuotation = docType === 'quotation'

    const pageStyle = isProposal
      ? `
        body { background: #c8c8c8; margin: 0; padding: 24px; }
        #document-preview { width: 100%; max-width: 960px; margin: 0 auto; }
        @media print {
          body { background: #c8c8c8; padding: 0; }
          @page { size: A4 landscape; margin: 10mm; }
        }
      `
      : isQuotation
      ? `
        body { background: #d0d0d0; margin: 0; padding: 24px; display: flex; justify-content: center; }
        #document-preview { width: 210mm; background: #fff; }
        @media print {
          body { background: white; padding: 0; display: block; }
          #document-preview { width: 100%; box-shadow: none; }
          @page { size: A4; margin: 0; }
        }
      `
      : `
        body { background: #e8e8e8; margin: 0; padding: 24px; display: flex; justify-content: center; }
        #document-preview { width: 210mm; min-height: 297mm; background: #fff; }
        @media print {
          body { background: white; padding: 0; display: block; }
          #document-preview { width: 100%; min-height: 0; box-shadow: none; }
          @page { size: A4; margin: 0; }
        }
      `

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${pageStyle}
  </style>
</head>
<body>
  <div id="document-preview">${content}</div>
  <script>
    document.fonts.ready.then(function() { window.print(); });
  <\/script>
</body>
</html>`)
    printWindow.document.close()
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
