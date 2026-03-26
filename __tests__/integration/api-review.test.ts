/**
 * @jest-environment node
 *
 * Integration tests for POST /api/review.
 *
 * The route instantiates the OpenAI client at module level, so we mock the
 * `openai` package for the entire test file to avoid real API calls (and to
 * prevent the "Missing credentials" constructor error during validation tests).
 */

import { NextRequest } from 'next/server'

// Mock the openai package before any imports that might load the route module
const mockCreate = jest.fn()
jest.mock('openai', () =>
  jest.fn().mockImplementation(() => ({
    chat: { completions: { create: mockCreate } },
  }))
)

function makeRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/review', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

// ──────────────────────────────────────────────
// Validation tests
// ──────────────────────────────────────────────
describe('POST /api/review — validation', () => {
  it('returns 400 when fields array is empty', async () => {
    const { POST } = await import('@/app/api/review/route')
    const res = await POST(makeRequest({ fields: [] }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when fields property is missing', async () => {
    const { POST } = await import('@/app/api/review/route')
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  it('returns 500 when OPENAI_API_KEY is not set', async () => {
    const savedKey = process.env.OPENAI_API_KEY
    delete process.env.OPENAI_API_KEY

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(
      makeRequest({ fields: [{ id: 'f1', label: '회사명', value: 'Acme' }] })
    )
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('OPENAI_API_KEY')

    if (savedKey) process.env.OPENAI_API_KEY = savedKey
  })
})

// ──────────────────────────────────────────────
// Happy-path tests
// ──────────────────────────────────────────────
describe('POST /api/review — with mocked OpenAI', () => {
  beforeEach(() => {
    process.env.OPENAI_API_KEY = 'test-key'
    mockCreate.mockReset()
  })

  afterEach(() => {
    delete process.env.OPENAI_API_KEY
  })

  it('returns score and suggestions from AI response', async () => {
    const aiPayload = {
      score: 88,
      suggestions: [
        {
          id: 's1',
          fieldId: 'company_name',
          original: '주식회사acme',
          suggested: '주식회사 Acme',
          reason: '띄어쓰기 오류',
          type: 'spelling',
        },
      ],
    }
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify(aiPayload) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(
      makeRequest({ fields: [{ id: 'company_name', label: '회사명', value: '주식회사acme' }] })
    )

    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.score).toBe(88)
    expect(data.suggestions).toHaveLength(1)
    expect(data.suggestions[0].type).toBe('spelling')
  })

  it('clamps score to 0–100 range', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ score: 150, suggestions: [] }) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(
      makeRequest({ fields: [{ id: 'f1', label: 'Label', value: 'value' }] })
    )
    const data = await res.json()
    expect(data.score).toBeLessThanOrEqual(100)
  })

  it('returns empty suggestions array when AI sends none', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ score: 95, suggestions: [] }) } }],
    })

    const { POST } = await import('@/app/api/review/route')
    const res = await POST(
      makeRequest({ fields: [{ id: 'f1', label: 'Label', value: 'value' }] })
    )
    const data = await res.json()
    expect(Array.isArray(data.suggestions)).toBe(true)
    expect(data.suggestions).toHaveLength(0)
  })
})
