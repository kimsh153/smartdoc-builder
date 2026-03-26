'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { Template } from '@/lib/types'

interface TemplateCardProps {
  template: Template
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter()
  const { createDocument } = useDocumentStore()

  const handleSelect = () => {
    createDocument(template.id)
    router.push('/editor')
  }

  return (
    <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={handleSelect}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <span className="text-3xl">{template.icon}</span>
          <Button 
            variant="secondary" 
            size="sm" 
            className="opacity-0 transition-opacity group-hover:opacity-100"
          >
            선택
          </Button>
        </div>
        <CardTitle className="mt-2">{template.name}</CardTitle>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {template.sections.length}개 섹션 · {template.sections.reduce((acc, s) => acc + s.fields.length, 0)}개 입력 필드
        </p>
      </CardContent>
    </Card>
  )
}
