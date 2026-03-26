/**
 * @jest-environment node
 *
 * Integration tests for POST /api/templates/analyze.
 * The endpoint currently returns 501 (not implemented).
 */

import { NextRequest } from 'next/server'

describe('POST /api/templates/analyze', () => {
  it('returns 501 Not Implemented', async () => {
    const { POST } = await import('@/app/api/templates/analyze/route')
    const req = new NextRequest('http://localhost/api/templates/analyze', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'Content-Type': 'application/json' },
    })
    const res = await POST(req)
    expect(res.status).toBe(501)
    const data = await res.json()
    expect(data).toHaveProperty('error')
  })
})
