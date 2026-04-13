import { NextResponse } from 'next/server'
import path from 'node:path'
import type { QuotationData } from '@/lib/quotation/types'
import {
  calcWorkDays,
  calcItemTotal,
  calcGroupSubtotal,
  calcLaborCost,
  calcOverhead,
  calcProfit,
  calcMMTotal,
  calcVat,
} from '@/lib/quotation/engine'

// eslint-disable-next-line @typescript-eslint/no-require-imports
const XlsxPopulate = require('xlsx-populate')

const FMT_KRW = '[$₩-412]#,##0'
const FMT_DATE = 'yyyy"-"mm"-"dd'
const FMT_PCT = '0.00%'
const FMT_NUM = '#,##0.0'
const DEFAULT_HEIGHT = 18.75

function safeHeight(h: unknown): number {
  if (h === undefined || h === null) return DEFAULT_HEIGHT
  const n = parseFloat(String(h))
  return isNaN(n) ? DEFAULT_HEIGHT : n
}

// ─── 행 전체 스타일 캡처 (A-P 16컬럼) ──────────────────────────────────────

interface RowStyle {
  ids: number[] // 16 styleIds (col 1-16)
  height: number
}

interface StyleMap {
  gap: RowStyle
  groupHeader: RowStyle
  item: RowStyle
  subtotal: RowStyle
  gapBetween: RowStyle
  clear: number
}

function captureRowStyle(ws: any, row: number): RowStyle {
  const ids: number[] = []
  for (let c = 1; c <= 16; c++) ids.push(ws.cell(row, c)._styleId ?? 0)
  return { ids, height: safeHeight(ws.row(row).height()) }
}

function captureAllStyles(
  ws: any, gapRow: number, ghRow: number, itemRow: number, stRow: number, gapBtwRow: number,
): StyleMap {
  return {
    gap: captureRowStyle(ws, gapRow),
    groupHeader: captureRowStyle(ws, ghRow),
    item: captureRowStyle(ws, itemRow),
    subtotal: captureRowStyle(ws, stRow),
    gapBetween: captureRowStyle(ws, gapBtwRow),
    clear: ws.cell('A60')._styleId ?? 0,
  }
}

function applyRowStyle(ws: any, row: number, style: RowStyle) {
  ws.row(row).height(style.height)
  for (let c = 1; c <= 16; c++) ws.cell(row, c)._styleId = style.ids[c - 1]
}

// ─── 동적 영역 초기화 ─────────────────────────────────────────────────────────

function clearDynamicArea(ws: any, startRow: number, endRow: number, clearStyleId: number) {
  // 머지 해제 — 시작행 OR 끝행이 범위에 걸치면 모두 해제
  if (ws._mergeCells) {
    const keys = [...Object.keys(ws._mergeCells)]
    keys.forEach((key: string) => {
      const match = key.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
      if (!match) return
      const r1 = parseInt(match[2]), r2 = parseInt(match[4])
      const overlaps = r1 <= endRow && r2 >= startRow
      if (overlaps) {
        try { ws.range(key).merged(false) } catch { /* ignore */ }
      }
    })
  }

  for (let r = startRow; r <= endRow; r++) {
    for (let c = 1; c <= 16; c++) {
      const cell = ws.cell(r, c)
      cell.value(undefined)
      cell._styleId = clearStyleId
    }
  }
}

// ─── 푸터 캡처/복원 ──────────────────────────────────────────────────────────

interface CapturedFooterCell {
  col: number
  value: any
  styleId: number
}
interface CapturedFooterRow {
  height: number
  cells: CapturedFooterCell[]
}
interface CapturedFooter {
  rows: CapturedFooterRow[]
  merges: string[] // "B52:F52" 형식
  originalStart: number
}

