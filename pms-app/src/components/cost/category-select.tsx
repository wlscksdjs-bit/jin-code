'use client'

import { useMemo } from 'react'
import { COST_CATEGORY_SEED, type CostCategorySeed } from '@/lib/cost-calculation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export interface CategorySelectValue {
  major: string
  sub: string
}

interface CategorySelectProps {
  majorValue: string
  subValue: string
  onMajorChange: (value: string) => void
  onSubChange: (value: string) => void
}

const MAJOR_CATEGORIES = [
  { value: 'DIRECT', label: '직접경비' },
  { value: 'INDIRECT', label: '간접경비' },
]

export function CategorySelect({
  majorValue,
  subValue,
  onMajorChange,
  onSubChange,
}: CategorySelectProps) {
  const majorCategories = MAJOR_CATEGORIES

  const subCategories = useMemo(() => {
    if (!majorValue) return []
    
    const typeMap: Record<string, string[]> = {
      'DIRECT': ['MATERIAL', 'LABOR', 'EXPENSE'],
      'INDIRECT': ['INDIRECT'],
    }
    
    const allowedTypes = typeMap[majorValue] || []
    
    return COST_CATEGORY_SEED.filter(
      cat => allowedTypes.includes(cat.type) && cat.level === 1
    ).map(cat => ({
      value: cat.code,
      label: cat.name,
      type: cat.type,
    }))
  }, [majorValue])

  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <Label className="mb-1 block text-xs">대분류</Label>
        <Select value={majorValue} onValueChange={onMajorChange}>
          <SelectTrigger className="h-8">
            <SelectValue placeholder="선택" />
          </SelectTrigger>
          <SelectContent>
            {majorCategories.map(m => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <Label className="mb-1 block text-xs">중분류</Label>
        <Select 
          value={subValue} 
          onValueChange={onSubChange}
          disabled={!majorValue}
        >
          <SelectTrigger className="h-8">
            <SelectValue placeholder={majorValue ? "선택" : "대분류 선택"} />
          </SelectTrigger>
          <SelectContent>
            {subCategories.map(cat => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
