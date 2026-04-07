'use client'

import { useEffect, useRef } from 'react'
import { useDocumentStore } from '@/lib/store'
import { toast } from 'sonner'

const MAX_CONTENT_LENGTH = 10000
const PLACEHOLDER_REGEX = /\{\{(\w+)\}\}/g

function validatePlaceholders(content: string): string[] {
  const invalid: string[] = []
  const open = (content.match(/\{\{/g) || []).length
  const close = (content.match(/\}\}/g) || []).length
  if (open !== close) {
    invalid.push('{{...}} 플레이스홀더 열림/닫힘이 맞지 않습니다.')
  }
  return invalid
}

interface TemplateEditorProps {
  /** textarea ref to allow SampleSnippetDrawer to insert text at cursor */
  editorRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function TemplateEditor({ editorRef }: TemplateEditorProps) {
  const { selectedTemplate, customContent, customFields, setCustomContent } = useDocumentStore()
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const ref = editorRef ?? internalRef

  const content = customContent ?? selectedTemplate?.documentContent ?? ''

  useEffect(() => {
    // Initialise customContent from template once
    if (customContent === null && selectedTemplate) {
      setCustomContent(selectedTemplate.documentContent)
    }
  }, [selectedTemplate, customContent, setCustomContent])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value

    const warnings = validatePlaceholders(val)
    if (warnings.length > 0) {
      toast.warning(warnings[0], { id: 'placeholder-warning' })
    }

    if (val.length > MAX_CONTENT_LENGTH) {
      toast.warning(`문서 내용이 ${MAX_CONTENT_LENGTH.toLocaleString()}자를 초과했습니다. 저장 전 확인해주세요.`, {
        id: 'content-length-warning',
      })
    }

    setCustomContent(val)
  }

  // Build hint of available placeholders
  const templateFields = selectedTemplate?.sections.flatMap(s => s.fields) ?? []
  const allFields = [...templateFields, ...customFields]

  return (
    <div className="flex h-full flex-col p-4 gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>문서 본문을 마크다운/HTML로 직접 편집합니다.</span>
        <span className={content.length > MAX_CONTENT_LENGTH ? 'text-destructive font-semibold' : ''}>
          {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}자
        </span>
      </div>

      <textarea
        ref={ref}
        value={content}
        onChange={handleChange}
        className="flex-1 w-full resize-none rounded-md border bg-background p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring"
        spellCheck={false}
        placeholder="문서 내용을 입력하세요. {{fieldId}} 형태로 필드 값을 참조할 수 있습니다."
      />

      {allFields.length > 0 && (
        <div className="rounded-md border bg-muted/30 p-3 text-xs">
          <p className="font-medium text-muted-foreground mb-2">사용 가능한 플레이스홀더</p>
          <div className="flex flex-wrap gap-1.5">
            {allFields.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  const ta = ref.current
                  if (!ta) return
                  const start = ta.selectionStart
                  const end = ta.selectionEnd
                  const before = content.slice(0, start)
                  const after = content.slice(end)
                  const snippet = `{{${f.id}}}`
                  const next = before + snippet + after
                  setCustomContent(next)
                  // Restore cursor after React re-render
                  requestAnimationFrame(() => {
                    ta.focus()
                    ta.setSelectionRange(start + snippet.length, start + snippet.length)
                  })
                }}
                className="rounded bg-primary/10 px-2 py-0.5 font-mono text-primary hover:bg-primary/20 transition-colors"
                title={f.label}
              >
                {`{{${f.id}}}`}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
