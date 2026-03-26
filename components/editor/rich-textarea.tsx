'use client'

import { useRef } from 'react'
import { Bold, Italic, Underline, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface RichTextareaProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}

export function RichTextarea({ id, value, onChange, placeholder, rows = 4 }: RichTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const wrapSelection = (before: string, after: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = value.slice(start, end)
    const newValue = value.slice(0, start) + before + selected + after + value.slice(end)
    onChange(newValue)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    })
  }

  const insertBullet = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const lineStart = value.lastIndexOf('\n', start - 1) + 1
    const newValue = value.slice(0, lineStart) + '• ' + value.slice(lineStart)
    onChange(newValue)

    requestAnimationFrame(() => {
      textarea.focus()
      const newPos = start + 2
      textarea.setSelectionRange(newPos, newPos)
    })
  }

  return (
    <div>
      <div className="flex gap-1 rounded-t-md border border-b-0 bg-muted/50 px-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => wrapSelection('**', '**')}
          title="굵게"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => wrapSelection('*', '*')}
          title="기울임"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => wrapSelection('__', '__')}
          title="밑줄"
        >
          <Underline className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={insertBullet}
          title="목록"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="rounded-t-none"
      />
    </div>
  )
}
