// 견적서 계산 엔진
// 원본 Excel의 수식 로직을 JS 비즈니스 함수로 재현

import { isBusinessDay } from './holidays'
import type { QuotationGroup, QuotationItem, StaffItem } from './types'

// ─── 날짜 유틸 ───────────────────────────────────────────────────────────────

export function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? null : d
}

export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayString(): string {
  return formatDate(new Date())
}

// ─── 영업일 계산 ──────────────────────────────────────────────────────────────

/**
 * 두 날짜 사이의 영업일 수 계산 (주말 + 일본 공휴일 제외)
 * 원본 Excel WORKDAY 함수 동작 재현
 * startDate, endDate 모두 포함 (inclusive)
 */
export function calcWorkDays(startDate: string, endDate: string): number {
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  if (!start || !end || end < start) return 0

  let count = 0
  const current = new Date(start)
  while (current <= end) {
    if (isBusinessDay(current)) count++
    current.setDate(current.getDate() + 1)
  }
  return count
}

/**
 * 영업일 기준 종료일 계산 (WORKDAY(start, days-1, holidays) 재현)
 * start 날짜부터 workDays일 후의 영업일 반환
 */
export function calcEndDate(startDate: string, workDays: number): string {
  const start = parseDate(startDate)
  if (!start || workDays <= 0) return startDate

  let remaining = workDays
  const current = new Date(start)
  while (remaining > 0) {
    if (isBusinessDay(current)) remaining--
    if (remaining > 0) current.setDate(current.getDate() + 1)
  }
  return formatDate(current)
}

// ─── 비용 계산 ────────────────────────────────────────────────────────────────

/**
 * 항목 총합 계산
 * 원본 수식: =J{n} * 3.33% * K{n}  (월비용 * 3.33% * 소요일)
 * 3.33% = 1/30 ≈ 일당 비율
 */
export function calcItemTotal(monthlyCost: number, workDays: number): number {
  if (monthlyCost <= 0 || workDays <= 0) return 0
  return Math.round(monthlyCost * 0.0333 * workDays)
}

/**
 * 그룹 소계 (대분류 합계)
 */
export function calcGroupSubtotal(items: QuotationItem[]): number {
  return items.reduce((sum, item) => {
    const days = calcWorkDays(item.startDate, item.endDate)
    return sum + calcItemTotal(item.monthlyCost, days)
  }, 0)
}

/**
 * 전체 직접 노무비 (모든 대분류 소계 합산)
 * 원본 수식: =SUM(L{소계1} + L{소계2} + ...)
 */
export function calcLaborCost(groups: QuotationGroup[]): number {
  return groups.reduce((sum, group) => sum + calcGroupSubtotal(group.items), 0)
}

/**
 * 제경비
 * 원본 수식: =J11 * H12  (직접노무비 * 제경비율)
 */
export function calcOverhead(laborCost: number, overheadRate: number): number {
  return Math.round(laborCost * overheadRate)
}

/**
 * 기술료 (수익률)
 * 원본 수식: =SUM(J11:J12) * H13  ((직접노무비 + 제경비) * 기술료율)
 */
export function calcProfit(laborCost: number, overhead: number, profitRate: number): number {
  return Math.round((laborCost + overhead) * profitRate)
}

/**
 * 최종 견적가
 * 원본 수식: =SUM(J11:J13) - J14  (노무비 + 제경비 + 기술료 - 할인)
 */
export function calcFinalQuote(
  laborCost: number,
  overheadRate: number,
  profitRate: number,
  discount: number,
): number {
  const overhead = calcOverhead(laborCost, overheadRate)
  const profit = calcProfit(laborCost, overhead, profitRate)
  return laborCost + overhead + profit - discount
}

/**
 * MM 시트 항목 총합
 * 원본 수식: =월비용 * M/M
 */
export function calcMMTotal(monthlyCost: number, mm: number): number {
  return Math.round(monthlyCost * mm)
}

/**
 * MM 시트 전체 노무비
 */
export function calcMMTotalLaborCost(staffItems: StaffItem[]): number {
  return staffItems.reduce((sum, item) => sum + calcMMTotal(item.monthlyCost, item.mm), 0)
}

/**
 * 부가세 (10%)
 */
export function calcVat(amount: number): number {
  return Math.round(amount * 0.1)
}

// ─── 견적 요약 ────────────────────────────────────────────────────────────────

export interface QuotationSummary {
  laborCost: number       // 직접 노무비
  overhead: number        // 제경비
  profit: number          // 기술료
  discount: number        // 파트너 할인
  finalQuote: number      // 최종 견적가
  finalVat: number        // 최종 견적가 부가세
  total: number           // 최종 견적가 + 부가세
}

export function calcSummary(
  groups: QuotationGroup[],
  overheadRate: number,
  profitRate: number,
  discount: number,
): QuotationSummary {
  const laborCost = calcLaborCost(groups)
  const overhead = calcOverhead(laborCost, overheadRate)
  const profit = calcProfit(laborCost, overhead, profitRate)
  const finalQuote = laborCost + overhead + profit - discount
  const finalVat = calcVat(finalQuote)

  return {
    laborCost,
    overhead,
    profit,
    discount,
    finalQuote,
    finalVat,
    total: finalQuote + finalVat,
  }
}

// ─── 포맷 유틸 ───────────────────────────────────────────────────────────────

export function formatKRW(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`
}
