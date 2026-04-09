// 대시보드 카드용 견적서 템플릿 메타 정보
// 실제 데이터 기본값은 store.ts의 createDefaultData()에서 관리

import type { QuotationTemplateMeta } from './types'
import { todayString } from './engine'
import { v4 as uuid } from 'uuid'

export const defaultQuotationTemplates: QuotationTemplateMeta[] = [
  {
    id: 'qt-it-project',
    name: 'IT 프로젝트 견적서',
    description: '모듈별 개발 비용 + MM 인력 구성. 원본 테이크원 견적서 형식.',
    icon: '💻',
    defaultData: {
      clientName: '',
      quoteDate: todayString(),
      validDays: 30,
      salesPerson: '',
      salesContact: '',
      salesEmail: '',

      overheadRate: 0.25,
      profitRate: 0.20,
      discount: 0,

      deliverable: '',
      devPeriodStart: todayString(),
      devPeriodEnd: '',
      paymentMethod: '선금 40% / 중도금 30% / 잔금 30%',
      hasInterimPayment: true,
      billingMethod: '전자세금계산서 발행',

      groups: [
        {
          id: uuid(),
          name: '프로젝트 관리 및 기획',
          items: [
            {
              id: uuid(),
              category: '프로젝트 관리',
              description: '프로젝트 세팅, 프로젝트 매니지먼트',
              startDate: todayString(),
              endDate: '',
              monthlyCost: 15000000,
            },
            {
              id: uuid(),
              category: '서비스 기획',
              description: '서비스 기획 및 와이어프레임',
              startDate: todayString(),
              endDate: '',
              monthlyCost: 7500000,
            },
          ],
        },
        {
          id: uuid(),
          name: '개발',
          items: [
            {
              id: uuid(),
              category: 'UIUX 디자인',
              description: '앱/웹 UI 디자인, 어드민, 랜딩페이지',
              startDate: todayString(),
              endDate: '',
              monthlyCost: 7500000,
            },
            {
              id: uuid(),
              category: '백엔드 개발',
              description: 'API 서버, DB 설계, 어드민 백엔드',
              startDate: todayString(),
              endDate: '',
              monthlyCost: 30000000,
            },
            {
              id: uuid(),
              category: '프론트엔드 개발',
              description: '앱(React Native) 또는 웹 프론트엔드',
              startDate: todayString(),
              endDate: '',
              monthlyCost: 25000000,
            },
          ],
        },
        {
          id: uuid(),
          name: '배포 및 운영',
          items: [
            {
              id: uuid(),
              category: '서버 구축 및 배포',
              description: '클라우드 서버 구축, CI/CD, 배포',
              startDate: todayString(),
              endDate: '',
              monthlyCost: 24000000,
            },
          ],
        },
      ],

      staffItems: [
        {
          id: uuid(),
          role: 'PMO',
          description: '프로젝트 관리 및 기획',
          startDate: todayString(),
          endDate: '',
          monthlyCost: 15000000,
          mm: 1.5,
        },
        {
          id: uuid(),
          role: '기획',
          description: '서비스 기획 및 와이어프레임',
          startDate: todayString(),
          endDate: '',
          monthlyCost: 7500000,
          mm: 1.0,
        },
        {
          id: uuid(),
          role: 'UIUX 디자인',
          description: '디자인 시스템 및 화면 설계',
          startDate: todayString(),
          endDate: '',
          monthlyCost: 7500000,
          mm: 2.0,
        },
        {
          id: uuid(),
          role: '백엔드 개발',
          description: 'API 서버 및 인프라',
          startDate: todayString(),
          endDate: '',
          monthlyCost: 30000000,
          mm: 3.0,
        },
        {
          id: uuid(),
          role: '프론트엔드 개발',
          description: '앱 및 웹 프론트엔드',
          startDate: todayString(),
          endDate: '',
          monthlyCost: 25000000,
          mm: 2.0,
        },
      ],

      notes: '',
    },
  },
]
