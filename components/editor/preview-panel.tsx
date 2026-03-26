'use client'

import { useMemo } from 'react'
import { useDocumentStore } from '@/lib/store'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

export function PreviewPanel() {
  const { selectedTemplate, values } = useDocumentStore()

  const renderedContent = useMemo(() => {
    if (!selectedTemplate) return ''

    let content = selectedTemplate.documentContent

    // {{fieldId}} 패턴을 찾아서 값으로 교체
    const placeholderRegex = /\{\{(\w+)\}\}/g

    content = content.replace(placeholderRegex, (match, fieldId) => {
      const value = values[fieldId]
      if (value) {
        // 입력된 값은 볼드 + 밑줄로 표시 (XSS 방지를 위해 HTML 이스케이프)
        return `<span class="font-bold underline underline-offset-2">${escapeHtml(value)}</span>`
      }
      // 미입력 필드는 밑줄로 표시
      return '<span class="text-muted-foreground">ㅡㅡㅡㅡ</span>'
    })

    // 줄바꿈을 <br>로 변환
    content = content.replace(/\n/g, '<br />')

    return content
  }, [selectedTemplate, values])

  if (!selectedTemplate) return null

  return (
    <div className="flex justify-center p-8">
      {/* A4 문서 */}
      <div
        id="document-preview"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white p-12 shadow-lg font-serif text-[14px] leading-relaxed"
        style={{
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1), 0 0 0 1px rgb(0 0 0 / 0.05)',
        }}
      >
        <div 
          className="whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: renderedContent }}
        />
      </div>
    </div>
  )
}
