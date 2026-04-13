'use client'

import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { QuotationToolbar } from '@/components/quotation/toolbar'
import { InputSidebar } from '@/components/quotation/input-sidebar'
import { GroupEditor } from '@/components/quotation/group-editor'
import { StaffEditor } from '@/components/quotation/staff-editor'
import { PreviewTable } from '@/components/quotation/preview-table'
import { useQuotationStore } from '@/lib/quotation/store'
import { useDocumentStore } from '@/lib/store'
import { exportToXlsx } from '@/lib/exporters/toXlsx'
import { toast } from 'sonner'

export default function QuotationEditorPage() {
  const { data } = useQuotationStore()
  const saveQuotationDocument = useDocumentStore(s => s.saveQuotationDocument)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      saveQuotationDocument()
      toast.success('내 문서에 저장되었습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportXlsx = async () => {
    try {
      await exportToXlsx(data)
      toast.success('Excel 파일이 다운로드되었습니다.')
    } catch (e) {
      console.error(e)
      toast.error('Excel 내보내기에 실패했습니다.')
    }
  }

  const title = data.clientName ? `${data.clientName} 견적서` : 'IT 프로젝트 견적서'

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <QuotationToolbar
        title={title}
        onSave={handleSave}
        onExportXlsx={handleExportXlsx}
        isSaving={isSaving}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* 왼쪽 입력 패널 (50%) */}
        <div className="w-1/2 border-r overflow-y-auto">
          <Tabs defaultValue="info" className="h-full flex flex-col">
            <div className="border-b px-4 pt-2 shrink-0 bg-background sticky top-0 z-10">
              <TabsList className="h-9">
                <TabsTrigger value="info" className="text-xs">견적 정보</TabsTrigger>
                <TabsTrigger value="module" className="text-xs">모듈별 견적</TabsTrigger>
                <TabsTrigger value="staff" className="text-xs">인력별 견적</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info" className="mt-0 flex-1">
              <InputSidebar />
            </TabsContent>
            <TabsContent value="module" className="mt-0 flex-1">
              <GroupEditor />
            </TabsContent>
            <TabsContent value="staff" className="mt-0 flex-1">
              <StaffEditor />
            </TabsContent>
          </Tabs>
        </div>

        {/* 오른쪽 미리보기 (50%) */}
        <div className="w-1/2 overflow-y-auto bg-muted/20">
          <div className="border-b px-4 py-2 bg-background sticky top-0 z-10">
            <p className="text-xs font-medium text-muted-foreground">실시간 미리보기</p>
          </div>
          <PreviewTable />
        </div>
      </div>
    </div>
  )
}
