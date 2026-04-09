/**
 * lib/exporters/toXlsx.ts
 *
 * exceljs 기반 고품질 Excel 내보내기
 * 원본 "테이크원 신규 IT프로젝트 견적서" Excel과 동일한 레이아웃 재현
 *
 * 구조:
 *   P13-a: STYLES  — 공통 색상/폰트/테두리/포맷 상수
 *   P13-b: buildHeader  — 행 1~9 (회사정보/고객사/견적메타)
 *   P13-c: buildSummary — 행 10~18 (비용요약+프로젝트정보)
 *   P13-d: buildModuleTable — 행 19~ (동적 모듈 항목 테이블)
 *   P13-e: buildMMSheet — 시트 2 (인력별)
 *   P13-f: exportToXlsx — 통합 + 다운로드
 */

import ExcelJS from 'exceljs'
import type { QuotationData, QuotationGroup, StaffItem } from '@/lib/quotation/types'
import {
  calcWorkDays,
  calcItemTotal,
  calcGroupSubtotal,
  calcLaborCost,
  calcOverhead,
  calcProfit,
  calcMMTotal,
} from '@/lib/quotation/engine'

// ─── P13-a: 공통 스타일 정의 ────────────────────────────────────────────────

// 열 너비 (원본 wpx 값 기준, exceljs width는 문자 단위이므로 wpx/7 근사값)
const COL_WIDTHS = [
  3.5,  // A: 29px
  2.0,  // B: 15px
  5.5,  // C: 43px
  17.0, // D: 139px
  17.0, // E: 139px
  17.0, // F: 139px
  8.5,  // G: 70px
  17.0, // H: 139px
  17.0, // I: 139px
  17.0, // J: 139px
  8.5,  // K: 70px
  17.0, // L: 139px
  15.0, // M: 125px
  13.0, // N: 105px
  11.5, // O: 91px
  2.0,  // P: 15px
]

// 행 높이 (pt 단위, 원본 hpt 값)
const ROW_H = {
  margin: 15,
  header: 18.75,
  divider: 6,
  meta: 18.75,
  gap: 30,
  summaryBar: 30,
  summaryRow: 22.5,
  summaryDivider: 11.25,
  projectInfo: 26.25,
  titleBar: 31.5,
  colHeader: 22.5,
  groupHeader: 26.25,
  item: 22.5,
  subtotal: 26.25,
  gap2: 7.5,
  gap3: 3.75,
  note: 45,
}

// 색상
const COLOR = {
  black: '000000',
  white: 'FFFFFF',
  gray: 'CCCCCC',
  lightGray: 'F3F3F3',
  bgWhite: 'FFFFFF',
  transparent: undefined,
}

// 폰트 기본
const FONT_BASE = { name: 'Malgun Gothic', size: 9 }
const FONT_WHITE = { ...FONT_BASE, color: { argb: 'FFFFFFFF' }, bold: true }
const FONT_BLACK = { ...FONT_BASE, color: { argb: 'FF000000' } }
const FONT_BOLD = { ...FONT_BASE, bold: true }

// 테두리 — 원본 Excel과 동일하게 검정 계열
const BORDER_THIN: ExcelJS.Borders = {
  top:    { style: 'thin', color: { argb: 'FF000000' } },
  bottom: { style: 'thin', color: { argb: 'FF000000' } },
  left:   { style: 'thin', color: { argb: 'FF000000' } },
  right:  { style: 'thin', color: { argb: 'FF000000' } },
}
const BORDER_MEDIUM: ExcelJS.Borders = {
  top:    { style: 'medium', color: { argb: 'FF000000' } },
  bottom: { style: 'medium', color: { argb: 'FF000000' } },
  left:   { style: 'medium', color: { argb: 'FF000000' } },
  right:  { style: 'medium', color: { argb: 'FF000000' } },
}

// 숫자 포맷
const FMT = {
  krw: '[$₩-412]#,##0',
  krwMinus: '- [$₩-412]#,##0',
  percent: '0.00%',
  workdays: '0.0',
  date: 'yyyy"-"mm"-"dd',
  mm: '0.0',
}

// ─── 헬퍼 함수 ───────────────────────────────────────────────────────────────

function cellAddr(row: number, col: number): string {
  return ExcelJS.utils
    ? ''
    : String.fromCharCode(64 + col) + row
}

// col: 1-indexed
function colLetter(col: number): string {
  let s = ''
  let n = col
  while (n > 0) {
    s = String.fromCharCode(65 + ((n - 1) % 26)) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

function addr(row: number, col: number): string {
  return `${colLetter(col)}${row}`
}

function setRowHeight(ws: ExcelJS.Worksheet, row: number, height: number) {
  ws.getRow(row).height = height
}

function setCell(
  ws: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: ExcelJS.CellValue,
  style?: Partial<ExcelJS.Style>,
) {
  const cell = ws.getCell(row, col)
  cell.value = value
  if (style) {
    if (style.font) cell.font = style.font as ExcelJS.Font
    if (style.fill) cell.fill = style.fill as ExcelJS.Fill
    if (style.alignment) cell.alignment = style.alignment as ExcelJS.Alignment
    if (style.border) cell.border = style.border as ExcelJS.Borders
    if (style.numFmt) cell.numFmt = style.numFmt
  }
}

function mergeCells(ws: ExcelJS.Worksheet, r1: number, c1: number, r2: number, c2: number) {
  ws.mergeCells(r1, c1, r2, c2)
}

function blackFill(): ExcelJS.Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF000000' },
  }
}

