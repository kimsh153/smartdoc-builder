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

  const handleDownloadPdf = async () => {
    const previewEl = document.getElementById('document-preview')
    if (!previewEl) return

    const docType = (selectedTemplate as any)?.documentType ?? 'contract'
    const isProposal = docType === 'proposal'

    toast.loading('PDF 생성 중...', { id: 'pdf-gen' })

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const pageEls = Array.from(previewEl.querySelectorAll<HTMLElement>('.document-preview-page'))
      if (pageEls.length === 0) return

      const [pdfW, pdfH] = isProposal ? [297, 210] : [210, 297]
      const pdf = new jsPDF({
        unit: 'mm',
        format: 'a4',
        orientation: isProposal ? 'landscape' : 'portrait',
      })

      // Tailwind v4의 oklch/lab 색상을 html2canvas가 파싱 가능한 hex로 변환
      const fixCss = (css: string) =>
        css
          .replace(/oklch\s*\(([^)]*)\)/g, (_, args) => {
            const L = parseFloat(args.trim().split(/[\s,]+/)[0] ?? '0.5')
            if (L > 0.93) return '#ffffff'
            if (L > 0.8)  return '#e5e7eb'
            if (L > 0.6)  return '#9ca3af'
            if (L > 0.4)  return '#4b5563'
            if (L > 0.2)  return '#1f2937'
            return '#030712'
          })
          .replace(/lab\s*\(([^)]*)\)/g, (_, args) => {
            const L = parseFloat(args.trim().split(/[\s,]+/)[0] ?? '50')
            if (L > 90) return '#ffffff'
            if (L > 70) return '#d1d5db'
            if (L > 50) return '#6b7280'
            if (L > 30) return '#374151'
            return '#111827'
          })

      // 각 미리보기 페이지를 개별 캡처해서 jsPDF 페이지로 추가
      // → 페이지 분할 로직 불필요, 빈 마지막 페이지 없음
      for (let i = 0; i < pageEls.length; i++) {
        const pageEl = pageEls[i]
        const origShadow = pageEl.style.boxShadow
        pageEl.style.boxShadow = 'none'

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          letterRendering: true,
          scrollX: 0,
          scrollY: 0,
          onclone: async (_doc: Document, clonedEl: HTMLElement) => {
            const cloneDoc = clonedEl.ownerDocument
            cloneDoc.querySelectorAll('style').forEach(s => {
              if (s.textContent) s.textContent = fixCss(s.textContent)
            })
            await Promise.all(
              Array.from(cloneDoc.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'))
                .map(async link => {
                  try {
                    const css = fixCss(await (await fetch(link.href)).text())
                    const style = cloneDoc.createElement('style')
                    style.textContent = css
                    link.replaceWith(style)
                  } catch { link.remove() }
                })
            )
          },
        })

        pageEl.style.boxShadow = origShadow

        // canvas는 scale:2로 렌더 → 실제 크기는 절반
        // 가로를 pdfW(mm)에 맞추고 비율에 따라 높이 계산
        const imgH = (canvas.height / canvas.width) * pdfW
        const imgData = canvas.toDataURL('image/jpeg', 0.97)

        if (i > 0) pdf.addPage()
        // imgH가 pdfH를 초과하면 pdfH로 클리핑 (마지막 페이지는 보통 짧음)
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, Math.min(imgH, pdfH))
      }

      pdf.save(`${getFilename()}.pdf`)
      toast.success('PDF가 다운로드되었습니다.', { id: 'pdf-gen' })
    } catch (e) {
      console.error(e)
      toast.error('PDF 생성 중 오류가 발생했습니다.', { id: 'pdf-gen' })
    }
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
