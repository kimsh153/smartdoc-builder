'use client'

import { useDocumentStore } from '@/lib/store'
import { TemplateCard } from '@/components/template-card'
import { DocumentCard } from '@/components/document-card'
import { Button } from '@/components/ui/button'
import { FileUp, Sparkles, FileText, FolderOpen } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { templates, documents } = useDocumentStore()

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}
      <header className="border-b border-border/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <FileText className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base font-semibold tracking-tight text-foreground">DocuFlow</span>
          </div>
          <nav className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/parse">
                <FileUp className="mr-1.5 h-3.5 w-3.5" />
                기존 문서 파싱
              </Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/upload">
                <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                AI 템플릿 생성
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Hero */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">문서 양식</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            템플릿을 선택하거나 AI로 새 양식을 만드세요
          </p>
        </div>

        {/* 양식 선택 섹션 */}
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">기본 템플릿</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {templates.length}
              </span>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {templates.map((template) => (
              <TemplateCard key={template.id} template={template} />
            ))}
            {/* AI 템플릿 생성 카드 */}
            <Link href="/upload" className="group block">
              <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-white/60 transition-all hover:border-primary/50 hover:bg-white hover:shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">AI로 템플릿 만들기</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">문서를 업로드하면 자동 생성</p>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* 내 문서 섹션 */}
        {documents.length > 0 && (
          <section>
            <div className="mb-5 flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">내 문서</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {documents.length}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
