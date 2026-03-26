import { NextRequest, NextResponse } from 'next/server'
import type { Document } from '@/lib/types'

// 인메모리 스토어 (추후 DB로 교체)
const documents: Map<string, Document> = new Map()

export async function GET() {
  const list = Array.from(documents.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
  return NextResponse.json({ documents: list })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { templateId, templateName } = body

  if (!templateId || !templateName) {
    return NextResponse.json(
      { error: 'templateId와 templateName은 필수입니다.' },
      { status: 400 }
    )
  }

  const newDoc: Document = {
    id: crypto.randomUUID(),
    templateId,
    templateName,
    values: {},
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  documents.set(newDoc.id, newDoc)
  return NextResponse.json({ document: newDoc }, { status: 201 })
}
