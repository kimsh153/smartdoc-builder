import type { Template } from './types'

/**
 * Encodes a Template object into a Base64 string for URL sharing.
 * We use URI encoding to handle Korean characters safely before Base64.
 */
export function encodeTemplate(template: Template): string {
  try {
    const jsonStr = JSON.stringify(template)
    // Use encodeURIComponent to handle non-ASCII characters and then btoa
    // Standard btoa only handles Latin1, so we need this intermediate step.
    return btoa(encodeURIComponent(jsonStr))
  } catch (error) {
    console.error('Failed to encode template:', error)
    return ''
  }
}

/**
 * Decodes a Base64 string back into a Template object.
 */
export function decodeTemplate(encoded: string): Template | null {
  try {
    const decodedStr = decodeURIComponent(atob(encoded))
    const template = JSON.parse(decodedStr) as Template
    
    // Basic validation: must have ID and name
    if (!template.id || !template.name || !Array.isArray(template.sections)) {
      return null
    }
    
    return template
  } catch (error) {
    console.error('Failed to decode template:', error)
    return null
  }
}

/**
 * Generates a full shareable URL for a template.
 */
export function getShareableUrl(template: Template): string {
  const encoded = encodeTemplate(template)
  if (!encoded) return ''
  
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  return `${baseUrl}/editor?share=${encoded}`
}

/**
 * Triggers a JSON file download of the template.
 */
export function exportTemplateAsJson(template: Template) {
  const dataStr = JSON.stringify(template, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = `template_${template.id}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