function grayFill(hex: string = 'FFCCCCCC'): ExcelJS.Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: hex },
  }
}

function whiteFill(): ExcelJS.Fill {
  return {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFFFFF' },
  }
}

// 검정 배경 + 흰 텍스트 셀 스타일
const BLACK_CELL_STYLE: Partial<ExcelJS.Style> = {
  fill: blackFill(),
  font: FONT_WHITE,
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  border: BORDER_THIN,
}

// 밝은 회색 배경 스타일 (소계/프로젝트 정보 레이블)
const LIGHTGRAY_CELL_STYLE: Partial<ExcelJS.Style> = {
  fill: grayFill('FFF3F3F3'),
  font: FONT_BLACK,
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  border: BORDER_THIN,
}

// 진회색 배경 스타일 (소계 레이블 D열)
const GRAY_CELL_STYLE: Partial<ExcelJS.Style> = {
  fill: grayFill('FFCCCCCC'),
  font: { ...FONT_BLACK, bold: true },
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  border: BORDER_THIN,
}

// 일반 셀 스타일
const NORMAL_CELL_STYLE: Partial<ExcelJS.Style> = {
  font: FONT_BLACK,
  alignment: { vertical: 'middle', wrapText: true },
  border: BORDER_THIN,
}

const NORMAL_CENTER: Partial<ExcelJS.Style> = {
  ...NORMAL_CELL_STYLE,
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
}

const NORMAL_RIGHT: Partial<ExcelJS.Style> = {
  ...NORMAL_CELL_STYLE,
  alignment: { vertical: 'middle', horizontal: 'right', wrapText: true },
}

// ─── P13-b: 헤더 영역 빌더 (행 1~9) ─────────────────────────────────────────

