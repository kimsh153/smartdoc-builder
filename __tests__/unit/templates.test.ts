import { defaultTemplates } from '@/lib/templates'

describe('defaultTemplates', () => {
  it('exports an array of 6 templates', () => {
    expect(Array.isArray(defaultTemplates)).toBe(true)
    expect(defaultTemplates).toHaveLength(6)
  })

  it('every template has required fields', () => {
    defaultTemplates.forEach((template) => {
      expect(template).toHaveProperty('id')
      expect(template).toHaveProperty('name')
      expect(template).toHaveProperty('description')
      expect(template).toHaveProperty('icon')
      expect(Array.isArray(template.sections)).toBe(true)
      expect(typeof template.documentContent).toBe('string')
    })
  })

  it('template IDs are unique', () => {
    const ids = defaultTemplates.map((t) => t.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('every section has id, title, and fields array', () => {
    defaultTemplates.forEach((template) => {
      template.sections.forEach((section) => {
        expect(section).toHaveProperty('id')
        expect(section).toHaveProperty('title')
        expect(Array.isArray(section.fields)).toBe(true)
        expect(section.fields.length).toBeGreaterThan(0)
      })
    })
  })

  it('every field has id, label, and a valid type', () => {
    const validTypes = ['text', 'textarea', 'select', 'radio', 'date', 'number']
    defaultTemplates.forEach((template) => {
      template.sections.forEach((section) => {
        section.fields.forEach((field) => {
          expect(field).toHaveProperty('id')
          expect(field).toHaveProperty('label')
          expect(validTypes).toContain(field.type)
        })
      })
    })
  })

  it('select/radio fields have non-empty options array', () => {
    defaultTemplates.forEach((template) => {
      template.sections.forEach((section) => {
        section.fields
          .filter((f) => f.type === 'select' || f.type === 'radio')
          .forEach((field) => {
            expect(Array.isArray(field.options)).toBe(true)
            expect(field.options!.length).toBeGreaterThan(0)
          })
      })
    })
  })

  it('documentContent contains at least one {{placeholder}}', () => {
    defaultTemplates.forEach((template) => {
      expect(template.documentContent).toMatch(/\{\{[^}]+\}\}/)
    })
  })
})
