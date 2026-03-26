'use client'

import { useDocumentStore } from '@/lib/store'
import { SectionCard } from './section-card'

export function InputPanel() {
  const { selectedTemplate } = useDocumentStore()

  if (!selectedTemplate) return null

  return (
    <div className="p-6">
      <div className="space-y-6">
        {selectedTemplate.sections.map((section, index) => (
          <SectionCard 
            key={section.id} 
            section={section} 
            index={index + 1}
            total={selectedTemplate.sections.length}
          />
        ))}
      </div>
    </div>
  )
}
