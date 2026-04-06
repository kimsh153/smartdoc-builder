import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { GoogleGenAI } from '@google/genai'
import type { Template } from '@/lib/types'
import { extractFromDocxAsHtml, extractFromPdf, extractFromXlsx } from '@/lib/parsers/extractText'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

// JSON 문자열 내부의 리터럴 제어문자(줄바꿈 등)를 이스케이프하고
// 유효하지 않은 이스케이프 시퀀스(\k 등)는 백슬래시를 이스케이프 처리
function sanitizeJson(raw: string): string {
  const VALID_ESCAPES = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'])
  let result = ''
  let inString = false
  let i = 0

  while (i < raw.length) {
    const ch = raw[i]
    const code = raw.charCodeAt(i)

    if (!inString) {
      if (ch === '"') inString = true
      result += ch
      i++
      continue
    }

    // 문자열 내부
    if (ch === '\\') {
      const next = raw[i + 1]
      if (next === undefined) {
        // 끝에 백슬래시 → 이스케이프
        result += '\\\\'
        i++
      } else if (VALID_ESCAPES.has(next)) {
        if (next === 'u') {
          // \uXXXX 유효성 확인
          const hex = raw.slice(i + 2, i + 6)
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            result += '\\u' + hex
            i += 6
          } else {
            // 잘못된 유니코드 이스케이프 → 백슬래시만 이스케이프
            result += '\\\\'
            i++
          }
        } else {
          result += '\\' + next
          i += 2
        }
      } else {
        // 유효하지 않은 이스케이프 시퀀스 → 백슬래시를 이스케이프
        result += '\\\\'
        i++
      }
      continue
    }

    if (ch === '"') {
      inString = false
      result += ch
      i++
      continue
    }

    // 리터럴 제어문자 이스케이프
    if (code < 0x20) {
      if (ch === '\n') result += '\\n'
      else if (ch === '\r') result += '\\r'
      else if (ch === '\t') result += '\\t'
      // 나머지 제어문자 제거
      i++
      continue
    }

    result += ch
    i++
  }
  return result
}

function parseTemplate(raw: string): Template {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(sanitizeJson(cleaned)) as Template
}


// ── 계약서 HTML 구조 ──
const CONTRACT_HTML_GUIDE = `
■ documentType: "contract" — 공문서/계약서 HTML 구조

실제 계약서처럼 정갈한 공문서 스타일. 마크다운(##, **, - 불릿 등) 절대 금지.

⚠️ 계약서 원문 보존 절대 규칙 (반드시 준수):
- 원문의 모든 조항(제1조, 제2조, ... 제N조)을 빠짐없이 포함할 것
- 내용 요약, 축약, 병합, 생략 절대 금지 — 조항 하나도 누락 불가
- 조항 번호·제목·본문을 원문 순서 그대로 유지할 것
- 원문에 조항이 N개이면 반드시 N개의 <div class="doc-section">을 생성할 것
- 각 조항의 세부 항목(①②③ 또는 1.2.3. 등)도 모두 포함할 것

<h1 class="doc-title">용역계약서</h1>
<p class="doc-intro">멜리언스(이하 '갑')와 수호(이하 '을')는 다음과 같이 계약을 체결한다.</p>

<div class="doc-section">
  <h2 class="doc-section-title">제1조(계약의 목적)</h2>
  <p class="doc-body">본 계약은 '갑'이 필요로 하는 업무를 '을'에게 위탁하여 수행하도록 함에 있어, 필요한 사항을 정하는 것을 목적으로 한다.</p>
  <ol class="doc-list">
    <li>항목 내용...</li>
    <li>항목 내용...</li>
  </ol>
</div>

<div class="doc-section">
  <h2 class="doc-section-title">제2조(계약 당사자)</h2>
  <p class="doc-body">본문...</p>
</div>

<!-- 원문의 모든 조항을 위와 같은 형식으로 순서대로 모두 포함 -->

<div class="doc-signature">
  <p class="doc-sign-date">{{contract_date}}</p>
  <div class="doc-sign-row">
    <div class="doc-sign-box"><strong>갑</strong><br/>{{party_a}}&nbsp;&nbsp;&nbsp;(인)</div>
    <div class="doc-sign-box"><strong>을</strong><br/>{{party_b}}&nbsp;&nbsp;&nbsp;(인)</div>
  </div>
</div>

규칙:
- 각 조항은 <div class="doc-section">으로 감쌀 것
- 조항 제목은 <h2 class="doc-section-title">
- 본문은 <p class="doc-body">, 목록은 <ol class="doc-list"><li>
- 표가 필요하면 <table class="doc-table">
- 원문 조항 수와 생성된 <div class="doc-section"> 수가 반드시 일치해야 함
`

