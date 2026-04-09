'use client'

import { useState } from 'react'
import { useDocumentStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { Field } from '@/lib/types'

interface AddOptionForm {
  label: string
  fieldId: string
  opt1Label: string
  opt1Value: string
  opt1Clause: string
  opt2Label: string
  opt2Value: string
  opt2Clause: string
}

const EMPTY_FORM: AddOptionForm = {
  label: '',
  fieldId: '',
  opt1Label: '포함',
  opt1Value: 'yes',
  opt1Clause: '',
  opt2Label: '미포함',
  opt2Value: 'no',
  opt2Clause: '',
}

interface AddConditionDialogProps {
  /** 트리거 버튼 스타일 변형 */
  triggerVariant?: 'text' | 'button'
}

export function AddConditionDialog({ triggerVariant = 'text' }: AddConditionDialogProps) {
  const { addContractOption } = useDocumentStore()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<AddOptionForm>(EMPTY_FORM)

  const handleAdd = () => {
    if (!form.label.trim()) { toast.error('질문을 입력해주세요.'); return }
    if (!form.fieldId.trim()) { toast.error('조건 ID를 입력해주세요.'); return }
    if (!/^\w+$/.test(form.fieldId.trim())) { toast.error('조건 ID는 영문·숫자·밑줄만 사용 가능합니다.'); return }
    if (!form.opt1Label.trim() || !form.opt2Label.trim()) { toast.error('선택지를 모두 입력해주세요.'); return }
    if (!form.opt1Clause.trim()) { toast.error('선택지 1의 조항 내용을 입력해주세요.'); return }

    const field: Field = {
      id: form.fieldId.trim(),
      label: form.label.trim(),
      type: 'radio',
      required: false,
      options: [
        { label: form.opt1Label.trim(), value: form.opt1Value.trim() || 'yes' },
        { label: form.opt2Label.trim(), value: form.opt2Value.trim() || 'no' },
      ],
    }
    addContractOption(field, form.opt1Clause.trim(), form.opt2Clause.trim())
    toast.success(`"${field.label}" 조건이 추가되었습니다.`)
    setForm(EMPTY_FORM)
    setOpen(false)
  }

  return (
    <>
      {triggerVariant === 'button' ? (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          조건 추가
        </Button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors py-1"
        >
          <Plus className="h-3.5 w-3.5" />
          조건 추가
        </button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>조건 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 pt-1">

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">질문 <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="예: 경쟁금지 조항을 포함하시겠습니까?"
                  value={form.label}
                  onChange={(e) => setForm(f => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  조건 ID <span className="text-destructive">*</span>
                  <span className="ml-1.5 text-muted-foreground font-normal text-[11px]">
                    {'영문·숫자·밑줄만. 조항에서 {{#if ID == "값"}} 형태로 쓰입니다.'}
                  </span>
                </Label>
                <Input
                  placeholder="예: no_compete"
                  value={form.fieldId}
                  onChange={(e) => setForm(f => ({ ...f, fieldId: e.target.value.replace(/[^\w]/g, '_') }))}
                  className="font-mono text-sm"
                />
              </div>
            </div>

            {/* 선택지 1 */}
            <div className="rounded-lg border p-3 space-y-2.5">
              <p className="text-xs font-semibold">선택지 1</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">표시명</Label>
                  <Input placeholder="포함" value={form.opt1Label} onChange={(e) => setForm(f => ({ ...f, opt1Label: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">값</Label>
                  <Input placeholder="yes" value={form.opt1Value} onChange={(e) => setForm(f => ({ ...f, opt1Value: e.target.value }))} className="h-8 text-sm font-mono" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">이 선택지일 때 삽입될 조항 내용 <span className="text-destructive">*</span></Label>
                <textarea
                  rows={4}
                  placeholder={"예:\n제 17 조(경쟁금지)\n을은 계약 종료 후 1년간 경쟁 업무를 할 수 없다."}
                  value={form.opt1Clause}
                  onChange={(e) => setForm(f => ({ ...f, opt1Clause: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            {/* 선택지 2 */}
            <div className="rounded-lg border p-3 space-y-2.5">
              <p className="text-xs font-semibold">선택지 2</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">표시명</Label>
                  <Input placeholder="미포함" value={form.opt2Label} onChange={(e) => setForm(f => ({ ...f, opt2Label: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">값</Label>
                  <Input placeholder="no" value={form.opt2Value} onChange={(e) => setForm(f => ({ ...f, opt2Value: e.target.value }))} className="h-8 text-sm font-mono" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">이 선택지일 때 삽입될 조항 내용 <span className="text-muted-foreground/60">(비워두면 미출력)</span></Label>
                <textarea
                  rows={3}
                  placeholder="비워두면 이 선택지 선택 시 해당 블록이 출력되지 않습니다."
                  value={form.opt2Clause}
                  onChange={(e) => setForm(f => ({ ...f, opt2Clause: e.target.value }))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => { setForm(EMPTY_FORM); setOpen(false) }}>취소</Button>
              <Button size="sm" onClick={handleAdd}>추가</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