function buildHeader(ws: ExcelJS.Worksheet, data: QuotationData) {
  // 행 1: 여백
  setRowHeight(ws, 1, ROW_H.margin)

  // 행 2: 회사명 / 일본본사 레이블 / 회사정보
  setRowHeight(ws, 2, ROW_H.header)
  mergeCells(ws, 2, 3, 2, 9) // C2:I2 — 회사명
  const c2 = ws.getCell(2, 3)
  c2.value = 'PROTO INC.  Software Development'
  c2.font = { ...FONT_BASE, bold: true, size: 11 }
  c2.alignment = { vertical: 'middle' }

  mergeCells(ws, 2, 11, 2, 12) // K2:L2
  setCell(ws, 2, 11, '  일본 본사', {
    font: { ...FONT_BASE, bold: true },
    alignment: { vertical: 'middle' },
  })

  mergeCells(ws, 2, 13, 2, 16) // M2:P2
  setCell(ws, 2, 13, '회사 명 : 株式会社ｐｒｏｔｏ\n사업자 번호 : 7011101083414\n대표자 : 金　知賢 / 金　書浩\n주소 : 東京都新宿区新宿2-11-7第33宮庭ビル5F\n연락처 : +81 50-5539-8928', {
    font: FONT_BASE,
    alignment: { vertical: 'middle', wrapText: true },
  })

  // 행 3: 고객사명 / 한국 지사 / 회사정보
  setRowHeight(ws, 3, ROW_H.header)
  mergeCells(ws, 3, 4, 3, 9) // D3:I3
  setCell(ws, 3, 4, ` ${data.clientName || '(주)고객사명'}  귀하`, {
    font: { ...FONT_BASE, bold: true, size: 10 },
    alignment: { vertical: 'middle' },
  })

  mergeCells(ws, 3, 11, 3, 12) // K3:L3
  setCell(ws, 3, 11, ' 한국 지사', {
    font: { ...FONT_BASE, bold: true },
    alignment: { vertical: 'middle' },
  })

  mergeCells(ws, 3, 13, 3, 16) // M3:P3
  setCell(ws, 3, 13, '회사 명 : 주식회사 투스페이스\n사업자 번호 : 714-88-02482\n대표자 : 김서호\n주소 : 서울특별시 강남구 선릉로145길 13, 4F\n연락처 : +82 70-7174-2181', {
    font: FONT_BASE,
    alignment: { vertical: 'middle', wrapText: true },
  })

  // 행 4: 견적 문구
  setRowHeight(ws, 4, ROW_H.header)
  mergeCells(ws, 4, 4, 4, 10) // D4:J4
  setCell(ws, 4, 4, ' 아래와 같이 견적합니다 ', {
    font: FONT_BASE,
    alignment: { vertical: 'middle' },
  })

  mergeCells(ws, 4, 11, 4, 12) // K4:L4
  setCell(ws, 4, 11, '  주요 사업', {
    font: { ...FONT_BASE, bold: true },
    alignment: { vertical: 'middle' },
  })

  mergeCells(ws, 4, 13, 4, 16) // M4:P4
  setCell(ws, 4, 13, 'SW 개발 / IT 서비스 운영 / 종합 광고 대행', {
    font: FONT_BASE,
    alignment: { vertical: 'middle' },
  })

  // 행 5: 구분선
  setRowHeight(ws, 5, ROW_H.divider)

  // 행 6: 견적일자
  setRowHeight(ws, 6, ROW_H.meta)
  setCell(ws, 6, 4, '견적일자', { font: FONT_BOLD, alignment: { vertical: 'middle' } })
  setCell(ws, 6, 5, data.quoteDate ? new Date(data.quoteDate) : new Date(), {
    font: FONT_BASE,
    numFmt: FMT.date,
    alignment: { vertical: 'middle', horizontal: 'center' },
  })
  setCell(ws, 6, 6, data.validDays, {
    font: FONT_BASE,
    numFmt: '(견적일 기준 0일)',
    alignment: { vertical: 'middle', horizontal: 'center' },
  })

  mergeCells(ws, 6, 11, 6, 12) // K6:L6
  setCell(ws, 6, 11, '  세일즈 담당자', { font: { ...FONT_BASE, bold: true }, alignment: { vertical: 'middle' } })
  mergeCells(ws, 6, 13, 6, 16) // M6:P6
  setCell(ws, 6, 13, data.salesPerson || 'B2B세일즈팀 담당 매니저', { font: FONT_BASE, alignment: { vertical: 'middle' } })

  // 행 7: 유효기간
  setRowHeight(ws, 7, ROW_H.meta)
  setCell(ws, 7, 4, '유효기간', { font: FONT_BOLD, alignment: { vertical: 'middle' } })
  // 유효기간 = 견적일자 + validDays - 1
  if (data.quoteDate) {
    const expire = new Date(data.quoteDate)
    expire.setDate(expire.getDate() + data.validDays - 1)
    setCell(ws, 7, 5, expire, {
      font: FONT_BASE,
      numFmt: FMT.date,
      alignment: { vertical: 'middle', horizontal: 'center' },
    })
  }
  mergeCells(ws, 7, 5, 7, 6) // E7:F7 (원본 F7에 validDays)
  setCell(ws, 7, 6, data.validDays, {
    font: FONT_BASE,
    numFmt: FMT.workdays,
    alignment: { vertical: 'middle', horizontal: 'center' },
  })

  mergeCells(ws, 7, 11, 7, 12) // K7:L7
  setCell(ws, 7, 11, '  연락처', { font: { ...FONT_BASE, bold: true }, alignment: { vertical: 'middle' } })
  mergeCells(ws, 7, 13, 7, 16) // M7:P7
  setCell(ws, 7, 13, data.salesContact || '', { font: FONT_BASE, alignment: { vertical: 'middle' } })

  // 행 8: 이메일
  setRowHeight(ws, 8, ROW_H.meta)
  mergeCells(ws, 8, 2, 8, 3) // B8:C8
  setCell(ws, 8, 2, '', { font: FONT_BASE })
  mergeCells(ws, 8, 11, 8, 12) // K8:L8
  setCell(ws, 8, 11, '  이메일 주소', { font: { ...FONT_BASE, bold: true }, alignment: { vertical: 'middle' } })
  mergeCells(ws, 8, 13, 8, 16) // M8:P8
  setCell(ws, 8, 13, data.salesEmail || '', { font: FONT_BASE, alignment: { vertical: 'middle' } })

  // 행 9: 여백
  setRowHeight(ws, 9, ROW_H.gap)
}

// ─── P13-c: 비용 요약 + 프로젝트 정보 빌더 (행 10~18) ───────────────────────

