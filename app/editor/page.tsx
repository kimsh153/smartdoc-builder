'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { InputPanel } from '@/components/editor/input-panel'
import { PreviewPanel } from '@/components/editor/preview-panel'
import { EditorHeader } from '@/components/editor/editor-header'
import { ReviewDialog } from '@/components/editor/review-dialog'
import { TemplateEditor } from '@/components/editor/TemplateEditor'
import { SampleSnippetDrawer } from '@/components/editor/SampleSnippetDrawer'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen, Save, FolderOpen, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

type EditorTab = 'form' | 'md' | 'preview'

// ── Save Custom Template Dialog ────────────────────────────
function SaveTemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { saveCustomTemplate } = useDocumentStore()
  const [name, setName] = useState('')

  const handleSave = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    saveCustomTemplate(trimmed)
    toast.success(`"${trimmed}" 템플릿이 저장되었습니다.`)
    setName('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>이 템플릿 저장</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>템플릿 이름</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 수정된 용역계약서"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleSave} disabled={!name.trim()}>저장</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Load Custom Template Dialog ────────────────────────────
function LoadTemplateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { savedCustomTemplates, loadCustomTemplate, deleteCustomTemplate } = useDocumentStore()

  const handleLoad = (id: string) => {
    loadCustomTemplate(id)
    toast.success('커스텀 템플릿을 불러왔습니다.')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>커스텀 템플릿 불러오기</DialogTitle>
        </DialogHeader>
        {savedCustomTemplates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">저장된 커스텀 템플릿이 없습니다.</p>
        ) : (
          <ScrollArea className="max-h-72">
            <div className="space-y-2 pr-2">
              {savedCustomTemplates.map((tpl) => (
                <div key={tpl.id} className="flex items-center gap-2 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tpl.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tpl.createdAt).toLocaleString('ko-KR')}</p>
                  </div>
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
export default function EditorPage() {
  const router = useRouter()
  const { selectedTemplate, currentDocument } = useDocumentStore()
  const [activeTab, setActiveTab] = useState<EditorTab>('form')
  const [snippetOpen, setSnippetOpen] = useState(false)
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [loadDialogOpen, setLoadDialogOpen] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!selectedTemplate || !currentDocument) {
      router.push('/')
    }
  }, [selectedTemplate, currentDocument, router])

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
                'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          {activeTab === 'md' && (
            <Button size="sm" variant="outline" onClick={() => setSnippetOpen(true)}>
              <BookOpen className="mr-1.5 h-3.5 w-3.5" />
              샘플 조항
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setSaveDialogOpen(true)}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            이 템플릿 저장
          </Button>
          <Button size="sm" variant="outline" onClick={() => setLoadDialogOpen(true)}>
            <FolderOpen className="mr-1.5 h-3.5 w-3.5" />
            불러오기
          </Button>
        </div>
      </div>

      {/* Content */}
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
            <div className="w-[50%] overflow-y-auto border-r bg-card">
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

      <ReviewDialog />

      <SampleSnippetDrawer
        open={snippetOpen}
        onClose={() => setSnippetOpen(false)}
        editorRef={editorRef}
      />

      <SaveTemplateDialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} />
      <LoadTemplateDialog open={loadDialogOpen} onClose={() => setLoadDialogOpen(false)} />
    </div>
  )
}
