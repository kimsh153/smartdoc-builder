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
- **드래그앤드롭**: @dnd-kit/core + @dnd-kit/sortable (커스텀 필드 재배치)
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
- [TASK-018] 계약서 AI 분석 조항 누락 버그 수정 — TEXT_SYSTEM_PROMPT/HTML_SYSTEM_PROMPT/CONTRACT_HTML_GUIDE에 원문 전체 보존 강제 규칙 추가, JSON_SCHEMA clauseIndex 필드 추가, 조항 수 불일치 경고 로직, max_tokens 확대 (3fcc687)
- [TASK-019] 계약서 당사자 명칭·문구 원문 verbatim 보존 강제 — CONTRACT_HTML_GUIDE 갑/을 하드코딩 제거·동적 플레이스홀더 교체, HTML_SYSTEM_PROMPT/TEXT_SYSTEM_PROMPT verbatim 보존 규칙 추가, JSON_SCHEMA party_a_label/party_b_label 필드 추가, claudeParser PARSE_SYSTEM_PROMPT 당사자 명칭 보존 규칙 추가 (b4f5273)
- [TASK-020] 업로드→파싱→에디터 통합 플로우 완성 — types/document.ts documentType 6종 확장, schemaToTemplate() 변환 브릿지 구현, DynamicForm onSubmit+버튼 추가, /parse Step 3 에디터 이동 CTA 연결, 대시보드 진입점 레이블 명확화 (31be80e)
- [TASK-021] 용역계약서 템플릿 defaultTemplates 반영 — lib/types.ts FieldType에 'tel' 추가, DocumentType에 'service-contract' 추가, section-card.tsx tel 렌더러 추가, lib/용역계약서_template.json → templates.ts 변환 반영 (7섹션 21필드, 16개 조항 documentContent)
- [TASK-022] 스마트문서 템플릿 고도화 (Phase 1/2/3) — TemplateEditor.tsx(MD 직접편집+플레이스홀더 자동완성), DynamicFieldPanel.tsx(동적 필드 추가/삭제/@dnd-kit 재배치), SampleSnippetDrawer.tsx(10종 샘플 조항 삽입), app/editor/page.tsx 3탭(폼입력/MD편집/미리보기)+커스텀 템플릿 저장/불러오기, lib/store.ts customContent·customFields·savedCustomTemplates 슬라이스 추가, lib/types.ts CustomTemplate 타입 추가
- [TASK-023] 템플릿 에디터 고도화 — lib/qa/templateQA.ts(신규, 플레이스홀더·중복ID·페이지예측), QAResultPanel.tsx(신규, 에디터 하단 QA패널+useQAResult훅), TemplateEditor.tsx Undo/Redo 버튼, DynamicFieldPanel.tsx 섹션 접기/펼치기·showIf·number타입, preview-panel.tsx 300ms debounce, app/editor/page.tsx MD탭 QA배지·저장버튼 비활성화(QA fail), CustomTemplate scope/starred/versionTag (787fb2b)
- [TASK-024] A4 페이지 분할 미작동 수정 — preview-panel.tsx repeating-linear-gradient로 297mm 페이지 경계선 시각화(screen only), @media print break-inside:avoid 규칙 추가(doc-article·doc-section·tr·li·doc-signature), editor-header.tsx @page margin:0→10mm 수정, 각 docType별 break-inside 규칙 추가 (a443101) closes #40
- [TASK-026] PDF 다운로드 레이아웃 붕괴 수정 — editor-header.tsx handleDownload() innerHTML→outerHTML 교체(컨테이너 padding·font·line-height 인라인 스타일 보존), 프린트 창 head에 Noto Sans KR Google Fonts 링크 추가, contract @page margin 10mm→0(컨테이너 28mm 패딩이 여백 담당), @media print box-shadow:none!important 추가 closes #42
- [TASK-027] 문서 제목 렌더링·A4 다중 페이지 여백·DOCX/Google Docs 다운로드 — preview-panel.tsx renderContent()에 templateName 인수 추가(첫 줄 ≤60자 → `<h1 class="doc-title">` 자동 래핑, 긴 첫 줄 → 템플릿명 prepend fallback), editor-header.tsx @page margin:0→20mm 22mm 20mm 28mm(2페이지+ 상단 여백 보장)·print 시 container padding:0 오버라이드·다운로드 버튼 DropdownMenu(PDF/DOCX/Google Docs), lib/exporters/toDocx.ts 신규(DOM 파싱→Heading1/2/3/Normal docx 변환·Packer.toBlob 다운로드) closes #43