// ── 견적서 HTML 구조 ──
const QUOTATION_HTML_GUIDE = `
■ documentType: "quotation" — 엑셀/스프레드시트 스타일 견적서 HTML 구조

PROTO 견적서처럼 깔끔한 표 중심 레이아웃. 마크다운 절대 금지.

<!-- 헤더: 좌=고객사, 우=공급자 정보표 -->
<div class="quot-header">
  <div class="quot-client-side">
    <p class="quot-label-bar">광고대행 견적서</p>
    <p class="quot-client-name">{{client_name}} 귀하</p>
    <p class="quot-tagline">아래와 같이 견적합니다</p>
    <div class="quot-meta-row"><span class="quot-meta-label">견적일자</span><span class="quot-meta-value">{{quote_date}}</span></div>
    <div class="quot-meta-row"><span class="quot-meta-label">유효기간</span><span class="quot-meta-value">{{valid_until}}</span></div>
  </div>
  <div class="quot-company-side">
    <div class="quot-company-header">공 급 자</div>
    <table class="quot-company-table">
      <tr><td>상호</td><td>{{company_name}}</td></tr>
      <tr><td>대표자</td><td>{{ceo_name}}</td></tr>
      <tr><td>사업자번호</td><td>{{business_no}}</td></tr>
      <tr><td>연락처</td><td>{{company_phone}}</td></tr>
      <tr><td>이메일</td><td>{{company_email}}</td></tr>
    </table>
  </div>
</div>

<!-- 최종 견적가 요약 -->
<div class="quot-summary">
  <div class="quot-summary-top">
    <span class="quot-summary-title">최종 견적가</span>
    <div class="quot-summary-amounts">
      <span class="quot-summary-amount">{{total_amount}}</span>
      <span class="quot-summary-amount-vat">(VAT {{total_vat}})</span>
    </div>
  </div>
  <div class="quot-summary-rows">
    <div class="quot-summary-row"><span class="quot-row-label">공급가액</span><span class="quot-row-value">{{subtotal}}</span></div>
    <div class="quot-summary-row"><span class="quot-row-label">부가세(10%)</span><span class="quot-row-value">{{vat}}</span></div>
  </div>
</div>

<!-- 결과물/기간/결제 세부 -->
<div class="quot-detail-row">
  <div class="quot-detail-cell"><p class="quot-detail-label">최종 결과물</p><p class="quot-detail-value">{{deliverable}}</p></div>
  <div class="quot-detail-cell"><p class="quot-detail-label">계약 기간</p><p class="quot-detail-value">{{contract_period}}</p></div>
  <div class="quot-detail-cell"><p class="quot-detail-label">결제 방법</p><p class="quot-detail-value">{{payment_method}}</p></div>
  <div class="quot-detail-cell"><p class="quot-detail-label">청구 방법</p><p class="quot-detail-value">{{billing_method}}</p></div>
</div>

<!-- 세부 견적 테이블 -->
<p class="quot-section-title">세부 견적 기준</p>
<table class="quot-items-table">
  <thead>
    <tr><th>no</th><th>구분</th><th>상품명</th><th>세부항목</th><th class="num">공급가</th><th class="num">수량</th><th class="num">합계</th><th class="num">부가세</th></tr>
  </thead>
  <tbody>
    <tr class="quot-category-row"><td colspan="8">카테고리 (예: 콘텐츠 제작)</td></tr>
    <tr><td class="center">1</td><td>구분</td><td>상품명</td><td>세부항목</td><td class="num">{{unit_price}}</td><td class="center">1</td><td class="num">{{amount}}</td><td class="num">{{item_vat}}</td></tr>
    <tr class="quot-subtotal-row"><td colspan="6" style="text-align:right;padding-right:12px">소계</td><td class="num">{{cat_subtotal}}</td><td class="num">{{cat_vat}}</td></tr>
  </tbody>
</table>

<!-- 기타 및 주의사항 -->
<div class="quot-notes">
  <p class="quot-notes-title">기타</p>
  <ol>
    <li>주의사항 1</li>
    <li>주의사항 2</li>
  </ol>
</div>
<div class="quot-footer">© {{year}} {{company_name}}. All rights reserved.</div>

규칙:
- 반드시 위 구조를 사용. 표 중심 레이아웃 유지.
- 금액은 ₩ 또는 원 단위로 표기
- class 이름 정확히 사용 (quot-header, quot-summary, quot-items-table 등)
`

