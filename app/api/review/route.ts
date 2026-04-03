import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { AIReviewResult, AIReviewSuggestion } from '@/lib/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface ReviewField {
  id: string
  label: string
  value: string
}

interface ReviewRequest {
  fields: ReviewField[]
}

export async function POST(request: NextRequest) {
  try {
    const body: ReviewRequest = await request.json()
    const { fields } = body

    if (!fields || fields.length === 0) {
      return NextResponse.json(
        { error: '검토할 필드가 없습니다.' },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OPENAI_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const fieldsText = fields
      .filter((f) => f.value.trim())
      .map((f) => `[${f.id}] ${f.label}: ${f.value}`)
      .join('\n')

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `당신은 한국어 비즈니스 문서 전문 교정 AI입니다.
사용자가 입력한 비즈니스 문서 필드들을 검토하고 맞춤법, 어투, 일관성, 경어체, 완성도를 교정해주세요.

응답은 반드시 아래 JSON 형식으로만 반환하세요:
{
  "score": <0~100 사이 품질 점수>,
  "suggestions": [
    {
      "id": "<고유 ID (s1, s2, ...)>",
      "fieldId": "<필드 ID>",
      "original": "<원본 텍스트>",
      "suggested": "<교정 텍스트>",
      "reason": "<교정 이유>",
      "type": "<spelling|tone|consistency|honorific|completeness>"
    }
  ]
}

score 산정 기준:
- 90~100: 교정 필요 없음, 완성도 높은 비즈니스 문서
- 70~89: 경미한 오류 1~2개, 전반적으로 양호
- 50~69: 중간 수준 오류 다수, 개선 필요
- 30~49: 심각한 오류 또는 비즈니스 문서 형식 미달
- 0~29: 전면 재작성 필요

교정 유형 정의:
spelling: 맞춤법/띄어쓰기 오류 (예: "안됩니다" → "안 됩니다")
tone: 어투/문체 부적절 — 비즈니스 문서에 맞지 않는 구어체, 비격식 표현 (예: "해요체" → "합니다체")
consistency: 용어 불일치 또는 논리적 모순 (같은 대상을 다른 명칭으로 지칭하는 경우)
honorific: 한국어 비즈니스 경어체 규칙 위반 — 비즈니스 문서는 반드시 "~습니다", "~드립니다", "~하겠습니다" 체를 사용해야 함. "~해요", "~이에요", "~할게요" 등 해요체 금지
completeness: 필수 정보 누락 또는 불완전한 문장 (예: 문장이 끊겨 있거나, 금액에 단위가 없거나, 날짜 형식 불완전)

교정이 필요 없는 경우 suggestions는 빈 배열로, score는 높게 반환하세요.`,
        },
        {
          role: 'user',
          content: `다음 비즈니스 문서 필드들을 검토해주세요:\n\n${fieldsText}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    const content = completion.choices[0]?.message?.content
    if (!content) {
      return NextResponse.json(
        { error: 'AI 응답을 받지 못했습니다.' },
        { status: 500 }
      )
    }

    const parsed = JSON.parse(content) as {
      score: number
      suggestions: AIReviewSuggestion[]
    }

    const result: AIReviewResult = {
      score: Math.max(0, Math.min(100, parsed.score ?? 80)),
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[/api/review] error:', error)
    return NextResponse.json(
      { error: 'AI 검토 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
