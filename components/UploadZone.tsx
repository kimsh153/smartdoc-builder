'use client'

import { useCallback, useRef, useState } from 'react'
import { useTemplateStore } from '@/lib/stores/templateStore'
import { Button } from '@/components/ui/button'
import { FileUp, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { ParseResult } from '@/types/document'

const ALLOWED_TYPES = ['.pdf', '.docx', '.xlsx', '.txt']

export function UploadZone() {
  const { setSchema, setLoading, setError, isLoading } = useTemplateStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const validateFile = (file: File): boolean => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_TYPES.includes(ext)) {
      toast.error('PDF, DOCX, XLSX, TXT 파일만 지원합니다.')
      return false
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다.')
      return false
    }
    return true
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && validateFile(file)) setSelectedFile(file)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && validateFile(file)) setSelectedFile(file)
  }

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('파일을 선택해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      const res = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      })

      const result: ParseResult = await res.json()

      if (!result.success || !result.schema) {
        throw new Error(result.error || '분석 실패')
      }

      setSchema(result.schema)
      toast.success('문서 분석이 완료되었습니다.')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '분석 중 오류가 발생했습니다.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div
        onClick={() => !isLoading && fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        className={`flex min-h-52 cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed transition-colors ${
          isLoading
            ? 'cursor-not-allowed opacity-60 border-border'
            : dragOver
            ? 'border-primary bg-primary/5'
            : selectedFile
            ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
            : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.txt"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isLoading}
        />
        {selectedFile ? (
          <>
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div className="text-center">
              <p className="font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-sm text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
              <button
                onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }}
                className="mt-1 text-xs text-muted-foreground underline hover:text-foreground"
                disabled={isLoading}
              >
                다른 파일 선택
              </button>
            </div>
          </>
        ) : (
          <>
            <FileUp className="h-10 w-10 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium text-foreground">파일을 드래그하거나 클릭하여 선택</p>
              <p className="mt-1 text-sm text-muted-foreground">PDF · DOCX · XLSX · TXT · 최대 10MB</p>
            </div>
          </>
        )}
      </div>

      <Button
        onClick={handleAnalyze}
        size="lg"
        className="w-full"
        disabled={!selectedFile || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            AI가 문서를 분석 중입니다...
          </>
        ) : (
          'AI로 필드 분석하기'
        )}
      </Button>
    </div>
  )
}