## 📋 Open Issues
<!-- PM Agent가 생성한 이슈. PM Agent가 업데이트 -->
- [#23](https://github.com/kimsh153/smartdoc-builder/issues/23) [QA] 용역계약서(한국형) 템플릿 E2E 검증 — 입력→미리보기→PDF 올패스
- [#37](https://github.com/kimsh153/smartdoc-builder/issues/37) [TASK-024] 템플릿 미리보기/다운로드 A4 페이징 처리 개선 — 연속/페이지 뷰 토글·경계선·PDF 1:1 일치·표/이미지/widow 분할 규칙
- [#38](https://github.com/kimsh153/smartdoc-builder/issues/38) [BUG] PDF 다운로드 시 A4 페이지 분할 미적용 — `handleDownload()` `@page margin:0` + 페이지브레이크 CSS 부재로 전체 문서 단일 페이지 출력
- [#39](https://github.com/kimsh153/smartdoc-builder/issues/39) [BUG] 미리보기·다운로드 A4 페이지 분할 미작동 — `preview-panel.tsx` 경계선 없음 + `editor-header.tsx` `window.print()` break-inside 미적용
## 🔧 In Progress
<!-- Dev Agent가 작업 중인 이슈. Dev Agent가 업데이트 -->

## ⚠️ QA Failed
<!-- QA FAIL 후 재작업 대기. QA Agent가 업데이트 -->

## 🚫 토큰 절약 규칙 (Claude Agent 필독)

> 이 규칙을 어기면 작업 중단 요청이 올 수 있음.

- **빌드 금지**: `npm run build`, `npx tsc`, `next build` 실행 금지. 코드가 맞으면 빌드 없이 넘어간다.
- **테스트 실행 금지**: `npm test`, `jest` 실행 금지. 테스트 파일 생성도 불필요하면 하지 않는다.
- **파일 전체 읽기 금지**: 1000줄 넘는 파일(예: `preview-panel.tsx`)은 `offset`/`limit`으로 필요한 부분만 읽는다.
- **검증 명령 반복 금지**: 같은 명령을 타임아웃 이유로 여러 번 재시도하지 않는다. 1회 실패 시 다른 방법을 쓴다.
- **불필요한 파일 읽기 금지**: 수정 대상이 아닌 파일은 Grep으로 필요한 부분만 확인한다.
- **수정 확인은 Read로**: 수정 후 검증은 해당 부분만 `Read(offset, limit)`으로 확인한다.

## 📝 주요 결정사항
- 상태관리: Redux 대신 Zustand v5 선택 (가볍고 persist 미들웨어 내장)
- 다중 AI SDK 보유: Claude(Anthropic), Gemini(Google), OpenAI 모두 설치 — 실제 사용 API는 검토 필요
- 문서 파싱: 서버사이드에서만 처리 (mammoth, pdf-parse는 Node.js 전용)
- 템플릿 7종: 사업기획서, 프로젝트제안서, 업무계약서, 회의록, 주간/월간보고서, 견적서, 용역계약서(한국형)
- Tailwind CSS v4 사용 (v3과 설정 방식 다름 — `@tailwindcss/postcss` 플러그인 방식)
- 폰트: Noto Sans KR / Noto Serif KR (한국어 최적화)
