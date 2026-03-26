'use client'

import { useDocumentStore } from '@/lib/store'
import { TemplateCard } from '@/components/template-card'
import { DocumentCard } from '@/components/document-card'
import { Button } from '@/components/ui/button'
import { FileUp, Plus } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { templates, documents } = useDocumentStore()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <h1 className="text-xl font-bold text-primary">DocuFlow</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href="/upload">
              <FileUp className="mr-2 h-4 w-4" />
              문서 분석하기
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* 양식 선택 섹션 */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">양식 선택</h2>
              <p className="mt-1 text-muted-foreground">
                작성할 문서 양식을 선택하세요
              </p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
              <Button variant="ghost" className="flex flex-col gap-2 h-auto py-6" asChild>
                <Link href="/upload">
                  <Plus className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">AI로 새 템플릿 만들기</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* 내 문서 섹션 */}
        {documents.length > 0 && (
          <section>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground">내 문서</h2>
              <p className="mt-1 text-muted-foreground">
                작성 중인 문서를 이어서 편집하세요
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc) => (
                <DocumentCard key={doc.id} document={doc} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
