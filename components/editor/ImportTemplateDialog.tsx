'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Template } from '@/lib/types'
import { useDocumentStore } from '@/lib/store'
import { toast } from 'sonner'

interface ImportTemplateDialogProps {
  open: boolean
  template: Template | null
  onClose: () => void
  onImport?: (template: Template) => void
}

export function ImportTemplateDialog({ open, template, onClose, onImport }: ImportTemplateDialogProps) {
  const { addTemplate } = useDocumentStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
    }
  }, [template])

  const handleConfirm = () => {
    if (!template) return
    
    const updatedTemplate: Template = {
      ...template,
      // Always generate a fresh ID so imports never overwrite existing templates
      id: crypto.randomUUID(),
      name: name.trim() || template.name,
      description: description.trim() || template.description,
    }
    
    addTemplate(updatedTemplate)
    toast.success(`"${updatedTemplate.name}" 템플릿을 라이브러리에 추가했습니다.`)
    
    if (onImport) {
      onImport(updatedTemplate)
    }
    
    onClose()
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>템플릿 가져오기</DialogTitle>
          <DialogDescription>
            가져올 템플릿의 이름과 설명을 확인하거나 수정하세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="import-name">템플릿 이름</Label>
            <Input
              id="import-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="템플릿 이름을 입력하세요"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="import-description">설명</Label>
            <Textarea
              id="import-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="템플릿에 대한 설명을 입력하세요"
              className="resize-none h-20"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleConfirm} disabled={!name.trim()}>가져오기</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
