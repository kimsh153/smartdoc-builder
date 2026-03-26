import { NextRequest, NextResponse } from 'next/server'
import type { Document } from '@/lib/types'

// 인메모리 스토어 참조 (documents/route.ts와 동일 모듈 범위 공유 불가 → 독립 Map)
// 추후 DB 레이어로 교체 시 이 Map을 제거하면 됩니다.
const documents: Map<string, Document> = new Map()

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const doc = documents.get(id)
  if (!doc) {
    return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 })
  }
  return NextResponse.json({ document: doc })
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const existing = documents.get(id)
  if (!existing) {
    return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 })
  }

  const body = await request.json()
  const { values, status } = body

  const updated: Document = {
    ...existing,
    ...(values !== undefined && { values }),
    ...(status !== undefined && { status }),
    updatedAt: new Date().toISOString(),
  }

  documents.set(id, updated)
  return NextResponse.json({ document: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  if (!documents.has(id)) {
    return NextResponse.json({ error: '문서를 찾을 수 없습니다.' }, { status: 404 })
  }
  documents.delete(id)
  return NextResponse.json({ success: true })
}
