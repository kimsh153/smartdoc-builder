import OpenAI from 'openai'
import type { TemplateSchema } from '@/types/document'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const PARSE_SYSTEM_PROMPT = `
당신은 한국 비즈니스 문서(견적서, 제안서, 계약서) 분석 전문가입니다.
문서를 분석해서 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만.
fixedStructure는 고정값이 아니라 실제 문서에서 추출한 값을 사용하세요.

{
  "documentType": "quotation" | "proposal" | "unknown",
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
    "logoPosition": "top-left" | "top-center" | "top-right" | "none",
    "colorScheme": "blue" | "gray" | "black" | "custom"
  },
  "confidence": 0.0~1.0
}

변수 필드 판별 기준:
- 거래처마다 달라지는 값: 거래처명, 담당자, 연락처, 납기일, 수량, 단가
- 프로젝트마다 달라지는 값: 프로젝트명, 범위, 금액, 조건
- 날짜: 견적일, 유효기간, 납기일
고정 구조: 회사 로고, 은행 계좌, 세금 계산 방식, 양식 레이아웃
`

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
    max_tokens: 4000,
  })

  const raw = completion.choices[0]?.message?.content ?? ''

  try {
    const parsed = JSON.parse(raw)
    return { ...parsed, rawText: text }
  } catch {
    throw new Error('GPT 응답 파싱 실패: ' + raw.slice(0, 200))
  }
}
