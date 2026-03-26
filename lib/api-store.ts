import type { Document } from '@/lib/types'

// 인메모리 문서 스토어 (API 라우트 간 공유)
// 추후 DB 레이어로 교체 시 이 파일만 수정하면 됩니다.
export const documents: Map<string, Document> = new Map()
