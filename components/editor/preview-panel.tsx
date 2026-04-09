'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { useDocumentStore } from '@/lib/store'
import { marked } from 'marked'
import { processConditionals } from '@/lib/contractEngine'

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

function renderContent(
  content: string,
  values: Record<string, string>,
  templateName?: string
): string {
  const placeholderRegex = /\{\{(\w+)\}\}/g

  // 1단계: 조건 블록 처리
  const processed = processConditionals(content, values)
  const isHtml = /<[a-zA-Z][\s\S]*>/.test(processed)

  let rendered = processed.replace(placeholderRegex, (_match, fieldId) => {
    const value = values[fieldId]
    if (value) {
      return `<span class="filled-value">${escapeHtml(value)}</span>`
    }
    return '<span class="empty-value">&nbsp;&nbsp;&nbsp;&nbsp;</span>'
  })

  // Heuristic: If there is no HTML and the first line looks like a title, wrap it in h1
  if (!isHtml) {
    const lines = rendered.split('\n')
    const firstNonEmptyIdx = lines.findIndex((l) => l.trim().length > 0)
    if (firstNonEmptyIdx !== -1) {
      const firstLine = lines[firstNonEmptyIdx].trim()
      if (firstLine.length <= 60 && !firstLine.endsWith('.') && !firstLine.endsWith(',') && !firstLine.startsWith('#')) {
        lines[firstNonEmptyIdx] = `<h1 class="doc-title">${firstLine}</h1>`
        rendered = lines.join('\n')
      }
    }
  }

  // Parse markdown to HTML (allows mixing with HTML, converts \n to <br/>)
  rendered = marked.parse(rendered, { async: false, breaks: true }) as string;

  // Ensure there is a document title
  if (!/<h1[\s>]/i.test(rendered) && !rendered.includes('doc-title')) {
    if (templateName) {
      rendered = `<h1 class="doc-title">${escapeHtml(templateName)}</h1>\n${rendered}`
    }
  }

  return rendered
}

