import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { documents } from '@/lib/api-store'

const PutBodySchema = z.object({
  values: z.record(z.string()).optional(),
  status: z.enum(['draft', 'reviewed', 'confirmed']).optional(),
})

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

  const raw = await request.json()
  const parsed = PutBodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: '잘못된 요청입니다.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }
  const { values, status } = parsed.data

  const updated = {
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
