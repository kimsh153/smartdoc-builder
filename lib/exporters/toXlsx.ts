/**
 * lib/exporters/toXlsx.ts
 *
 * 견적서 Excel 내보내기 — 서버 사이드 API 호출 방식
 *
 * 브라우저 exceljs의 JSZip 기반 직렬화가 복잡한 템플릿(.xlsx)에서
 * XML 손상을 일으키는 문제를 우회하기 위해, 실제 Excel 생성은
 * Node.js(서버) 환경의 /api/quotation/export에서 수행합니다.
 */

import type { QuotationData } from '@/lib/quotation/types'

export async function exportToXlsx(data: QuotationData): Promise<void> {
  const resp = await fetch('/api/quotation/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: 'Unknown error' }))
    throw new Error(err.error || `Export failed (${resp.status})`)
  }

  const blob = await resp.blob()
  const url = URL.createObjectURL(blob)
  const filename = data.clientName
    ? `${data.clientName}_견적서_${new Date().toISOString().slice(0, 10)}.xlsx`
    : `견적서_${new Date().toISOString().slice(0, 10)}.xlsx`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 5_000)
}