// ══════════════════════════════════════════════
// 페이지네이션 래퍼 컴포넌트
// ══════════════════════════════════════════════
function PaginatedView({ content, pageStyle, cssString, containerBg }: { content: string, pageStyle: React.CSSProperties, cssString: string, containerBg: string }) {
  const [pages, setPages] = useState<string[]>([])
  const [isPaginating, setIsPaginating] = useState(true)

  const measureBoardRef = useRef<HTMLDivElement>(null)
  const pageTesterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true;
    setIsPaginating(true);
    
    setTimeout(() => {
      if (!active) return;
      if (!measureBoardRef.current || !pageTesterRef.current) {
        setIsPaginating(false);
        setPages([content]);
        return;
      }

      const nodes = Array.from(measureBoardRef.current.childNodes) as ChildNode[];
      const newPages: string[] = [];
      const tester = pageTesterRef.current;
      
      tester.innerHTML = '';
      
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i].cloneNode(true) as HTMLElement;
        tester.appendChild(node);
        
        if (tester.scrollHeight > tester.clientHeight) {
          tester.removeChild(node);
          
          if (tester.innerHTML.trim() !== '') {
            newPages.push(tester.innerHTML);
            tester.innerHTML = '';
          }
          tester.appendChild(node);
        }
      }
      
      if (tester.innerHTML.trim() !== '') {
        newPages.push(tester.innerHTML);
      }
      
      if (newPages.length === 0) {
         newPages.push(content);
      }
      
      if (active) {
        setPages(newPages);
        setIsPaginating(false);
      }
    }, 100);
    
    return () => { active = false; };
  }, [content]);

  const adjustedCss = cssString.replace(/#document-preview/g, '.document-preview-page') + `
    @media print {
      body { background: #fff !important; }
      .document-preview-page {
        box-shadow: none !important;
        margin: 0 !important;
        page-break-after: always;
      }
      .document-preview-page:last-child {
        page-break-after: auto;
      }
    }
  `;

  return (
    <div style={{ background: containerBg, minHeight: '100%', padding: '32px', display: 'flex', justifyContent: 'center' }}>
      <style>{adjustedCss}</style>

      <div style={{ position: 'absolute', top: -9999, left: -9999, visibility: 'hidden', pointerEvents: 'none' }}>
        <div ref={measureBoardRef} style={pageStyle} dangerouslySetInnerHTML={{ __html: content }} />
        <div ref={pageTesterRef} style={{ ...pageStyle, height: '297mm', overflow: 'hidden' }} />
      </div>

      <div id="document-preview" style={{ display: 'block' }}>
        {isPaginating ? (
          <div style={{ ...pageStyle, height: '297mm', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }} className="document-preview-page">
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#888' }}>
              문서 페이지 분할 처리 중...
            </div>
          </div>
        ) : (
          pages.map((htmlString, idx) => (
            <div 
              key={idx} 
              className="document-preview-page" 
              style={{ 
                ...pageStyle, 
                background: '#fff', 
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                minHeight: '297mm',
                marginBottom: idx === pages.length - 1 ? 0 : '24px'
              }} 
              dangerouslySetInnerHTML={{ __html: htmlString }} 
            />
          ))
        )}
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════
// 계약서 렌더러 — A4 공문서 스타일
// ══════════════════════════════════════════════
function ContractPreview({ content }: { content: string }) {
  const pageStyle: React.CSSProperties = {
    position: 'relative',
    width: '210mm',
    padding: '28mm 22mm 28mm 28mm',
    fontFamily: "'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    fontSize: '10pt',
    lineHeight: '2.0',
    color: '#111',
    zIndex: 1,
  };

  const css = `
          #document-preview .filled-value {
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 3px;
          }
          #document-preview .empty-value {
            display: inline-block;
            min-width: 60px;
            border-bottom: 1px solid #aaa;
            color: #bbb;
          }

          /* 제목 */
          #document-preview .doc-title,
          #document-preview h1 {
            text-align: center;
            font-size: 22pt;
            font-weight: 800;
            letter-spacing: 0.35em;
            margin: 0 0 1.6em 0;
            color: #000;
            line-height: 1.3;
          }

          /* 전문(前文) 도입부 */
          #document-preview .doc-intro,
          #document-preview .doc-meta {
            font-size: 10pt;
            line-height: 2.1;
            color: #111;
            margin: 0 0 1.5em 0;
            text-align: justify;
            word-break: keep-all;
          }

          /* 조항 wrapper */
          #document-preview .doc-section,
          #document-preview .doc-article {
            margin-top: 1.6em;
          }

          /* 조항 제목 (제1조...) */
          #document-preview .doc-section-title,
          #document-preview .doc-article-title,
          #document-preview h2 {
            font-size: 10.5pt;
            font-weight: 700;
            margin: 0 0 0.5em 0;
            color: #000;
            letter-spacing: 0.02em;
          }

          /* 본문 */
          #document-preview .doc-body,
          #document-preview p {
            font-size: 10pt;
            line-height: 2.1;
            margin: 0.3em 0;
            color: #111;
            text-align: justify;
            word-break: keep-all;
          }

          /* 번호 목록 */
          #document-preview .doc-list,
          #document-preview ol {
            font-size: 10pt;
            line-height: 2.1;
            padding-left: 1.8em;
            margin: 0.3em 0;
            color: #111;
            list-style-type: decimal;
          }
          #document-preview ul {
            font-size: 10pt;
            line-height: 2.1;
            padding-left: 1.8em;
            margin: 0.3em 0;
            color: #111;
            list-style-type: disc;
          }
          #document-preview .doc-list li,
          #document-preview li {
            margin: 0.1em 0;
            text-align: justify;
            word-break: keep-all;
            display: list-item;
          }

          /* 표 */
          #document-preview .doc-table,
          #document-preview table {
            width: 100%;
            border-collapse: collapse;
            margin: 0.8em 0;
            font-size: 9.5pt;
          }
          #document-preview .doc-table th,
          #document-preview th {
            background: #f0f0f0;
            font-weight: 700;
            text-align: center;
            padding: 6px 10px;
            border: 1px solid #888;
            white-space: nowrap;
          }
          #document-preview .doc-table td,
          #document-preview td {
            border: 1px solid #888;
            padding: 6px 10px;
            vertical-align: middle;
          }

          /* 서명란 */
          #document-preview .doc-signature {
            margin-top: 4em;
            padding-top: 1.5em;
            border-top: 1px solid #bbb;
          }
          #document-preview .doc-sign-date {
            text-align: center;
            font-size: 10pt;
            margin: 1em 0 2em;
          }
          #document-preview .doc-sign-row {
            display: block;
          }
          #document-preview .doc-sign-box {
            display: block;
            font-size: 10pt;
            line-height: 2.3;
            margin-bottom: 1.5em;
            border: none;
            background: none;
            padding: 0;
          }

          #document-preview strong { font-weight: 700; }
          #document-preview h3 { font-size: 10pt; font-weight: 700; margin: 0.8em 0 0.4em; }

          /* A4 페이지 경계선 (화면 전용) */
          @media screen {
            #document-preview {
              background-image: repeating-linear-gradient(
                to bottom,
                transparent 0,
                transparent calc(297mm - 1px),
                #bbb calc(297mm - 1px),
                #bbb 297mm
              );
            }
          }

          /* 인쇄 시 페이지 분할 규칙 */
          @media print {
            #document-preview .doc-article,
            #document-preview .doc-section,
            #document-preview tr,
            #document-preview li { break-inside: avoid; }
            #document-preview .doc-signature { break-before: avoid; break-inside: avoid; }
            #document-preview table { break-inside: auto; }
          }
  `;

  return <PaginatedView content={content} pageStyle={pageStyle} cssString={css} containerBg="#e8e8e8" />;
}

// ══════════════════════════════════════════════
// 견적서 렌더러 — 엑셀/스프레드시트 스타일
// ══════════════════════════════════════════════
function QuotationPreview({ content }: { content: string }) {
  const pageStyle: React.CSSProperties = {
    position: 'relative',
    width: '210mm',
    padding: '12mm 14mm 16mm',
    fontFamily: "'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
    fontSize: '8.5pt',
    color: '#111',
    zIndex: 1,
  };

  const css = `
          #document-preview .filled-value {
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 2px;
          }
          #document-preview .empty-value {
            display: inline-block;
            min-width: 40px;
            border-bottom: 1px solid #bbb;
          }

          /* ── 헤더: 좌(고객사) + 우(공급자 정보) ── */
          #document-preview .quot-header {
            display: flex;
            border: 1px solid #bbb;
            margin-bottom: 10px;
          }
          #document-preview .quot-client-side {
            flex: 1.3;
            padding: 14px 18px 12px;
            border-right: 1px solid #bbb;
          }
          #document-preview .quot-label-bar {
            font-size: 7pt;
            color: #666;
            margin-bottom: 4px;
          }
          #document-preview .quot-client-name {
            font-size: 20pt;
            font-weight: 900;
            color: #000;
            margin: 0 0 4px 0;
            line-height: 1.2;
          }
          #document-preview .quot-tagline {
            font-size: 8.5pt;
            color: #444;
            margin: 0 0 12px 0;
          }
          #document-preview .quot-meta-row {
            display: flex;
            align-items: baseline;
            font-size: 8pt;
            margin: 2px 0;
            gap: 10px;
          }
          #document-preview .quot-meta-label {
            color: #666;
            white-space: nowrap;
            width: 4.5em;
            flex-shrink: 0;
          }
          #document-preview .quot-meta-value {
            color: #111;
            font-weight: 500;
          }
          #document-preview .quot-company-side {
            flex: 1;
            display: flex;
            flex-direction: column;
          }
          #document-preview .quot-company-header {
            background: #222;
            color: #fff;
            text-align: center;
            font-size: 7pt;
            letter-spacing: 0.05em;
            padding: 4px 0;
          }
          #document-preview .quot-company-table {
            width: 100%;
            border-collapse: collapse;
            flex: 1;
          }
          #document-preview .quot-company-table tr {
            border-bottom: 1px solid #e0e0e0;
          }
          #document-preview .quot-company-table tr:last-child {
            border-bottom: none;
          }
          #document-preview .quot-company-table td:first-child {
            background: #f7f7f7;
            color: #666;
            font-size: 7pt;
            padding: 4px 8px;
            width: 5em;
            white-space: nowrap;
            border-right: 1px solid #e0e0e0;
          }
          #document-preview .quot-company-table td:last-child {
            padding: 4px 8px;
            font-weight: 600;
            font-size: 8pt;
          }

          /* ── 최종 견적가 요약 ── */
          #document-preview .quot-summary {
            border: 1px solid #bbb;
            margin-bottom: 10px;
          }
          #document-preview .quot-summary-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f5f5f5;
            padding: 8px 14px;
            border-bottom: 1px solid #bbb;
          }
          #document-preview .quot-summary-title {
            font-size: 10pt;
            font-weight: 700;
            color: #111;
          }
          #document-preview .quot-summary-amounts {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }
          #document-preview .quot-summary-amount {
            font-size: 15pt;
            font-weight: 900;
            color: #000;
          }
          #document-preview .quot-summary-amount-vat {
            font-size: 10pt;
            font-weight: 600;
            color: #555;
          }
          #document-preview .quot-summary-rows {
            display: flex;
          }
          #document-preview .quot-summary-row {
            flex: 1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 14px;
            border-right: 1px solid #eee;
            font-size: 8pt;
          }
          #document-preview .quot-summary-row:last-child {
            border-right: none;
          }
          #document-preview .quot-row-label { color: #666; }
          #document-preview .quot-row-value { font-weight: 600; }
          #document-preview .quot-row-value.discount { color: #c00; }

          /* ── 결과물/기간/결제 세부 행 ── */
          #document-preview .quot-detail-row {
            display: flex;
            border: 1px solid #bbb;
            border-top: none;
            margin-bottom: 14px;
          }
          #document-preview .quot-detail-cell {
            flex: 1;
            padding: 6px 12px;
            border-right: 1px solid #ddd;
            font-size: 8pt;
          }
          #document-preview .quot-detail-cell:last-child { border-right: none; }
          #document-preview .quot-detail-label {
            font-size: 7pt;
            color: #888;
            margin-bottom: 2px;
            font-weight: 600;
            letter-spacing: 0.03em;
          }
          #document-preview .quot-detail-value {
            font-weight: 600;
            color: #111;
          }

          /* ── 세부 견적 테이블 ── */
          #document-preview .quot-section-title {
            font-size: 10pt;
            font-weight: 700;
            color: #000;
            margin: 10px 0 6px;
          }
          #document-preview .quot-items-table,
          #document-preview table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7.5pt;
            margin-bottom: 12px;
          }
          #document-preview .quot-items-table th,
          #document-preview th {
            background: #333;
            color: #fff;
            padding: 5px 6px;
            text-align: center;
            font-weight: 600;
            border: 1px solid #555;
            white-space: nowrap;
          }
          #document-preview .quot-items-table td,
          #document-preview td {
            padding: 4px 6px;
            border: 1px solid #ddd;
            vertical-align: middle;
            color: #111;
          }
          #document-preview .quot-category-row td {
            background: #f0f0f0 !important;
            font-weight: 700;
            font-size: 8pt;
            color: #000;
          }
          #document-preview .quot-subtotal-row td {
            background: #fafafa;
            font-weight: 700;
            text-align: right;
            color: #111;
          }
          #document-preview .quot-total-row td {
            background: #e8e8e8;
            font-weight: 800;
            font-size: 8.5pt;
          }
          #document-preview .num { text-align: right; font-variant-numeric: tabular-nums; }
          #document-preview .center { text-align: center; }

          /* ── 기타/주의사항 ── */
          #document-preview .quot-notes,
          #document-preview .doc-section {
            border: 1px solid #ddd;
            padding: 10px 14px;
            font-size: 8pt;
            line-height: 1.7;
            color: #333;
            margin-top: 10px;
          }
          #document-preview .quot-notes-title {
            font-weight: 700;
            font-size: 8.5pt;
            color: #111;
            margin-bottom: 6px;
          }
          #document-preview .quot-notes ol,
          #document-preview ol {
            padding-left: 1.4em;
            margin: 0;
            list-style-type: decimal;
          }
          #document-preview .quot-notes li,
          #document-preview li { margin: 2px 0; display: list-item; }

          /* ── 푸터 ── */
          #document-preview .quot-footer {
            margin-top: 10px;
            text-align: right;
            font-size: 7pt;
            color: #aaa;
          }

          /* fallback */
          #document-preview h1 { font-size: 20pt; font-weight: 900; margin: 0 0 4px; }
          #document-preview h2 { font-size: 10pt; font-weight: 700; margin: 10px 0 6px; }
          #document-preview p { font-size: 8.5pt; line-height: 1.6; margin: 2px 0; }
          #document-preview strong { font-weight: 700; }
          #document-preview ul { padding-left: 1.4em; margin: 0; list-style-type: disc; }

          /* A4 페이지 경계선 (화면 전용) */
          @media screen {
            #document-preview {
              background-image: repeating-linear-gradient(
                to bottom,
                transparent 0,
                transparent calc(297mm - 1px),
                #bbb calc(297mm - 1px),
                #bbb 297mm
              );
            }
          }

          /* 인쇄 시 페이지 분할 규칙 */
          @media print {
            #document-preview tr,
            #document-preview li { break-inside: avoid; }
            #document-preview table { break-inside: auto; }
          }
  `;

  return <PaginatedView content={content} pageStyle={pageStyle} cssString={css} containerBg="#d0d0d0" />;
}

// ══════════════════════════════════════════════
// 제안서 렌더러 — 프레젠테이션/슬라이드 스타일
// ══════════════════════════════════════════════
function ProposalPreview({ content }: { content: string }) {
  return (
    <div style={{ background: '#c8c8c8', minHeight: '100%', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      <div
        id="document-preview"
        style={{
          width: '100%',
          maxWidth: '960px',
          fontFamily: "'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif",
        }}
      >
        <style>{`
          #document-preview .filled-value {
            font-weight: 700;
            text-decoration: underline;
            text-underline-offset: 3px;
          }
          #document-preview .empty-value {
            display: inline-block;
            min-width: 60px;
            border-bottom: 1px solid rgba(255,255,255,0.5);
          }

          /* ── 커버 슬라이드 ── */
          #document-preview .prop-cover {
            background: linear-gradient(145deg, #1458C8 0%, #0c3a8a 100%);
            color: #fff;
            padding: 0;
            min-height: 540px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            position: relative;
            margin-bottom: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.2);
            overflow: hidden;
          }
          #document-preview .prop-cover::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 10px;
            background: #FFD600;
          }
          #document-preview .prop-cover-inner {
            padding: 80px 80px 100px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }
          #document-preview .prop-cover-logo {
            font-size: 52pt;
            font-weight: 900;
            color: #fff;
            letter-spacing: -0.03em;
            margin: 0;
            line-height: 1;
          }
          #document-preview .prop-cover-title {
            font-size: 22pt;
            font-weight: 700;
            color: #fff;
            margin: 0;
            line-height: 1.3;
          }
          #document-preview .prop-cover-subtitle {
            font-size: 11pt;
            color: rgba(255,255,255,0.75);
            margin: 0;
          }
          #document-preview .prop-cover-footer {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            border-top: 1px solid rgba(255,255,255,0.25);
            padding: 12px 60px;
            display: flex;
            justify-content: space-between;
            font-size: 8.5pt;
            color: rgba(255,255,255,0.6);
          }

          /* ── 일반 슬라이드 ── */
          #document-preview .prop-slide {
            background: #fff;
            padding: 40px 50px 56px;
            min-height: 380px;
            margin-bottom: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            position: relative;
            overflow: hidden;
          }
          #document-preview .prop-slide::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 8px;
            background: #FFD600;
          }
          #document-preview .prop-slide-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #1458C8;
            padding-bottom: 12px;
            margin-bottom: 24px;
          }
          #document-preview .prop-slide-title {
            font-size: 15pt;
            font-weight: 800;
            color: #111;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          #document-preview .prop-slide-title::before {
            content: '';
            display: inline-block;
            width: 5px;
            height: 1em;
            background: #1458C8;
            border-radius: 2px;
            flex-shrink: 0;
          }
          #document-preview .prop-logo {
            font-size: 13pt;
            font-weight: 900;
            color: #1458C8;
            letter-spacing: -0.02em;
          }
          #document-preview .prop-slide-footer {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            border-top: 2.5px solid #1458C8;
            padding: 8px 50px;
            display: flex;
            justify-content: space-between;
            font-size: 8pt;
            color: #aaa;
            background: #fff;
          }

          /* ── 슬라이드 내 콘텐츠 ── */
          #document-preview .prop-body,
          #document-preview .doc-body {
            font-size: 10pt;
            line-height: 1.85;
            color: #333;
          }
          #document-preview .prop-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          #document-preview .prop-info-table,
          #document-preview table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10pt;
          }
          #document-preview .prop-info-table tr,
          #document-preview tr {
            border-bottom: 1px solid #eee;
          }
          #document-preview .prop-info-table td:first-child {
            font-weight: 700;
            color: #222;
            padding: 11px 0;
            width: 6em;
            vertical-align: top;
          }
          #document-preview .prop-info-table td:last-child {
            padding: 11px 0;
            color: #444;
          }
          #document-preview th {
            background: #1458C8;
            color: #fff;
            padding: 8px 12px;
            font-weight: 600;
          }
          #document-preview td {
            border: 1px solid #e0e0e0;
            padding: 8px 12px;
            vertical-align: middle;
          }
          #document-preview .prop-highlight {
            font-size: 24pt;
            font-weight: 900;
            color: #111;
            margin: 0 0 6px;
            line-height: 1.25;
          }
          #document-preview .prop-highlight-sub {
            font-size: 13pt;
            font-weight: 700;
            color: #1458C8;
            margin: 0 0 20px;
          }
          #document-preview .prop-service-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 8px;
          }
          #document-preview .prop-service-item {
            border: 1.5px solid #e0e0e0;
            border-radius: 4px;
            padding: 8px 12px;
            font-size: 9pt;
            color: #333;
            text-align: center;
          }
          #document-preview .prop-service-category-title {
            font-size: 12pt;
            font-weight: 800;
            color: #111;
            margin: 14px 0 6px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          /* doc-section → 슬라이드로 */
          #document-preview .doc-section {
            background: #fff;
            padding: 40px 50px 56px;
            min-height: 280px;
            margin-bottom: 16px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.12);
            position: relative;
            overflow: hidden;
          }
          #document-preview .doc-section::before {
            content: '';
            position: absolute;
            left: 0; top: 0; bottom: 0;
            width: 8px;
            background: #FFD600;
          }
          #document-preview .doc-section-title {
            font-size: 15pt;
            font-weight: 800;
            color: #111;
            border-bottom: 2.5px solid #1458C8;
            padding-bottom: 12px;
            margin: 0 0 24px 0;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          #document-preview .doc-section-title::before {
            content: '';
            display: inline-block;
            width: 5px;
            height: 0.9em;
            background: #1458C8;
            border-radius: 2px;
            flex-shrink: 0;
          }
          #document-preview .doc-list {
            line-height: 1.9;
            padding-left: 1.5em;
            font-size: 10pt;
            color: #333;
          }

          /* 커버에서 doc-title */
          #document-preview .doc-title {
            font-size: 22pt;
            font-weight: 700;
            color: #fff;
            text-align: center;
            margin: 0;
          }

          /* fallback */
          #document-preview h1 { font-size: 36pt; font-weight: 900; color: #fff; text-align: center; margin: 0 0 12px; }
          #document-preview h2 { font-size: 15pt; font-weight: 800; color: #111; border-bottom: 2.5px solid #1458C8; padding-bottom: 10px; margin: 0 0 20px; }
          #document-preview h3 { font-size: 12pt; font-weight: 700; color: #1458C8; margin: 12px 0 6px; }
          #document-preview p { font-size: 10pt; line-height: 1.85; color: #333; margin: 6px 0; }
          #document-preview ul { padding-left: 1.5em; list-style-type: disc; }
          #document-preview ol { padding-left: 1.5em; list-style-type: decimal; }
          #document-preview li { line-height: 1.9; font-size: 10pt; color: #333; display: list-item; }
          #document-preview strong { font-weight: 700; }

          /* 인쇄 시 슬라이드 단위 페이지 분할 */
          @media print {
            #document-preview .prop-cover,
            #document-preview .prop-slide,
            #document-preview .doc-section { break-inside: avoid; page-break-inside: avoid; }
            #document-preview tr,
            #document-preview li { break-inside: avoid; }
            #document-preview table { break-inside: auto; }
          }
        `}</style>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════
// 메인 컴포넌트
// ══════════════════════════════════════════════
export function PreviewPanel() {
  const { selectedTemplate, customContent, customTitle, values } = useDocumentStore()

  // Debounce customContent changes by ≤ 300ms so MD editor typing doesn't thrash the preview
  const [debouncedContent, setDebouncedContent] = useState(customContent)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedContent(customContent), 300)
    return () => clearTimeout(timer)
  }, [customContent])

  const renderedContent = useMemo(() => {
    if (!selectedTemplate) return ''
    const content = debouncedContent ?? selectedTemplate.documentContent
    const docName = customTitle ?? selectedTemplate.name
    return renderContent(content, values, docName)
  }, [selectedTemplate, debouncedContent, customTitle, values])

  if (!selectedTemplate) return null

  const docType = selectedTemplate.documentType ?? 'contract'

  if (docType === 'quotation') return <QuotationPreview content={renderedContent} />
  if (docType === 'proposal') return <ProposalPreview content={renderedContent} />
  return <ContractPreview content={renderedContent} />
}
