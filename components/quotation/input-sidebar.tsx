'use client'

import { useQuotationStore } from '@/lib/quotation/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'

export function InputSidebar() {
  const { data, updateField } = useQuotationStore()

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* 견적 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">견적 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">고객사명</Label>
            <Input
              value={data.clientName}
              onChange={e => updateField('clientName', e.target.value)}
              placeholder="(주)고객사명"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">견적일자</Label>
              <Input
                type="date"
                value={data.quoteDate}
                onChange={e => updateField('quoteDate', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">유효기간 (일)</Label>
              <Input
                type="number"
                value={data.validDays}
                min={1}
                onChange={e => updateField('validDays', Number(e.target.value))}
                placeholder="30"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">담당자명</Label>
            <Input
              value={data.salesPerson}
              onChange={e => updateField('salesPerson', e.target.value)}
              placeholder="홍길동 매니저"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">연락처</Label>
            <Input
              value={data.salesContact}
              onChange={e => updateField('salesContact', e.target.value)}
              placeholder="+82 10-0000-0000"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">이메일</Label>
            <Input
              type="email"
              value={data.salesEmail}
              onChange={e => updateField('salesEmail', e.target.value)}
              placeholder="name@company.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* 비용 구성 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">비용 구성</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">제경비 비율 (%)</Label>
              <Input
                type="number"
                value={Math.round(data.overheadRate * 100)}
                min={0}
                max={100}
                step={1}
                onChange={e => updateField('overheadRate', Number(e.target.value) / 100)}
                placeholder="25"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">기술료 비율 (%)</Label>
              <Input
                type="number"
                value={Math.round(data.profitRate * 100)}
                min={0}
                max={100}
                step={1}
                onChange={e => updateField('profitRate', Number(e.target.value) / 100)}
                placeholder="20"
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">파트너 할인 (원)</Label>
            <Input
              type="number"
              value={data.discount}
              min={0}
              step={100000}
              onChange={e => updateField('discount', Number(e.target.value))}
              placeholder="0"
            />
          </div>
          <div className="flex items-center justify-between rounded-md border px-3 py-2">
            <div>
              <p className="text-sm font-medium">중도금</p>
              <p className="text-xs text-muted-foreground">
                {data.hasInterimPayment ? '선금 40% / 중도금 30% / 잔금 30%' : '선금 50% / 잔금 50%'}
              </p>
            </div>
            <Switch
              checked={data.hasInterimPayment}
              onCheckedChange={v => {
                updateField('hasInterimPayment', v)
                updateField(
                  'paymentMethod',
                  v ? '선금 40% / 중도금 30% / 잔금 30%' : '선금 50% / 잔금 50%',
                )
              }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">결제 방법</Label>
            <Input
              value={data.paymentMethod}
              onChange={e => updateField('paymentMethod', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">청구 방법</Label>
            <Input
              value={data.billingMethod}
              onChange={e => updateField('billingMethod', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 프로젝트 정보 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">최종 결과물</Label>
            <Input
              value={data.deliverable}
              onChange={e => updateField('deliverable', e.target.value)}
              placeholder="모바일 앱 (Android, iOS) 및 백엔드, 어드민"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">개발 시작일</Label>
              <Input
                type="date"
                value={data.devPeriodStart}
                onChange={e => updateField('devPeriodStart', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">개발 종료일</Label>
              <Input
                type="date"
                value={data.devPeriodEnd}
                onChange={e => updateField('devPeriodEnd', e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">기타 메모</Label>
            <textarea
              className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={data.notes}
              onChange={e => updateField('notes', e.target.value)}
              placeholder="추가 메모 (선택사항)"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
