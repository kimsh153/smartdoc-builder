'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { useQuotationStore } from '@/lib/quotation/store'
import { calcWorkDays, calcItemTotal, formatKRW } from '@/lib/quotation/engine'
import type { QuotationItem } from '@/lib/quotation/types'

// ─── 중분류 항목 행 ───────────────────────────────────────────────────────────

function ItemRow({
  groupId,
  item,
  index,
}: {
  groupId: string
  item: QuotationItem
  index: number
}) {
  const { updateItem, removeItem } = useQuotationStore()

  const workDays = calcWorkDays(item.startDate, item.endDate)
  const totalCost = calcItemTotal(item.monthlyCost, workDays)

  return (
    <div className="rounded-md border bg-card p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">항목 {index + 1}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-destructive hover:text-destructive"
          onClick={() => removeItem(groupId, item.id)}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">중분류</Label>
        <Input
          value={item.category}
          onChange={e => updateItem(groupId, item.id, { category: e.target.value })}
          placeholder="예: 백엔드 개발"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">주요 기능</Label>
        <textarea
          className="min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          value={item.description}
          onChange={e => updateItem(groupId, item.id, { description: e.target.value })}
          placeholder="주요 기능 및 범위 설명"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">예상 시작일</Label>
          <Input
            type="date"
            value={item.startDate}
            onChange={e => updateItem(groupId, item.id, { startDate: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">예상 종료일</Label>
          <Input
            type="date"
            value={item.endDate}
            onChange={e => updateItem(groupId, item.id, { endDate: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-xs text-muted-foreground">월 비용 (원)</Label>
        <Input
          type="number"
          value={item.monthlyCost}
          min={0}
          step={1000000}
          onChange={e => updateItem(groupId, item.id, { monthlyCost: Number(e.target.value) })}
          placeholder="15000000"
        />
      </div>

      {/* 자동계산 결과 */}
      <div className="grid grid-cols-2 gap-2 rounded-md bg-muted/50 px-3 py-2">
        <div>
          <p className="text-xs text-muted-foreground">소요일 (영업일)</p>
          <p className="text-sm font-medium">{workDays > 0 ? `${workDays}일` : '-'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">총합</p>
          <p className="text-sm font-semibold text-primary">{totalCost > 0 ? formatKRW(totalCost) : '-'}</p>
        </div>
      </div>
    </div>
  )
}

// ─── 대분류 카드 ──────────────────────────────────────────────────────────────

function GroupCard({ groupId, index }: { groupId: string; index: number }) {
  const { data, renameGroup, removeGroup, addItem, moveGroupUp, moveGroupDown } =
    useQuotationStore()
  const group = data.groups.find(g => g.id === groupId)
  const [collapsed, setCollapsed] = useState(false)
  const [editingName, setEditingName] = useState(false)

  if (!group) return null

  const isFirst = index === 0
  const isLast = index === data.groups.length - 1

  return (
    <Card className="border-2">
      <CardHeader className="py-2 px-3">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          <button
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(v => !v)}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {editingName ? (
            <Input
              autoFocus
              value={group.name}
              onChange={e => renameGroup(groupId, e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => e.key === 'Enter' && setEditingName(false)}
              className="h-7 text-sm font-semibold flex-1"
            />
          ) : (
            <button
              className="flex-1 text-left text-sm font-semibold hover:underline"
              onClick={() => setEditingName(true)}
            >
              {group.name || '(대분류명 없음)'}
            </button>
          )}

          <div className="flex items-center gap-1 ml-auto shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={isFirst}
              onClick={() => moveGroupUp(groupId)}
              title="위로 이동"
            >
              ↑
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={isLast}
              onClick={() => moveGroupDown(groupId)}
              title="아래로 이동"
            >
              ↓
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-destructive hover:text-destructive"
              onClick={() => {
                if (confirm(`"${group.name}" 대분류를 삭제하시겠습니까?`)) {
                  removeGroup(groupId)
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0 px-3 pb-3 flex flex-col gap-3">
          {group.items.map((item, i) => (
            <ItemRow key={item.id} groupId={groupId} item={item} index={i} />
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => addItem(groupId)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            중분류 추가
          </Button>
        </CardContent>
      )}
    </Card>
  )
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function GroupEditor() {
  const { data, addGroup } = useQuotationStore()

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">모듈별 견적</h3>
          <p className="text-xs text-muted-foreground">
            대분류 {data.groups.length}개 / 항목 {data.groups.reduce((s, g) => s + g.items.length, 0)}개
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={addGroup}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          대분류 추가
        </Button>
      </div>

      {data.groups.length === 0 && (
        <div className="rounded-md border border-dashed py-8 text-center text-sm text-muted-foreground">
          대분류가 없습니다. &quot;대분류 추가&quot; 버튼을 눌러 시작하세요.
        </div>
      )}

      {data.groups.map((group, idx) => (
        <GroupCard key={group.id} groupId={group.id} index={idx} />
      ))}
    </div>
  )
}
