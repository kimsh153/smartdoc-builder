'use client'

import { useMemo } from 'react'
import { useDocumentStore } from '@/lib/store'
import { runTemplateQA } from '@/lib/qa/templateQA'
import { AlertCircle, AlertTriangle, CheckCircle2, FileText } from 'lucide-react'

/** QA 결과 패널 — MD 편집 탭 하단에 표시 */
export function QAResultPanel() {
  const { selectedTemplate, customContent, customFields } = useDocumentStore()

  const result = useMemo(() => {
    if (!selectedTemplate) return null
    const content = customContent ?? selectedTemplate.documentContent
    return runTemplateQA(content, selectedTemplate.sections, customFields)
  }, [selectedTemplate, customContent, customFields])

  if (!result) return null

  return (
    <div className="border-t bg-card p-3 space-y-2">
      {/* 요약 행 */}
      <div className="flex items-center gap-2">
        {result.pass ? (
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
        )}
        <span className={`text-xs font-semibold ${result.pass ? 'text-green-600' : 'text-destructive'}`}>
          QA {result.pass ? '통과' : '실패'}
        </span>
        {!result.pass && (
          <span className="text-xs text-destructive">
            (오류 {result.issues.filter(i => i.severity === 'error').length}개)
          </span>
        )}
        {result.issues.some(i => i.severity === 'warning') && (
          <span className="text-xs text-amber-600">
            경고 {result.issues.filter(i => i.severity === 'warning').length}개
          </span>
        )}
        <div className="flex items-center gap-1 ml-auto text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>약 {result.pageCount}p</span>
        </div>
      </div>

      {/* 이슈 목록 */}
      {result.issues.length > 0 && (
        <ul className="space-y-1.5">
          {result.issues.map((issue, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs">
              {issue.severity === 'error' ? (
                <AlertCircle className="h-3 w-3 mt-0.5 text-destructive shrink-0" />
              ) : (
                <AlertTriangle className="h-3 w-3 mt-0.5 text-amber-500 shrink-0" />
              )}
              <span className={issue.severity === 'error' ? 'text-destructive' : 'text-amber-700'}>
                {issue.message}
              </span>
            </li>
          ))}
        </ul>
      )}

      {result.issues.length === 0 && (
        <p className="text-xs text-muted-foreground">문제가 발견되지 않았습니다.</p>
      )}
    </div>
  )
}

/** QA 상태 훅 — 탭 배지 및 저장 버튼 게이팅에 사용 */
export function useQAResult() {
  const { selectedTemplate, customContent, customFields } = useDocumentStore()

  return useMemo(() => {
    if (!selectedTemplate) return { pass: true, errorCount: 0, warningCount: 0, pageCount: 1 }
    const content = customContent ?? selectedTemplate.documentContent
    const result = runTemplateQA(content, selectedTemplate.sections, customFields)
    return {
      pass: result.pass,
      errorCount: result.issues.filter(i => i.severity === 'error').length,
      warningCount: result.issues.filter(i => i.severity === 'warning').length,
      pageCount: result.pageCount,
    }
  }, [selectedTemplate, customContent, customFields])
}
