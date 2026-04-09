import type { Field, Section } from '@/lib/types'

export interface QAIssue {
  severity: 'error' | 'warning'
  code: string
  message: string
}

export interface QAResult {
  issues: QAIssue[]
  /** A4 기준 예측 페이지 수 (약 1800자/페이지) */
  pageCount: number
  /** error 이슈가 없으면 true */
  pass: boolean
}

const CHARS_PER_PAGE = 1800

/**
 * 템플릿 QA 자동 검사
 * - 불완전한 플레이스홀더 감지 ({{ 만 있고 }} 없는 경우)
 * - 열림/닫힘 중괄호 수 불일치
 * - 정의되지 않은 fieldId 참조
 * - 중복 field.id 탐지
 * - 문서 길이/페이지 분할 예측
 *
 * PII 주의: 샘플 값은 반드시 마스킹 사용 (예: "홍**", "010-****-****")
 */
export function runTemplateQA(
  content: string,
  sections: Section[],
  customFields: Field[],
): QAResult {
  const issues: QAIssue[] = []

  // content가 빈 경우 graceful 처리
  if (!content || content.trim() === '') {
    return { issues: [], pageCount: 0, pass: true }
  }

  const allFields = [...sections.flatMap(s => s.fields), ...customFields]
  const fieldIds = new Set(allFields.map(f => f.id))

  // ── 불완전한 플레이스홀더 감지: "{{" 만 있고 바로 닫히지 않는 경우 ──
  // {{fieldId}} 형식 및 조건부 블록 디렉티브 ({{#if}}, {{#elif}}, {{#else}}, {{/if}}) 는 정상으로 허용
  const incompleteMatches = content.match(
    /\{\{(?!\w+\}\}|#(?:if|elif|else)[^}]*\}\}|\/if\}\})/g
  )
  if (incompleteMatches) {
    issues.push({
      severity: 'error',
      code: 'INCOMPLETE_PLACEHOLDER',
      message: `불완전한 플레이스홀더가 ${incompleteMatches.length}개 발견되었습니다. "{{fieldId}}" 형식을 확인하세요.`,
    })
  }

  // ── 열림/닫힘 중괄호 수 불일치 (조건 블록 디렉티브 제외) ──
  // 조건 블록 디렉티브를 제거한 후 일반 플레이스홀더 {{ }} 쌍만 비교
  const contentWithoutDirectives = content
    .replace(/\{\{#(?:if|elif|else)[^}]*\}\}/g, '')
    .replace(/\{\{\/if\}\}/g, '')
  const openCount = (contentWithoutDirectives.match(/\{\{/g) || []).length
  const closeCount = (contentWithoutDirectives.match(/\}\}/g) || []).length
  if (openCount !== closeCount) {
    issues.push({
      severity: 'error',
      code: 'MISMATCHED_BRACES',
      message: `플레이스홀더 열림({{) ${openCount}개 vs 닫힘(}}) ${closeCount}개 — 쌍이 맞지 않습니다.`,
    })
  }

  // ── 정의되지 않은 fieldId 참조 ──
  const placeholderRegex = /\{\{(\w+)\}\}/g
  let match: RegExpExecArray | null
  const unknownIds: string[] = []
  while ((match = placeholderRegex.exec(content)) !== null) {
    if (!fieldIds.has(match[1])) {
      unknownIds.push(match[1])
    }
  }
  if (unknownIds.length > 0) {
    const unique = [...new Set(unknownIds)]
    issues.push({
      severity: 'warning',
      code: 'UNKNOWN_PLACEHOLDER',
      message: `필드 목록에 없는 플레이스홀더: ${unique.map(id => `{{${id}}}`).join(', ')}`,
    })
  }

  // ── 중복 field.id 탐지 ──
  const seenIds = new Set<string>()
  const duplicateIds: string[] = []
  for (const field of allFields) {
    if (seenIds.has(field.id)) {
      duplicateIds.push(field.id)
    }
    seenIds.add(field.id)
  }
  if (duplicateIds.length > 0) {
    issues.push({
      severity: 'error',
      code: 'DUPLICATE_FIELD_ID',
      message: `중복된 필드 ID가 있습니다: ${[...new Set(duplicateIds)].join(', ')}`,
    })
  }

  // ── 문서 길이/페이지 분할 예측 (A4 기준 약 1800자/페이지) ──
  const plainLength = content.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().length
  const pageCount = Math.max(1, Math.ceil(plainLength / CHARS_PER_PAGE))
  if (pageCount > 10) {
    issues.push({
      severity: 'warning',
      code: 'LONG_DOCUMENT',
      message: `문서가 약 ${pageCount}페이지로 예측됩니다. PDF 변환 시 레이아웃을 꼭 확인하세요.`,
    })
  }

  const hasError = issues.some(i => i.severity === 'error')
  return { issues, pageCount, pass: !hasError }
}