function buildSummary(
  ws: ExcelJS.Worksheet,
  data: QuotationData,
  laborCellRef: string, // 직접 노무비 셀 주소 (J11)
  overheadCellRef: string,
  profitCellRef: string,
  discountCellRef: string,
) {
  // 행 10: 최종 견적가 바 (검정 배경)
  setRowHeight(ws, 10, ROW_H.summaryBar)
  mergeCells(ws, 10, 2, 10, 9) // B10:I10
  setCell(ws, 10, 2, '최종 견적가', {
    fill: blackFill(),
    font: FONT_WHITE,
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: BORDER_THIN,
  })
  mergeCells(ws, 10, 10, 10, 13) // J10:M10
  setCell(ws, 10, 10, { formula: `SUM(${laborCellRef}:${profitCellRef})-${discountCellRef}` }, {
    fill: blackFill(),
    font: FONT_WHITE,
    numFmt: FMT.krw,
    alignment: { vertical: 'middle', horizontal: 'right' },
    border: BORDER_THIN,
  })
  mergeCells(ws, 10, 14, 10, 16) // N10:P10
  setCell(ws, 10, 14, { formula: `${addr(10, 10)}*10%` }, {
    fill: blackFill(),
    font: FONT_WHITE,
    numFmt: FMT.krw,
    alignment: { vertical: 'middle', horizontal: 'right' },
    border: BORDER_THIN,
  })

  // 행 11: 직접 노무비 (업무처리비)
  setRowHeight(ws, 11, ROW_H.summaryRow)
  mergeCells(ws, 11, 5, 11, 9) // E11:I11
  setCell(ws, 11, 5, ' 직접 노무비 (업무처리비)', NORMAL_CELL_STYLE)
  mergeCells(ws, 11, 10, 11, 13) // J11:M11
  // 값은 buildModuleTable에서 수식으로 채워짐 — 여기선 0 placeholder
  const j11 = ws.getCell(11, 10)
  j11.numFmt = FMT.krw
  j11.font = FONT_BLACK
  j11.alignment = { vertical: 'middle', horizontal: 'right' }
  j11.border = BORDER_THIN
  mergeCells(ws, 11, 14, 11, 16) // N11:P11
  setCell(ws, 11, 14, { formula: `${addr(11, 10)}*10%` }, {
    ...NORMAL_RIGHT,
    numFmt: FMT.krw,
  })

  // 행 12: 제경비
  setRowHeight(ws, 12, ROW_H.summaryRow)
  mergeCells(ws, 12, 5, 12, 7) // E12:G12
  setCell(ws, 12, 5, ' 제경비', NORMAL_CELL_STYLE)
  setCell(ws, 12, 8, data.overheadRate, {
    ...NORMAL_CENTER,
    numFmt: FMT.percent,
  })
  mergeCells(ws, 12, 8, 12, 9) // H12:I12
  mergeCells(ws, 12, 10, 12, 13) // J12:M12
  setCell(ws, 12, 10, { formula: `${addr(11, 10)}*${addr(12, 8)}` }, {
    ...NORMAL_RIGHT,
    numFmt: FMT.krw,
  })
  mergeCells(ws, 12, 14, 12, 16) // N12:P12
  setCell(ws, 12, 14, { formula: `${addr(12, 10)}*10%` }, {
    ...NORMAL_RIGHT,
    numFmt: FMT.krw,
  })

  // 행 13: 기술료 (수익률)
  setRowHeight(ws, 13, ROW_H.summaryRow)
  mergeCells(ws, 13, 5, 13, 7) // E13:G13
  setCell(ws, 13, 5, ' 기술료 (수익률)', NORMAL_CELL_STYLE)
  setCell(ws, 13, 8, data.profitRate, {
    ...NORMAL_CENTER,
    numFmt: FMT.percent,
  })
  mergeCells(ws, 13, 8, 13, 9) // H13:I13
  mergeCells(ws, 13, 10, 13, 13) // J13:M13
  setCell(ws, 13, 10, { formula: `SUM(${addr(11, 10)}:${addr(12, 10)})*${addr(13, 8)}` }, {
    ...NORMAL_RIGHT,
    numFmt: FMT.krw,
  })
  mergeCells(ws, 13, 14, 13, 16) // N13:P13
  setCell(ws, 13, 14, { formula: `${addr(13, 10)}*10%` }, {
    ...NORMAL_RIGHT,
    numFmt: FMT.krw,
  })

  // 행 14: 파트너 할인
  setRowHeight(ws, 14, ROW_H.summaryRow)
  mergeCells(ws, 14, 5, 14, 7) // E14:G14
  setCell(ws, 14, 5, ' 파트너 할인', NORMAL_CELL_STYLE)
  mergeCells(ws, 14, 8, 14, 9) // H14:I14
  mergeCells(ws, 14, 10, 14, 13) // J14:M14
  setCell(ws, 14, 10, data.discount || 0, {
    ...NORMAL_RIGHT,
    numFmt: FMT.krwMinus,
  })
  mergeCells(ws, 14, 14, 14, 16) // N14:P14
  setCell(ws, 14, 14, { formula: `${addr(14, 10)}*10%` }, {
    ...NORMAL_RIGHT,
    numFmt: FMT.krwMinus,
  })

  // 행 15: 구분선
  setRowHeight(ws, 15, ROW_H.summaryDivider)

  // 행 16: 최종 결과물 + 결제 방법
  setRowHeight(ws, 16, ROW_H.projectInfo)
  mergeCells(ws, 16, 5, 16, 7) // E16:G16
  setCell(ws, 16, 5, ' 최종 결과물', LIGHTGRAY_CELL_STYLE)
  mergeCells(ws, 16, 8, 16, 11) // H16:K16
  setCell(ws, 16, 8, data.deliverable || '', {
    ...NORMAL_CELL_STYLE,
    alignment: { vertical: 'middle', wrapText: true },
  })
  mergeCells(ws, 16, 12, 16, 13) // L16:M16
  setCell(ws, 16, 12, '결제 방법', LIGHTGRAY_CELL_STYLE)
  mergeCells(ws, 16, 14, 16, 16) // N16:P16
  setCell(ws, 16, 14, data.paymentMethod || '', {
    ...NORMAL_CELL_STYLE,
    alignment: { vertical: 'middle', wrapText: true },
  })

  // 행 17: 개발 기간 + 청구 방법
  setRowHeight(ws, 17, ROW_H.projectInfo)
  mergeCells(ws, 17, 8, 17, 11) // H17:K17 (원본 I17)
  const period =
    data.devPeriodStart && data.devPeriodEnd
      ? `${data.devPeriodStart} ~ ${data.devPeriodEnd}`
      : ''
  setCell(ws, 17, 5, '개발 기간', LIGHTGRAY_CELL_STYLE)
  mergeCells(ws, 17, 5, 17, 7) // E17:G17
  setCell(ws, 17, 8, period, {
    ...NORMAL_CELL_STYLE,
    alignment: { vertical: 'middle', horizontal: 'center' },
  })
  mergeCells(ws, 17, 12, 17, 13) // L17:M17
  setCell(ws, 17, 12, '청구 방법', LIGHTGRAY_CELL_STYLE)
  mergeCells(ws, 17, 14, 17, 16) // N17:P17
  setCell(ws, 17, 14, data.billingMethod || '', {
    ...NORMAL_CELL_STYLE,
    alignment: { vertical: 'middle' },
  })

  // 행 18: 여백
  setRowHeight(ws, 18, ROW_H.gap3)
}

