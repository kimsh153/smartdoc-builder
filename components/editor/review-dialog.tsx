'use client'

import { useDocumentStore } from '@/lib/store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { CheckCheck, X, ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import type { AIReviewSuggestion } from '@/lib/types'

const TYPE_LABEL: Record<AIReviewSuggestion['type'], string> = {
  spelling: '맞춤법',
  tone: '어투',
  consistency: '일관성',
}

const TYPE_VARIANT: Record<AIReviewSuggestion['type'], 'default' | 'secondary' | 'destructive' | 'outline'> = {
  spelling: 'destructive',
  tone: 'default',
  consistency: 'secondary',
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-yellow-600'
  return 'text-red-600'
}

export function ReviewDialog() {
  const { reviewResult, setReviewResult, setValue } = useDocumentStore()

  const handleClose = () => setReviewResult(null)

  const handleAccept = (suggestion: AIReviewSuggestion) => {
    setValue(suggestion.fieldId, suggestion.suggested)
    toast.success('제안이 적용되었습니다')
    // Remove accepted suggestion from results
    if (!reviewResult) return
    const remaining = reviewResult.suggestions.filter((s) => s.id !== suggestion.id)
    setReviewResult({ ...reviewResult, suggestions: remaining })
  }

  const handleAcceptAll = () => {
    if (!reviewResult) return
    reviewResult.suggestions.forEach((s) => setValue(s.fieldId, s.suggested))
    toast.success(`${reviewResult.suggestions.length}개 제안이 모두 적용되었습니다`)
    setReviewResult({ ...reviewResult, suggestions: [] })
  }

  const handleIgnore = (suggestionId: string) => {
    if (!reviewResult) return
    const remaining = reviewResult.suggestions.filter((s) => s.id !== suggestionId)
    setReviewResult({ ...reviewResult, suggestions: remaining })
  }

  if (!reviewResult) return null

  const { score, suggestions } = reviewResult

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>AI 검토 결과</DialogTitle>
          <DialogDescription>
            문서의 맞춤법, 어투, 일관성을 분석했습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 점수 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">문서 품질 점수</span>
            <span className={`text-2xl font-bold ${scoreColor(score)}`}>{score}점</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <Separator />

        {/* 제안 목록 */}
        {suggestions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            교정이 필요한 항목이 없습니다 ✓
          </p>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{suggestions.length}개 교정 제안</span>
              <Button variant="outline" size="sm" onClick={handleAcceptAll}>
                <CheckCheck className="mr-1 h-4 w-4" />
                모두 적용
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant={TYPE_VARIANT[suggestion.type]} className="shrink-0">
                      {TYPE_LABEL[suggestion.type]}
                    </Badge>
                    <span className="text-xs text-muted-foreground flex-1 text-right line-clamp-1">
                      {suggestion.reason}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="line-through text-muted-foreground flex-1 truncate">
                      {suggestion.original}
                    </span>
                    <ArrowRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="text-foreground font-medium flex-1 truncate">
                      {suggestion.suggested}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-muted-foreground"
                      onClick={() => handleIgnore(suggestion.id)}
                    >
                      <X className="mr-1 h-3 w-3" />
                      무시
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => handleAccept(suggestion)}
                    >
                      적용
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
