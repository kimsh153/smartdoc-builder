# CLAUDE.md — SmartDoc Builder

> PM/Dev/QA Agent 공유 메모리. 각 에이전트가 작업 후 해당 섹션 업데이트.

## 🏗️ 프로젝트 개요
- **레포**: kimsh153/smartdoc-builder
- **로컬 경로**: /Users/sunghun/Desktop/work/ai/business-document/smartdoc-builder
- **생성일**: 2026-04-03
- **목적**: AI 기반 비즈니스 문서 자동화 앱. 템플릿 선택 → 필드 입력 → A4 미리보기 → PDF 다운로드. 파일 업로드(DOCX/PDF/Excel)로 AI가 템플릿 자동 분석 및 생성 지원.

## 🛠️ 기술 스택
- **Frontend**: Next.js 16.2 (App Router), React 19, TypeScript 5.7, Tailwind CSS v4
- **UI 컴포넌트**: shadcn/ui (Radix UI 기반), lucide-react 아이콘
- **상태관리**: Zustand v5 (localStorage persist)
- **Backend**: Next.js Route Handlers (app/api/)
- **AI**: @anthropic-ai/sdk (Claude), @google/genai (Gemini), openai
- **문서 파싱**: mammoth (DOCX), pdf-parse (PDF), xlsx (Excel)
- **PDF 생성**: html2pdf.js, docx
- **폼**: react-hook-form + zod
- **알림**: sonner (토스트)
- **패키지 매니저**: npm
- **테스트**: Jest + @testing-library/react

## 📐 코딩 컨벤션
- **네이밍**: 컴포넌트 PascalCase, 함수/변수 camelCase, 파일 kebab-case
- **폴더 구조**:
  ```
  app/                    # Next.js App Router 페이지
  ├── api/                # Route Handlers (서버)
  │   ├── documents/      # 문서 CRUD API
  │   ├── parse/          # 파일 파싱 API
  │   ├── review/         # AI 검토 API
  │   └── templates/analyze/  # 템플릿 AI 분석 API
  ├── editor/             # 에디터 페이지
  ├── parse/              # 파싱 결과 페이지
  └── upload/             # 파일 업로드 페이지
  components/
  ├── ui/                 # shadcn/ui 기본 컴포넌트
  ├── editor/             # 에디터 전용 컴포넌트
  ├── DynamicForm.tsx     # 동적 폼 렌더러
  └── UploadZone.tsx      # 파일 업로드 드래그앤드롭
  lib/
  ├── types.ts            # 전역 타입 정의
  ├── templates.ts        # 6개 템플릿 데이터
  ├── stores/             # Zustand 스토어
  │   └── templateStore.ts
  └── parsers/            # 파일 파싱 유틸
      ├── extractText.ts
      └── claudeParser.ts
  types/
  └── document.ts         # 추가 문서 타입
  ```
- **주요 패턴**:
  - 서버 컴포넌트 기본, 클라이언트 필요시 `"use client"` 명시
  - Zustand store는 `lib/stores/`에 위치
  - API Route는 `app/api/` 하위에 `route.ts`로 작성
  - 미리보기: `documentContent`의 `{{fieldId}}` 플레이스홀더를 입력값으로 치환
  - 스타일: Tailwind 유틸리티 클래스 + `cn()` 헬퍼 (clsx + tailwind-merge)

## 📊 핵심 데이터 구조

```ts
// lib/types.ts
Template { id, name, description, icon, documentType?, sections[], documentContent }
Section  { id, title, fields[] }
Field    { id, label, type: FieldType, placeholder?, options?, required?, guide? }
Document { id, templateId, templateName, values, status, createdAt, updatedAt }
AIReviewResult { score, suggestions: AIReviewSuggestion[] }
```

## ✅ Implemented Features
<!-- QA PASS된 기능. QA Agent가 업데이트 -->
- [TASK-005] 백엔드 API 엔드포인트 구성 (documents CRUD, review, templates/analyze)
- [TASK-006] AI 맞춤법 검사 API 통합 (`/api/review`)
- [TASK-008] 문서 편집 인터페이스 (에디터 좌우 분할 레이아웃, 실시간 미리보기)
- [TASK-009] 에디터 AI 맞춤법 검사 연동 (review-dialog 컴포넌트)
- [TASK-011] PDF 다운로드 기능 (html2pdf.js 기반)
- [TASK-012] 단위/통합 테스트 작성 (Jest + Testing Library)
- [TASK-013] 코드 리뷰, 리팩토링, 문서화 완료
- [TASK-014] AI 품질 개선 — gpt-4o 업그레이드 및 프롬프트 최적화 (templates/analyze, review, claudeParser)
  - 토큰 비용 참고: gpt-4o-mini 대비 gpt-4o는 입력 ~15배, 출력 ~15배 비용 증가. 복잡한 문서 분석 기준 요청당 약 $0.01~0.05 예상.
- [TASK-016] 문서 파싱·리뷰 AI 품질 개선 — claudeParser PARSE_SYSTEM_PROMPT 재작성 (documentType 6종 확장, confidence 임계값 명시, fixedStructure 동적 추출)
- [TASK-017] 문서 파싱 AI 품질 불량 진단 및 개선 완료 (#16과 동일 변경, 63a79c8)

## 📋 Open Issues
<!-- PM Agent가 생성한 이슈. PM Agent가 업데이트 -->
- 파일 업로드 → 템플릿 자동 생성 기능 (app/upload/, app/parse/ 페이지 존재하나 완성도 미확인)
- DynamicForm.tsx, UploadZone.tsx 통합 완성도 확인 필요
- [#15](https://github.com/kimsh153/smartdoc-builder/issues/15) 문서 읽기(parse) AI 품질 개선 — claudeParser 프롬프트 강화 및 모델 업그레이드

## 🔧 In Progress
<!-- Dev Agent가 작업 중인 이슈. Dev Agent가 업데이트 -->

## ⚠️ QA Failed
<!-- QA FAIL 후 재작업 대기. QA Agent가 업데이트 -->

## 📝 주요 결정사항
- 상태관리: Redux 대신 Zustand v5 선택 (가볍고 persist 미들웨어 내장)
- 다중 AI SDK 보유: Claude(Anthropic), Gemini(Google), OpenAI 모두 설치 — 실제 사용 API는 검토 필요
- 문서 파싱: 서버사이드에서만 처리 (mammoth, pdf-parse는 Node.js 전용)
- 템플릿 6종: 사업기획서, 프로젝트제안서, 업무계약서, 회의록, 주간/월간보고서, 견적서
- Tailwind CSS v4 사용 (v3과 설정 방식 다름 — `@tailwindcss/postcss` 플러그인 방식)
- 폰트: Noto Sans KR / Noto Serif KR (한국어 최적화)
