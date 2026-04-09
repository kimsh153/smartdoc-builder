'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import React from 'react'
import { useQuotationStore } from '@/lib/quotation/store'
import {
  calcWorkDays,
  calcItemTotal,
  calcGroupSubtotal,
  calcMMTotal,
  calcSummary,
  formatKRW,
} from '@/lib/quotation/engine'

// ─── 요약 카드 ────────────────────────────────────────────────────────────────

function SummaryCards() {
  const { data } = useQuotationStore()
  const summary = calcSummary(data.groups, data.overheadRate, data.profitRate, data.discount)

  const cards = [
    { label: '최종 견적가', value: formatKRW(summary.finalQuote), highlight: true },
    { label: '부가세 (10%)', value: formatKRW(summary.finalVat), highlight: false },
    { label: '직접 노무비', value: formatKRW(summary.laborCost), highlight: false },
    {
      label: `제경비 (${Math.round(data.overheadRate * 100)}%)`,
      value: formatKRW(summary.overhead),
      highlight: false,
    },
    {
      label: `기술료 (${Math.round(data.profitRate * 100)}%)`,
      value: formatKRW(summary.profit),
      highlight: false,
    },
    {
      label: '파트너 할인',
      value: data.discount > 0 ? `- ${formatKRW(data.discount)}` : '-',
      highlight: false,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 p-4 xl:grid-cols-3">
      {cards.map(card => (
        <Card
          key={card.label}
          className={card.highlight ? 'border-primary bg-primary text-primary-foreground' : ''}
        >
          <CardContent className="p-3">
            <p className={`text-xs ${card.highlight ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
              {card.label}
            </p>
            <p className={`text-sm font-bold mt-0.5 ${card.highlight ? 'text-lg' : ''}`}>
              {card.value}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

// ─── 모듈별 테이블 ────────────────────────────────────────────────────────────

function ModuleTable() {
  const { data } = useQuotationStore()
  let no = 0

  return (
    <div className="px-4 pb-4 overflow-x-auto">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-8 text-center">NO</TableHead>
            <TableHead className="w-24">중분류</TableHead>
            <TableHead>주요 기능</TableHead>
            <TableHead className="w-20 text-center">시작일</TableHead>
            <TableHead className="w-20 text-center">종료일</TableHead>
            <TableHead className="w-20 text-right">월 비용</TableHead>
            <TableHead className="w-12 text-center">소요일</TableHead>
            <TableHead className="w-20 text-right">총합</TableHead>
            <TableHead className="w-20 text-right">부가세</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.groups.map(group => {
            const subtotal = calcGroupSubtotal(group.items)
            return (
              <React.Fragment key={group.id}>
                {/* 대분류 헤더 */}
                <TableRow className="bg-foreground/5 font-semibold">
                  <TableCell colSpan={9} className="py-1.5 font-semibold text-xs">
                    {group.name}
                  </TableCell>
                </TableRow>

                {/* 항목 행 */}
                {group.items.map(item => {
                  no++
                  const days = calcWorkDays(item.startDate, item.endDate)
                  const total = calcItemTotal(item.monthlyCost, days)
                  const vat = Math.round(total * 0.1)
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/30">
                      <TableCell className="text-center">{no}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="line-clamp-2 whitespace-pre-line">{item.description || '-'}</p>
                      </TableCell>
                      <TableCell className="text-center">{item.startDate || '-'}</TableCell>
                      <TableCell className="text-center">{item.endDate || '-'}</TableCell>
                      <TableCell className="text-right">
                        {item.monthlyCost > 0 ? formatKRW(item.monthlyCost) : '-'}
                      </TableCell>
                      <TableCell className="text-center">{days > 0 ? days : '-'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {total > 0 ? formatKRW(total) : '-'}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {vat > 0 ? formatKRW(vat) : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}

                {/* 소계 */}
                <TableRow className="bg-muted/30 font-semibold text-xs">
                  <TableCell colSpan={7} className="py-1 text-right text-muted-foreground">
                    소계
                  </TableCell>
                  <TableCell className="text-right font-bold">{formatKRW(subtotal)}</TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {formatKRW(Math.round(subtotal * 0.1))}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

// ─── 인력별 테이블 ────────────────────────────────────────────────────────────

function StaffTable() {
  const { data } = useQuotationStore()
  const totalMM = data.staffItems.reduce((s, item) => s + item.mm, 0)
  const totalCost = data.staffItems.reduce(
    (s, item) => s + calcMMTotal(item.monthlyCost, item.mm),
    0,
  )

  return (
    <div className="px-4 pb-4 overflow-x-auto">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-8 text-center">NO</TableHead>
            <TableHead className="w-24">역할</TableHead>
            <TableHead>주요업무</TableHead>
            <TableHead className="w-20 text-center">시작일</TableHead>
            <TableHead className="w-20 text-center">종료일</TableHead>
            <TableHead className="w-20 text-right">월 비용</TableHead>
            <TableHead className="w-12 text-center">M/M</TableHead>
            <TableHead className="w-20 text-right">총합</TableHead>
            <TableHead className="w-20 text-right">부가세</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.staffItems.map((item, i) => {
            const total = calcMMTotal(item.monthlyCost, item.mm)
            const vat = Math.round(total * 0.1)
            return (
              <TableRow key={item.id} className="hover:bg-muted/30">
                <TableCell className="text-center">{i + 1}</TableCell>
                <TableCell>{item.role || '-'}</TableCell>
                <TableCell>{item.description || '-'}</TableCell>
                <TableCell className="text-center">{item.startDate || '-'}</TableCell>
                <TableCell className="text-center">{item.endDate || '-'}</TableCell>
                <TableCell className="text-right">
                  {item.monthlyCost > 0 ? formatKRW(item.monthlyCost) : '-'}
                </TableCell>
                <TableCell className="text-center">{item.mm.toFixed(1)}</TableCell>
                <TableCell className="text-right font-medium">
                  {total > 0 ? formatKRW(total) : '-'}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {vat > 0 ? formatKRW(vat) : '-'}
                </TableCell>
              </TableRow>
            )
          })}

          {data.staffItems.length > 0 && (
            <TableRow className="bg-muted/30 font-semibold">
              <TableCell colSpan={6} className="text-right text-muted-foreground py-1">
                소계
              </TableCell>
              <TableCell className="text-center font-bold">{totalMM.toFixed(1)}</TableCell>
              <TableCell className="text-right font-bold">{formatKRW(totalCost)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatKRW(Math.round(totalCost * 0.1))}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {data.staffItems.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          인력별 견적 탭에서 인력을 추가하세요.
        </p>
      )}
    </div>
  )
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

export function PreviewTable() {
  return (
    <div className="flex flex-col h-full">
      <SummaryCards />

      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="module">
          <div className="px-4 border-b">
            <TabsList className="h-9">
              <TabsTrigger value="module" className="text-xs">모듈별 견적</TabsTrigger>
              <TabsTrigger value="staff" className="text-xs">인력별 견적</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="module" className="mt-0">
            <ModuleTable />
          </TabsContent>
          <TabsContent value="staff" className="mt-0">
            <StaffTable />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
