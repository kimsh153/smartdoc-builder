'use client'

import { useEffect, useRef } from 'react'
import { useDocumentStore } from '@/lib/store'
import { QAResultPanel } from '@/components/editor/QAResultPanel'
import { AddConditionDialog } from '@/components/editor/add-condition-dialog'
import { Button } from '@/components/ui/button'
import { Undo2, Redo2, Bold, Italic, Strikethrough, Heading1, Heading3, AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
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
  const {
    selectedTemplate,
    customTitle,
    customContent,
    customFields,
    customContractOptions,
    historyStack,
    historyIndex,
    setCustomTitle,
    setCustomContent,
    undoContent,
    redoContent,
  } = useDocumentStore()
  const internalRef = useRef<HTMLTextAreaElement>(null)
  const ref = editorRef ?? internalRef

  const content = customContent ?? selectedTemplate?.documentContent ?? ''
  const titleValue = customTitle ?? selectedTemplate?.name ?? ''

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

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < historyStack.length - 1

  /** 커서 위치에 스니펫 삽입 */
  const insertSnippet = (snippet: string) => {
    const ta = ref.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const next = content.slice(0, start) + snippet + content.slice(end)
    setCustomContent(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(start + snippet.length, start + snippet.length)
    })
  }

  const applyFormat = (prefix: string, suffix: string = '') => {
    const ta = ref.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = content.slice(start, end)
    
    const beforeSelection = content.slice(0, start)
    const afterSelection = content.slice(end)
    
    let nextContent = ''
    let newStart = start
    let newEnd = end
    
    if (!suffix) {
      const lastNewline = beforeSelection.lastIndexOf('\n')
      const lineStart = lastNewline === -1 ? 0 : lastNewline + 1
      const lineBeforeCursor = content.slice(lineStart, start)
      
      if (lineBeforeCursor.startsWith(prefix)) {
        nextContent = content.slice(0, lineStart) + lineBeforeCursor.slice(prefix.length) + selected + afterSelection
        newStart = Math.max(lineStart, start - prefix.length)
        newEnd = Math.max(lineStart, end - prefix.length)
      } else if (selected.startsWith(prefix)) {
        nextContent = beforeSelection + selected.slice(prefix.length) + afterSelection
        newEnd = end - prefix.length
      } else {
        nextContent = beforeSelection + prefix + selected + afterSelection
        if (selected) {
          newStart = start
          newEnd = start + prefix.length + selected.length
        } else {
          newStart = start + prefix.length
          newEnd = start + prefix.length
        }
      }
    } else {
      if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= prefix.length + suffix.length) {
        nextContent = beforeSelection + selected.slice(prefix.length, -suffix.length) + afterSelection
        newEnd = end - prefix.length - suffix.length
      } 
      else if (beforeSelection.endsWith(prefix) && afterSelection.startsWith(suffix)) {
        nextContent = content.slice(0, start - prefix.length) + selected + content.slice(end + suffix.length)
        newStart = start - prefix.length
        newEnd = end - prefix.length
      } 
      else {
        let isInside = false
        let prefixIdx = -1
        let suffixIdx = -1

        if (prefix === suffix) {
          const lastPrefix = beforeSelection.lastIndexOf(prefix)
          const nextSuffix = afterSelection.indexOf(suffix)
          if (lastPrefix !== -1 && nextSuffix !== -1) {
             const textBetween = content.slice(lastPrefix + prefix.length, end + nextSuffix)
             if (!textBetween.includes(prefix)) {
               isInside = true
               prefixIdx = lastPrefix
               suffixIdx = end + nextSuffix
             }
          }
        } else {
          const lastPrefix = beforeSelection.lastIndexOf(prefix)
          const nextSuffix = afterSelection.indexOf(suffix)
          if (lastPrefix !== -1 && nextSuffix !== -1) {
            const lastSuffixBefore = beforeSelection.lastIndexOf(suffix)
            if (lastSuffixBefore < lastPrefix) {
               isInside = true
               prefixIdx = lastPrefix
               suffixIdx = end + nextSuffix
            }
          }
        }

        if (isInside) {
          nextContent = content.slice(0, prefixIdx) + content.slice(prefixIdx + prefix.length, suffixIdx) + content.slice(suffixIdx + suffix.length)
          newStart = Math.max(prefixIdx, start - prefix.length)
          newEnd = Math.max(prefixIdx, end - prefix.length)
        } else {
          nextContent = beforeSelection + prefix + selected + suffix + afterSelection
          if (selected) {
            newStart = start
            newEnd = start + prefix.length + selected.length + suffix.length
          } else {
            newStart = start + prefix.length
            newEnd = start + prefix.length
          }
        }
      }
    }
    
    setCustomContent(nextContent)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(newStart, newEnd)
    })
  }

  // Build hint of available placeholders
  // contract-options 섹션 필드는 조건 블록 전용이므로 일반 플레이스홀더 목록에서 제외
  const templateFields = selectedTemplate?.sections
    .filter(s => s.id !== 'contract-options')
    .flatMap(s => s.fields) ?? []
  const allFields = [...templateFields, ...customFields]

  // 조건 블록 스니펫 — contract-options 섹션 필드 기반으로 자동 생성
  const conditionFields = selectedTemplate?.sections
    .find(s => s.id === 'contract-options')?.fields ?? []

  return (
    <div className="flex h-full flex-col">
      {/* Title Input */}
      <div className="px-5 pt-4 pb-2 border-b bg-muted/10">
        <input
          type="text"
          value={titleValue}
          onChange={(e) => setCustomTitle(e.target.value)}
          placeholder="문서 제목을 입력하세요"
          className="w-full text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-0 placeholder:text-muted-foreground/50"
        />
      </div>

      {/* 툴바: 서식, undo/redo + 글자수 */}
      <div className="flex items-center gap-1.5 border-b px-3 py-1.5 overflow-x-auto">
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canUndo} onClick={undoContent} title="실행 취소 (Ctrl+Z)">
          <Undo2 className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" disabled={!canRedo} onClick={redoContent} title="다시 실행 (Ctrl+Y)">
          <Redo2 className="h-3.5 w-3.5" />
        </Button>

        <div className="w-[1px] h-4 bg-border mx-1" />

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('**', '**')} title="굵게">
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('*', '*')} title="기울임꼴">
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('~~', '~~')} title="취소선">
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>

        <div className="w-[1px] h-4 bg-border mx-1" />

        <Button variant="ghost" size="icon" className="h-7 w-7 font-bold text-xs" onClick={() => applyFormat('# ')} title="대제목 (H1)">
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 font-bold text-xs" onClick={() => applyFormat('### ')} title="소제목 (H3)">
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="w-[1px] h-4 bg-border mx-1" />

        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('<div style="text-align: left;">\n', '\n</div>')} title="왼쪽 정렬">
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('<div style="text-align: center;">\n', '\n</div>')} title="가운데 정렬">
          <AlignCenter className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => applyFormat('<div style="text-align: right;">\n', '\n</div>')} title="오른쪽 정렬">
          <AlignRight className="h-3.5 w-3.5" />
        </Button>

        <span className="text-xs text-muted-foreground ml-2 hidden xl:inline-block">마크다운/HTML 변환 지원</span>
        <span className={`ml-auto text-xs whitespace-nowrap pl-2 ${content.length > MAX_CONTENT_LENGTH ? 'text-destructive font-semibold' : 'text-muted-foreground'}`}>
          {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}자
        </span>
      </div>

      {/* textarea */}
      <textarea
        ref={ref}
        value={content}
        onChange={handleChange}
        className="flex-1 w-full resize-none bg-background p-3 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring"
        spellCheck={false}
        placeholder="문서 내용을 입력하세요. {{fieldId}} 형태로 필드 값을 참조할 수 있습니다."
      />

      {/* 사용 가능한 플레이스홀더 */}
      {allFields.length > 0 && (
        <div className="border-t bg-muted/30 p-3 text-xs">
          <p className="font-medium text-muted-foreground mb-2">사용 가능한 플레이스홀더</p>
          <div className="flex flex-wrap gap-1.5">
            {allFields.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => insertSnippet(`{{${f.id}}}`)}
                className="rounded bg-primary/10 px-2 py-0.5 font-mono text-primary hover:bg-primary/20 transition-colors"
                title={f.label}
              >
                {`{{${f.id}}}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 조건 블록 패널 */}
      <div className="border-t bg-amber-50/60 dark:bg-amber-950/20 p-3 text-xs">
        <div className="flex items-center justify-between mb-2">
          <p className="font-medium text-amber-700 dark:text-amber-400">조건 블록 — 클릭하면 커서 위치에 삽입됩니다</p>
          <AddConditionDialog triggerVariant="button" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[...conditionFields, ...customContractOptions].map(f => {
            const firstValue = f.options?.[0]?.value ?? 'value'
            const snippet = `{{#if ${f.id} == "${firstValue}"}}\n(조건 참일 때 내용)\n{{#else}}\n(조건 거짓일 때 내용)\n{{/if}}`
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => insertSnippet(snippet)}
                className="rounded bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 font-mono text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800/40 transition-colors"
                title={`${f.label}`}
              >
                {`#if ${f.id}`}
              </button>
            )
          })}
        </div>
        <p className="mt-1.5 text-[10px] text-amber-600/70 dark:text-amber-500/70">
          연산자: <code>==</code>, <code>!=</code> / 블록: <code>{'{{#if}}'}</code> <code>{'{{#elif}}'}</code> <code>{'{{#else}}'}</code> <code>{'{{/if}}'}</code>
        </p>
      </div>

      {/* QA 결과 패널 */}
      <QAResultPanel />
    </div>
  )
}
