import { NextRequest, NextResponse } from 'next/server'
import { extractFromDocx, extractFromPdf, extractFromXlsx } from '@/lib/parsers/extractText'
import { parseDocumentWithClaude } from '@/lib/parsers/claudeParser'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File

  if (!file) return NextResponse.json({ error: '파일 없음' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const mime = file.type
  const name = file.name.toLowerCase()

  let text = ''
  let imageBase64: string | undefined

  try {
    if (name.endsWith('.docx') || mime.includes('wordprocessingml')) {
      text = await extractFromDocx(buffer)
    } else if (name.endsWith('.xlsx') || mime.includes('spreadsheetml')) {
      text = await extractFromXlsx(buffer)
    } else if (name.endsWith('.pdf') || mime === 'application/pdf') {
      const result = await extractFromPdf(buffer)
      text = result.text
      imageBase64 = result.imageBase64
    } else if (name.endsWith('.txt') || mime === 'text/plain') {
      text = await file.text()
    } else {
      return NextResponse.json({ error: '지원하지 않는 파일 형식' }, { status: 400 })
    }

    const schema = await parseDocumentWithClaude(text, imageBase64)
    return NextResponse.json({ success: true, schema })
  } catch (e) {
    const msg = e instanceof Error ? e.message : '알 수 없는 오류'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
