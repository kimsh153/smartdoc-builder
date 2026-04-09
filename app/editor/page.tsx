'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { decodeTemplate } from '@/lib/share'
import { InputPanel } from '@/components/editor/input-panel'
import { PreviewPanel } from '@/components/editor/preview-panel'
import { EditorHeader } from '@/components/editor/editor-header'
import { ReviewDialog } from '@/components/editor/review-dialog'
import { TemplateEditor } from '@/components/editor/TemplateEditor'
import { SampleSnippetDrawer } from '@/components/editor/SampleSnippetDrawer'
import { useQAResult } from '@/components/editor/QAResultPanel'
import type { CustomTemplate } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BookOpen, Save, FolderOpen, Star, Trash2, Share2, Link as LinkIcon, Download, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { ImportTemplateDialog } from '@/components/editor/ImportTemplateDialog'
import { getShareableUrl, exportTemplateAsJson } from '@/lib/share'
import type { Template } from '@/lib/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ContractChatPanel } from '@/components/editor/contract-chat-panel'

type EditorTab = 'form' | 'md' | 'preview'

// ── Save Custom Template Dialog ────────────────────────────
function SaveTemplateDialog({ open, onClose, disabled }: { open: boolean; onClose: () => void; disabled?: boolean }) {
  const { saveCustomTemplate } = useDocumentStore()
  const [name, setName] = useState('')
  const [scope, setScope] = useState<CustomTemplate['scope']>('personal')
  const [versionTag, setVersionTag] = useState('')

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    saveCustomTemplate(trimmed, { scope, versionTag: versionTag.trim() || undefined })
    toast.success(`"${trimmed}" 템플릿이 저장되었습니다.`)
    setName('')
    setScope('personal')
    setVersionTag('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>이 템플릿 저장</DialogTitle>
        </DialogHeader>
        {disabled && (
          <p className="text-xs text-destructive rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2">
            QA 오류가 있어 저장할 수 없습니다. MD 편집 탭에서 오류를 수정한 후 다시 시도하세요.
          </p>
        )}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>템플릿 이름</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 수정된 용역계약서"
              onKeyDown={(e) => { if (e.key === 'Enter' && !disabled) handleSave() }}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>버전 태그 (선택)</Label>
            <Input
              value={versionTag}
              onChange={(e) => setVersionTag(e.target.value)}
              placeholder="예: v1, draft, final"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label>범위</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as CustomTemplate['scope'])} disabled={disabled}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">개인 (personal)</SelectItem>
                <SelectItem value="team">팀 (team)</SelectItem>
                <SelectItem value="company">회사 (company)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={!name.trim() || disabled}>저장</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Load Custom Template Dialog ────────────────────────────
function LoadTemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { savedCustomTemplates, loadCustomTemplate, deleteCustomTemplate, toggleStarCustomTemplate } = useDocumentStore()

  const handleLoad = (id: string) => {
    loadCustomTemplate(id)
    toast.success('커스텀 템플릿을 불러왔습니다.')
    onClose()
  }

  // Sort: starred first, then by createdAt desc
  const sorted = [...savedCustomTemplates].sort((a, b) => {
    if (a.starred && !b.starred) return -1
    if (!a.starred && b.starred) return 1
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  })

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>커스텀 템플릿 불러오기</DialogTitle>
        </DialogHeader>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">저장된 커스텀 템플릿이 없습니다.</p>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="space-y-2 pr-2">
              {sorted.map((tpl) => (
                <div key={tpl.id} className="flex items-center gap-2 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{tpl.name}</p>
                      {tpl.versionTag && (
                        <span className="shrink-0 text-xs border rounded px-1 text-muted-foreground">{tpl.versionTag}</span>
                      )}
                      {tpl.scope && tpl.scope !== 'personal' && (
                        <span className="shrink-0 text-xs border rounded px-1 text-blue-600">{tpl.scope}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{new Date(tpl.createdAt).toLocaleString('ko-KR')}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={`h-7 w-7 ${tpl.starred ? 'text-amber-400' : 'text-muted-foreground'}`}
                    onClick={() => toggleStarCustomTemplate(tpl.id)}
                    title={tpl.starred ? '즐겨찾기 해제' : '즐겨찾기'}
                  >
                    <Star className="h-3.5 w-3.5" fill={tpl.starred ? 'currentColor' : 'none'} />
                  </Button>
                  <Button size="sm" onClick={() => handleLoad(tpl.id)}>불러오기</Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => deleteCustomTemplate(tpl.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ── Main page ──────────────────────────────────────────────
function EditorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { selectedTemplate, currentDocument, addTemplate, createDocument, customTitle, customContent, customFields } = useDocumentStore()
  const [activeTab, setActiveTab] = useState<EditorTab>('form')
  const [snippetOpen, setSnippetOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const [importingTemplate, setImportingTemplate] = useState<Template | null>(null)
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  const qa = useQAResult()

  // Handle shared template
  useEffect(() => {
    const shareData = searchParams.get('share')
    if (shareData) {
      const template = decodeTemplate(shareData)
      if (template) {
        setImportingTemplate(template)
        setIsImportDialogOpen(true)
        
        // Clear share param from URL immediately
        const newUrl = window.location.pathname
        window.history.replaceState({}, '', newUrl)
      } else {
        toast.error('올바르지 않은 공유 링크입니다.')
      }
    }
  }, [searchParams])

  useEffect(() => {
    // Only redirect if there is no shared template being processed
    if (!searchParams.get('share') && (!selectedTemplate || !currentDocument)) {
      router.push('/')
    }
  }, [selectedTemplate, currentDocument, router, searchParams])

  if (!selectedTemplate || !currentDocument) {
    return null
  }

  const tabs: { key: EditorTab; label: string }[] = [
    { key: 'form', label: '폼 입력' },
    { key: 'md', label: 'MD 편집' },
    { key: 'preview', label: '미리보기' },
  ]

  return (
    <div className="flex h-screen flex-col">
      <EditorHeader />

      {/* Tab bar + custom template actions */}
      <div className="flex items-center justify-between border-b bg-card px-4 py-1.5">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                'relative rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {tab.label}
              {/* QA badge on MD 편집 tab */}
              {tab.key === 'md' && (qa.errorCount > 0 || qa.warningCount > 0) && (
                <span
                  className={[
                    'absolute -top-1 -right-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none text-white',
                    qa.errorCount > 0 ? 'bg-destructive' : 'bg-amber-500',
                  ].join(' ')}
                  title={`QA: 오류 ${qa.errorCount}개, 경고 ${qa.warningCount}개`}
                >
                  {qa.errorCount > 0 ? qa.errorCount : qa.warningCount}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant={chatOpen ? 'default' : 'outline'}
            onClick={() => setChatOpen(v => !v)}
            title="AI와 함께 계약서 편집"
          >
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            AI 편집
          </Button>
          {activeTab === 'md' && (
            <Button size="sm" variant="outline" onClick={() => setSnippetOpen(true)}>
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              샘플 조항
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSaveDialogOpen(true)}
            className={!qa.pass ? 'border-destructive/50 text-destructive' : ''}
            title={!qa.pass ? 'QA 오류가 있습니다. MD 편집 탭에서 확인하세요.' : '이 템플릿 저장'}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            이 템플릿 저장
            {!qa.pass && <span className="ml-1 text-[10px]">⚠</span>}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Share2 className="mr-1.5 h-3.5 w-3.5" />
                공유
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuItem
                onClick={() => {
                  if (!selectedTemplate) return
                  const shareTpl: Template = {
                    ...selectedTemplate,
                    name: customTitle || selectedTemplate.name,
                    documentContent: customContent || selectedTemplate.documentContent,
                    sections: selectedTemplate.sections.map(s => {
                      if (s.id === 'custom') {
                        return { ...s, fields: customFields }
                      }
                      return s
                    })
                  }
                  const url = getShareableUrl(shareTpl)
                  navigator.clipboard.writeText(url)
                  toast.success('수정된 템플릿 공유용 링크가 복사되었습니다.')
                }}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                링크 공유
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!selectedTemplate) return
                  const shareTpl: Template = {
                    ...selectedTemplate,
                    name: customTitle || selectedTemplate.name,
                    documentContent: customContent || selectedTemplate.documentContent,
                    sections: selectedTemplate.sections.map(s => {
                      if (s.id === 'custom') {
                        return { ...s, fields: customFields }
                      }
                      return s
                    })
                  }
                  exportTemplateAsJson(shareTpl)
                  toast.success('템플릿 파일(.json)이 다운로드되었습니다.')
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                파일 다운로드
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="outline" onClick={() => setLoadDialogOpen(true)}>
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            불러오기
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* 메인 편집 영역 */}
        <div className="flex flex-1 overflow-hidden">
          {activeTab === 'form' && (
            <>
              <div className="w-[40%] overflow-y-auto border-r bg-card">
                <InputPanel />
              </div>
              <div className="w-[60%] overflow-y-auto bg-[#f0f0f0]">
                <PreviewPanel />
              </div>
            </>
          )}

          {activeTab === 'md' && (
            <>
              <div className="w-[50%] flex flex-col overflow-hidden border-r bg-card">
                <TemplateEditor editorRef={editorRef} />
              </div>
              <div className="w-[50%] overflow-y-auto bg-[#f0f0f0]">
                <PreviewPanel />
              </div>
            </>
          )}

          {activeTab === 'preview' && (
            <div className="w-full overflow-y-auto bg-[#f0f0f0]">
              <PreviewPanel />
            </div>
          )}
        </div>

        {/* AI 채팅 패널 (우측 사이드) */}
        {chatOpen && (
          <div className="w-[340px] shrink-0 overflow-hidden">
            <ContractChatPanel onClose={() => setChatOpen(false)} />
          </div>
        )}
      </div>

      <ReviewDialog />

      <SampleSnippetDrawer
        open={snippetOpen}
        onClose={() => setSnippetOpen(false)}
        editorRef={editorRef}
      />

      <SaveTemplateDialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        disabled={!qa.pass}
      />
      <LoadTemplateDialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)} />
      <ImportTemplateDialog
        open={isImportDialogOpen}
        template={importingTemplate}
        onClose={() => {
          setIsImportDialogOpen(false)
          setImportingTemplate(null)
        }}
        onImport={(tpl) => {
          createDocument(tpl.id)
        }}
      />
    </div>
  )
}

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    }>
      <EditorContent />
    </Suspense>
  )
}