// ── 제안서 HTML 구조 ──
const PROPOSAL_HTML_GUIDE = `
■ documentType: "proposal" — 프레젠테이션/슬라이드 스타일 HTML 구조

회사소개서/제안서처럼 슬라이드 형태. 각 섹션이 하나의 슬라이드.

<!-- 슬라이드 1: 커버 (파란 배경) -->
<div class="prop-cover">
  <div class="prop-cover-inner">
    <p class="prop-cover-logo">{{company_name}}</p>
    <h1 class="prop-cover-title">{{proposal_title}}</h1>
    <p class="prop-cover-subtitle">{{subtitle}}</p>
  </div>
  <div class="prop-cover-footer">
    <span>{{year}} © {{company_name}}. All rights reserved.</span>
    <span>{{company_website}}</span>
  </div>
</div>

<!-- 슬라이드 2+: 일반 슬라이드 (흰 배경) -->
<div class="prop-slide">
  <div class="prop-slide-header">
    <h2 class="prop-slide-title">섹션 제목</h2>
    <span class="prop-logo">{{company_name}}</span>
  </div>
  <div class="prop-body">
    <!-- 2단 레이아웃 예시 -->
    <div class="prop-2col">
      <div>
        <!-- 왼쪽: 이미지 자리 또는 강조 텍스트 -->
        <p class="prop-highlight">{{headline}}</p>
        <p class="prop-highlight-sub">{{subheadline}}</p>
        <p>설명 텍스트...</p>
      </div>
      <div>
        <!-- 오른쪽: 정보 테이블 -->
        <table class="prop-info-table">
          <tr><td>항목</td><td>{{value}}</td></tr>
          <tr><td>항목</td><td>{{value2}}</td></tr>
        </table>
      </div>
    </div>
    <!-- 서비스/항목 그리드 -->
    <p class="prop-service-category-title">🎯 카테고리명</p>
    <div class="prop-service-grid">
      <div class="prop-service-item">항목 1</div>
      <div class="prop-service-item">항목 2</div>
    </div>
  </div>
  <div class="prop-slide-footer">
    <span>{{company_website}}</span>
    <span>02</span>
  </div>
</div>

규칙:
- 커버는 반드시 prop-cover (파란 배경)
- 이후 각 섹션은 prop-slide (흰 배경)
- 각 슬라이드는 prop-slide-header + prop-body + prop-slide-footer 구조
- 슬라이드 푸터에 페이지 번호 표시
- 내용이 풍부하게 최소 4개 이상 슬라이드 생성
`

