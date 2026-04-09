// 견적서 핵심 데이터 모델
// 입력 데이터와 출력 디자인을 완전 분리하는 구조

export interface QuotationItem {
  id: string
  category: string       // 중분류
  description: string    // 주요 기능
  startDate: string      // yyyy-MM-dd
  endDate: string        // yyyy-MM-dd
  monthlyCost: number    // 월 비용 (원)
  // 자동계산 (store/preview에서 계산)
  // workDays: number     calcWorkDays(startDate, endDate)
  // totalCost: number    calcItemTotal(monthlyCost, workDays)
  // vat: number          totalCost * 0.1
}

export interface QuotationGroup {
  id: string
  name: string           // 대분류명 (자유 입력)
  items: QuotationItem[]
}

export interface StaffItem {
  id: string
  role: string           // 역할/중분류 (PMO, 기획, 디자인, 백엔드, 프론트 등)
  description: string    // 주요업무
  startDate: string      // yyyy-MM-dd
  endDate: string        // yyyy-MM-dd
  monthlyCost: number    // 월 비용 (원)
  mm: number             // M/M (Man-Month)
  // 자동계산: totalCost = monthlyCost * mm
}

export interface QuotationData {
  // 견적 헤더
  clientName: string        // 고객사명
  quoteDate: string         // 견적일자 (yyyy-MM-dd, 기본값 today)
  validDays: number         // 유효기간 (일수, 기본 30)
  salesPerson: string       // 담당자명
  salesContact: string      // 연락처
  salesEmail: string        // 이메일

  // 비용 구성
  overheadRate: number      // 제경비 비율 (0.25 = 25%)
  profitRate: number        // 기술료(수익률) 비율 (0.20 = 20%)
  discount: number          // 파트너 할인 금액 (원)

  // 프로젝트 정보
  deliverable: string       // 최종 결과물
  devPeriodStart: string    // 개발 기간 시작
  devPeriodEnd: string      // 개발 기간 종료
  paymentMethod: string     // 결제 방법
  hasInterimPayment: boolean // 중도금 유무 (true: 선금40/중도금30/잔금30, false: 선금50/잔금50)
  billingMethod: string     // 청구 방법

  // 모듈별 견적 (시트1)
  groups: QuotationGroup[]

  // 인력별 견적 (시트2 MM)
  staffItems: StaffItem[]

  // 기타
  notes: string             // 기타 메모
}

export interface SavedQuotation {
  id: string
  name: string
  savedAt: string
  data: QuotationData
}

// 대시보드 카드용 메타 정보
export interface QuotationTemplateMeta {
  id: string
  name: string
  description: string
  icon: string
  defaultData: QuotationData
}
