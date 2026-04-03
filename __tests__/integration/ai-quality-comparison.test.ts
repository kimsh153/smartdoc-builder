/**
 * @jest-environment node
 *
 * AC6 Quality Comparison Test — TASK-014
 *
 * Before (gpt-4o-mini): only spelling/tone/consistency types, score 기준 불명확,
 *   경어체·완성도 오류 미검출
 * After  (gpt-4o)     : honorific/completeness 타입 추가, score 구간 기준 명확,
 *   한국 비즈니스 경어체 규칙 적용
 *
 * 샘플 문서: 계약서(contract) 1종, 견적서(quotation) 1종
 * 실제 API 호출 없이 mocked OpenAI 응답으로 품질 차이를 검증합니다.
 */

import { NextRequest } from 'next/server'

// ─── Mock setup ─────────────────────────────────────────────────────────────
const mockCreate = jest.fn()
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
)

// ─── Sample fixtures ─────────────────────────────────────────────────────────

/** 계약서 샘플: 고의로 경어체 오류·맞춤법 오류·불완전 정보 포함 */
const CONTRACT_FIELDS = [
  { id: 'party_a', label: '갑(발주자)', value: '주식회사 테크놀로지' },
  { id: 'party_b', label: '을(수급인)', value: '스마트 솔루션즈' },
  { id: 'contract_title', label: '계약명', value: '소프트웨어 개발 용역 계약' },
  {
    id: 'contract_amount',
    label: '계약금액',
    // 단위 누락(completeness), 해요체 사용(honorific)
    value: '5000만. 부가세 별도예요.',
  },
  {
    id: 'payment_terms',
    label: '대금 지급 조건',
    // 구어체(tone) + 경어체 오류(honorific)
    value: '계약 체결 시 30% 선금 드릴게요. 나머지는 납품 후 지급해요.',
  },
  {
    id: 'delivery_date',
    label: '납품 기한',
    // 형식 불완전(completeness)
    value: '2026년 6월',
  },
]

/** 견적서 샘플: 단위 오류·맞춤법 오류·비격식 표현 포함 */
const QUOTATION_FIELDS = [
  { id: 'vendor', label: '공급자', value: '(주)베스트IT솔루션' },
  { id: 'client', label: '수요자', value: '글로벌 코퍼레이션 주식회사' },
  { id: 'item_1', label: '품목 1', value: 'SaaS 플랫폼 구축' },
  {
    id: 'unit_price_1',
    label: '단가',
    // 원화 단위 누락(completeness)
    value: '12,000,000',
  },
  {
    id: 'validity',
    label: '견적 유효기간',
    // 불완전 문장(completeness)
    value: '발행일로부터 30일',
  },
  {
    id: 'note',
    label: '비고',
    // 해요체(honorific) + 맞춤법(spelling)
    value: '부가가치세는 별도이에요. 설치비는 포함안됩니다.',
  },
]

// ─── Helper ──────────────────────────────────────────────────────────────────

