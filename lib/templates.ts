import type { Template } from './types'

export const defaultTemplates: Template[] = [
  {
    id: 'service-contract-kor',
    name: '용역계약서(한국형)',
    description: '프리랜서/외주 용역 계약서. 계약 옵션(NDA·IP귀속·분쟁해결 방식 등)에 따라 조항이 자동으로 구성됩니다.',
    icon: '📄',
    documentType: 'service-contract' as const,
    sections: [
      // ── 1. 계약 옵션 설정 (스마트 질문) ──────────────────────
      {
        id: 'contract-options',
        title: '⚙️ 계약 옵션 설정',
        fields: [
          {
            id: 'contract_type',
            label: '계약 유형을 선택해주세요',
            type: 'radio',
            required: true,
            options: [
              { label: '기간제 (시작일~종료일 명시)', value: 'fixed_term' },
              { label: '프로젝트 완료 기준 (결과물 납품 시까지)', value: 'project_based' },
            ],
            guide: '기간제: 특정 날짜까지 계약 기간을 명시합니다. 프로젝트 완료 기준: 결과물 납품 완료 시까지로 명시합니다.',
          },
          {
            id: 'ip_ownership',
            label: '산출물 지식재산권(IP) 귀속 주체를 선택해주세요',
            type: 'radio',
            required: true,
            options: [
              { label: '갑(위탁자)에게 귀속', value: 'client' },
              { label: '을(수탁자)에게 귀속', value: 'contractor' },
              { label: '공동 소유', value: 'joint' },
            ],
            guide: '용역 산출물의 저작권·특허 등 지식재산권이 누구에게 귀속될지 선택합니다.',
          },
          {
            id: 'has_nda',
            label: '비밀유지(NDA) 조항을 포함하시겠습니까?',
            type: 'radio',
            required: true,
            options: [
              { label: '포함 (제10조 비밀준수 조항 삽입)', value: 'yes' },
              { label: '미포함', value: 'no' },
            ],
          },
          {
            id: 'has_ip_protection',
            label: '제3자 지식재산권 침해 금지 조항을 포함하시겠습니까?',
            type: 'radio',
            required: true,
            options: [
              { label: '포함 (제11조 삽입)', value: 'yes' },
              { label: '미포함', value: 'no' },
            ],
          },
          {
            id: 'allow_subcontract',
            label: '재위탁(하도급) 허용 여부를 선택해주세요',
            type: 'radio',
            required: true,
            options: [
              { label: '허용 안 함', value: 'no' },
              { label: '서면 동의 시 허용', value: 'yes_with_consent' },
            ],
          },
          {
            id: 'dispute_resolution',
            label: '분쟁 해결 방식을 선택해주세요',
            type: 'radio',
            required: true,
            options: [
              { label: '법원 소송 (관할법원)', value: 'court' },
              { label: '중재 (대한상사중재원)', value: 'arbitration' },
            ],
          },
        ],
      },
      // ── 2. 계약 당사자 기본 정보 ─────────────────────────────
      {
        id: 'preamble',
        title: '계약 당사자 기본 정보',
        fields: [
          { id: 'client_company_name', label: '위탁자(갑) 상호/사업체명을 입력해주세요', type: 'text', placeholder: '(주)위탁회사', required: true },
          { id: 'contractor_name', label: '수탁자(을) 성명을 입력해주세요', type: 'text', placeholder: '김수탁', required: true },
        ],
      },
      // ── 3. 용역의 내용 ────────────────────────────────────────
      {
        id: 'service-content',
        title: '제4조 용역의 내용',
        fields: [
          { id: 'service_task_name', label: '업무명을 입력해주세요', type: 'text', placeholder: '상용 웹사이트 및 모바일 앱 구축 용역', required: true },
          { id: 'service_purpose', label: '업무 목적을 입력해주세요', type: 'textarea', placeholder: '본 프로젝트의 안정적인 개발 및 운영을 위해 필요한 기술 용역 업무를 위탁한다.', required: true },
          { id: 'service_start_date', label: '용역 시작일을 입력해주세요', type: 'date', required: true },
          { id: 'deliverable_name', label: '제작물의 명칭(프로젝트명)을 입력해주세요', type: 'text', placeholder: '프로젝트 산출물(명칭)', required: true },
          { id: 'task_manager', label: '업무 책임자 성명을 입력해주세요', type: 'text', placeholder: '박책임', required: true },
          { id: 'task_participant', label: '업무 참여자 성명을 입력해주세요', type: 'text', placeholder: '이참여', required: false },
        ],
      },
      // ── 4. 용역대금 ───────────────────────────────────────────
      {
        id: 'payment',
        title: '제7조 용역대금 및 비용의 처리',
        fields: [
          { id: 'payment_period_label', label: '용역대금 지급 기간(예: 5월~6월)을 입력해주세요', type: 'text', placeholder: '2024년 00월분', required: true },
          { id: 'monthly_fee', label: '월 용역대금(원천징수 전 금액, 원)을 입력해주세요', type: 'number', placeholder: '3000000', required: true },
          { id: 'withholding_tax_rate', label: '원천징수세율(%)을 입력해주세요', type: 'number', placeholder: '3.3', required: true },
          {
            id: 'payment_schedule', label: '지급 방식을 선택해주세요', type: 'select', options: [
              { label: '월말정산/익월말일 지급', value: '월말정산/익월말일 지급' },
              { label: '월말정산/당월말일 지급', value: '월말정산/당월말일 지급' },
              { label: '완료 후 일괄 지급', value: '완료 후 일괄 지급' },
              { label: '기타', value: '기타' },
            ], required: true
          },
        ],
      },
      // ── 5. 계약기간 ───────────────────────────────────────────
      {
        id: 'contract-period',
        title: '제8조 계약기간',
        fields: [
          { id: 'contract_start_date', label: '계약 시작일을 입력해주세요', type: 'date', required: true },
          {
            id: 'contract_end_date',
            label: '계약 종료일을 입력해주세요',
            type: 'date',
            required: false,
            showIf: { fieldId: 'contract_type', value: 'fixed_term' },
            guide: '기간제 계약에서만 표시됩니다.',
          },
        ],
      },
      // ── 6. 계약 체결일 ────────────────────────────────────────
      {
        id: 'signing-date',
        title: '계약 체결일',
        fields: [
          { id: 'signing_date', label: '계약 체결일을 입력해주세요', type: 'date', required: true },
        ],
      },
      // ── 7. 위탁자(갑) 정보 ───────────────────────────────────
      {
        id: 'client-info',
        title: '위탁자(갑) 정보',
        fields: [
          { id: 'client_company_name_sign', label: '위탁자 상호(사업체명)를 입력해주세요', type: 'text', placeholder: '(주)위탁회사', required: true },
          { id: 'client_business_number', label: '위탁자 사업자 번호를 입력해주세요', type: 'text', placeholder: '123-45-67890', required: true },
          { id: 'client_business_type', label: '위탁자 업태 및 종목을 입력해주세요', type: 'text', placeholder: '서비스 / 소프트웨어 개발 및 공급업', required: false },
          { id: 'client_owner_name', label: '위탁자 사업주명(대표자)을 입력해주세요', type: 'text', placeholder: '김위탁', required: true },
          { id: 'client_address', label: '위탁자 주소를 입력해주세요', type: 'text', placeholder: '서울특별시 강남구 테헤란로 123', required: true },
          { id: 'client_phone', label: '위탁자 전화번호를 입력해주세요', type: 'tel', placeholder: '02-123-4567', required: true },
        ],
      },
      // ── 8. 수탁자(을) 정보 ───────────────────────────────────
      {
        id: 'contractor-info',
        title: '수탁자(을) 정보',
        fields: [
          { id: 'contractor_name_sign', label: '수탁자 성명을 입력해주세요', type: 'text', placeholder: '이수탁', required: true },
          { id: 'contractor_id_number', label: '수탁자 주민등록번호를 입력해주세요', type: 'text', placeholder: '900101-1234567', required: true },
          { id: 'contractor_address', label: '수탁자 주소를 입력해주세요', type: 'text', placeholder: '서울특별시 서초구 서초동 ...', required: true },
          { id: 'contractor_phone', label: '수탁자 전화번호를 입력해주세요', type: 'tel', placeholder: '010-1234-5678', required: true },
        ],
      },
    ],
    documentContent: `용역계약서

{{client_company_name}}(이하 '위탁자' 또는 '갑')와 {{contractor_name}}(이하 '수탁자' 또는 '을')는 '갑'이 위탁하는 업무를 '을'이 수행하고, '갑'은 '을'에게 이에 대한 대가를 지급하기로 하는 내용의 약정에 관하여 다음과 같이 계약(이하 '본 계약')을 체결한다.

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
{{#if contract_type == "project_based"}}
1. 본 계약의 계약기간은 {{contract_start_date}}부터 최종 결과물({{deliverable_name}}) 납품 완료 시까지로 한다. 다만, 납품 완료 후 하자보수 기간은 별도 합의에 따른다.
{{#else}}
1. 본 계약의 계약기간은 {{contract_start_date}}부터 {{contract_end_date}}까지로 한다.
{{/if}}

제 9 조(소유권 및 지식재산권 등의 귀속)
{{#if ip_ownership == "contractor"}}
1. 본건 용역 수행 과정에서 '을'이 독자적으로 개발·창작한 산출물의 소유권 및 지식재산권은 '을'에게 귀속된다. 단, '갑'이 제공한 자료 및 정보를 기반으로 생성된 결과물은 '갑'에게 귀속된다.
2. '갑'은 본 계약의 목적 범위 내에서 '을'의 산출물을 사용할 수 있는 비독점적 사용권을 가진다.
{{#elif ip_ownership == "joint"}}
1. 본건 용역 수행 과정에서 발생한 산출물의 소유권 및 지식재산권은 '갑'과 '을'이 공동으로 소유한다.
2. 양 당사자는 공동 소유 지식재산권의 활용 및 처분에 관하여 사전에 서면으로 합의하여야 한다.
{{#else}}
1. 본건 용역의 최종 결과물을 비롯하여 그 과정에 발생한 보고서, 중간 산출물, 2차적 저작물 및 본 건 용역 산출물을 기초로 한 2차적 산출물로 인한 이득에 관한 소유권, 지식재산권은 갑에게 있다.
2. 다만, 보다 효율적인 활용을 위하여 필요하다고 인정되는 경우 '갑'은 '을'에게 이를 무상으로 양도할 수 있다.
{{/if}}

{{#if has_nda == "yes"}}
제 10 조(비밀준수)
1. '을'은 '갑'으로부터 제공받은 일체의 회사의 정보나 지득한 사실(이하 '비밀정보'라 한다)을 본 계약의 목적범위 내에서 제한적으로 사용할 수 있으며, '갑'의 사전 서면 동의 없이 '을'이 본 건 용역 업무를 수행하는 관리 영역 외의 외부로 반출하거나 제3자에게 공개 또는 제공 등을 할 수 없다.
2. '을'은 '갑'의 업무상 정보, 노하우, 기타 정책 및 신규사업, 특허, 저작권 등의 지식재산, 주요 자산, 임직원의 개인정보, 회계정보 등을 임의로 반출하거나 제3자에게 제공, 누설할 수 없다.
3. 제1항 및 제2항의 의무는 업무수행이나 계약기간 중은 물론, 계약기간이나 업무 종료 후 1년간 그 효력을 갖는다.
{{/if}}

{{#if has_ip_protection == "yes"}}
제 11 조(제3자의 지적재산권 등 권리 침해 금지)
1. '을'은 본 건 용역 수행 과정에서 제3자의 지식재산권, 소유권 등을 침해하지 않도록 적극 노력하여야 한다.
2. '을'의 본 건 용역 수행과 관련한 산출물 등에 관하여 '갑'이 제3자로부터 지식재산권의 침해 등 권리 침해를 이유로 법적조치 등을 당한 경우 '을'은 '갑'에게 '갑'이 위 법적조치 등을 방어하기 위하여 소요한 비용(제3자에 대한 손해배상액, 소송비용이나 법적 자문료 등 포함) 및 손해를 배상하여야 한다.
{{/if}}

제 12 조(양도 금지)
{{#if allow_subcontract == "yes_with_consent"}}
1. 양 당사자는 상호 간의 서면 승인 없이 본 계약의 내용 및 본 계약으로 인하여 발생하는 권리의무를 제3자에게 양도할 수 없다.
2. '을'은 '갑'의 사전 서면 동의를 받은 경우에 한하여 본 건 용역 업무의 일부를 제3자에게 재위탁할 수 있다. 이 경우 '을'은 재위탁 업체의 업무 수행에 대하여 '갑'에게 연대하여 책임을 진다.
3. 전 항을 위반하여 제3자에게 본 계약상의 권리 의무가 이전됨으로 인하여 발생한 손해에 대하여, 위반 당사자는 그 배상책임을 진다.
{{#else}}
1. 양 당사자는 상호 간의 서면 승인 없이 본 계약의 내용 및 본 계약으로 인하여 발생하는 권리의무를 제3자에게 양도할 수 없다.
2. '을'은 본 건 용역 업무를 '갑'의 사전 서면 동의 없이 제3자에게 재위탁(하도급)할 수 없다.
3. 전 항을 위반하여 제3자에게 본 계약상의 권리 의무가 이전됨으로 인하여 발생한 손해에 대하여, 위반 당사자는 그 배상책임을 진다.
{{/if}}

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

{{#if dispute_resolution == "arbitration"}}
제 15 조(중재)
본 계약과 관련한 분쟁이 발생할 경우 대한상사중재원의 중재규칙에 따라 중재로 최종 해결한다. 중재지는 대한민국 서울로 하며, 중재 판정은 최종적인 것으로 양 당사자를 구속한다.
{{#else}}
제 15 조(관할법원)
본 계약과 관련한 분쟁이 발생할 경우 '갑'의 주소지를 관할하는 법원을 관할법원으로 한다.
{{/if}}

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
