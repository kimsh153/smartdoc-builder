'use client'

import { useDocumentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

export const SAMPLE_SNIPPETS = [
  {
    title: '비밀유지 조항',
    body: `제__조 (비밀유지)\n① 각 당사자는 본 계약의 이행과 관련하여 취득한 상대방의 기술상·경영상의 정보를 제3자에게 누설하거나 본 계약 이외의 목적으로 사용하여서는 아니 된다.\n② 본 조의 의무는 계약 종료 후 3년간 존속한다.`,
  },
  {
    title: '분쟁해결 조항',
    body: `제__조 (분쟁해결)\n본 계약에 관한 분쟁은 당사자 간의 협의로 해결하되, 협의가 이루어지지 아니할 경우 관할 법원에 소를 제기할 수 있다. 관할법원은 [관할법원]으로 한다.`,
  },
  {
    title: '손해배상 조항',
    body: `제__조 (손해배상)\n일방 당사자가 본 계약상의 의무를 위반하여 상대방에게 손해를 끼친 경우, 위반 당사자는 그로 인한 모든 손해를 배상하여야 한다.`,
  },
  {
    title: '계약 해지 조항',
    body: `제__조 (계약해지)\n① 일방 당사자가 본 계약을 중대하게 위반한 경우, 상대방은 30일의 서면 통지 후 본 계약을 해지할 수 있다.\n② 계약 해지 시 이미 이행된 부분에 대한 정산은 양 당사자 협의에 따른다.`,
  },
  {
    title: '지식재산권 귀속',
    body: `제__조 (지식재산권)\n본 계약의 이행 과정에서 발생하는 모든 지식재산권은 [귀속 당사자]에 귀속된다. 단, 사전에 별도 합의가 있을 경우 그에 따른다.`,
  },
  {
    title: '계약 기간',
    body: `제__조 (계약기간)\n본 계약의 유효기간은 계약 체결일로부터 [기간] 까지로 하며, 기간 만료 30일 전까지 서면으로 갱신 거절 의사를 통지하지 않는 한 동일 조건으로 자동 연장된다.`,
  },
  {
    title: '용역 범위',
    body: `제__조 (용역의 범위)\n"을"은 다음 각 호의 업무를 수행한다.\n1. [업무 항목 1]\n2. [업무 항목 2]\n3. [업무 항목 3]\n세부 사항은 별첨 작업명세서에 따른다.`,
  },
  {
    title: '대금 지급 조건',
    body: `제__조 (대금 지급)\n① "갑"은 "을"에게 계약금 [금액]원을 계약 체결 후 [일수]일 이내에 지급한다.\n② 잔금 [금액]원은 최종 산출물 납품 후 [일수]일 이내에 지급한다.\n③ 부가가치세는 별도로 한다.`,
  },
  {
    title: '납품 및 검수',
    body: `제__조 (납품 및 검수)\n① "을"은 계약 체결 후 [기간] 이내에 산출물을 "갑"에게 납품한다.\n② "갑"은 납품 후 [일수]일 이내에 검수를 완료하여야 하며, 이의 없이 기간이 경과하면 검수 완료된 것으로 본다.`,
  },
  {
    title: '준거법',
    body: `제__조 (준거법)\n본 계약은 대한민국 법률에 따라 해석되고 집행된다.`,
  },
]

interface SampleSnippetDrawerProps {
  open: boolean
  onClose: () => void
  editorRef: React.RefObject<HTMLTextAreaElement | null>
}

export function SampleSnippetDrawer({ open, onClose, editorRef }: SampleSnippetDrawerProps) {
  const { customContent, selectedTemplate, setCustomContent } = useDocumentStore()

  const insertSnippet = (body: string) => {
    const ta = editorRef.current
    const current = customContent ?? selectedTemplate?.documentContent ?? ''

    if (ta) {
      const start = ta.selectionStart
      const end = ta.selectionEnd
      const before = current.slice(0, start)
      const after = current.slice(end)
      const next = before + '\n' + body + '\n' + after
      setCustomContent(next)
      requestAnimationFrame(() => {
        ta.focus()
        const pos = start + body.length + 2
        ta.setSelectionRange(pos, pos)
      })
    } else {
      setCustomContent(current + '\n' + body)
    }
    onClose()
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <SheetContent side="right" className="w-[380px] sm:w-[420px] flex flex-col">
        <SheetHeader>
          <SheetTitle>샘플 조항 삽입</SheetTitle>
          <p className="text-sm text-muted-foreground">클릭하면 현재 커서 위치에 삽입됩니다.</p>
        </SheetHeader>
        <ScrollArea className="flex-1 mt-4 pr-2">
          <div className="space-y-3">
            {SAMPLE_SNIPPETS.map((snippet) => (
              <div key={snippet.title} className="rounded-md border p-3 space-y-2">
                <p className="text-sm font-semibold">{snippet.title}</p>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-3">
                  {snippet.body}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => insertSnippet(snippet.body)}
                >
                  삽입
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
