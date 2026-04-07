'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useDocumentStore } from '@/lib/store'
import type { Field, FieldType } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { GripVertical, Plus, Trash2 } from 'lucide-react'

// ── Sortable item ──────────────────────────────────────────
function SortableFieldItem({ field, onRemove }: { field: Field; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: field.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm"
    >
      <button type="button" {...attributes} {...listeners} className="cursor-grab text-muted-foreground">
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="flex-1 font-medium truncate">{field.label}</span>
      <span className="text-xs text-muted-foreground font-mono">{`{{${field.id}}}`}</span>
      <span className="text-xs text-muted-foreground border rounded px-1">{field.type}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-destructive hover:text-destructive"
        onClick={() => onRemove(field.id)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ── Add field dialog ───────────────────────────────────────
function AddFieldDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addCustomField } = useDocumentStore()
  const [label, setLabel] = useState('')
  const [type, setType] = useState<FieldType>('text')
  const [required, setRequired] = useState(false)
  const [guide, setGuide] = useState('')

  const handleAdd = () => {
    if (!label.trim()) return
    const id = `custom_${Date.now()}`
    const field: Field = {
      id,
      label: label.trim(),
      type,
      required,
      guide: guide.trim() || undefined,
      placeholder: `${label.trim()} 입력`,
    }
    addCustomField(field)
    setLabel('')
    setType('text')
    setRequired(false)
    setGuide('')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>필드 추가</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>레이블 *</Label>
            <Input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="예: 담당자 이름"
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            />
          </div>
          <div className="space-y-2">
            <Label>타입</Label>
            <Select value={type} onValueChange={(v) => setType(v as FieldType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">텍스트 (text)</SelectItem>
                <SelectItem value="textarea">긴 텍스트 (textarea)</SelectItem>
                <SelectItem value="date">날짜 (date)</SelectItem>
                <SelectItem value="select">선택 (select)</SelectItem>
                <SelectItem value="tel">전화번호 (tel)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="required-check"
              checked={required}
              onChange={(e) => setRequired(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="required-check" className="font-normal cursor-pointer">필수 입력</Label>
          </div>
          <div className="space-y-2">
            <Label>작성 가이드 (선택)</Label>
            <Input
              value={guide}
              onChange={(e) => setGuide(e.target.value)}
              placeholder="이 필드에 대한 설명"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>취소</Button>
            <Button onClick={handleAdd} disabled={!label.trim()}>추가</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Main panel ─────────────────────────────────────────────
export function DynamicFieldPanel() {
  const { customFields, updateCustomFields, removeCustomField } = useDocumentStore()
  const [dialogOpen, setDialogOpen] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = customFields.findIndex(f => f.id === active.id)
    const newIndex = customFields.findIndex(f => f.id === over.id)
    updateCustomFields(arrayMove(customFields, oldIndex, newIndex))
  }

  return (
    <div className="border-t pt-4 mt-4 space-y-3">
      <div className="flex items-center justify-between px-4">
        <h4 className="text-sm font-semibold text-foreground">커스텀 필드</h4>
        <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          필드 추가
        </Button>
      </div>

      {customFields.length === 0 ? (
        <p className="px-4 text-xs text-muted-foreground">
          [+ 필드 추가] 버튼으로 커스텀 항목을 추가하세요.
        </p>
      ) : (
        <div className="px-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={customFields.map(f => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {customFields.map(field => (
                  <SortableFieldItem key={field.id} field={field} onRemove={removeCustomField} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <AddFieldDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </div>
  )
}
