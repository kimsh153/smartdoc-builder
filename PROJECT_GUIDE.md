# SmartDoc Builder - 프로젝트 가이드

## 핵심 파일 (먼저 읽기)
```
lib/types.ts      # 모든 타입 정의 (Template, Document, Field, Section)
lib/store.ts      # Zustand 스토어 (상태관리 + localStorage persist)
lib/templates.ts  # 6개 템플릿 데이터
```

## 페이지 구조
```
app/page.tsx         # 대시보드 - 템플릿 선택 + 내 문서 목록
app/editor/page.tsx  # 에디터 - 좌우 분할 (입력 40% / 미리보기 60%)
```

## 컴포넌트
```
components/
├── template-card.tsx    # 템플릿 선택 카드 (클릭시 문서 생성 → 에디터 이동)
├── document-card.tsx    # 저장된 문서 카드 (상태 뱃지, 수정/삭제)
└── editor/
    ├── editor-header.tsx   # 상단바 (문서명, 상태, 저장/PDF 버튼)
    ├── input-panel.tsx     # 좌측 입력 패널
    ├── section-card.tsx    # 섹션별 아코디언 + 필드 렌더링
    └── preview-panel.tsx   # 우측 A4 미리보기
```

## 상태관리 (Zustand)

### Store 구조
```ts
interface DocStore {
  documents: Document[]
  currentDocId: string | null
  
  // Actions
  createDocument(templateId: string): string  // 새 문서 생성, id 반환
  updateField(docId: string, fieldId: string, value: string): void
  setStatus(docId: string, status: 'draft' | 'reviewed' | 'confirmed'): void
  deleteDocument(docId: string): void
}
```

### 사용법
```ts
import { useDocStore } from '@/lib/store'

// 컴포넌트에서
const { documents, createDocument, updateField } = useDocStore()
```

## 데이터 흐름
1. 대시보드에서 템플릿 클릭 → `createDocument(templateId)` 호출
2. 새 Document 생성 (status: 'draft') → `currentDocId` 설정
3. `/editor`로 이동 → `currentDocId`로 문서 로드
4. 필드 입력 → `updateField()` 실시간 저장
5. 미리보기: `template.documentContent`의 `{{fieldId}}`를 `values[fieldId]`로 치환

## 템플릿 구조
```ts
Template {
  id: string
  name: string
  sections: Section[]        // 입력 섹션들
  documentContent: string    // "{{fieldId}}" 플레이스홀더 포함 본문
}
```

현재 6개: 사업기획서, 프로젝트제안서, 업무계약서, 회의록, 주간/월간보고서, 견적서

## 미구현 기능 (PRD 참조)
- [ ] AI 검토 API (`/api/review`) - AIReviewResult 타입 정의됨
- [ ] PDF 다운로드 - html2pdf.js 설치됨
- [ ] 파일 업로드 → 템플릿 생성

## 스타일
- Tailwind CSS v4
- 네이비/블루 계열 (globals.css 참조)
- Noto Sans KR / Noto Serif KR 폰트
- shadcn/ui 컴포넌트 (components/ui/)

## 패키지
- zustand: 상태관리
- html2pdf.js: PDF 생성 (미사용)
- sonner: 토스트 알림
