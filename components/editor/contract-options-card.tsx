'use client'

import { useDocumentStore } from '@/lib/store'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Info, Settings2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { AddConditionDialog } from './add-condition-dialog'
import type { Section } from '@/lib/types'

interface ContractOptionsCardProps {
  section: Section
}

function getActiveClausesSummary(values: Record<string, string>): string[] {
  const active: string[] = []
  const ct = values['contract_type']
  if (ct === 'project_based') active.push('제8조: 프로젝트 완료 기준')
  else if (ct) active.push('제8조: 기간제')
  const ip = values['ip_ownership']
  if (ip === 'contractor') active.push('제9조: IP → 을')
  else if (ip === 'joint') active.push('제9조: IP → 공동')
  else if (ip) active.push('제9조: IP → 갑')
  if (values['has_nda'] === 'yes') active.push('제10조: NDA 포함')
  if (values['has_ip_protection'] === 'yes') active.push('제11조: 제3자 IP 포함')
  const sub = values['allow_subcontract']
  if (sub === 'yes_with_consent') active.push('제12조: 재위탁 동의 시 허용')
  else if (sub) active.push('제12조: 재위탁 불허')
  const dr = values['dispute_resolution']
  if (dr === 'arbitration') active.push('제15조: 중재')
  else if (dr) active.push('제15조: 관할법원')
  return active
}

export function ContractOptionsCard({ section }: ContractOptionsCardProps) {
  const { values, setValue, setActiveSection, customContractOptions, removeContractOption } = useDocumentStore()

  const allFields = [...section.fields, ...customContractOptions]
  const hasAnyAnswer = allFields.some(f => !!values[f.id])
  const summary = hasAnyAnswer ? getActiveClausesSummary(values) : []

  return (
    <div
      className="rounded-xl border-2 border-primary/30 bg-primary/5 overflow-hidden"
      onFocus={() => setActiveSection(section.id)}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-2.5 px-5 py-3.5 bg-primary/10 border-b border-primary/20">
        <Settings2 className="h-4 w-4 text-primary shrink-0" />
        <h3 className="font-bold text-primary text-sm">계약 옵션 설정</h3>
        <span className="ml-auto text-xs text-primary/60 font-medium">답변에 따라 계약서 조항이 자동 구성됩니다</span>
      </div>

      {/* 질문 목록 */}
      <div className="px-5 py-4 space-y-5">
        {allFields.map((field) => (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-semibold text-foreground flex-1">
                {field.label}
                {field.required && <span className="ml-1 text-destructive">*</span>}
              </Label>
              {field.guide && (
                <Popover>
                  <PopoverTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </PopoverTrigger>
                  <PopoverContent className="text-sm max-w-xs">{field.guide}</PopoverContent>
                </Popover>
              )}
              {customContractOptions.some(f => f.id === field.id) && (
                <button
                  type="button"
                  onClick={() => { removeContractOption(field.id); toast.success('조건이 삭제되었습니다.') }}
                  className="text-destructive/60 hover:text-destructive transition-colors"
                  title="이 조건 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {field.type === 'radio' && field.options && (
              <RadioGroup
                value={values[field.id] || ''}
                onValueChange={(val) => setValue(field.id, val)}
                className="flex flex-wrap gap-3"
              >
                {field.options.map((opt) => (
                  <label
                    key={opt.value}
                    htmlFor={`${field.id}-${opt.value}`}
                    className={[
                      'flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm',
                      values[field.id] === opt.value
                        ? 'border-primary bg-primary text-primary-foreground font-medium shadow-sm'
                        : 'border-border bg-background hover:border-primary/50 hover:bg-primary/5',
                    ].join(' ')}
                  >
                    <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </RadioGroup>
            )}
          </div>
        ))}

        <AddConditionDialog triggerVariant="text" />
      </div>

      {/* 활성 조항 요약 */}
      {summary.length > 0 && (
        <div className="px-5 py-3.5 bg-primary/5 border-t border-primary/20">
          <p className="text-xs font-semibold text-primary/70 mb-2">현재 계약서 구성</p>
          <div className="flex flex-wrap gap-1.5">
            {summary.map((item) => (
              <span key={item} className="inline-block rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
