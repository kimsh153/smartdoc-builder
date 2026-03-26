'use client'

import { useRouter } from 'next/navigation'
import { useDocumentStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2 } from 'lucide-react'
import type { Document } from '@/lib/types'

interface DocumentCardProps {
  document: Document
}

const statusLabels: Record<Document['status'], string> = {
  draft: '작성중',
  reviewed: '검토완료',
  confirmed: '확정',
}

const statusVariants: Record<Document['status'], 'secondary' | 'outline' | 'default'> = {
  draft: 'secondary',
  reviewed: 'outline',
  confirmed: 'default',
}

export function DocumentCard({ document }: DocumentCardProps) {
  const router = useRouter()
  const { loadDocument, deleteDocument } = useDocumentStore()

  const handleClick = () => {
    loadDocument(document.id)
    router.push('/editor')
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteDocument(document.id)
  }

  const filledFields = Object.values(document.values).filter(Boolean).length

  return (
    <Card className="group cursor-pointer transition-all hover:border-primary hover:shadow-md" onClick={handleClick}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Badge variant={statusVariants[document.status]}>
            {statusLabels[document.status]}
          </Badge>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        <CardTitle className="mt-2 text-lg">{document.templateName}</CardTitle>
        <CardDescription>
          {new Date(document.updatedAt).toLocaleDateString('ko-KR')} 수정
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {filledFields}개 필드 작성됨
        </p>
      </CardContent>
    </Card>
  )
}