function captureFooter(ws: any, start: number, end: number): CapturedFooter {
  const merges: string[] = []
  const slaveCells = new Set<string>()

  if (ws._mergeCells) {
    Object.keys(ws._mergeCells).forEach((key: string) => {
      const match = key.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
      if (!match) return
      const r1 = parseInt(match[2]), r2 = parseInt(match[4])
      if (r1 >= start && r2 <= end) {
        merges.push(key)
        const range = ws._mergeCells[key]
        if (range) {
          const sr = range.startCell().rowNumber()
          const sc = range.startCell().columnNumber()
          const er = range.endCell().rowNumber()
          const ec = range.endCell().columnNumber()
          for (let r = sr; r <= er; r++) {
            for (let c = sc; c <= ec; c++) {
              if (r !== sr || c !== sc) slaveCells.add(`${r}:${c}`)
            }
          }
        }
      }
    })
  }

  const rows: CapturedFooterRow[] = []
  for (let r = start; r <= end; r++) {
    const cells: CapturedFooterCell[] = []
    for (let c = 1; c <= 16; c++) {
      const cell = ws.cell(r, c)
      const isSlave = slaveCells.has(`${r}:${c}`)
      cells.push({
        col: c,
        value: isSlave ? undefined : cell.value(),
        styleId: cell._styleId ?? 0,
      })
    }
    rows.push({ height: safeHeight(ws.row(r).height()), cells })
  }

  return { rows, merges, originalStart: start }
}

function restoreFooter(ws: any, newStart: number, footer: CapturedFooter) {
  const offset = newStart - footer.originalStart

  footer.rows.forEach((row, i) => {
    const r = newStart + i
    ws.row(r).height(row.height)
    row.cells.forEach(({ col, value, styleId }) => {
      const cell = ws.cell(r, col)
      cell.value(value)
      cell._styleId = styleId
    })
  })

  // 머지 재적용 (행 오프셋)
  footer.merges.forEach(mergeRef => {
    const shifted = mergeRef.replace(/([A-Z]+)(\d+)/g,
      (_: string, col: string, row: string) => `${col}${parseInt(row) + offset}`)
    try { ws.range(shifted).merged(true) } catch { /* ignore */ }
  })
}

// ─── 고정 영역 채우기 ─────────────────────────────────────────────────────────

function fillHeader(
  ws: any, data: QuotationData,
  laborCost: number, overhead: number, profit: number, finalQuote: number,
) {
  const set = (addr: string, val: any, fmt?: string) => {
    ws.cell(addr).value(val)
    if (fmt) ws.cell(addr).style('numberFormat', fmt)
  }

  set('D3', data.clientName ? `${data.clientName}  귀하` : '고객사명  귀하')

  if (data.quoteDate) set('E6', new Date(data.quoteDate), FMT_DATE)
  set('M6', data.salesPerson || '')

  if (data.quoteDate) {
    const expire = new Date(data.quoteDate)
    expire.setDate(expire.getDate() + (data.validDays ?? 30) - 1)
    set('E7', expire, FMT_DATE)
  }
  set('F7', data.validDays ?? 30)
  set('M7', data.salesContact || '')
  set('M8', data.salesEmail || '')

  set('J10', finalQuote, FMT_KRW)
  set('N10', calcVat(finalQuote), FMT_KRW)
  set('J11', laborCost, FMT_KRW)
  set('N11', calcVat(laborCost), FMT_KRW)
  set('H12', data.overheadRate, FMT_PCT)
  set('J12', overhead, FMT_KRW)
  set('N12', calcVat(overhead), FMT_KRW)
  set('H13', data.profitRate, FMT_PCT)
  set('J13', profit, FMT_KRW)
  set('N13', calcVat(profit), FMT_KRW)
  set('J14', data.discount, FMT_KRW)
  set('N14', calcVat(data.discount), FMT_KRW)

  set('I16', data.deliverable || '')
  set('M16', data.paymentMethod || '')
  if (data.devPeriodStart && data.devPeriodEnd) {
    set('I17', `${data.devPeriodStart} ~ ${data.devPeriodEnd}`)
  }
  set('M17', data.billingMethod || '')
}

// ─── 모듈별 견적 동적 섹션 ───────────────────────────────────────────────────

