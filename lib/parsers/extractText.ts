import mammoth from 'mammoth'

export async function extractFromDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer })
  return result.value
}

// DOCX → HTML 변환 (표, 굵은 글씨, 레이아웃 유지)
export async function extractFromDocxAsHtml(buffer: Buffer): Promise<string> {
  const result = await mammoth.convertToHtml({ buffer })
  return result.value
}

export async function extractFromPdf(buffer: Buffer): Promise<{
  text: string
  imageBase64?: string
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse')
    const data = await pdfParse(buffer)
    if (data.text.trim().length > 0) {
      return { text: data.text }
    }
  } catch {}

  // Vision fallback: PDF buffer → base64 (Gemini는 PDF 네이티브 지원)
  const imageBase64 = buffer.toString('base64')
  return { text: '', imageBase64 }
}

export async function extractFromXlsx(buffer: Buffer): Promise<string> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  let text = ''
  workbook.SheetNames.forEach((name: string) => {
    const sheet = workbook.Sheets[name]
    text += XLSX.utils.sheet_to_csv(sheet) + '\n'
  })
  return text
}
