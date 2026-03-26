import { NextRequest, NextResponse } from 'next/server'

// TODO: 파일 업로드 → 템플릿 자동 생성 (별도 태스크)
export async function POST(_request: NextRequest) {
  return NextResponse.json(
    { error: '템플릿 분석 기능은 준비 중입니다.' },
    { status: 501 }
  )
}
