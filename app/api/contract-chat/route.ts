import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ContractChatRequest {
  messages: ChatMessage[]
  currentContent: string
  values: Record<string, string>
  templateName: string
}

export type ContractChatResponse =
  | { action: 'update'; content: string; message: string }
  | { action: 'reply'; message: string }

const SYSTEM_PROMPT = `당신은 한국 법률 문서 전문가이자 계약서 편집 어시스턴트입니다.
사용자가 현재 편집 중인 계약서를 함께 보면서, 수정 요청이나 질문에 답합니다.

## 역할
- 계약서 조항 수정, 추가, 삭제 요청을 처리합니다.
- 계약서 내용에 대한 질문에 답합니다.
- 불리한 조항이나 누락된 사항을 먼저 짚어줍니다.
- 항상 한국어로 답합니다.

## 계약서 문법 규칙
이 계약서는 아래 두 가지 구문을 사용합니다:
1. 값 치환: {{fieldId}} — 사용자가 입력한 값으로 대체됨
2. 조건 블록:
   {{#if fieldId == "value"}}
   조건이 참일 때 내용
   {{#elif fieldId == "other"}}
   다른 조건일 때 내용
   {{#else}}
   나머지 경우 내용
   {{/if}}
이 구문들을 그대로 유지하면서 수정해야 합니다.

## 응답 형식 (반드시 준수)
계약서 내용을 수정하는 경우:
\`\`\`json
{"action":"update","content":"수정된 전체 계약서 내용","message":"변경 사항 한 줄 요약"}
\`\`\`

질문에 답하거나 설명하는 경우:
\`\`\`json
{"action":"reply","message":"답변 내용"}
\`\`\`

## 주의
- content는 반드시 전체 계약서 문자열이어야 합니다 (일부가 아님).
- {{fieldId}}, {{#if}}, {{/if}} 등 기존 플레이스홀더 구문을 임의로 제거하지 마세요.
- 법적 조언 면책: 이 내용은 참고용이며 실제 법률 검토는 전문가에게 받으시기 바랍니다.`

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) {
    return NextResponse.json({ error: 'API 키가 필요합니다.' }, { status: 401 })
  }

  let body: ContractChatRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const { messages, currentContent, values, templateName } = body

  // 현재 계약서 컨텍스트를 시스템 메시지에 주입
  const filledValues = Object.entries(values)
    .filter(([, v]) => v)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join('\n')

  const contextBlock = `## 현재 편집 중인 계약서: ${templateName}

### 입력된 값
${filledValues || '(아직 입력된 값 없음)'}

### 계약서 내용 (원문)
${currentContent}`

  const client = new Anthropic({ apiKey })

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT + '\n\n' + contextBlock,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : ''

    // JSON 블록 추출
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/)
    if (!jsonMatch) {
      // JSON 블록 없으면 그냥 reply로 감쌈
      return NextResponse.json({ action: 'reply', message: raw } satisfies ContractChatResponse)
    }

    const parsed = JSON.parse(jsonMatch[1]) as ContractChatResponse
    return NextResponse.json(parsed)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.includes('401') || msg.includes('invalid_api_key') || msg.includes('authentication')) {
      return NextResponse.json({ error: 'API 키가 유효하지 않습니다.' }, { status: 401 })
    }
    return NextResponse.json({ error: `AI 호출 오류: ${msg}` }, { status: 500 })
  }
}