// ─── P13-d: 모듈별 항목 테이블 빌더 (동적, 행 19~) ────────────────────────

/**
 * 모듈별 항목 테이블을 작성하고 다음 빈 행 번호를 반환한다.
 * J11(직접 노무비)에 삽입할 수식도 반환한다.
 */
function buildModuleTable(
  ws: ExcelJS.Worksheet,
  data: QuotationData,
  startRow: number,
): { nextRow: number; subtotalCells: string[] } {
  let r = startRow
  const subtotalCells: string[] = [] // 각 그룹 소계 L셀 주소 모음

  // 행 19: "세부 견적 기준" 제목 바
  setRowHeight(ws, r, ROW_H.titleBar)
  mergeCells(ws, r, 2, r, 16)
  setCell(ws, r, 2, '세부 견적 기준', {
    fill: whiteFill(),
    font: { ...FONT_BASE, bold: true, size: 11 },
    alignment: { vertical: 'middle', horizontal: 'left' },
    border: BORDER_THIN,
  })
  r++

  // 행 20: 여백
  setRowHeight(ws, r, ROW_H.gap3)
  r++

  // 행 21: 컬럼 헤더 (검정 배경)
  setRowHeight(ws, r, ROW_H.colHeader)
  const colHeaderStyle = BLACK_CELL_STYLE

  mergeCells(ws, r, 2, r, 3) // B21:C21 — NO
  setCell(ws, r, 2, 'NO', colHeaderStyle)
  setCell(ws, r, 4, '중분류', colHeaderStyle) // D21
  mergeCells(ws, r, 5, r, 7) // E21:G21 — 주요 기능
  setCell(ws, r, 5, '주요 기능', colHeaderStyle)
  setCell(ws, r, 8, '예상 시작일', colHeaderStyle) // H21
  setCell(ws, r, 9, '예상 종료일', colHeaderStyle) // I21
  setCell(ws, r, 10, '월 비용', colHeaderStyle) // J21
  setCell(ws, r, 11, '소요일', colHeaderStyle) // K21
  mergeCells(ws, r, 12, r, 13) // L21:M21 — 총합
  setCell(ws, r, 12, '총합', colHeaderStyle)
  mergeCells(ws, r, 14, r, 16) // N21:P21 — 부가세
  setCell(ws, r, 14, '부가세', colHeaderStyle)
  r++

  // 행 22: 구분선
  setRowHeight(ws, r, ROW_H.gap3)
  r++

  // 각 대분류별 렌더링
  for (const group of data.groups) {
    // 그룹 헤더 행 (검정 배경)
    setRowHeight(ws, r, ROW_H.groupHeader)
    mergeCells(ws, r, 2, r, 11)
    setCell(ws, r, 2, group.name, {
      fill: blackFill(),
      font: FONT_WHITE,
      alignment: { vertical: 'middle', horizontal: 'left' },
      border: BORDER_THIN,
    })
    mergeCells(ws, r, 12, r, 13)
    const groupTotal = calcGroupSubtotal(group.items)
    setCell(ws, r, 12, groupTotal, {
      fill: blackFill(),
      font: FONT_WHITE,
      numFmt: FMT.krw,
      alignment: { vertical: 'middle', horizontal: 'right' },
      border: BORDER_THIN,
    })
    mergeCells(ws, r, 14, r, 16)
    setCell(ws, r, 14, { formula: `${addr(r, 12)}*10%` }, {
      fill: blackFill(),
      font: FONT_WHITE,
      numFmt: FMT.krw,
      alignment: { vertical: 'middle', horizontal: 'right' },
      border: BORDER_THIN,
    })
    r++

    const itemStartRow = r

    // 중분류 항목 행
    let no = 1
    for (const item of group.items) {
      setRowHeight(ws, r, ROW_H.item)
      const workDays = calcWorkDays(item.startDate, item.endDate)
      const totalCost = calcItemTotal(item.monthlyCost, workDays)

      mergeCells(ws, r, 2, r, 3) // B:C — NO
      setCell(ws, r, 2, no, { ...NORMAL_CENTER, numFmt: '0' })

      setCell(ws, r, 4, item.category, NORMAL_CELL_STYLE) // D — 중분류

      mergeCells(ws, r, 5, r, 7) // E:F:G — 주요기능
      setCell(ws, r, 5, item.description, {
        ...NORMAL_CELL_STYLE,
        alignment: { vertical: 'middle', wrapText: true },
      })

      setCell(ws, r, 8, item.startDate ? new Date(item.startDate) : '', {
        ...NORMAL_CENTER,
        numFmt: FMT.date,
      })
      setCell(ws, r, 9, item.endDate ? new Date(item.endDate) : '', {
        ...NORMAL_CENTER,
        numFmt: FMT.date,
      })
      setCell(ws, r, 10, item.monthlyCost, { ...NORMAL_RIGHT, numFmt: FMT.krw })
      setCell(ws, r, 11, workDays, { ...NORMAL_CENTER, numFmt: FMT.workdays })

      mergeCells(ws, r, 12, r, 13) // L:M — 총합
      // 수식: =J{r}*3.33%*K{r}
      setCell(ws, r, 12, { formula: `${addr(r, 10)}*3.33%*${addr(r, 11)}` }, {
        ...NORMAL_RIGHT,
        numFmt: FMT.krw,
      })

      mergeCells(ws, r, 14, r, 16) // N:O:P — 부가세
      setCell(ws, r, 14, { formula: `${addr(r, 12)}*10%` }, {
        ...NORMAL_RIGHT,
        numFmt: FMT.krw,
      })

      no++
      r++
    }

    const itemEndRow = r - 1

    // 소계 행
    setRowHeight(ws, r, ROW_H.subtotal)
    setCell(ws, r, 4, '소계', GRAY_CELL_STYLE) // D — 소계 레이블

    setCell(ws, r, 11, { formula: `SUM(${addr(itemStartRow, 11)}:${addr(itemEndRow, 11)})` }, {
      ...LIGHTGRAY_CELL_STYLE,
      numFmt: FMT.workdays,
    })
    mergeCells(ws, r, 12, r, 13) // L:M
    const subtotalAddr = addr(r, 12)
    subtotalCells.push(subtotalAddr)
    setCell(ws, r, 12, { formula: `SUM(${addr(itemStartRow, 12)}:${addr(itemEndRow, 12)})` }, {
      ...LIGHTGRAY_CELL_STYLE,
      numFmt: FMT.krw,
    })
    mergeCells(ws, r, 14, r, 16) // N:O:P
    setCell(ws, r, 14, { formula: `${subtotalAddr}*10%` }, {
      ...LIGHTGRAY_CELL_STYLE,
      numFmt: FMT.krw,
    })
    r++

    // 그룹 사이 여백
    setRowHeight(ws, r, ROW_H.gap2)
    r++
  }

  return { nextRow: r, subtotalCells }
}