// 공통 JSON 스키마 설명
const JSON_SCHEMA = `
반환 JSON 스키마:
{
  "id": "string (kebab-case)",
  "name": "string (한국어)",
  "description": "string (한국어, 한 줄)",
  "icon": "string (단일 이모지)",
  "documentType": "contract | quotation | proposal",
  "sections": [
    {
      "id": "string (kebab-case)",
      "title": "string (한국어 섹션 제목)",
      "fields": [
        {
          "id": "string (snake_case)",
          "label": "string (한국어 질문형)",
          "type": "text | textarea | date | number | select | radio",
          "placeholder": "string",
          "required": true | false,
          "clauseIndex": "number | null (계약서 조항 번호. 제3조이면 3, 해당없으면 null)"
        }
      ]
    }
  ],
  "documentContent": "string (아래 HTML 구조 규칙 준수 + {{fieldId}} 치환. JSON 문자열이므로 따옴표 이스케이프)"
}

⚠️ 계약서(contract) 필드 생성 규칙 — 원문 보존 필수:
- 원문 조항 수와 동일한 수의 field 또는 section을 생성할 것 (조항 1개 = field 또는 section 1개 이상)
- 요약·축약·병합·생략 절대 금지 — 원문의 모든 조항 내용을 fields와 documentContent에 반영
- clauseIndex 필드로 원문 조항 번호를 추적할 것 (제3조 → clauseIndex: 3)

documentType 판별 기준 및 few-shot 예시:

■ contract (계약서 유형)
  - 키워드: 계약서, 협약서, 약정서, MOU, 제N조, 갑, 을, 서명, 날인
  - 구조 특징: 조항(제1조, 제2조...) 열거, 갑/을 당사자 표기, 서명란 존재
  - 예시 입력 → 출력: "소프트웨어 개발 용역계약서... 제1조(목적)... 갑: OO사, 을: XX사... 서명" → documentType: "contract"

■ quotation (견적서 유형)
  - 키워드: 견적서, 인보이스, 발주서, 단가, 수량, 합계, VAT, 공급가액, 부가세
  - 구조 특징: 품목/단가/수량/합계 테이블 중심, 금액 합산, 세금계산서 요소
  - 예시 입력 → 출력: "광고 제작 견적서... 단가: 500,000원, 수량: 2, VAT: 10%" → documentType: "quotation"

■ proposal (제안서/기획서 유형) — 판별 불확실 시 기본값
  - 키워드: 제안서, 기획서, 회사소개서, 보고서, 계획서, 개요, 목표, 전략
  - 구조 특징: 섹션별 내용 서술, 슬라이드/프레젠테이션 형식, 표나 조항보다 서술 중심
  - 예시 입력 → 출력: "마케팅 전략 제안서... 현황 분석, 목표 설정, 실행 계획" → documentType: "proposal"
  - ⚠️ 판별 불확실 시(위 두 타입 특징이 없을 경우) 반드시 "proposal"로 설정

한국 비즈니스 관행 반영:
- 계약서: 갑/을 표기 필수, 금액은 한화(원, ₩) 단위, 날짜는 YYYY년 MM월 DD일 형식
- 견적서: 공급가액 + 부가세(10%) = 합계 구조, 사업자번호 필드 포함
- 제안서: 경어체 사용(~습니다, ~드립니다), 회사명/담당자 필드 포함

반드시 JSON만 반환하세요.`

