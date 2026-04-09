'use client'

import { useDocumentStore } from '@/lib/store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RichTextarea } from '@/components/editor/rich-textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Info } from 'lucide-react'
import type { Section, Field } from '@/lib/types'

interface SectionCardProps {
  section: Section
  index: number
  total: number
}

export function SectionCard({ section, index, total }: SectionCardProps) {
  const { values, setValue, setActiveSection } = useDocumentStore()

  const handleFocus = () => {
    setActiveSection(section.id)
  }

  // Filter fields by showIf condition
  const visibleFields = section.fields.filter(field => {
    if (!field.showIf) return true
    return values[field.showIf.fieldId] === field.showIf.value
  })

  return (
    <Card
      className="border transition-all focus-within:border-primary focus-within:ring-1 focus-within:ring-primary"
      onFocus={handleFocus}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">{section.title}</h3>
          <span className="text-sm text-muted-foreground">{index}/{total}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {visibleFields.map((field) => (
          <FieldInput
            key={field.id}
            field={field}
            value={values[field.id] || ''}
            onChange={(val) => setValue(field.id, val)}
          />
        ))}
      </CardContent>
    </Card>
  )
}

interface FieldInputProps {
  field: Field
  value: string
  onChange: (value: string) => void
}

function FieldInput({ field, value, onChange }: FieldInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor={field.id} className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="ml-1 text-destructive">*</span>}
        </Label>
        {field.guide && (
          <Popover>
            <PopoverTrigger>
              <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </PopoverTrigger>
            <PopoverContent className="text-sm">
              {field.guide}
            </PopoverContent>
          </Popover>
        )}
      </div>

      {(field.type === 'text' || field.type === 'tel') && (
        <Input
          id={field.id}
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}

      {field.type === 'number' && (
        <Input
          id={field.id}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      )}

      {field.type === 'date' && (
        <Input
          id={field.id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.type === 'textarea' && (
        <RichTextarea
          id={field.id}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          rows={4}
        />
      )}

      {field.type === 'select' && field.options && (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {field.type === 'radio' && field.options && (
        <RadioGroup value={value} onValueChange={onChange} className="flex flex-wrap gap-4">
          {field.options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={`${field.id}-${opt.value}`} />
              <Label htmlFor={`${field.id}-${opt.value}`} className="font-normal cursor-pointer">
                {opt.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}
    </div>
  )
}