// ─── P13-e: MM별 시트 빌더 (시트 2) ─────────────────────────────────────────

function buildMMSheet(ws: ExcelJS.Worksheet, data: QuotationData) {
  // 헤더 영역 재사용
  buildHeader(ws, data)

  // 비용 요약 — MM 시트는 staffItems 기준 노무비
  const staffLaborCost = data.staffItems.reduce(
    (s, item) => s + calcMMTotal(item.monthlyCost, item.mm),
    0,
  )
  const overhead = calcOverhead(staffLaborCost, data.overheadRate)
  const profit = calcProfit(staffLaborCost, overhead, data.profitRate)

  // 행 10: 최종 견적가 바
  setRowHeight(ws, 10, ROW_H.summaryBar)
  mergeCells(ws, 10, 2, 10, 9)
  setCell(ws, 10, 2, '최종 견적가 (MM 기준)', {
    fill: blackFill(),
    font: FONT_WHITE,
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: BORDER_THIN,
  })
  const finalMM = staffLaborCost + overhead + profit - data.discount
  mergeCells(ws, 10, 10, 10, 13)
  setCell(ws, 10, 10, finalMM, {
    fill: blackFill(),
    font: FONT_WHITE,
    numFmt: FMT.krw,
    alignment: { vertical: 'middle', horizontal: 'right' },
    border: BORDER_THIN,
  })
  mergeCells(ws, 10, 14, 10, 16)
  setCell(ws, 10, 14, { formula: `${addr(10, 10)}*10%` }, {
    fill: blackFill(),
    font: FONT_WHITE,
    numFmt: FMT.krw,
    alignment: { vertical: 'middle', horizontal: 'right' },
    border: BORDER_THIN,
  })

  // 행 11: 직접 노무비
  setRowHeight(ws, 11, ROW_H.summaryRow)
  mergeCells(ws, 11, 5, 11, 9)
  setCell(ws, 11, 5, ' 직접 노무비 (MM 기준)', NORMAL_CELL_STYLE)
  mergeCells(ws, 11, 10, 11, 13)
  setCell(ws, 11, 10, staffLaborCost, { ...NORMAL_RIGHT, numFmt: FMT.krw })
  mergeCells(ws, 11, 14, 11, 16)
  setCell(ws, 11, 14, { formula: `${addr(11, 10)}*10%` }, { ...NORMAL_RIGHT, numFmt: FMT.krw })

  // 행 12: 제경비
  setRowHeight(ws, 12, ROW_H.summaryRow)
  mergeCells(ws, 12, 5, 12, 7)
  setCell(ws, 12, 5, ' 제경비', NORMAL_CELL_STYLE)
  setCell(ws, 12, 8, data.overheadRate, { ...NORMAL_CENTER, numFmt: FMT.percent })
  mergeCells(ws, 12, 8, 12, 9)
  mergeCells(ws, 12, 10, 12, 13)
  setCell(ws, 12, 10, { formula: `${addr(11, 10)}*${addr(12, 8)}` }, { ...NORMAL_RIGHT, numFmt: FMT.krw })
  mergeCells(ws, 12, 14, 12, 16)
  setCell(ws, 12, 14, { formula: `${addr(12, 10)}*10%` }, { ...NORMAL_RIGHT, numFmt: FMT.krw })

  // 행 13: 기술료
  setRowHeight(ws, 13, ROW_H.summaryRow)
  mergeCells(ws, 13, 5, 13, 7)
  setCell(ws, 13, 5, ' 기술료 (수익률)', NORMAL_CELL_STYLE)
  setCell(ws, 13, 8, data.profitRate, { ...NORMAL_CENTER, numFmt: FMT.percent })
  mergeCells(ws, 13, 8, 13, 9)
  mergeCells(ws, 13, 10, 13, 13)
  setCell(ws, 13, 10, { formula: `SUM(${addr(11, 10)}:${addr(12, 10)})*${addr(13, 8)}` }, { ...NORMAL_RIGHT, numFmt: FMT.krw })
  mergeCells(ws, 13, 14, 13, 16)
  setCell(ws, 13, 14, { formula: `${addr(13, 10)}*10%` }, { ...NORMAL_RIGHT, numFmt: FMT.krw })

  // 행 14: 파트너 할인
  setRowHeight(ws, 14, ROW_H.summaryRow)
  mergeCells(ws, 14, 5, 14, 7)
  setCell(ws, 14, 5, ' 파트너 할인', NORMAL_CELL_STYLE)
  mergeCells(ws, 14, 8, 14, 9)
  mergeCells(ws, 14, 10, 14, 13)
  setCell(ws, 14, 10, data.discount || 0, { ...NORMAL_RIGHT, numFmt: FMT.krwMinus })
  mergeCells(ws, 14, 14, 14, 16)
  setCell(ws, 14, 14, { formula: `${addr(14, 10)}*10%` }, { ...NORMAL_RIGHT, numFmt: FMT.krwMinus })

  // 행 15: 구분선
  setRowHeight(ws, 15, ROW_H.summaryDivider)

  // 행 16~17: 프로젝트 정보
  setRowHeight(ws, 16, ROW_H.projectInfo)
  mergeCells(ws, 16, 5, 16, 7)
  setCell(ws, 16, 5, ' 최종 결과물', LIGHTGRAY_CELL_STYLE)
  mergeCells(ws, 16, 8, 16, 11)
  setCell(ws, 16, 8, data.deliverable || '', NORMAL_CELL_STYLE)
  mergeCells(ws, 16, 12, 16, 13)
  setCell(ws, 16, 12, '결제 방법', LIGHTGRAY_CELL_STYLE)
  mergeCells(ws, 16, 14, 16, 16)
  setCell(ws, 16, 14, data.paymentMethod || '', NORMAL_CELL_STYLE)

  setRowHeight(ws, 17, ROW_H.projectInfo)
  mergeCells(ws, 17, 5, 17, 7)
  setCell(ws, 17, 5, '개발 기간', LIGHTGRAY_CELL_STYLE)
  mergeCells(ws, 17, 8, 17, 11)
  const period =
    data.devPeriodStart && data.devPeriodEnd
      ? `${data.devPeriodStart} ~ ${data.devPeriodEnd}`
      : ''
  setCell(ws, 17, 8, period, { ...NORMAL_CELL_STYLE, alignment: { vertical: 'middle', horizontal: 'center' } })
  mergeCells(ws, 17, 12, 17, 13)
  setCell(ws, 17, 12, '청구 방법', LIGHTGRAY_CELL_STYLE)
  mergeCells(ws, 17, 14, 17, 16)
  setCell(ws, 17, 14, data.billingMethod || '', NORMAL_CELL_STYLE)

  setRowHeight(ws, 18, ROW_H.gap3)

  // ─ MM 항목 테이블 (행 19~)
  let r = 19

  // 제목 바
  setRowHeight(ws, r, ROW_H.titleBar)
  mergeCells(ws, r, 2, r, 16)
  setCell(ws, r, 2, 'MM 별 견적 (투입 인력 및 비용)', {
    fill: whiteFill(),
    font: { ...FONT_BASE, bold: true, size: 11 },
    alignment: { vertical: 'middle', horizontal: 'left' },
    border: BORDER_THIN,
  })
  r++

  setRowHeight(ws, r, ROW_H.gap3)
  r++

  // 컬럼 헤더
  setRowHeight(ws, r, ROW_H.colHeader)
  mergeCells(ws, r, 2, r, 3)
  setCell(ws, r, 2, 'NO', BLACK_CELL_STYLE)
  setCell(ws, r, 4, '역할', BLACK_CELL_STYLE)
  mergeCells(ws, r, 5, r, 7)
  setCell(ws, r, 5, '주요업무', BLACK_CELL_STYLE)
  setCell(ws, r, 8, '시작일', BLACK_CELL_STYLE)
  setCell(ws, r, 9, '종료일', BLACK_CELL_STYLE)
  setCell(ws, r, 10, '월 비용', BLACK_CELL_STYLE)
  setCell(ws, r, 11, 'M/M', BLACK_CELL_STYLE)
  mergeCells(ws, r, 12, r, 13)
  setCell(ws, r, 12, '총합', BLACK_CELL_STYLE)
  mergeCells(ws, r, 14, r, 16)
  setCell(ws, r, 14, '부가세', BLACK_CELL_STYLE)
  r++

  setRowHeight(ws, r, ROW_H.gap3)
  r++

  const itemStartRow = r

  // 항목 행
  data.staffItems.forEach((item, i) => {
    setRowHeight(ws, r, ROW_H.item)
    const total = calcMMTotal(item.monthlyCost, item.mm)

    mergeCells(ws, r, 2, r, 3)
    setCell(ws, r, 2, i + 1, NORMAL_CENTER)
    setCell(ws, r, 4, item.role, NORMAL_CELL_STYLE)
    mergeCells(ws, r, 5, r, 7)
    setCell(ws, r, 5, item.description, NORMAL_CELL_STYLE)
    setCell(ws, r, 8, item.startDate ? new Date(item.startDate) : '', { ...NORMAL_CENTER, numFmt: FMT.date })
    setCell(ws, r, 9, item.endDate ? new Date(item.endDate) : '', { ...NORMAL_CENTER, numFmt: FMT.date })
    setCell(ws, r, 10, item.monthlyCost, { ...NORMAL_RIGHT, numFmt: FMT.krw })
    setCell(ws, r, 11, item.mm, { ...NORMAL_CENTER, numFmt: FMT.mm })
    mergeCells(ws, r, 12, r, 13)
    setCell(ws, r, 12, { formula: `${addr(r, 10)}*${addr(r, 11)}` }, { ...NORMAL_RIGHT, numFmt: FMT.krw })
    mergeCells(ws, r, 14, r, 16)
    setCell(ws, r, 14, { formula: `${addr(r, 12)}*10%` }, { ...NORMAL_RIGHT, numFmt: FMT.krw })
    r++
  })

  const itemEndRow = r - 1

  // 소계 행
  setRowHeight(ws, r, ROW_H.subtotal)
  setCell(ws, r, 4, '소계', GRAY_CELL_STYLE)
  setCell(ws, r, 11, { formula: `SUM(${addr(itemStartRow, 11)}:${addr(itemEndRow, 11)})` }, {
    ...LIGHTGRAY_CELL_STYLE,
    numFmt: FMT.mm,
  })
  mergeCells(ws, r, 12, r, 13)
  setCell(ws, r, 12, { formula: `SUM(${addr(itemStartRow, 12)}:${addr(itemEndRow, 12)})` }, {
    ...LIGHTGRAY_CELL_STYLE,
    numFmt: FMT.krw,
  })
  mergeCells(ws, r, 14, r, 16)
  setCell(ws, r, 14, { formula: `${addr(r, 12)}*10%` }, { ...LIGHTGRAY_CELL_STYLE, numFmt: FMT.krw })
}