function buildModuleSection(ws: any, data: QuotationData, styles: StyleMap): number {
  let r = 22

  applyRowStyle(ws, r, styles.gap)
  r++

  let no = 0
  data.groups.forEach((group, gi) => {
    const groupSub = calcGroupSubtotal(group.items)

    applyRowStyle(ws, r, styles.groupHeader)
    ws.range(r, 2, r, 11).merged(true)
    ws.cell(r, 2).value(group.name)
    ws.range(r, 12, r, 13).merged(true)
    ws.cell(r, 12).value(groupSub)
    ws.cell(r, 12).style('numberFormat', FMT_KRW)
    ws.range(r, 14, r, 16).merged(true)
    ws.cell(r, 14).value(calcVat(groupSub))
    ws.cell(r, 14).style('numberFormat', FMT_KRW)
    r++

    group.items.forEach(item => {
      no++
      const days = calcWorkDays(item.startDate, item.endDate)
      const total = calcItemTotal(item.monthlyCost, days)

      applyRowStyle(ws, r, styles.item)
      ws.range(r, 2, r, 3).merged(true)
      ws.cell(r, 2).value(no)
      ws.cell(r, 4).value(item.category)
      ws.cell(r, 4).style({ horizontalAlignment: 'center', verticalAlignment: 'center' })
      ws.range(r, 5, r, 7).merged(true)
      ws.cell(r, 5).value(item.description)
      ws.cell(r, 8).value(item.startDate ? new Date(item.startDate) : undefined)
      ws.cell(r, 8).style('numberFormat', FMT_DATE)
      ws.cell(r, 9).value(item.endDate ? new Date(item.endDate) : undefined)
      ws.cell(r, 9).style('numberFormat', FMT_DATE)
      ws.cell(r, 10).value(item.monthlyCost)
      ws.cell(r, 10).style('numberFormat', FMT_KRW)
      ws.cell(r, 11).value(days)
      ws.cell(r, 11).style('numberFormat', FMT_NUM)
      ws.range(r, 12, r, 13).merged(true)
      ws.cell(r, 12).value(total)
      ws.cell(r, 12).style('numberFormat', FMT_KRW)
      ws.range(r, 14, r, 16).merged(true)
      ws.cell(r, 14).value(calcVat(total))
      ws.cell(r, 14).style('numberFormat', FMT_KRW)
      r++
    })

    applyRowStyle(ws, r, styles.subtotal)
    ws.range(r, 2, r, 3).merged(true)
    ws.range(r, 4, r, 10).merged(true)
    ws.cell(r, 4).value('소계')
    const totalDays = group.items.reduce(
      (acc, item) => acc + calcWorkDays(item.startDate, item.endDate), 0,
    )
    ws.cell(r, 11).value(totalDays)
    ws.cell(r, 11).style('numberFormat', FMT_NUM)
    ws.range(r, 12, r, 13).merged(true)
    ws.cell(r, 12).value(groupSub)
    ws.cell(r, 12).style('numberFormat', FMT_KRW)
    ws.range(r, 14, r, 16).merged(true)
    ws.cell(r, 14).value(calcVat(groupSub))
    ws.cell(r, 14).style('numberFormat', FMT_KRW)
    r++

    if (gi < data.groups.length - 1) {
      applyRowStyle(ws, r, styles.gapBetween)
      r++
    }
  })

  return r - 1
}

// ─── MM별 견적 동적 섹션 ─────────────────────────────────────────────────────

function buildMMSection(ws: any, data: QuotationData, styles: StyleMap): number {
  let r = 22

  data.staffItems.forEach((item, i) => {
    const total = calcMMTotal(item.monthlyCost, item.mm)

    applyRowStyle(ws, r, styles.item)
    ws.range(r, 2, r, 3).merged(true)
    ws.cell(r, 2).value(i + 1)
    ws.cell(r, 4).value(item.role)
    ws.cell(r, 4).style({ horizontalAlignment: 'center', verticalAlignment: 'center' })
    ws.range(r, 5, r, 7).merged(true)
    ws.cell(r, 5).value(item.description)
    ws.cell(r, 8).value(item.startDate ? new Date(item.startDate) : undefined)
    ws.cell(r, 8).style('numberFormat', FMT_DATE)
    ws.cell(r, 9).value(item.endDate ? new Date(item.endDate) : undefined)
    ws.cell(r, 9).style('numberFormat', FMT_DATE)
    ws.cell(r, 10).value(item.monthlyCost)
    ws.cell(r, 10).style('numberFormat', FMT_KRW)
    ws.cell(r, 11).value(item.mm)
    ws.cell(r, 11).style('numberFormat', FMT_NUM)
    ws.range(r, 12, r, 13).merged(true)
    ws.cell(r, 12).value(total)
    ws.cell(r, 12).style('numberFormat', FMT_KRW)
    ws.range(r, 14, r, 16).merged(true)
    ws.cell(r, 14).value(calcVat(total))
    ws.cell(r, 14).style('numberFormat', FMT_KRW)
    r++
  })

  if (data.staffItems.length > 0) {
    applyRowStyle(ws, r, styles.subtotal)
    ws.range(r, 2, r, 3).merged(true)
    ws.range(r, 4, r, 10).merged(true)
    ws.cell(r, 4).value('소계')
    const mmTotal = data.staffItems.reduce((acc, item) => acc + item.mm, 0)
    ws.cell(r, 11).value(mmTotal)
    ws.cell(r, 11).style('numberFormat', FMT_NUM)
    const totalCost = data.staffItems.reduce(
      (acc, item) => acc + calcMMTotal(item.monthlyCost, item.mm), 0,
    )
    ws.range(r, 12, r, 13).merged(true)
    ws.cell(r, 12).value(totalCost)
    ws.cell(r, 12).style('numberFormat', FMT_KRW)

    ws.range(r, 14, r, 16).merged(true)
    ws.cell(r, 14).value(calcVat(totalCost))
    ws.cell(r, 14).style('numberFormat', FMT_KRW)

    r++
  }

  return r - 1
}

