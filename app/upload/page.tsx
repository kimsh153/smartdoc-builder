'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import type { Template } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, FileUp, Sparkles, CheckCircle, ChevronRight, FileText, ClipboardPaste } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Mode = 'file' | 'paste'
type Step = 'input' | 'analyzing' | 'result'

const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.xlsx', '.txt', '.md', '.json']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export default function UploadPage() {
  const router = useRouter()
  const { addTemplate, createDocument } = useDocumentStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<Mode>('file')
  const [step, setStep] = useState<Step>('input')
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pastedText, setPastedText] = useState('')
  const [generatedTemplate, setGeneratedTemplate] = useState<Template | null>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) validateAndSetFile(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) validateAndSetFile(file)
  }

  const validateAndSetFile = (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      toast.error('PDF, DOCX, XLSX, TXT, MD, JSON 파일만 지원합니다.')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('파일 크기는 10MB 이하여야 합니다.')
      return
    }
    setSelectedFile(file)
  }

  const getFileTypeLabel = (file: File): string => {
    const ext = file.name.split('.').pop()?.toUpperCase() ?? ''
    const labels: Record<string, string> = {
      PDF: '📄 PDF 문서',
      DOCX: '📝 Word 문서',
      XLSX: '📊 Excel 파일',
      TXT: '📃 텍스트 파일',
      MD: '📃 마크다운',
      JSON: '📃 JSON',
    }
    return labels[ext] ?? ext
  }

  const handleAnalyze = async () => {
    setStep('analyzing')

    try {
      const formData = new FormData()

      if (mode === 'file') {
        if (!selectedFile) {
          toast.error('파일을 선택해주세요.')
          setStep('input')
          return
        }
        formData.append('file', selectedFile)
      } else {
        if (!pastedText.trim()) {
          toast.error('분석할 텍스트를 입력해주세요.')
          setStep('input')
          return
        }
        formData.append('text', pastedText.trim())
      }

      const res = await fetch('/api/templates/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error || '분석 실패')
      }

      const template: Template = await res.json()
      setGeneratedTemplate(template)
      setStep('result')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.')
      setStep('input')
    }
  }

  const handleUseTemplate = () => {
    if (!generatedTemplate) return
    addTemplate(generatedTemplate)
    createDocument(generatedTemplate.id)
    router.push('/editor')
  }

  const handleRetry = () => {
    setStep('input')
    setGeneratedTemplate(null)
  }

  const canAnalyze = mode === 'file' ? !!selectedFile : pastedText.trim().length > 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="font-bold text-foreground">AI 문서 분석</h1>
            <p className="text-xs text-muted-foreground">문서를 업로드하면 AI가 맞춤 템플릿을 생성합니다</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        {step === 'input' && (
          <div className="space-y-6">
            {/* 모드 탭 */}
            <div className="flex gap-1 rounded-lg border bg-muted p-1 w-fit">
              <button
                onClick={() => setMode('file')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'file'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <FileText className="h-4 w-4" />
                파일 업로드
              </button>
              <button
                onClick={() => setMode('paste')}
                className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  mode === 'paste'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ClipboardPaste className="h-4 w-4" />
                텍스트 붙여넣기
              </button>
            </div>

            {mode === 'file' ? (
              <div>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  className={`flex min-h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-colors ${
                    dragOver
                      ? 'border-primary bg-primary/5'
                      : selectedFile
                      ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                      : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.xlsx,.txt,.md,.json"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  {selectedFile ? (
                    <>
                      <CheckCircle className="h-12 w-12 text-green-500" />
                      <div className="text-center">
                        <p className="font-medium text-foreground">{getFileTypeLabel(selectedFile)}</p>
                        <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                          className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
                        >
                          다른 파일 선택
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <FileUp className="h-12 w-12 text-muted-foreground" />
                      <div className="text-center">
                        <p className="font-medium text-foreground">파일을 드래그하거나 클릭하여 선택</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          PDF · DOCX · XLSX · TXT · MD · JSON
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">최대 10MB</p>
                      </div>
                    </>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  💡 스캔된 PDF(이미지 PDF)는 텍스트 추출이 어렵습니다. DOCX로 변환 후 업로드하거나 텍스트 붙여넣기를 이용해주세요.
                </p>
              </div>
            ) : (
              <div>
                <Textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="문서 내용을 여기에 붙여넣으세요.

예시:
견적서

발행일: 2024년 1월 1일
고객사: (주)OOO
담당자: 홍길동

품목: 웹사이트 개발
금액: 5,000,000원
..."
                  className="min-h-72 font-mono text-sm resize-none"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {pastedText.length}자 입력됨 · PDF/Word 문서를 전체 선택(Ctrl+A) 후 복사(Ctrl+C)하여 붙여넣기 하세요.
                </p>
              </div>
            )}

            <Button
              onClick={handleAnalyze}
              size="lg"
              className="w-full"
              disabled={!canAnalyze}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              AI로 템플릿 생성하기
            </Button>
          </div>
        )}

        {step === 'analyzing' && (
          <div className="flex flex-col items-center gap-6 py-20">
            <div className="relative">
              <div className="h-20 w-20 rounded-full border-4 border-muted" />
              <div className="absolute inset-0 h-20 w-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">문서를 분석하고 있습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">AI가 문서 구조를 파악하고 양식을 생성 중입니다...</p>
            </div>
          </div>
        )}

        {step === 'result' && generatedTemplate && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
              <CheckCircle className="h-6 w-6 shrink-0 text-green-600" />
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">템플릿 생성 완료!</p>
                <p className="text-sm text-green-700 dark:text-green-300">AI가 문서를 분석하여 맞춤 템플릿을 만들었습니다.</p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6 space-y-5">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{generatedTemplate.icon}</span>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{generatedTemplate.name}</h2>
                  <p className="text-sm text-muted-foreground">{generatedTemplate.description}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  입력 섹션 ({generatedTemplate.sections.length}개)
                </p>
                {generatedTemplate.sections.map((section) => (
                  <div key={section.id} className="rounded-lg border bg-muted/30 p-4">
                    <p className="mb-2 text-sm font-semibold text-foreground">{section.title}</p>
                    <ul className="space-y-1">
                      {section.fields.map((field) => (
                        <li key={field.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                          <span>{field.label}</span>
                          {field.required && (
                            <span className="text-xs text-red-500">*필수</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleRetry} className="flex-1">
                다시 분석하기
              </Button>
              <Button onClick={handleUseTemplate} className="flex-2">
                이 템플릿으로 작성하기
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              생성된 템플릿은 대시보드의 양식 목록에도 저장됩니다.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