// ─── 열 너비 초기화 ───────────────────────────────────────────────────────────

function initColumns(ws: ExcelJS.Worksheet) {
  COL_WIDTHS.forEach((w, i) => {
    ws.getColumn(i + 1).width = w
  })
}

// ─── P13-f: 내보내기 통합 + 다운로드 ─────────────────────────────────────────

export async function exportToXlsx(data: QuotationData): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SmartDoc Builder'
  workbook.created = new Date()

  // ── 시트 1: 모듈 별 견적 ──
  const ws1 = workbook.addWorksheet('모듈 별 견적')
  initColumns(ws1)
  buildHeader(ws1, data)
  buildSummary(ws1, data, 'J11', 'J12', 'J13', 'J14')

  // 동적 항목 테이블 (행 19~)
  const { subtotalCells } = buildModuleTable(ws1, data, 19)

  // J11 직접 노무비 수식: 각 대분류 소계 합산
  const j11 = ws1.getCell(11, 10)
  if (subtotalCells.length > 0) {
    j11.value = { formula: `SUM(${subtotalCells.join(',')})` }
  } else {
    j11.value = 0
  }
  j11.numFmt = FMT.krw

  // ── 시트 2: MM 별 견적 ──
  const ws2 = workbook.addWorksheet('MM 별 견적')
  initColumns(ws2)
  buildMMSheet(ws2, data)

  // ── 다운로드 ──
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const filename =
    data.clientName
      ? `${data.clientName}_견적서_${new Date().toISOString().slice(0, 10)}.xlsx`
      : `견적서_${new Date().toISOString().slice(0, 10)}.xlsx`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