// ─── 동적 영역 준비 ──────────────────────────────────────────────────────────

function calcModuleRows(groups: QuotationData['groups']): number {
  return 1 + groups.reduce((a, g) => a + 1 + g.items.length + 1, 0) + Math.max(0, groups.length - 1)
}

function calcMMRows(n: number): number {
  return n + (n > 0 ? 1 : 0)
}

function prepareDynamicArea(
  ws: any, dynamicStart: number, footerStart: number, footerEnd: number,
  neededRows: number, clearStyleId: number,
) {
  const available = footerStart - dynamicStart

  if (neededRows <= available) {
    clearDynamicArea(ws, dynamicStart, footerStart - 1, clearStyleId)
    return
  }

  const newFooterStart = dynamicStart + neededRows
  const footerLen = footerEnd - footerStart + 1
  const footer = captureFooter(ws, footerStart, footerEnd)
  clearDynamicArea(ws, dynamicStart, newFooterStart + footerLen, clearStyleId)
  restoreFooter(ws, newFooterStart, footer)
}

// ─── 메인 핸들러 ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const data: QuotationData = await req.json()

    const templatePath = path.join(process.cwd(), 'public', 'templates', 'quotation-template.xlsx')
    const wb = await XlsxPopulate.fromFileAsync(templatePath)

    const ws1 = wb.sheet('모듈 별 견적')
    const ws2 = wb.sheet('MM 별 견적')
    if (!ws1 || !ws2) {
      return NextResponse.json({ error: '템플릿 시트를 찾을 수 없습니다.' }, { status: 500 })
    }

    // 스타일 캡처 (수정 전에) — gap=22, groupHeader=23, item=25, subtotal=27, gapBetween=28
    const moduleStyles = captureAllStyles(ws1, 22, 23, 25, 27, 28)
    // MM: item=22, subtotal=30 (gap/groupHeader/gapBetween은 MM에서 사용하지 않으므로 item으로 채움)
    const mmStyles = captureAllStyles(ws2, 22, 22, 22, 30, 22)

    // 비용 계산
    const laborCost = calcLaborCost(data.groups)
    const overhead = calcOverhead(laborCost, data.overheadRate)
    const profit = calcProfit(laborCost, overhead, data.profitRate)
    const finalQuote = laborCost + overhead + profit - data.discount

    const mmLaborCost = data.staffItems.reduce(
      (acc, item) => acc + calcMMTotal(item.monthlyCost, item.mm), 0,
    )
    const mmOverhead = calcOverhead(mmLaborCost, data.overheadRate)
    const mmProfit = calcProfit(mmLaborCost, mmOverhead, data.profitRate)
    const mmFinalQuote = mmLaborCost + mmOverhead + mmProfit - data.discount

    // 고정 영역 값 채우기
    fillHeader(ws1, data, laborCost, overhead, profit, finalQuote)
    fillHeader(ws2, data, mmLaborCost, mmOverhead, mmProfit, mmFinalQuote)

    // 동적 영역 준비
    const moduleNeeded = calcModuleRows(data.groups)
    const mmNeeded = calcMMRows(data.staffItems.length)

    prepareDynamicArea(ws1, 22, 51, 55, moduleNeeded, moduleStyles.clear)
    prepareDynamicArea(ws2, 22, 31, 35, mmNeeded, mmStyles.clear)

    // 동적 섹션 작성
    buildModuleSection(ws1, data, moduleStyles)
    buildMMSection(ws2, data, mmStyles)

    // 출력
    const buffer = await wb.outputAsync()

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="quotation.xlsx"',
      },
    })
  } catch (err) {
    console.error('[quotation/export] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
