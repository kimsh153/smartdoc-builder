import type { Template } from './types'

export const defaultTemplates: Template[] = [
  {
    id: 'business-plan',
    name: '사업 기획서',
    description: '신규 사업 또는 프로젝트를 위한 기획서 양식',
    icon: '📊',
    sections: [
      {
        id: 'basic-info',
        title: '기본 정보',
        fields: [
          { id: 'company_name', label: '회사명이 무엇인가요?', type: 'text', placeholder: '주식회사 OOO', required: true },
          { id: 'project_name', label: '프로젝트명을 입력해주세요', type: 'text', placeholder: '프로젝트명', required: true },
          { id: 'project_date', label: '기획 일자는 언제인가요?', type: 'date', required: true },
          { id: 'author', label: '작성자 이름을 알려주세요', type: 'text', placeholder: '홍길동', required: true },
        ],
      },
      {
        id: 'overview',
        title: '사업 개요',
        fields: [
          { id: 'business_type', label: '사업 유형을 선택해주세요', type: 'select', options: [
            { label: '신규 사업', value: 'new' },
            { label: '기존 사업 확장', value: 'expansion' },
            { label: '서비스 개선', value: 'improvement' },
          ], required: true },
          { id: 'target_market', label: '목표 시장은 어디인가요?', type: 'text', placeholder: 'B2B SaaS 시장', guide: '타겟 고객층과 시장 규모를 함께 기재하면 좋습니다' },
          { id: 'business_summary', label: '사업 내용을 간략히 설명해주세요', type: 'textarea', placeholder: '본 사업은...', required: true },
        ],
      },
      {
        id: 'budget',
        title: '예산 계획',
        fields: [
          { id: 'total_budget', label: '총 예산은 얼마인가요?', type: 'number', placeholder: '50000000', required: true },
          { id: 'budget_period', label: '예산 집행 기간을 선택해주세요', type: 'radio', options: [
            { label: '3개월', value: '3months' },
            { label: '6개월', value: '6months' },
            { label: '1년', value: '1year' },
          ], required: true },
        ],
      },
    ],
    documentContent: `사업 기획서

회사명: {{company_name}}
프로젝트명: {{project_name}}
작성일: {{project_date}}
작성자: {{author}}

1. 사업 개요

사업 유형: {{business_type}}
목표 시장: {{target_market}}

{{business_summary}}

2. 예산 계획

총 예산: {{total_budget}}원
집행 기간: {{budget_period}}`,
  },
  {
    id: 'project-proposal',
    name: '프로젝트 제안서',
    description: '프로젝트 수주를 위한 제안서 양식',
    icon: '📝',
    sections: [
      {
        id: 'client-info',
        title: '고객사 정보',
        fields: [
          { id: 'client_name', label: '고객사명을 입력해주세요', type: 'text', placeholder: '(주)OOO', required: true },
          { id: 'contact_person', label: '담당자분 성함은요?', type: 'text', placeholder: '김담당', required: true },
          { id: 'proposal_date', label: '제안 일자를 선택해주세요', type: 'date', required: true },
        ],
      },
      {
        id: 'project-scope',
        title: '프로젝트 범위',
        fields: [
          { id: 'project_title', label: '프로젝트 제목이 무엇인가요?', type: 'text', placeholder: '웹사이트 리뉴얼 프로젝트', required: true },
          { id: 'project_scope', label: '프로젝트 범위를 설명해주세요', type: 'textarea', placeholder: '본 프로젝트는...', required: true, guide: '수행 범위, 제외 범위를 명확히 구분해주세요' },
          { id: 'deliverables', label: '산출물을 나열해주세요', type: 'textarea', placeholder: '1. 요구사항 정의서\n2. 설계 문서\n3. 소스코드' },
        ],
      },
      {
        id: 'timeline',
        title: '일정 및 비용',
        fields: [
          { id: 'start_date', label: '시작 예정일은 언제인가요?', type: 'date', required: true },
          { id: 'end_date', label: '완료 예정일은요?', type: 'date', required: true },
          { id: 'total_cost', label: '총 비용은 얼마인가요?', type: 'number', placeholder: '30000000', required: true },
          { id: 'payment_terms', label: '지불 조건을 선택해주세요', type: 'radio', options: [
            { label: '착수금 50% / 잔금 50%', value: '50-50' },
            { label: '착수금 30% / 중도금 40% / 잔금 30%', value: '30-40-30' },
            { label: '완료 후 일시불', value: 'complete' },
          ] },
        ],
      },
    ],
    documentContent: `프로젝트 제안서

수신: {{client_name}} {{contact_person}} 귀하
제안일: {{proposal_date}}

1. 프로젝트 개요

프로젝트명: {{project_title}}

{{project_scope}}

2. 산출물

{{deliverables}}

3. 일정

시작일: {{start_date}}
완료일: {{end_date}}

4. 비용

총 비용: {{total_cost}}원
지불 조건: {{payment_terms}}`,
  },
  {
    id: 'work-contract',
    name: '업무 계약서',
    description: '프리랜서 또는 외주 업무 계약서 양식',
    icon: '📋',
    sections: [
      {
        id: 'parties',
        title: '계약 당사자',
        fields: [
          { id: 'party_a', label: '갑(발주자)의 상호를 입력해주세요', type: 'text', placeholder: '주식회사 OOO', required: true },
          { id: 'party_a_rep', label: '갑의 대표자명은요?', type: 'text', placeholder: '대표이사 홍길동', required: true },
          { id: 'party_b', label: '을(수급자)의 상호를 입력해주세요', type: 'text', placeholder: '주식회사 OOO', required: true },
          { id: 'party_b_rep', label: '을의 대표자명은요?', type: 'text', placeholder: '대표이사 김철수', required: true },
        ],
      },
      {
        id: 'contract-details',
        title: '계약 내용',
        fields: [
          { id: 'work_description', label: '업무 내용을 상세히 기술해주세요', type: 'textarea', placeholder: '본 계약에 따른 업무 내용은...', required: true },
          { id: 'contract_amount', label: '계약 금액은 얼마인가요?', type: 'number', placeholder: '10000000', required: true },
          { id: 'contract_start', label: '계약 시작일을 선택해주세요', type: 'date', required: true },
          { id: 'contract_end', label: '계약 종료일을 선택해주세요', type: 'date', required: true },
        ],
      },
      {
        id: 'terms',
        title: '기타 조건',
        fields: [
          { id: 'confidentiality', label: '기밀유지 의무가 있나요?', type: 'radio', options: [
            { label: '있음', value: 'yes' },
            { label: '없음', value: 'no' },
          ], required: true },
          { id: 'penalty_clause', label: '위약금 조항을 포함하나요?', type: 'radio', options: [
            { label: '포함', value: 'include' },
            { label: '미포함', value: 'exclude' },
          ] },
          { id: 'additional_terms', label: '추가 특약 사항이 있나요?', type: 'textarea', placeholder: '추가 특약 사항...' },
        ],
      },
    ],
    documentContent: `업무 계약서

갑(발주자): {{party_a}}
대표자: {{party_a_rep}}

을(수급자): {{party_b}}
대표자: {{party_b_rep}}

제1조 (업무 내용)
{{work_description}}

제2조 (계약 금액)
총 계약 금액: 금 {{contract_amount}}원정

제3조 (계약 기간)
{{contract_start}}부터 {{contract_end}}까지

제4조 (기밀유지)
기밀유지 의무: {{confidentiality}}

제5조 (위약금)
{{penalty_clause}}

제6조 (특약사항)
{{additional_terms}}`,
  },
  {
    id: 'meeting-minutes',
    name: '회의록',
    description: '회의 내용을 정리하고 공유하기 위한 양식',
    icon: '🗒️',
    sections: [
      {
        id: 'meeting-info',
        title: '회의 정보',
        fields: [
          { id: 'meeting_title', label: '회의 제목을 입력해주세요', type: 'text', placeholder: '주간 정기 회의', required: true },
          { id: 'meeting_date', label: '회의 일시는 언제인가요?', type: 'date', required: true },
          { id: 'meeting_location', label: '회의 장소는 어디인가요?', type: 'text', placeholder: '3층 대회의실' },
          { id: 'attendees', label: '참석자를 나열해주세요', type: 'textarea', placeholder: '홍길동(팀장), 김철수(대리), 이영희(사원)', required: true },
        ],
      },
      {
        id: 'agenda',
        title: '안건 및 논의',
        fields: [
          { id: 'agenda_items', label: '회의 안건을 입력해주세요', type: 'textarea', placeholder: '1. 프로젝트 진행 현황\n2. 일정 조율\n3. 예산 검토', required: true },
          { id: 'discussion', label: '논의 내용을 정리해주세요', type: 'textarea', placeholder: '각 안건별 논의 내용...', required: true },
        ],
      },
      {
        id: 'decisions',
        title: '결정 사항',
        fields: [
          { id: 'decisions', label: '결정된 사항을 기록해주세요', type: 'textarea', placeholder: '1. OOO 프로젝트 일정 1주 연장\n2. 추가 인력 1명 투입 확정', required: true },
          { id: 'action_items', label: '후속 조치(액션 아이템)를 정리해주세요', type: 'textarea', placeholder: '담당자 - 업무 - 기한 형식으로 작성' },
          { id: 'next_meeting', label: '다음 회의 일정이 있나요?', type: 'date' },
        ],
      },
    ],
    documentContent: `회의록

회의 제목: {{meeting_title}}
일시: {{meeting_date}}
장소: {{meeting_location}}

참석자:
{{attendees}}

1. 안건
{{agenda_items}}

2. 논의 내용
{{discussion}}

3. 결정 사항
{{decisions}}

4. 후속 조치
{{action_items}}

다음 회의: {{next_meeting}}`,
  },
  {
    id: 'weekly-report',
    name: '주간/월간 보고서',
    description: '정기 업무 보고를 위한 양식',
    icon: '📊',
    sections: [
      {
        id: 'report-info',
        title: '보고서 정보',
        fields: [
          { id: 'report_period', label: '보고 기간을 선택해주세요', type: 'radio', options: [
            { label: '주간', value: 'weekly' },
            { label: '월간', value: 'monthly' },
          ], required: true },
          { id: 'report_date', label: '보고 일자를 선택해주세요', type: 'date', required: true },
          { id: 'reporter', label: '보고자 이름을 입력해주세요', type: 'text', placeholder: '홍길동', required: true },
          { id: 'department', label: '소속 부서는요?', type: 'text', placeholder: '개발팀' },
        ],
      },
      {
        id: 'achievements',
        title: '주요 실적',
        fields: [
          { id: 'completed_tasks', label: '완료한 업무를 나열해주세요', type: 'textarea', placeholder: '1. OOO 기능 개발 완료\n2. 버그 수정 5건', required: true },
          { id: 'kpi_achievement', label: 'KPI 달성 현황이 있나요?', type: 'textarea', placeholder: '목표 대비 달성률...' },
        ],
      },
      {
        id: 'issues',
        title: '이슈 및 계획',
        fields: [
          { id: 'issues', label: '이슈 사항이 있나요?', type: 'textarea', placeholder: '발생한 문제나 리스크...' },
          { id: 'next_plan', label: '다음 기간 계획을 입력해주세요', type: 'textarea', placeholder: '1. OOO 기능 테스트\n2. 문서 정리', required: true },
          { id: 'support_needed', label: '지원이 필요한 사항이 있나요?', type: 'textarea', placeholder: '추가 인력, 예산 등...' },
        ],
      },
    ],
    documentContent: `{{report_period}} 업무 보고서

보고 일자: {{report_date}}
보고자: {{reporter}}
소속: {{department}}

1. 주요 실적
{{completed_tasks}}

KPI 달성 현황:
{{kpi_achievement}}

2. 이슈 사항
{{issues}}

3. 향후 계획
{{next_plan}}

4. 지원 요청 사항
{{support_needed}}`,
  },
  {
    id: 'quotation',
    name: '견적서',
    description: '제품/서비스 가격 견적을 위한 양식',
    icon: '💰',
    sections: [
      {
        id: 'company-info',
        title: '발행 정보',
        fields: [
          { id: 'issuer_company', label: '발행 회사명을 입력해주세요', type: 'text', placeholder: '주식회사 OOO', required: true },
          { id: 'issuer_contact', label: '담당자 연락처는요?', type: 'text', placeholder: '02-1234-5678' },
          { id: 'issue_date', label: '발행일을 선택해주세요', type: 'date', required: true },
          { id: 'valid_until', label: '유효 기간은 언제까지인가요?', type: 'date', required: true },
        ],
      },
      {
        id: 'recipient',
        title: '수신 정보',
        fields: [
          { id: 'recipient_company', label: '수신 회사명을 입력해주세요', type: 'text', placeholder: '주식회사 OOO', required: true },
          { id: 'recipient_person', label: '담당자분 성함은요?', type: 'text', placeholder: '김담당' },
        ],
      },
      {
        id: 'items',
        title: '견적 내역',
        fields: [
          { id: 'item_list', label: '품목/서비스를 입력해주세요', type: 'textarea', placeholder: '품목명 - 수량 - 단가 형식으로 입력\n예: 웹사이트 개발 - 1식 - 5,000,000원', required: true },
          { id: 'subtotal', label: '공급가액(부가세 제외)은 얼마인가요?', type: 'number', placeholder: '10000000', required: true },
          { id: 'vat', label: '부가세는 얼마인가요?', type: 'number', placeholder: '1000000' },
          { id: 'total', label: '합계 금액을 입력해주세요', type: 'number', placeholder: '11000000', required: true },
          { id: 'notes', label: '비고 사항이 있나요?', type: 'textarea', placeholder: '결제 조건, 납기일 등...' },
        ],
      },
    ],
    documentContent: `견적서

발행일: {{issue_date}}
유효기간: {{valid_until}}까지

발행처: {{issuer_company}}
연락처: {{issuer_contact}}

수신: {{recipient_company}}
담당자: {{recipient_person}} 귀하

[견적 내역]
{{item_list}}

공급가액: {{subtotal}}원
부가세: {{vat}}원
합계: {{total}}원

[비고]
{{notes}}`,
  },
]