// DOCX HTML 입력용
const HTML_SYSTEM_PROMPT = `당신은 비즈니스 문서를 분석하여 재사용 가능한 양식 템플릿을 생성하는 AI입니다.

입력된 HTML 문서를 분석하여 아래 JSON 스키마에 맞는 템플릿을 생성하세요.

공통 규칙:
1. 문서에서 반복적으로 바뀌는 가변 정보(회사명, 날짜, 금액, 담당자명 등)를 입력 필드로 추출합니다.
2. documentContent의 가변 부분은 {{fieldId}} 플레이스홀더로 치환합니다.
3. 필드는 논리적 섹션으로 그룹화합니다 (최소 2개, 최대 4개 섹션).
4. 섹션당 필드는 2~6개가 적당합니다.
5. 모든 label은 한국어 질문 형식으로 작성합니다.
6. type은 내용에 맞게 선택: text, textarea, date, number, select, radio.
7. documentType을 정확히 판별한 뒤, 해당 타입의 HTML 구조를 사용합니다.

⚠️ 원문 보존 강제 규칙 (모든 documentType에 적용):
- 원문의 모든 조항/항목/섹션을 빠짐없이 포함할 것 — 내용 요약·축약·병합·생략 절대 금지
- 조항 번호·제목·본문을 원문 순서 그대로 유지할 것
- 원문에 조항이 N개이면 documentContent에 반드시 N개의 섹션/조항 블록을 생성할 것
- 계약서의 경우 각 조항의 세부 항목(①②③ 등)도 모두 포함할 것

${CONTRACT_HTML_GUIDE}

${QUOTATION_HTML_GUIDE}

${PROPOSAL_HTML_GUIDE}

${JSON_SCHEMA}`

