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
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `당신은 한국어 비즈니스 문서 전문 교정 AI입니다.
사용자가 입력한 비즈니스 문서 필드들을 검토하고 맞춤법, 어투, 일관성을 교정해주세요.

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
      "type": "<spelling|tone|consistency>"
    }
  ]
}

교정이 필요 없는 경우 suggestions는 빈 배열로, score는 높게 반환하세요.
spelling: 맞춤법/띄어쓰기 오류
tone: 어투/문체 부적절 (비즈니스 문서에 맞지 않는 표현)
consistency: 용어 불일치 또는 논리적 모순`,
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
