/**
 * @jest-environment node
 *
 * Integration tests for /api/documents and /api/documents/[id] routes.
 *
 * We import the route handlers directly and invoke them with mock NextRequest
 * objects to validate request parsing, response shape, and status codes.
 */

import { NextRequest } from 'next/server'

// Helper: build a NextRequest with optional JSON body
function makeRequest(method: string, url: string, body?: unknown): NextRequest {
  const init: { method: string; body?: string; headers?: Record<string, string> } = { method }
  if (body !== undefined) {
    init.body = JSON.stringify(body)
    init.headers = { 'Content-Type': 'application/json' }
  }
  return new NextRequest(url, init)
}

// ──────────────────────────────────────────────
// /api/documents
// ──────────────────────────────────────────────
describe('GET /api/documents', () => {
  it('returns an empty documents array initially', async () => {
    // Each test file gets its own module scope, so the in-memory Map is fresh.
    const { GET } = await import('@/app/api/documents/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.documents)).toBe(true)
  })
})

describe('POST /api/documents', () => {
  it('creates a document and returns 201', async () => {
    const { POST } = await import('@/app/api/documents/route')
    const req = makeRequest('POST', 'http://localhost/api/documents', {
      templateId: 'business-plan',
      templateName: '사업 기획서',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.document).toMatchObject({
      templateId: 'business-plan',
      templateName: '사업 기획서',
      status: 'draft',
      values: {},
    })
    expect(typeof data.document.id).toBe('string')
  })

  it('returns 400 when templateId is missing', async () => {
    const { POST } = await import('@/app/api/documents/route')
    const req = makeRequest('POST', 'http://localhost/api/documents', {
      templateName: '사업 기획서',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })

  it('returns 400 when templateName is missing', async () => {
    const { POST } = await import('@/app/api/documents/route')
    const req = makeRequest('POST', 'http://localhost/api/documents', {
      templateId: 'business-plan',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

// ──────────────────────────────────────────────
// /api/documents/[id]
// ──────────────────────────────────────────────
describe('GET /api/documents/[id]', () => {
  it('returns 404 for an unknown id', async () => {
    const { GET } = await import('@/app/api/documents/[id]/route')
    const req = makeRequest('GET', 'http://localhost/api/documents/unknown-id')
    const res = await GET(req, { params: Promise.resolve({ id: 'unknown-id' }) })
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/documents/[id]', () => {
  it('returns 404 for an unknown id', async () => {
    const { PUT } = await import('@/app/api/documents/[id]/route')
    const req = makeRequest('PUT', 'http://localhost/api/documents/no-such-id', {
      values: { company_name: '테스트' },
    })
    const res = await PUT(req, { params: Promise.resolve({ id: 'no-such-id' }) })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/documents/[id]', () => {
  it('returns 404 for an unknown id', async () => {
    const { DELETE } = await import('@/app/api/documents/[id]/route')
    const req = makeRequest('DELETE', 'http://localhost/api/documents/no-such-id')
    const res = await DELETE(req, { params: Promise.resolve({ id: 'no-such-id' }) })
    expect(res.status).toBe(404)
  })
})
