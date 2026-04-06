import OpenAI from 'openai'
import type { TemplateSchema } from '@/types/document'
import type { Template, DocumentType, FieldType } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const PARSE_SYSTEM_PROMPT = `
당신은 한국 비즈니스 문서 분석 전문가입니다.
문서를 분석해서 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만.
fixedStructure는 하드코딩된 고정값이 아닌, 실제 문서에서 동적으로 추출한 값을 사용하세요.

{
  "documentType": "quotation" | "proposal" | "contract" | "report" | "minutes" | "unknown",
  "title": "문서 제목",
  "variableFields": [
    {
      "id": "고유ID (snake_case)",
      "label": "한국어 레이블",
      "type": "text" | "number" | "date" | "currency" | "table",
      "placeholder": "예시값",
      "required": true | false
    }
  ],
  "fixedStructure": {
    "companyInfo": true | false,
    "tableStructure": true | false,
    "logoPosition": "실제 문서에서 관찰된 로고 위치 (없으면 none)",
    "colorScheme": "실제 문서에서 관찰된 주 색상 계열 (예: blue, gray, black, red, green 등)"
  },
  "confidence": 0.0~1.0
}

documentType 판별 기준:
- quotation: 견적서, 인보이스, 단가/수량/합계 표, VAT, 공급가액
- proposal: 제안서, 기획서, 회사소개서, 목표/전략 서술
- contract: 계약서, 협약서, 약정서, 제N조 조항 구조, 갑/을 표기, 서명란
- report: 보고서, 업무보고, 월간/주간보고, 결과 분석
- minutes: 회의록, 회의 결과, 참석자, 논의사항, 결정사항
- unknown: 위 유형으로 판별 불가한 경우

confidence 임계값 기준:
- 0.8 이상: 고신뢰 — 문서 유형이 명확하게 판별됨
- 0.5~0.79: 재확인 권장 — 유형 판별이 불확실하거나 혼합된 특성
- 0.5 미만: unknown으로 처리 — 판별 근거 불충분

변수 필드 판별 기준:
- 거래처마다 달라지는 값: 거래처명, 담당자, 연락처, 납기일, 수량, 단가
- 프로젝트마다 달라지는 값: 프로젝트명, 범위, 금액, 조건
- 날짜: 견적일, 유효기간, 납기일, 계약일, 회의일
고정 구조: 회사 로고, 은행 계좌, 세금 계산 방식, 표준 조항, 양식 레이아웃

⚠️ 원문 전체 추출 필수 규칙:
- 문서의 모든 조항/항목을 빠짐없이 추출할 것 — 요약·축약·생략 절대 금지
- 계약서의 경우 제1조부터 마지막 조항까지 모든 조항을 variableFields에 반영할 것
- 조항 번호·순서를 원문 그대로 유지할 것
- 내용이 길더라도 잘라내거나 "등" 으로 축약하지 말 것

⚠️ 당사자 명칭 verbatim 보존 규칙 (계약서에 필수):
- 원문의 당사자 명칭(위탁자/수탁자, 도급인/수급인, 갑/을 등)을 임의로 변경 절대 금지
- 원문이 '위탁자'이면 '위탁자', '갑'이면 '갑' — AI가 임의로 다른 명칭으로 치환 불가
- variableFields에 party_a_label(당사자 A 명칭)과 party_b_label(당사자 B 명칭)을 포함할 것
- 조항 본문 문구 재작성(paraphrase), 의역, 축약 절대 금지
`

const DOC_TYPE_ICON: Record<string, string> = {
  quotation: '💰',
  proposal: '📋',
  contract: '📝',
  report: '📊',
  minutes: '📅',
  unknown: '📄',
}

const DOC_TYPE_LABEL: Record<string, string> = {
  quotation: '견적서',
  proposal: '제안서',
  contract: '계약서',
  report: '보고서',
  minutes: '회의록',
  unknown: '문서',
}

const SCHEMA_TO_FIELD_TYPE: Record<string, FieldType> = {
  text: 'text',
  number: 'number',
  date: 'date',
  currency: 'number',
  table: 'textarea',
}

const SCHEMA_TO_DOC_TYPE: Record<string, DocumentType | undefined> = {
  quotation: 'quotation',
  proposal: 'proposal',
  contract: 'contract',
  report: undefined,
  minutes: undefined,
  unknown: undefined,
}

export function schemaToTemplate(schema: TemplateSchema): Template {
  const id = `parsed-${Date.now()}`
  const docTypeLabel = DOC_TYPE_LABEL[schema.documentType] ?? '문서'
  const icon = DOC_TYPE_ICON[schema.documentType] ?? '📄'
  const docType = SCHEMA_TO_DOC_TYPE[schema.documentType]

  const fields = schema.variableFields.map((f) => ({
    id: f.id,
    label: f.label,
    type: SCHEMA_TO_FIELD_TYPE[f.type] ?? 'text',
    placeholder: f.placeholder,
    required: f.required,
  }))

  const sections = [{ id: 'main', title: '기본 정보', fields }]

  const contentLines = [
    schema.title,
    '',
    ...schema.variableFields.map((f) => `${f.label}: {{${f.id}}}`),
  ]

  return {
    id,
    name: schema.title || docTypeLabel,
    description: `AI가 분석한 ${docTypeLabel} 템플릿 (신뢰도 ${Math.round(schema.confidence * 100)}%)`,
    icon,
    ...(docType ? { documentType: docType } : {}),
    sections,
    documentContent: contentLines.join('\n'),
  }
}

export async function parseDocumentWithClaude(
  text: string,
  imageBase64?: string
): Promise<TemplateSchema> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: { url: `data:image/png;base64,${imageBase64}` },
        },
        {
          type: 'text',
          text: '위 문서 이미지를 분석해서 필드를 추출해주세요.',
        },
      ],
    })
  } else {
    messages.push({
      role: 'user',
      content: `다음 문서 텍스트를 분석해주세요:\n\n${text}`,
    })
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: PARSE_SYSTEM_PROMPT },
      ...messages,
    ],
    response_format: { type: 'json_object' },
    temperature: 0.3,
    max_tokens: 6000,
  })

  const raw = completion.choices[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(raw)
    return { ...parsed, rawText: text }
  } catch {
    throw new Error('GPT 응답 파싱 실패: ' + raw.slice(0, 200))
  }
}
