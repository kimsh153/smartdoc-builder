import { NextRequest, NextResponse } from 'next/server'

// TODO: TASK-006, TASK-007, TASK-009 — OpenAI API 연동 구현 예정
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: 'AI 검토 기능은 준비 중입니다.' },
    { status: 501 }
  )
}
