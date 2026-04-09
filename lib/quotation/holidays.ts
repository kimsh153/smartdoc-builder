// 2025 일본 공휴일 (원본 Excel SET 주요 휴일 시트 기준)
// Excel serial -> 실제 날짜 변환: (serial - 25569) * 86400 * 1000 = JS timestamp

export const JAPAN_HOLIDAYS_2025: string[] = [
  '2025-01-01', // 신정
  '2025-01-13', // 성인의 날
  '2025-02-11', // 건국기념일
  '2025-02-23', // 천황 탄생일
  '2025-02-24', // 대체 공휴일 (천황 탄생일)
  '2025-03-20', // 춘분의 날
  '2025-04-29', // 쇼와의 날 / 골든위크 시작
  '2025-04-30', // 골든위크
  '2025-05-01', // 골든위크
  '2025-05-02', // 골든위크
  '2025-05-03', // 헌법 기념일 / 골든위크
  '2025-05-04', // 녹색의 날 / 골든위크
  '2025-05-05', // 어린이날 / 골든위크
  '2025-05-06', // 대체 공휴일 (녹색의 날)
  '2025-07-21', // 바다의 날
  '2025-08-11', // 산의 날
  '2025-08-13', // 오봉 시작
  '2025-08-14', // 오봉
  '2025-08-15', // 오봉
  '2025-09-15', // 경로의 날
  '2025-09-23', // 추분의 날
  '2025-10-13', // 스포츠의 날
  '2025-11-03', // 문화의 날
  '2025-11-23', // 근로감사의 날
  '2025-11-24', // 대체 공휴일 (근로감사의 날)
]

const holidaySet = new Set(JAPAN_HOLIDAYS_2025)

export function isHoliday(date: Date): boolean {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return holidaySet.has(`${y}-${m}-${d}`)
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  return day === 0 || day === 6 // 0=일요일, 6=토요일
}

export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date)
}
