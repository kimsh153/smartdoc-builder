'use client'

import { useRouter } from 'next/navigation'
import { useTemplateStore } from '@/lib/stores/templateStore'
import { useDocumentStore } from '@/lib/store'
import { UploadZone } from '@/components/UploadZone'
import { DynamicForm } from '@/components/DynamicForm'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { schemaToTemplate } from '@/lib/parsers/claudeParser'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ParsePage() {
  const router = useRouter()
  const { schema, values, reset } = useTemplateStore()
  const { addTemplate, createDocument, setValue } = useDocumentStore()

  const handleSubmit = () => {
    if (!schema) return

    try {
      const template = schemaToTemplate(schema)
      addTemplate(template)
      createDocument(template.id)

      // Pre-fill editor with values entered in DynamicForm
      Object.entries(values).forEach(([fieldId, value]) => {
        if (value) setValue(fieldId, value)
      })

      toast.success('문서 작성 준비 완료!')
      router.push('/editor')
    } catch {
      toast.error('에디터 이동 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="font-bold text-foreground">AI 문서 파싱</h1>
            <p className="text-xs text-muted-foreground">PDF · DOCX · XLSX 업로드 → 변수 필드 자동 추출 → 에디터에서 완성</p>
          </div>
          {schema && (
            <Button variant="outline" size="sm" onClick={reset}>
              <RotateCcw className="mr-2 h-4 w-4" />
              초기화
            </Button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 space-y-10">
        {/* Step 1: 파일 업로드 */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Step 1 · 문서 업로드
          </h2>
          <UploadZone />
        </section>

        {/* Step 2: 분석 결과 + 입력 폼 */}
        {schema && (
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Step 2 · 변수 입력
            </h2>
            <div className="rounded-xl border bg-card p-6">
              <DynamicForm onSubmit={handleSubmit} />
            </div>
          </section>
        )}

        {/* Step 3: 에디터 이동 안내 (폼 제출 전 가이드) */}
        {schema && (
          <section>
            <div className="rounded-lg border border-dashed bg-muted/30 p-4 text-center text-sm text-muted-foreground">
              변수를 모두 입력한 후 <span className="font-semibold text-foreground">문서 작성하기</span> 버튼을 눌러 에디터로 이동하세요.
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