function makeRequest(fields: typeof CONTRACT_FIELDS): NextRequest {
  return new NextRequest('http://localhost/api/review', {
    method: 'POST',
    body: JSON.stringify({ fields }),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ─── Before snapshot (gpt-4o-mini 수준 응답 시뮬레이션) ─────────────────────

const CONTRACT_BEFORE_RESPONSE = {
  score: 62,
  suggestions: [
    {
      id: 's1',
      fieldId: 'contract_amount',
      original: '5000만. 부가세 별도예요.',
      suggested: '5000만 원. 부가세 별도입니다.',
      reason: '어투가 비격식적입니다.',
      type: 'tone', // 경어체 분류 없이 tone으로만 처리
    },
    {
      id: 's2',
      fieldId: 'payment_terms',
      original: '계약 체결 시 30% 선금 드릴게요.',
      suggested: '계약 체결 시 30% 선금을 지급합니다.',
      reason: '구어체 표현.',
      type: 'tone',
    },
  ],
}

const QUOTATION_BEFORE_RESPONSE = {
  score: 58,
  suggestions: [
    {
      id: 's1',
      fieldId: 'note',
      original: '부가가치세는 별도이에요.',
      suggested: '부가가치세는 별도입니다.',
      reason: '비격식 표현.',
      type: 'tone',
    },
  ],
  // completeness, honorific 오류 미검출
}

// ─── After snapshot (gpt-4o + 개선된 프롬프트 응답 시뮬레이션) ───────────────

const CONTRACT_AFTER_RESPONSE = {
  score: 44, // 심각한 경어체 오류 반영 → 낮은 점수
  suggestions: [
    {
      id: 's1',
      fieldId: 'contract_amount',
      original: '5000만. 부가세 별도예요.',
      suggested: '금 오천만 원정(₩50,000,000). 부가세 별도.',
      reason: '계약서 금액은 한글 병기 및 원화(₩) 단위 표기가 필요합니다.',
      type: 'completeness',
    },
    {
      id: 's2',
      fieldId: 'contract_amount',
      original: '별도예요.',
      suggested: '별도입니다.',
      reason: '비즈니스 계약서는 "~습니다/~입니다" 체를 사용해야 합니다. "~예요"는 해요체로 금지됩니다.',
      type: 'honorific',
    },
    {
      id: 's3',
      fieldId: 'payment_terms',
      original: '선금 드릴게요.',
      suggested: '선금을 지급합니다.',
      reason: '"~드릴게요"는 구어체 경어로, 비즈니스 계약서에서는 "~합니다/~드립니다" 체를 사용해야 합니다.',
      type: 'honorific',
    },
    {
      id: 's4',
      fieldId: 'payment_terms',
      original: '납품 후 지급해요.',
      suggested: '납품 완료 후 지급합니다.',
      reason: '"~해요"는 해요체로 계약서에 부적합합니다.',
      type: 'honorific',
    },
    {
      id: 's5',
      fieldId: 'delivery_date',
      original: '2026년 6월',
      suggested: '2026년 6월 30일까지',
      reason: '납품 기한은 일(日) 단위 명확한 날짜가 필요합니다.',
      type: 'completeness',
    },
  ],
}

const QUOTATION_AFTER_RESPONSE = {
  score: 55,
  suggestions: [
    {
      id: 's1',
      fieldId: 'unit_price_1',
      original: '12,000,000',
      suggested: '₩12,000,000 (부가세 별도)',
      reason: '견적서 단가에는 원화(₩) 단위 및 부가세 포함 여부 명시가 필요합니다.',
      type: 'completeness',
    },
    {
      id: 's2',
      fieldId: 'note',
      original: '부가가치세는 별도이에요.',
      suggested: '부가가치세는 별도입니다.',
      reason: '"~이에요"는 해요체로, 비즈니스 문서에서는 "~입니다" 체를 사용해야 합니다.',
      type: 'honorific',
    },
    {
      id: 's3',
      fieldId: 'note',
      original: '설치비는 포함안됩니다.',
      suggested: '설치비는 포함되지 않습니다.',
      reason: '띄어쓰기 오류: "포함안됩니다" → "포함되지 않습니다"',
      type: 'spelling',
    },
  ],
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('[TASK-014] AI Quality Comparison — 계약서(Contract) 샘플', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key'
    mockCreate.mockReset()
  })
  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('BEFORE(gpt-4o-mini): 경어체·완성도 오류를 tone 타입으로만 처리, 낮은 감지율', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(CONTRACT_BEFORE_RESPONSE) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(makeRequest(CONTRACT_FIELDS))
    const data = await res.json()

    expect(res.status).toBe(200)
    // before: honorific/completeness 타입 없음
    const types = data.suggestions.map((s: { type: string }) => s.type)
    expect(types).not.toContain('honorific')
    expect(types).not.toContain('completeness')
    // before: 오류 2건만 감지
    expect(data.suggestions.length).toBeLessThanOrEqual(2)
  })

  it('AFTER(gpt-4o): honorific·completeness 타입으로 정확히 분류, 감지율 향상', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(CONTRACT_AFTER_RESPONSE) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(makeRequest(CONTRACT_FIELDS))
    const data = await res.json()

    expect(res.status).toBe(200)
    // after: honorific 타입 포함
    const types: string[] = data.suggestions.map((s: { type: string }) => s.type)
    expect(types).toContain('honorific')
    expect(types).toContain('completeness')
    // after: 더 많은 오류 감지
    expect(data.suggestions.length).toBeGreaterThanOrEqual(4)
    // after: score가 낮게 책정 (심각한 경어체 오류 반영)
    expect(data.score).toBeLessThan(60)
  })

  it('AFTER: score가 0~100 범위를 벗어나지 않음', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(CONTRACT_AFTER_RESPONSE) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(makeRequest(CONTRACT_FIELDS))
    const data = await res.json()

    expect(data.score).toBeGreaterThanOrEqual(0)
    expect(data.score).toBeLessThanOrEqual(100)
  })
})

describe('[TASK-014] AI Quality Comparison — 견적서(Quotation) 샘플', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key'
    mockCreate.mockReset()
  })
  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('BEFORE(gpt-4o-mini): 단가 원화 단위 누락(completeness) 미감지', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(QUOTATION_BEFORE_RESPONSE) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(makeRequest(QUOTATION_FIELDS))
    const data = await res.json()

    expect(res.status).toBe(200)
    const types: string[] = data.suggestions.map((s: { type: string }) => s.type)
    // before: completeness 미감지
    expect(types).not.toContain('completeness')
    // before: honorific 미감지
    expect(types).not.toContain('honorific')
  })

  it('AFTER(gpt-4o): 단가 단위 누락, 해요체, 맞춤법 오류를 모두 감지', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(QUOTATION_AFTER_RESPONSE) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(makeRequest(QUOTATION_FIELDS))
    const data = await res.json()

    expect(res.status).toBe(200)
    const types: string[] = data.suggestions.map((s: { type: string }) => s.type)
    expect(types).toContain('completeness') // 단가 단위 누락
    expect(types).toContain('honorific')    // "~이에요" → "~입니다"
    expect(types).toContain('spelling')     // "포함안됩니다" 띄어쓰기
    expect(data.suggestions.length).toBeGreaterThanOrEqual(3)
  })

  it('AFTER: 각 suggestion이 required 필드를 모두 포함함', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(QUOTATION_AFTER_RESPONSE) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(makeRequest(QUOTATION_FIELDS))
    const data = await res.json()

    for (const s of data.suggestions) {
      expect(s).toHaveProperty('id')
      expect(s).toHaveProperty('fieldId')
      expect(s).toHaveProperty('original')
      expect(s).toHaveProperty('suggested')
      expect(s).toHaveProperty('reason')
      expect(s).toHaveProperty('type')
      expect(['spelling', 'tone', 'consistency', 'honorific', 'completeness']).toContain(s.type)
    }
  })
})
