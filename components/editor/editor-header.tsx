'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowLeft, Download, FileText, Sparkles, Save } from 'lucide-react'
import { toast } from 'sonner'
import { exportToDocx } from '@/lib/exporters/toDocx'

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

  const getFilename = () =>
    `${selectedTemplate?.name || '문서'}_${new Date().toISOString().slice(0, 10)}`

  const handleDownloadPdf = () => {
    const element = document.getElementById('document-preview')
    if (!element) return

    const filename = getFilename()
    const docType = (selectedTemplate as any)?.documentType ?? 'contract'

    // outerHTML로 컨테이너 인라인 스타일(padding·font-family·font-size·line-height) 포함 전체 복사
    const content = element.outerHTML

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
        @media print {
          body { background: #c8c8c8; padding: 0; }
          #document-preview { box-shadow: none !important; }
          @page { size: A4 landscape; margin: 10mm; }
          #document-preview .prop-cover,
          #document-preview .prop-slide,
          #document-preview .doc-section { break-inside: avoid; page-break-inside: avoid; }
          #document-preview tr,
          #document-preview li { break-inside: avoid; }
          #document-preview table { break-inside: auto; }
        }
      `
      : isQuotation
      ? `
        body { background: #d0d0d0; margin: 0; padding: 24px; display: flex; justify-content: center; }
        @media print {
          body { background: white; padding: 0; display: block; }
          #document-preview { width: 100%; box-shadow: none !important; }
          @page { size: A4; margin: 10mm; }
          #document-preview tr,
          #document-preview li { break-inside: avoid; }
          #document-preview table { break-inside: auto; }
        }
      `
      : `
        body { background: #e8e8e8; margin: 0; padding: 24px; display: flex; justify-content: center; }
        @media print {
          body { background: white; padding: 0; display: block; }
          /* @page 여백으로 모든 페이지의 상하좌우 여백 보장 */
          @page { size: A4; margin: 20mm 22mm 20mm 28mm; }
          #document-preview { width: 100%; min-height: 0; padding: 0; box-shadow: none !important; }
          #document-preview .doc-article,
          #document-preview .doc-section,
          #document-preview tr,
          #document-preview li { break-inside: avoid; }
          #document-preview .doc-signature { break-before: avoid; break-inside: avoid; }
          #document-preview table { break-inside: auto; }
        }
      `

    printWindow.document.write(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    ${pageStyle}
  </style>
</head>
<body>
  ${content}
  <script>
    document.fonts.ready.then(function() { window.print(); });
  <\/script>
</body>
</html>`)
    printWindow.document.close()
  }

  const handleDownloadDocx = async () => {
    const element = document.getElementById('document-preview')
    if (!element) return
    try {
      await exportToDocx('document-preview', getFilename())
      toast.success('DOCX 파일이 다운로드되었습니다')
    } catch {
      toast.error('DOCX 생성 중 오류가 발생했습니다')
    }
  }

  const handleGoogleDocs = async () => {
    const element = document.getElementById('document-preview')
    if (!element) return
    try {
      await exportToDocx('document-preview', getFilename())
      toast.info('DOCX 파일을 다운로드했습니다. Google Docs에서 파일 열기로 업로드하세요.', {
        duration: 6000,
      })
    } catch {
      toast.error('파일 생성 중 오류가 발생했습니다')
    }
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm">
              <Download className="mr-2 h-4 w-4" />
              다운로드
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleDownloadPdf}>
              <Download className="mr-2 h-4 w-4" />
              PDF 다운로드
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadDocx}>
              <FileText className="mr-2 h-4 w-4" />
              DOCX (Word) 다운로드
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleGoogleDocs}>
              <FileText className="mr-2 h-4 w-4" />
              Google Docs로 열기
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
