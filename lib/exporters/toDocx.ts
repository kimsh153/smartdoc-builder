import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
} from 'docx'

type DocxParagraph = Paragraph

function collectParagraphs(el: Element, paragraphs: DocxParagraph[]) {
  const tag = el.tagName?.toLowerCase()
  const cls = (el as HTMLElement).className || ''

  if (tag === 'style' || tag === 'script') return

  // Heading 1
  if (tag === 'h1' || cls.includes('doc-title') || cls.includes('prop-cover-title')) {
    const text = el.textContent?.trim()
    if (text) {
      paragraphs.push(
        new Paragraph({
          text,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        })
      )
    }
    return
  }

  // Heading 2
  if (
    tag === 'h2' ||
    cls.includes('doc-section-title') ||
    cls.includes('doc-article-title') ||
    cls.includes('prop-slide-title')
  ) {
    const text = el.textContent?.trim()
    if (text) {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_2 }))
    }
    return
  }

  // Heading 3
  if (tag === 'h3') {
    const text = el.textContent?.trim()
    if (text) {
      paragraphs.push(new Paragraph({ text, heading: HeadingLevel.HEADING_3 }))
    }
    return
  }

  // Paragraph / body text
  if (
    tag === 'p' ||
    cls.includes('doc-body') ||
    cls.includes('doc-intro') ||
    cls.includes('doc-meta') ||
    cls.includes('doc-sign-box') ||
    cls.includes('doc-sign-date')
  ) {
    const runs = buildTextRuns(el)
    if (runs.length > 0) {
      paragraphs.push(new Paragraph({ children: runs }))
    }
    return
  }

  // List item
  if (tag === 'li') {
    const text = el.textContent?.trim()
    if (text) {
      paragraphs.push(
        new Paragraph({ children: [new TextRun(`• ${text}`)], indent: { left: 720 } })
      )
    }
    return
  }

  // Table — flatten each row
  if (tag === 'table') {
    el.querySelectorAll('tr').forEach((tr) => {
      const cells = Array.from(tr.querySelectorAll('td, th'))
      const rowText = cells
        .map((c) => c.textContent?.trim())
        .filter(Boolean)
        .join('  |  ')
      if (rowText) {
        paragraphs.push(new Paragraph({ children: [new TextRun(rowText)] }))
      }
    })
    return
  }

  // line break → empty paragraph
  if (tag === 'br') {
    paragraphs.push(new Paragraph({ children: [] }))
    return
  }

  // Recurse into children
  Array.from(el.children).forEach((child) => collectParagraphs(child, paragraphs))

  // Also handle inline text nodes that sit directly under container divs
  if (el.children.length === 0) {
    const text = el.textContent?.trim()
    if (text) {
      paragraphs.push(new Paragraph({ children: [new TextRun(text)] }))
    }
  }
}

function buildTextRuns(el: Element): TextRun[] {
  const runs: TextRun[] = []
  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || ''
      if (text.trim()) runs.push(new TextRun(text))
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const c = child as Element
      const tag = c.tagName.toLowerCase()
      const childText = c.textContent || ''
      if (tag === 'strong' || tag === 'b') {
        runs.push(new TextRun({ text: childText, bold: true }))
      } else if (tag === 'em' || tag === 'i') {
        runs.push(new TextRun({ text: childText, italics: true }))
      } else if (tag === 'br') {
        runs.push(new TextRun({ text: '', break: 1 }))
      } else if (tag === 'span') {
        runs.push(new TextRun(childText))
      } else {
        runs.push(...buildTextRuns(c))
      }
    }
  })
  return runs
}

/**
 * Export the contents of `elementId` as a .docx file download.
 * Falls back to plain-text extraction when structural parsing yields nothing.
 */
export async function exportToDocx(elementId: string, filename: string): Promise<void> {
  const root = document.getElementById(elementId)
  if (!root) throw new Error(`Element #${elementId} not found`)

  const paragraphs: DocxParagraph[] = []
  Array.from(root.children).forEach((child) => collectParagraphs(child, paragraphs))

  // Fallback: strip tags and split by br/newline
  if (paragraphs.length === 0) {
    const raw = root.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
    raw.split('\n').forEach((line) => {
      paragraphs.push(new Paragraph({ children: [new TextRun(line.trim())] }))
    })
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1134,    // 20mm
              bottom: 1134, // 20mm
              left: 1587,   // 28mm
              right: 1247,  // 22mm
            },
          },
        },
        children: paragraphs,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.docx`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
