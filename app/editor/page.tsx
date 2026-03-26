'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { InputPanel } from '@/components/editor/input-panel'
import { PreviewPanel } from '@/components/editor/preview-panel'
import { EditorHeader } from '@/components/editor/editor-header'

export default function EditorPage() {
  const router = useRouter()
  const { selectedTemplate, currentDocument } = useDocumentStore()

  useEffect(() => {
    if (!selectedTemplate || !currentDocument) {
      router.push('/')
    }
  }, [selectedTemplate, currentDocument, router])

  if (!selectedTemplate || !currentDocument) {
    return null
  }

  return (
    <div className="flex h-screen flex-col">
      <EditorHeader />
      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 입력 패널 (40%) */}
        <div className="w-[40%] overflow-y-auto border-r bg-card">
          <InputPanel />
        </div>
        {/* 오른쪽 미리보기 패널 (60%) */}
        <div className="w-[60%] overflow-y-auto bg-[#f0f0f0]">
          <PreviewPanel />
        </div>
      </div>
    </div>
  )
}
