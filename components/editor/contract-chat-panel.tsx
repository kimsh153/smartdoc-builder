'use client'

import { useEffect, useRef, useState } from 'react'
import { useDocumentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Send, Key, Bot, User, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import type { ChatMessage, ContractChatResponse } from '@/app/api/contract-chat/route'

interface ContractChatPanelProps {
  onClose: () => void
}

interface UIMessage {
  role: 'user' | 'assistant'
  content: string
  pendingUpdate?: { content: string; message: string }
}

export function ContractChatPanel({ onClose }: ContractChatPanelProps) {
  const {
    selectedTemplate,
    customContent,
    customTitle,
    values,
    anthropicApiKey,
    setAnthropicApiKey,
    setCustomContent,
  } = useDocumentStore()

  const [messages, setMessages] = useState<UIMessage[]>([
    {
      role: 'assistant',
      content: `안녕하세요! **${customTitle ?? selectedTemplate?.name ?? '계약서'}** 편집을 도와드리겠습니다.\n\n조항 수정, 추가, 삭제 요청이나 계약서 내용에 대한 질문을 입력해주세요.\n\n예시:\n- "경쟁금지 기간을 계약 종료 후 2년으로 변경해줘"\n- "위약금 조항을 추가해줘"\n- "NDA 조항이 을에게 불리하지 않아?"`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(!anthropicApiKey)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const currentContent = customContent ?? selectedTemplate?.documentContent ?? ''
  const templateName = customTitle ?? selectedTemplate?.name ?? '계약서'

  const handleSaveKey = () => {
    const trimmed = keyInput.trim()
    if (!trimmed.startsWith('sk-ant-')) {
      toast.error('올바른 Anthropic API 키를 입력해주세요. (sk-ant-... 형식)')
      return
    }
    setAnthropicApiKey(trimmed)
    setShowKeyInput(false)
    setKeyInput('')
    toast.success('API 키가 저장되었습니다.')
  }

  const handleApplyUpdate = (newContent: string) => {
    setCustomContent(newContent)
    toast.success('계약서에 변경 사항이 적용되었습니다.')
    // 적용 완료 표시
    setMessages(prev => prev.map(m =>
      m.pendingUpdate?.content === newContent
        ? { ...m, pendingUpdate: undefined }
        : m
    ))
  }

  const handleSend = async () => {
    const text = input.trim()
    if (!text || loading) return
    if (!anthropicApiKey) { setShowKeyInput(true); return }

    const userMsg: UIMessage = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // API에 전달할 히스토리 (UI 전용 필드 제외)
    const history: ChatMessage[] = [...messages, userMsg]
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/contract-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
        },
        body: JSON.stringify({
          messages: history,
          currentContent,
          values,
          templateName,
        }),
      })

      if (res.status === 401) {
        toast.error('API 키가 유효하지 않습니다. 키를 다시 확인해주세요.')
        setShowKeyInput(true)
        setAnthropicApiKey(null)
        setMessages(prev => prev.slice(0, -1)) // 유저 메시지 롤백
        return
      }

      const data: ContractChatResponse | { error: string } = await res.json()

      if ('error' in data) {
        toast.error(data.error)
        setMessages(prev => [...prev, { role: 'assistant', content: `오류가 발생했습니다: ${data.error}` }])
        return
      }

      if (data.action === 'update') {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          pendingUpdate: { content: data.content, message: data.message },
        }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }])
      }
    } catch {
      toast.error('네트워크 오류가 발생했습니다.')
      setMessages(prev => [...prev, { role: 'assistant', content: '네트워크 오류가 발생했습니다. 다시 시도해주세요.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full border-l bg-background">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-card shrink-0">
        <Bot className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold flex-1">AI 계약서 편집</span>
        <button
          onClick={() => setShowKeyInput(v => !v)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="API 키 설정"
        >
          <Key className="h-4 w-4" />
        </button>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* API 키 입력 */}
      {showKeyInput && (
        <div className="px-4 py-3 border-b bg-amber-50/60 dark:bg-amber-950/20 shrink-0">
          <p className="text-xs text-amber-700 dark:text-amber-400 font-medium mb-2 flex items-center gap-1">
            <Key className="h-3 w-3" />
            Anthropic API 키 입력
          </p>
          <p className="text-xs text-muted-foreground mb-2">
            키는 이 브라우저에만 저장되며 서버에 보관되지 않습니다.{' '}
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" className="underline text-primary">키 발급 →</a>
          </p>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="sk-ant-..."
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveKey() }}
              className="text-xs h-8"
            />
            <Button size="sm" className="h-8 shrink-0" onClick={handleSaveKey}>저장</Button>
          </div>
          {anthropicApiKey && (
            <button
              className="text-xs text-muted-foreground mt-1.5 hover:text-destructive"
              onClick={() => { setAnthropicApiKey(null); toast.success('API 키가 삭제되었습니다.') }}
            >
              현재 키 삭제
            </button>
          )}
        </div>
      )}

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 ${msg.role === 'user' ? 'bg-primary' : 'bg-muted'}`}>
              {msg.role === 'user'
                ? <User className="h-3.5 w-3.5 text-primary-foreground" />
                : <Bot className="h-3.5 w-3.5 text-muted-foreground" />}
            </div>
            <div className={`max-w-[85%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`rounded-xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-tr-sm'
                  : 'bg-muted text-foreground rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              {/* 계약서 수정 적용 버튼 */}
              {msg.pendingUpdate && (
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => handleApplyUpdate(msg.pendingUpdate!.content)}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  계약서에 적용
                </Button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="bg-muted rounded-xl rounded-tl-sm px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}

        {!anthropicApiKey && !showKeyInput && (
          <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            API 키를 먼저 입력해주세요.
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="px-4 py-3 border-t bg-card shrink-0">
        <div className="flex gap-2">
          <Input
            placeholder={anthropicApiKey ? '계약서 수정 요청이나 질문을 입력하세요...' : 'API 키를 먼저 입력해주세요'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            disabled={loading || !anthropicApiKey}
            className="text-sm"
          />
          <Button size="icon" onClick={handleSend} disabled={loading || !input.trim() || !anthropicApiKey}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">
          AI 답변은 참고용입니다. 실제 법률 검토는 전문가에게 받으세요.
        </p>
      </div>
    </div>
  )
}
