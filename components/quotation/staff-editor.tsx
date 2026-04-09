'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useQuotationStore } from '@/lib/quotation/store'
import { calcMMTotal, formatKRW } from '@/lib/quotation/engine'

export function StaffEditor() {
  const { data, addStaffItem, removeStaffItem, updateStaffItem } = useQuotationStore()

  const totalMM = data.staffItems.reduce((s, item) => s + (item.mm || 0), 0)
  const totalCost = data.staffItems.reduce(
    (s, item) => s + calcMMTotal(item.monthlyCost, item.mm),
    0,
  )

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">인력별 견적 (MM)</h3>
          <p className="text-xs text-muted-foreground">
            인력 {data.staffItems.length}명 / 합계 {totalMM.toFixed(1)} M/M
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addStaffItem}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          인력 추가
        </Button>
      </div>

      {data.staffItems.length === 0 && (
        <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          인력 항목이 없습니다. &quot;인력 추가&quot; 버튼을 눌러 시작하세요.
        </div>
      )}

      {data.staffItems.map((item, idx) => (
        <Card key={item.id} className="border">
          <CardHeader className="py-2 px-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                인력 {idx + 1}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-destructive hover:text-destructive"
                onClick={() => removeStaffItem(item.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-3 pb-3 flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">역할/중분류</label>
                <Input
                  value={item.role}
                  onChange={e => updateStaffItem(item.id, { role: e.target.value })}
                  placeholder="예: PMO, 백엔드"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">M/M</label>
                <Input
                  type="number"
                  value={item.mm}
                  min={0.1}
                  step={0.5}
                  onChange={e => updateStaffItem(item.id, { mm: Number(e.target.value) })}
                  placeholder="1.0"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">주요업무</label>
              <Input
                value={item.description}
                onChange={e => updateStaffItem(item.id, { description: e.target.value })}
                placeholder="업무 내용 간략 설명"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">시작일</label>
                <Input
                  type="date"
                  value={item.startDate}
                  onChange={e => updateStaffItem(item.id, { startDate: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">종료일</label>
                <Input
                  type="date"
                  value={item.endDate}
                  onChange={e => updateStaffItem(item.id, { endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">월 비용 (원)</label>
              <Input
                type="number"
                value={item.monthlyCost}
                min={0}
                step={1000000}
                onChange={e => updateStaffItem(item.id, { monthlyCost: Number(e.target.value) })}
                placeholder="15000000"
              />
            </div>

            {/* 자동계산 */}
            <div className="rounded-md bg-muted/50 px-3 py-2">
              <p className="text-xs text-muted-foreground">총합 (월비용 × M/M)</p>
              <p className="text-sm font-semibold text-primary">
                {calcMMTotal(item.monthlyCost, item.mm) > 0
                  ? formatKRW(calcMMTotal(item.monthlyCost, item.mm))
                  : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}

      {data.staffItems.length > 0 && (
        <div className="rounded-md bg-muted px-4 py-3 flex justify-between items-center">
          <div>
            <p className="text-xs text-muted-foreground">소계</p>
            <p className="text-sm font-semibold">{totalMM.toFixed(1)} M/M</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">총 인력 비용</p>
            <p className="text-sm font-bold text-primary">{formatKRW(totalCost)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
