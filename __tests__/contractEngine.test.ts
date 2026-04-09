import { processConditionals } from '@/lib/contractEngine'

const template = `
제 8 조(계약기간)
{{#if contract_type == "project_based"}}
프로젝트 완료 기준으로 한다.
{{#else}}
기간제: 시작일부터 종료일까지.
{{/if}}

{{#if has_nda == "yes"}}
제 10 조(비밀준수)
비밀유지 조항 내용.
{{/if}}

{{#if dispute_resolution == "arbitration"}}
제 15 조(중재)
중재로 해결한다.
{{#else}}
제 15 조(관할법원)
법원으로 해결한다.
{{/if}}
`

describe('processConditionals', () => {
  it('project_based + no NDA + court', () => {
    const result = processConditionals(template, {
      contract_type: 'project_based',
      has_nda: 'no',
      dispute_resolution: 'court',
    })
    expect(result).toContain('프로젝트 완료 기준으로 한다.')
    expect(result).not.toContain('기간제: 시작일부터 종료일까지.')
    expect(result).not.toContain('제 10 조(비밀준수)')
    expect(result).toContain('제 15 조(관할법원)')
    expect(result).not.toContain('제 15 조(중재)')
  })

  it('fixed_term + NDA + arbitration', () => {
    const result = processConditionals(template, {
      contract_type: 'fixed_term',
      has_nda: 'yes',
      dispute_resolution: 'arbitration',
    })
    expect(result).toContain('기간제: 시작일부터 종료일까지.')
    expect(result).not.toContain('프로젝트 완료 기준으로 한다.')
    expect(result).toContain('제 10 조(비밀준수)')
    expect(result).toContain('제 15 조(중재)')
    expect(result).not.toContain('제 15 조(관할법원)')
  })

  it('no answer (empty values) → else branches rendered', () => {
    const result = processConditionals(template, {})
    expect(result).toContain('기간제: 시작일부터 종료일까지.')
    expect(result).not.toContain('제 10 조(비밀준수)')
    expect(result).toContain('제 15 조(관할법원)')
  })

  it('ip_ownership elif', () => {
    const content = `{{#if ip_ownership == "client"}}갑 귀속{{#elif ip_ownership == "contractor"}}을 귀속{{#elif ip_ownership == "joint"}}공동 소유{{#else}}기본{{/if}}`
    expect(processConditionals(content, { ip_ownership: 'client' })).toBe('갑 귀속')
    expect(processConditionals(content, { ip_ownership: 'contractor' })).toBe('을 귀속')
    expect(processConditionals(content, { ip_ownership: 'joint' })).toBe('공동 소유')
    expect(processConditionals(content, {})).toBe('기본')
  })

  it('does not alter content without conditional blocks', () => {
    const plain = '제 1 조(목적)\n본 계약의 목적을 정한다.\n{{client_name}}'
    expect(processConditionals(plain, {})).toBe(plain)
  })
})
