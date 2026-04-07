import type { Template } from './types'

export const defaultTemplates: Template[] = [
  {
    id: 'business-plan',
    name: '사업 기획서',
    description: '신규 사업 또는 프로젝트를 위한 기획서 양식',
    icon: '📊',
    documentType: 'proposal' as const,
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
            { label: '신규 사업', value: '신규 사업' },
            { label: '기존 사업 확장', value: '기존 사업 확장' },
            { label: '서비스 개선', value: '서비스 개선' },
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
            { label: '3개월', value: '3개월' },
            { label: '6개월', value: '6개월' },
            { label: '1년', value: '1년' },
          ], required: true },
        ],
      },
    ],
    documentContent: `사  업  기  획  서


                                                    기획일: {{project_date}}
                                                    작성자: {{author}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ {{project_name}} ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

제출: {{company_name}}


【 Executive Summary 】

본 기획서는 {{company_name}}이(가) 추진하는 {{project_name}}에 관한
사업 계획을 담고 있습니다. 사업 유형은 {{business_type}}이며,
{{target_market}}을(를) 주요 목표 시장으로 설정합니다.


제1장  사업 개요

  1.1  사업 배경 및 목적

{{business_summary}}

  1.2  사업 유형 및 추진 방향

  본 사업은 {{business_type}} 형태로 추진되며, 시장 내 경쟁 우위
  확보를 핵심 목표로 합니다. 빠른 실행과 지속적인 개선을 통해
  시장 변화에 선제적으로 대응합니다.

  1.3  목표 시장 및 고객

  목표 시장: {{target_market}}

  현재 해당 시장은 디지털 전환 가속화, 고객 니즈 다변화 등으로
  빠르게 재편되고 있습니다. 본 사업은 이러한 변화를 기회로
  삼아 차별화된 가치를 제공합니다.


제2장  사업 전략

  2.1  핵심 가치 제안 (Value Proposition)

  - 차별화된 서비스·제품으로 시장 내 독보적 포지셔닝 확보
  - 고객 중심 운영 체계 구축을 통한 만족도 극대화
  - 지속적인 R&D 투자로 기술 경쟁력 강화

  2.2  수익 모델

  {{business_type}} 사업 특성에 맞는 수익 구조를 설계하며,
  초기 시장 진입 후 단계적으로 수익원을 다각화합니다.

  2.3  핵심 성공 요소 (KSF)

  ① 시장 선점  : 빠른 진입을 통한 브랜드 인지도 확보
  ② 품질 경쟁력 : 업계 최고 수준의 품질 기준 유지
  ③ 고객 관계  : 장기적 파트너십 및 충성 고객 기반 구축


제3장  추진 일정

  Phase 1 (1~3개월)  : 시장 조사 완료, 핵심 인력 구성, 파일럿 설계
  Phase 2 (4~6개월)  : 서비스·제품 개발 및 테스트, 파일럿 운영
  Phase 3 (7~12개월) : 본격 런칭 및 마케팅, KPI 기반 성과 모니터링


제4장  예산 계획

  4.1  소요 예산

  총 예산   : 금 {{total_budget}}원정
  집행 기간 : {{budget_period}}

  4.2  예산 배분 계획

  - 개발 · 제작비   : 총 예산의 40%
  - 마케팅 · 홍보비  : 총 예산의 25%
  - 운영비 · 인건비  : 총 예산의 25%
  - 예비비         : 총 예산의 10%

  4.3  투자 수익 전망

  {{budget_period}} 내 손익분기점(BEP) 달성을 목표로 하며,
  이후 안정적인 수익 창출 단계로 진입합니다.


제5장  위험 관리 (Risk Management)

  ① 시장 리스크  : 시장 변화 모니터링 강화, 유연한 전략 수립
  ② 재무 리스크  : 철저한 예산 관리, 추가 투자 유치 방안 마련
  ③ 운영 리스크  : 핵심 인력 확보·유지, 업무 프로세스 표준화


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 결론 】

본 기획서에 기술된 {{project_name}}은(는) {{target_market}}에서
충분한 성장 가능성을 보유하고 있습니다. {{company_name}}의 역량과
체계적인 실행 계획을 바탕으로 성공적인 사업 추진이 가능할 것으로
판단되며, 적극적인 투자와 지원을 요청드립니다.


  작성일 : {{project_date}}
  작성자 : {{author}}   소속 : {{company_name}}`,
  },
  {
    id: 'project-proposal',
    name: '프로젝트 제안서',
    description: '프로젝트 수주를 위한 제안서 양식',
    documentType: 'proposal' as const,
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
            { label: '착수금 50% / 잔금 50%', value: '착수금 50% / 잔금 50%' },
            { label: '착수금 30% / 중도금 40% / 잔금 30%', value: '착수금 30% / 중도금 40% / 잔금 30%' },
            { label: '완료 후 일시불', value: '완료 후 일시불' },
          ] },
        ],
      },
    ],
    documentContent: `프 로 젝 트  제 안 서


수    신 : {{client_name}}  {{contact_person}} 귀하
제 안 일 : {{proposal_date}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ {{project_title}} ]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   

안녕하십니까.
귀사의 지속적인 발전과 번영을 기원합니다.

이번 프로젝트에 제안의 기회를 주신 것에 깊이 감사드리며,
귀사의 요구사항을 면밀히 검토하여 최적의 솔루션을 제안드립니다.


제1장  프로젝트 개요

  1.1  프로젝트 배경 및 목적

  {{project_title}}은(는) {{client_name}}의 비즈니스 목표 달성을
  위해 기획된 프로젝트입니다. 저희는 해당 분야의 전문 역량을
  바탕으로 귀사에 최적화된 솔루션을 제공할 것입니다.

  1.2  프로젝트 목표

  - 요구사항에 완전히 부합하는 고품질 결과물 납품
  - 합의된 일정 및 예산 범위 내 프로젝트 완료
  - 긴밀한 커뮤니케이션을 통한 리스크 최소화
  - 납품 후 안정적인 운영 지원


제2장  수행 범위 및 방법론

  2.1  수행 범위

{{project_scope}}

  2.2  프로젝트 접근 방식

  본 프로젝트는 단계별 마일스톤을 설정하여 진행하며,
  각 단계 완료 시 귀사의 검토·피드백을 즉각 반영합니다.

  2.3  품질 관리 계획

  - 정기 진행 현황 보고 (주 1회 이상 서면 보고)
  - 단계별 품질 검토 및 테스트 수행
  - 이슈 발생 시 24시간 이내 보고 및 대응


제3장  주요 산출물

  3.1  산출물 목록

{{deliverables}}

  3.2  납품 및 검수 기준

  각 산출물은 사전 합의된 품질 기준 충족 시 납품 완료로 인정합니다.
  납품 후 귀사의 검수 기간은 납품일로부터 7영업일로 합니다.
  검수 기간 내 이의가 없을 경우 최종 승인된 것으로 간주합니다.


제4장  프로젝트 일정

  4.1  전체 일정

  시작일 : {{start_date}}
  완료일 : {{end_date}}

  4.2  단계별 마일스톤

  [착수 단계]    프로젝트 킥오프, 요구사항 확정, 착수 보고
  [기획/설계]    상세 기획, 설계서 작성, 중간 보고 및 승인
  [개발/구현]    핵심 기능 개발, 단위 테스트, 품질 검토
  [검수/완료]    통합 테스트, 최종 검수, 산출물 납품


제5장  비용 제안

  5.1  총 비용

  총 프로젝트 비용 : 금 {{total_cost}}원정 (부가가치세 별도)

  5.2  지급 조건

  {{payment_terms}}

  5.3  비용 산정 근거

  본 비용은 투입 인력 규모, 프로젝트 기간, 기술 복잡도,
  납품 후 유지보수 지원 범위 등을 종합 고려하여 산정하였습니다.
  세부 내역은 요청 시 별도 제출 가능합니다.


제6장  기대 효과

  정성적 효과
  - 업무 효율성 향상 및 운영 비용 절감
  - 사용자 경험 개선을 통한 고객 만족도 증대
  - 시스템 안정성 강화로 운영 리스크 감소

  정량적 효과
  - 업무 처리 시간 단축 (목표: 현행 대비 30% 이상)
  - 오류 발생률 감소 (목표: 현행 대비 50% 이상)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

본 제안서에 기재된 내용은 당사의 성실한 프로젝트 수행 의지를
담은 것으로, 추가 문의 사항은 언제든지 연락 주시기 바랍니다.

                                          제안일 : {{proposal_date}}
                                수신 : {{client_name}}  {{contact_person}} 귀하`,
  },
  {
    id: 'work-contract',
    name: '업무 계약서',
    description: '프리랜서 또는 외주 업무 계약서 양식',
    icon: '📋',
    documentType: 'contract' as const,
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
            { label: '있음', value: '있음' },
            { label: '없음', value: '없음' },
          ], required: true },
          { id: 'penalty_clause', label: '위약금 조항을 포함하나요?', type: 'radio', options: [
            { label: '포함 (계약 금액의 10%)', value: '위약금은 계약 금액의 10%로 한다' },
            { label: '미포함', value: '별도 위약금 조항 없음' },
          ] },
          { id: 'additional_terms', label: '추가 특약 사항이 있나요?', type: 'textarea', placeholder: '추가 특약 사항...' },
        ],
      },
    ],
    documentContent: `업  무  계  약  서


  계약번호: 제                호


"갑"과 "을"은 신의성실의 원칙에 따라 아래와 같이 업무 위탁 계약을
체결하고, 이를 성실히 이행할 것을 확약한다.


■  계약 당사자

  갑 (발주자)
  상    호 : {{party_a}}
  대 표 자 : {{party_a_rep}}

  을 (수급자)
  상    호 : {{party_b}}
  대 표 자 : {{party_b_rep}}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

제1조  (목적)

  본 계약은 갑이 을에게 업무를 위탁함에 있어 필요한 사항을
  정함으로써 상호 신뢰를 바탕으로 원활한 업무 수행을 도모함을
  목적으로 한다.


제2조  (업무 내용)

  갑이 을에게 위탁하는 업무의 내용은 다음과 같다.

{{work_description}}


제3조  (계약 금액 및 지급 방법)

  ① 본 계약에 따른 계약 금액은 다음과 같다.

     금  {{contract_amount}}원정  (부가가치세 별도)

  ② 갑은 을에게 계약 금액을 다음과 같이 분할 지급한다.

     - 착수금  : 계약 체결 후 7일 이내  →  계약 금액의 30%
     - 중도금  : 업무 진행률 60% 달성 시  →  계약 금액의 40%
     - 잔  금  : 최종 산출물 납품·검수 완료 후  →  계약 금액의 30%

  ③ 지급 방법은 을이 지정하는 금융기관 계좌 이체로 한다.

  ④ 갑이 지급 기일을 초과하는 경우, 초과 기간에 대해 연 12%의
     지연이자를 가산하여 지급한다.


제4조  (계약 기간)

  본 계약의 기간은 {{contract_start}}부터 {{contract_end}}까지로 한다.

  단, 계약 기간 만료 30일 전까지 어느 일방이 서면으로 계약 종료
  의사를 표시하지 않는 경우, 동일 조건으로 1년씩 자동 연장된다.


제5조  (납품 및 검수)

  ① 을은 합의된 일정에 따라 결과물을 갑에게 납품한다.

  ② 갑은 납품일로부터 7영업일 이내에 검수를 완료하여야 한다.

  ③ 검수 기간 내 이의가 없는 경우 납품이 완료된 것으로 간주한다.

  ④ 검수 불합격 시 을은 14영업일 이내에 수정·보완하여 재납품한다.


제6조  (기밀유지)

  ① 기밀유지 의무 적용 여부 : {{confidentiality}}

  ② 을은 본 계약의 수행 과정에서 취득한 갑의 기술정보, 영업비밀,
     고객정보 등 일체의 정보를 제3자에게 누설하거나 본 계약
     이외의 목적으로 사용해서는 아니 된다.

  ③ 본 조에 따른 기밀유지 의무는 계약 종료 후 3년간 존속한다.

  ④ 본 조를 위반할 경우 을은 갑에게 발생한 모든 손해를 배상한다.


제7조  (지식재산권)

  ① 을이 본 계약에 따라 제작한 결과물에 대한 저작권 및 기타
     지식재산권 일체는 갑에게 귀속된다.

  ② 을은 결과물 납품과 동시에 갑에게 모든 관련 권리를 양도하며,
     이에 필요한 서류 및 절차에 적극 협력한다.

  ③ 단, 을이 본 계약 이전부터 보유하던 기술·도구·라이브러리 등은
     을의 소유로 유지된다.


제8조  (위약금 및 손해배상)

  {{penalty_clause}}

  양 당사자가 본 계약을 위반하여 상대방에게 손해를 입힌 경우,
  그 손해 전액을 배상하여야 한다.


제9조  (계약의 해지)

  ① 다음 각 호에 해당하는 경우, 일방은 서면 통지로써 계약을
     해지할 수 있다.

     1. 상대방이 본 계약의 중요 사항을 위반하고 30일 이내 미시정
     2. 상대방에게 파산·회생절차·강제집행 등이 개시된 경우
     3. 상대방의 귀책사유로 계약 목적 달성이 불가능한 경우

  ② 계약 해지 시 을은 기 수행한 업무 비율에 상응하는 대가만을
     청구할 수 있으며, 갑은 해당 금액을 30일 이내 지급한다.


제10조  (분쟁의 해결)

  ① 본 계약과 관련하여 분쟁 발생 시 양 당사자는 상호 협의하여
     우선 해결한다.

  ② 협의가 이루어지지 않는 경우, 갑의 주된 사무소 소재지를
     관할하는 법원을 제1심 관할 법원으로 한다.


제11조  (특약 사항)

{{additional_terms}}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

이 계약의 성립을 증명하기 위하여 계약서 2부를 작성하고,
갑과 을이 각각 서명·날인한 후 각 1부씩 보관한다.


계약일: {{contract_start}}


  갑  (발주자)

  상    호  :  {{party_a}}
  대 표 자  :  {{party_a_rep}}                              (인)


  을  (수급자)

  상    호  :  {{party_b}}
  대 표 자  :  {{party_b_rep}}                              (인)`,
  },
  {
    id: 'meeting-minutes',
    name: '회의록',
    description: '회의 내용을 정리하고 공유하기 위한 양식',
    icon: '🗒️',
    documentType: 'contract' as const,
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
          { id: 'action_items', label: '후속 조치(Action Items)를 정리해주세요', type: 'textarea', placeholder: '담당자 | 업무 | 기한 형식으로 작성' },
          { id: 'next_meeting', label: '다음 회의 일정이 있나요?', type: 'date' },
        ],
      },
    ],
    documentContent: `회  의  록

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  회  의  명 : {{meeting_title}}
  일      시 : {{meeting_date}}
  장      소 : {{meeting_location}}
  문   서 번호 : 제          호

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■  참석자

{{attendees}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1.  회의 안건

{{agenda_items}}


2.  주요 논의 내용

{{discussion}}


3.  결정 사항 및 합의 내용

{{decisions}}


4.  후속 조치 (Action Items)

  담당자  |  업무 내용  |  완료 기한

{{action_items}}

  ※ 각 담당자는 기한 내 완료 후 결과를 보고합니다.
  ※ 이행이 어려운 경우, 기한 2영업일 전 사전 보고합니다.


5.  다음 회의 일정

  일시 : {{next_meeting}}
  ※ 일정 미확정 시 별도 공지 예정


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  【 배포 안내 】
  본 회의록은 회의 종료 후 24시간 이내에 참석자 전원에게 배포됩니다.
  내용에 이의가 있는 경우, 배포 후 2영업일 이내에 서면으로 이의를
  제기하여 주시기 바랍니다. 기간 내 이의가 없을 경우 내용에
  동의한 것으로 간주합니다.

  작 성 자 : _________________________  (서명)

  확 인 자 : _________________________  (서명)`,
  },
  {
    id: 'weekly-report',
    name: '주간/월간 보고서',
    description: '정기 업무 보고를 위한 양식',
    icon: '📊',
    documentType: 'contract' as const,
    sections: [
      {
        id: 'report-info',
        title: '보고서 정보',
        fields: [
          { id: 'report_period', label: '보고 기간을 선택해주세요', type: 'radio', options: [
            { label: '주간', value: '주간' },
            { label: '월간', value: '월간' },
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
          { id: 'kpi_achievement', label: 'KPI 달성 현황이 있나요?', type: 'textarea', placeholder: '항목 | 목표 | 실적 | 달성률' },
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
    documentContent: `{{report_period}}  업 무 보 고 서

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  보 고 일 : {{report_date}}
  보 고 자 : {{reporter}}       소  속 : {{department}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【 종합 의견 】

금 {{report_period}} 업무 수행 결과를 아래와 같이 보고드립니다.
전반적인 업무 진행은 계획 대비 정상적으로 수행되고 있으며,
특이사항 발생 시 즉각 보고 및 대응하였습니다.


1.  주요 완료 업무

{{completed_tasks}}


2.  KPI 달성 현황

  항목  |  목표  |  실적  |  달성률

{{kpi_achievement}}


3.  이슈 및 리스크 관리

  발생 이슈 :
{{issues}}

  ※ 이슈 미발생 시: 금 {{report_period}} 중 특이 이슈 없음


4.  차기 {{report_period}} 업무 계획

{{next_plan}}


5.  지원 요청 사항

{{support_needed}}

  ※ 지원 요청 없을 시: 해당 없음


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  보  고 자 :  {{reporter}}              (서명: _______________)

  소      속 :  {{department}}

  보고 일자 :  {{report_date}}`,
  },
  {
    id: 'quotation',
    name: '견적서',
    description: '제품/서비스 가격 견적을 위한 양식',
    icon: '💰',
    documentType: 'quotation' as const,
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
          { id: 'item_list', label: '품목/서비스를 입력해주세요', type: 'textarea', placeholder: '품목명 | 수량 | 단가 | 금액 형식으로 입력\n예: 웹사이트 개발 | 1식 | 5,000,000원 | 5,000,000원', required: true },
          { id: 'subtotal', label: '공급가액(부가세 제외)은 얼마인가요?', type: 'number', placeholder: '10000000', required: true },
          { id: 'vat', label: '부가세는 얼마인가요?', type: 'number', placeholder: '1000000' },
          { id: 'total', label: '합계 금액을 입력해주세요', type: 'number', placeholder: '11000000', required: true },
          { id: 'notes', label: '비고 사항이 있나요?', type: 'textarea', placeholder: '결제 조건, 납기일 등...' },
        ],
      },
    ],
    documentContent: `견  적  서


  견적번호 : 제              호
  발 행 일 : {{issue_date}}
  유효기간 : {{valid_until}} 까지

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  발 행 처 : {{issuer_company}}
  담당연락처 : {{issuer_contact}}

  수    신 : {{recipient_company}}
  담  당  자 : {{recipient_person}} 귀하

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

귀사의 무궁한 발전을 기원합니다.
아래와 같이 견적을 제출하오니 검토하여 주시기 바랍니다.

                        ─  아  래  ─


■  견적 내역

  품목 / 서비스  |  수량  |  단가  |  금액

{{item_list}}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  공  급  가  액           {{subtotal}} 원
  부  가  세  (10%)         {{vat}} 원
  ─────────────────────────────────
  합           계           {{total}} 원

  (금 {{total}}원정 / 부가가치세 포함)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

■  비고 및 특이사항

{{notes}}


■  견적 조건 및 유의사항

  제1조  본 견적서의 유효기간은 발행일로부터 {{valid_until}}까지입니다.
         유효기간 경과 후에는 금액 및 조건이 변경될 수 있습니다.

  제2조  납기일은 계약 체결 후 양 당사자 합의하여 별도 결정합니다.

  제3조  결제 조건은 계약 체결 시 합의하며, 일반적 기준은 다음과 같습니다.
         - 착수금: 계약 체결 후 7일 이내 (계약 금액의 30~50%)
         - 잔  금: 최종 납품·검수 완료 후 (계약 금액의 50~70%)

  제4조  본 견적에는 명시되지 않은 추가 작업 및 변경 요청 사항은
         별도 협의 후 진행합니다.

  제5조  세금계산서는 대금 수령 후 발행합니다.


                                          {{issue_date}}

                                  {{issuer_company}}
                            담당자 연락처: {{issuer_contact}}`,
  },
  {
    id: 'service-contract-kor',
    name: '용역계약서(한국형)',
    description: '프리랜서/외주 용역 계약서. 위탁자(갑)과 수탁자(을) 간의 업무 위탁 계약. 실무에서 사용되는 모든 조항 포함.',
    icon: '📄',
    documentType: 'service-contract' as const,
    sections: [
      {
        id: 'preamble',
        title: '계약 당사자 기본 정보',
        fields: [
          { id: 'client_company_name', label: '위탁자(갑) 상호/사업체명을 입력해주세요', type: 'text', placeholder: '에이프로(APRO)', required: true },
          { id: 'contractor_name', label: '수탁자(을) 성명을 입력해주세요', type: 'text', placeholder: '홍길동', required: true },
        ],
      },
      {
        id: 'service-content',
        title: '제4조 용역의 내용',
        fields: [
          { id: 'service_task_name', label: '업무명을 입력해주세요', type: 'text', placeholder: '일본 후원플랫폼 프로젝트 웹페이지 및 서버 제작', required: true },
          { id: 'service_purpose', label: '업무 목적을 입력해주세요', type: 'textarea', placeholder: '서버사이드/인프라 및 웹서비스 등을 제작하기 위해 용역 형태로 업무를 위탁한다.', required: true },
          { id: 'service_start_date', label: '용역 시작일을 입력해주세요', type: 'date', required: true },
          { id: 'deliverable_name', label: '제작물의 명칭(프로젝트명)을 입력해주세요', type: 'text', placeholder: 'HONNOKIMOCHI', required: true },
          { id: 'task_manager', label: '업무 책임자 성명을 입력해주세요', type: 'text', placeholder: '김지현', required: true },
          { id: 'task_participant', label: '업무 참여자 성명을 입력해주세요', type: 'text', placeholder: '변찬우', required: false },
        ],
      },
      {
        id: 'payment',
        title: '제7조 용역대금 및 비용의 처리',
        fields: [
          { id: 'payment_period_label', label: '용역대금 지급 기간(예: 5월~6월)을 입력해주세요', type: 'text', placeholder: '5월~6월(프리랜서)', required: true },
          { id: 'monthly_fee', label: '월 용역대금(원천징수 전 금액, 원)을 입력해주세요', type: 'number', placeholder: '2700000', required: true },
          { id: 'withholding_tax_rate', label: '원천징수세율(%)을 입력해주세요', type: 'number', placeholder: '3.3', required: true },
          { id: 'payment_schedule', label: '지급 방식을 선택해주세요', type: 'select', options: [
            { label: '월말정산/익월말일 지급', value: '월말정산/익월말일 지급' },
            { label: '월말정산/당월말일 지급', value: '월말정산/당월말일 지급' },
            { label: '완료 후 일괄 지급', value: '완료 후 일괄 지급' },
            { label: '기타', value: '기타' },
          ], required: true },
        ],
      },
      {
        id: 'contract-period',
        title: '제8조 계약기간',
        fields: [
          { id: 'contract_start_date', label: '계약 시작일을 입력해주세요', type: 'date', required: true },
          { id: 'contract_end_date', label: '계약 종료일을 입력해주세요', type: 'date', required: true },
        ],
      },
      {
        id: 'signing-date',
        title: '계약 체결일',
        fields: [
          { id: 'signing_date', label: '계약 체결일을 입력해주세요', type: 'date', required: true },
        ],
      },
      {
        id: 'client-info',
        title: '위탁자(갑) 정보',
        fields: [
          { id: 'client_company_name_sign', label: '위탁자 상호(사업체명)를 입력해주세요', type: 'text', placeholder: '에이프로(APRO)', required: true },
          { id: 'client_business_number', label: '위탁자 사업자 번호를 입력해주세요', type: 'text', placeholder: '000-00-00000', required: true },
          { id: 'client_business_type', label: '위탁자 업태 및 종목을 입력해주세요', type: 'text', placeholder: '정보통신업 / 응용 소프트웨어 개발 및 공급업', required: false },
          { id: 'client_owner_name', label: '위탁자 사업주명(대표자)을 입력해주세요', type: 'text', placeholder: '김지현', required: true },
          { id: 'client_address', label: '위탁자 주소를 입력해주세요', type: 'text', placeholder: '부산 남구 수영로 298 10층 1001-81호', required: true },
          { id: 'client_phone', label: '위탁자 전화번호를 입력해주세요', type: 'tel', placeholder: '010-0000-0000', required: true },
        ],
      },
      {
        id: 'contractor-info',
        title: '수탁자(을) 정보',
        fields: [
          { id: 'contractor_name_sign', label: '수탁자 성명을 입력해주세요', type: 'text', placeholder: '변찬우', required: true },
          { id: 'contractor_id_number', label: '수탁자 주민등록번호를 입력해주세요', type: 'text', placeholder: '000000-0000000', required: true },
          { id: 'contractor_address', label: '수탁자 주소를 입력해주세요', type: 'text', placeholder: '서울특별시 강남구 ...', required: true },
          { id: 'contractor_phone', label: '수탁자 전화번호를 입력해주세요', type: 'tel', placeholder: '010-0000-0000', required: true },
        ],
      },
    ],
    documentContent: `{{client_company_name}}(이하 '위탁자' 또는 '갑')와 {{contractor_name}}(이하 '수탁자' 또는 '을')는 '갑'이 위탁하는 업무를 '을'이 수행하고, '갑'은 '을'에게 이에 대한 대가를 지급하기로 하는 내용의 약정에 관하여 다음과 같이 계약(이하 '본 계약')을 체결한다.

제 1 조(계약의 목적)
본 계약은 '갑'이 필요로 하는 업무(이하 '본 건 용역 업무')를 '을'에게 위탁하여 수행하도록 함에 있어, '갑'과 '을'이 사이에 필요한 사항을 정하는 것을 목적으로 한다.

제 2 조(관계법령의 준수)
양 당사자는 대등한 관계에서 본 계약을 합의하고 체결하며, 독점규제 및 공정거래에 관한 법률 등 관계 법규를 준수하여 이행한다.

제 3 조(신의성실의 원칙)
양 당사자는 본 계약에 따른 권리와 의무를 신의성실 원칙에 따라 성실히 이행함으로써 상호 간에 공정한 관계를 형성하고 지속한다.

제 4 조(용역의 내용)
'갑'은 '을'에게 아래와 같은 내용의 용역(이하 '본 건 용역')의 수행을 위탁한다.
1. 업무명 : {{service_task_name}}
2. 업무목적 : {{service_purpose}} {{service_start_date}}부터 용역형태로 업무를 위탁한다.
3. 제작물의 명칭 : {{deliverable_name}}
4. 용역 수행자
   가. 업무 책임자 : {{task_manager}}
   나. 업무 참여자 : {{task_participant}}

제 5 조(신용유지 / 협조의무)
과업을 이행하는 과정에서 상호 신용을 손상시키지 않도록 하며 공동 사업임을 인식하고 믿음과 친절로 상호 협조해야 한다.

제 6 조(용역의 성실이행)
1. 용역을 제공함에 있어서 '을'은 그 축적된 지식 및 경험을 활용하여 '갑'이 본 계약을 통해 도달하고자 하는 목표가 도달되도록 가능한 최고 수준의 용역을 성실히 제공한다.
2. '을'은 본 건 용역의 수행을 위해 참여하기로 한 작업자 등 작업자의 업무수행 일자, 방법의 변경이 있는 경우, 이를 사전에 '갑'에게 통지하고, '갑'으로부터 용역 업무 수행의 적정성을 검토 받아야 한다.
3. '을'은 본 건 용역의 목적을 달성하고 관련 결과물이 도출되는 것을 보증하고, '갑'과 '을'은 별도의 약정을 통해 보증보험증서 교부 여부를 정할 수 있다.
4. '을'이 계약서에서 정한 바와 달리, 성실하게 용역업무를 이행하지 않을 경우, '갑'은 '을'과 합의하에 계약을 해지할 수 있다.
5. 양 당사자간의 합의하에 계약을 해지를 희망 할 경우 최소 7일 전에 서면을 통한 연락으로 협의한다.

제 7 조(용역대금 및 비용의 처리)
1. '갑'은 '을'에게 본 건 용역의 대가를 아래와 같이 지급하며, 원천징수 {{withholding_tax_rate}}%를 제한 금액으로 지급한다.
   - {{payment_period_label}} : {{monthly_fee}}원, {{payment_schedule}}
2. '을'은 '갑'이 요청하는 경우 언제든지 본 건 용역 업무 수행 경과에 대하여 보고하여야 한다.
3. 계약의 해제 및 해지가 발생한 경우, 해지 및 해제일자가 해당되는 월을 기준으로 일할 계산하여 '갑'은 '을'에게 대금을 지급한다.

제 8 조(계약기간)
1. 본 계약의 계약기간은 {{contract_start_date}}부터 {{contract_end_date}}까지로 한다.

제 9 조(소유권 및 지식재산권 등의 귀속)
1. 본건 용역의 최종 결과물을 비롯하여 그 과정에 발생한 보고서, 중간 산출물, 2차적 저작물 및 본 건 용역 산출물을 기초로 한 2차적 산출물로 인한 이득에 관한 소유권, 지식재산권은 갑에게 있다.
2. 다만, 보다 효율적인 활용을 위하여 필요하다고 인정되는 경우 '갑'은 '을'에게 이를 무상으로 양도할 수 있다.

제 10 조(비밀준수)
1. '을'은 '갑'으로부터 제공받은 일체의 회사의 정보나 지득한 사실(이하 '비밀정보'라 한다)을 본 계약의 목적범위 내에서 제한적으로 사용할 수 있으며, '갑'의 사전 서면 동의 없이 '을'이 본 건 용역 업무를 수행하는 관리 영역 외의 외부로 반출하거나 제3자에게 공개 또는 제공 등을 할 수 없다.
2. '을'은 '갑'의 업무상 정보, 노하우, 기타 정책 및 신규사업, 특허, 저작권 등의 지식재산, 주요 자산, 임직원의 개인정보, 회계정보 등을 임의로 반출하거나 제3자에게 제공, 누설할 수 없다.
3. 제1항 및 제2항의 의무는 업무수행이나 계약기간 중은 물론, 계약기간이나 업무 종료 후 1년간 그 효력을 갖는다.

제 11 조(제3자의 지적재산권 등 권리 침해 금지)
1. '을'은 본 건 용역 수행 과정에서 제3자의 지식재산권, 소유권 등을 침해하지 않도록 적극 노력하여야 한다.
2. '을'의 본 건 용역 수행과 관련한 산출물 등에 관하여 '갑'이 제3자로부터 지식재산권의 침해 등 권리 침해를 이유로 법적조치 등을 당한 경우 '을'은 '갑'에게 '갑'이 위 법적조치 등을 방어하기 위하여 소요한 비용(제3자에 대한 손해배상액, 소송비용이나 법적 자문료 등 포함) 및 손해를 배상하여야 한다.

제 12 조(양도 금지)
1. 양 당사자는 상호 간의 서면 승인 없이 본 계약의 내용 및 본 계약으로 인하여 발생하는 권리의무를 제3자에게 양도할 수 없다.
2. 전 항을 위반하여 제3자에게 본 계약상의 권리 의무가 이전됨으로 인하여 발생한 손해에 대하여, 위반 당사자는 그 배상책임을 진다.

제 13 조(계약의 해제, 해지)
1. 양 당사자는 다음 각호에 해당하는 사유가 발생한 경우에 서면 통지로써 본 계약을 해제 또는 해지할 수 있다.
   가. 천재지변, 법적 규제의 변경 등으로 본 건 용역을 통해 달성하고자 하는 목적을 달성할 수 없게 된 때
   나. 양당사자 중 일방이 본 계약상 의무를 이행하지 아니하거나 본 계약을 위반하고, 계약 위반이 없는 일방으로부터 서면 통지에 의한 이행 최고 또는 시정 요구를 받고도 7일 이내에 본 계약상 의무를 이행하지 아니하거나 위반 사항을 시정하지 아니 한 경우
2. 양 당사자 중 일방에게 아래의 사유가 발생한 경우, 기한의 이익을 상실하고, 즉시 상대방은 본 계약의 해지나 해제를 청구할 수 있다.
   가. 거래은행으로부터 당좌 거래정지 등 그에 상응하는 사유가 발생하는 경우
   나. 조세 체납으로 압류 처분을 받은 때
   다. 양 당사자 중 일방에 대하여 회사정리 또는 파산, 회의개시가 신청된 때
   라. 양 당사자 중 일방의 재산에 대하여 그 일방의 귀책사유에 의해 보전처분(가압류, 가처분)이나 강제집행이 개시되고 이로 인해 본 계약의 이행을 기대하기 어려운 객관적인 사정이 발생한 경우
3. 양 당사자가 합의하에 계약해지를 희망할 경우 합의한 일자에 본 계약을 해제 또는 해지할 수 있다.

제 14 조(계약해석의 원칙)
계약의 해석상 의문이나 이견이 있을 시 상호 합의 하에 결정하며, 합의되지 않는 경우 및 기타 본 계약서에 명시되지 아니한 사항에 대하여서는 일반 상관례에 준하여 처리한다.

제 15 조(관할법원)
본 계약과 관련한 분쟁이 발생할 경우 '갑'의 주소지를 관할하는 법원을 관할법원으로 한다.

제 16 조(계약의 효력)
1. 양 당사자는 본 계약의 성립을 증명하기 위하여 본 계약서를 작성하고, 서명 또는 기명날인하여 각 1통씩 보관한다.
2. 전자서명을 통해 본 계약을 체결할 경우 계약서의 작성, 서명, 교부에 대한 전자적 방법의 효력을 인정하고 그 진행에 동의한 것으로 본다.

{{signing_date}}

위탁자
상호(사업체명) : {{client_company_name_sign}}
사업자 번호 : {{client_business_number}}
업태 및 종목 : {{client_business_type}}
사업주명 : {{client_owner_name}} (서명 또는 인)
주소 : {{client_address}}
전화번호 : {{client_phone}}

수탁자
성명 : {{contractor_name_sign}} (서명 또는 인)
주민등록번호 : {{contractor_id_number}}
주소 : {{contractor_address}}
전화번호 : {{contractor_phone}}`,
  },
]