// 텍스트(PDF/XLSX/붙여넣기) 입력용
const TEXT_SYSTEM_PROMPT = `당신은 비즈니스 문서를 분석하여 재사용 가능한 양식 템플릿을 생성하는 AI입니다.

사용자가 제공한 문서 텍스트를 분석하여 아래 JSON 스키마에 맞는 템플릿을 생성하세요.

공통 규칙:
1. 문서에서 반복적으로 바뀌는 가변 정보(회사명, 날짜, 금액, 담당자명 등)를 입력 필드로 추출합니다.
2. 고정 텍스트(조항, 표준 문구, 서식)는 documentContent에 그대로 유지합니다.
3. documentContent의 가변 부분은 {{fieldId}} 형식으로 치환합니다.
4. 원본 문서의 구조, 순서를 최대한 그대로 재현합니다.
5. 필드는 논리적 섹션으로 그룹화합니다 (최소 2개, 최대 4개 섹션).
6. 섹션당 필드는 2~6개가 적당합니다.
7. 모든 label은 한국어 질문 형식으로 작성합니다.
8. type은 내용에 맞게 선택: text, textarea, date, number, select, radio.
9. documentType을 정확히 판별한 뒤, 해당 타입의 HTML 구조를 사용합니다.

⚠️ 원문 보존 강제 규칙 (모든 documentType에 적용):
- 원문의 모든 조항/항목/섹션을 빠짐없이 포함할 것 — 내용 요약·축약·병합·생략 절대 금지
- 조항 번호·제목·본문을 원문 순서 그대로 유지할 것
- 원문에 조항이 N개이면 documentContent에 반드시 N개의 섹션/조항 블록을 생성할 것
- 계약서의 경우 각 조항(제1조~제N조)을 모두 개별 <div class="doc-section">으로 생성할 것
- 각 조항의 세부 항목(①②③ 또는 1.2.3. 등)도 모두 포함할 것

${CONTRACT_HTML_GUIDE}

${QUOTATION_HTML_GUIDE}

${PROPOSAL_HTML_GUIDE}

${JSON_SCHEMA}`

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const text = formData.get('text')

    let documentContent = ''
    let isHtml = false

    if (file) {
      // 파일 업로드 모드 (PDF / DOCX / XLSX)
      const buffer = Buffer.from(await file.arrayBuffer())
      const name = file.name.toLowerCase()

      if (name.endsWith('.docx') || file.type.includes('wordprocessingml')) {
        // DOCX → HTML (표, 굵은 글씨, 레이아웃 보존)
        documentContent = await extractFromDocxAsHtml(buffer)
        isHtml = true
      } else if (name.endsWith('.pdf') || file.type === 'application/pdf') {
        const result = await extractFromPdf(buffer)
        if (result.text) {
          // 텍스트 레이어 있는 PDF
          documentContent = result.text
          isHtml = false
        } else if (result.imageBase64) {
          // 스캔 PDF → Gemini로 직접 분석 (PDF 네이티브 지원)
          const geminiResponse = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    inlineData: { mimeType: 'application/pdf', data: result.imageBase64 },
                  },
                  { text: TEXT_SYSTEM_PROMPT + '\n\n이 PDF 문서를 분석하여 재사용 가능한 템플릿을 생성해주세요. 반드시 JSON만 반환하세요.' },
                ],
              },
            ],
          })
          const visionContent = geminiResponse.text
          if (!visionContent) {
            return NextResponse.json({ error: 'PDF 분석에 실패했습니다.' }, { status: 500 })
          }
          const parsed = parseTemplate(visionContent)
          const template: Template = { ...parsed, id: `${parsed.id}-${Date.now()}`, icon: parsed.icon || '📄' }
          return NextResponse.json(template)
        } else {
          return NextResponse.json(
            { error: 'PDF에서 내용을 읽을 수 없습니다. DOCX로 변환 후 업로드해주세요.' },
            { status: 400 }
          )
        }
      } else if (name.endsWith('.xlsx') || file.type.includes('spreadsheetml')) {
        documentContent = await extractFromXlsx(buffer)
        isHtml = false
      } else if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.json')) {
        documentContent = await file.text()
        isHtml = false
      } else {
        return NextResponse.json({ error: '지원하지 않는 파일 형식입니다.' }, { status: 400 })
      }
    } else if (text && typeof text === 'string') {
      // 텍스트 붙여넣기 모드 (기존)
      documentContent = text.trim()
      isHtml = false
    } else {
      return NextResponse.json(
        { error: '파일 또는 텍스트를 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!documentContent.trim()) {
      return NextResponse.json(
        { error: '문서 내용을 추출할 수 없습니다.' },
        { status: 400 }
      )
    }

    const truncated = documentContent.slice(0, 12000)
    const systemPrompt = isHtml ? HTML_SYSTEM_PROMPT : TEXT_SYSTEM_PROMPT
    const userMessage = isHtml
      ? `다음 HTML 문서를 분석하여 템플릿을 생성해주세요:\n\n${truncated}`
      : `다음 문서를 분석하여 재사용 가능한 템플릿을 생성해주세요:\n\n${truncated}`

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 8000,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'AI 응답을 받지 못했습니다.' },
        { status: 500 }
      )
    }

    const parsed = parseTemplate(content)

    // 계약서 조항 수 불일치 경고
    if (parsed.documentType === 'contract') {
      const originalClauseCount = (truncated.match(/제\d+조/g) ?? []).length
      const generatedFieldCount = (parsed.sections ?? []).reduce(
        (sum: number, s: { fields?: unknown[] }) => sum + (s.fields?.length ?? 0),
        0
      )
      if (
        originalClauseCount > 0 &&
        generatedFieldCount < originalClauseCount * 0.8
      ) {
        console.warn(
          `[/api/templates/analyze] ⚠️ 계약서 조항 수 불일치: 원문 ${originalClauseCount}개 조항, 생성된 필드 ${generatedFieldCount}개 (기준: 원문의 80% 미만)`
        )
      }
    }

    if (
      !parsed.id ||
      !parsed.name ||
      !parsed.sections ||
      !Array.isArray(parsed.sections) ||
      parsed.sections.length === 0
    ) {
      return NextResponse.json(
        { error: 'AI가 유효한 템플릿을 생성하지 못했습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    const template: Template = {
      ...parsed,
      id: `${parsed.id}-${Date.now()}`,
      icon: parsed.icon || '📄',
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('[/api/templates/analyze] error:', error)
    return NextResponse.json(
      { error: '문서 분석 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
