'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'

interface WbsItem {
  id: string
  code: string
  name: string
}

interface AddWbsFormProps {
  projectId: string
  existingWbs: WbsItem[]
}

export function AddWbsForm({ projectId, existingWbs }: AddWbsFormProps) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    formData.append('projectId', projectId)
    
    try {
      const response = await fetch('/api/wbs', {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error creating WBS item:', error)
    }
    
    setLoading(false)
  }

  if (!showForm) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setShowForm(true)}
        className="ml-auto"
      >
        <Plus className="w-4 h-4 mr-1" />
        공정 추가
      </Button>
    )
  }

  const nextCode = existingWbs.length > 0 
    ? `${parseInt(existingWbs[existingWbs.length - 1].code.split('.')[0] || '0') + 1}`
    : '1'

  return (
    <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-slate-50 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">새 공정 추가</h4>
        <Button 
          type="button" 
          variant="ghost" 
          size="sm"
          onClick={() => setShowForm(false)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-600">공정 코드</label>
          <input 
            name="code"
            required
            defaultValue={nextCode}
            className="w-full mt-1 p-2 text-sm border rounded"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">Phase</label>
          <select name="phaseType" className="w-full mt-1 p-2 text-sm border rounded">
            <option value="DESIGN">설계</option>
            <option value="PROCUREMENT">구매</option>
            <option value="CONSTRUCTION">시공</option>
            <option value="COMMISSIONING">시운전</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-600">공정명</label>
        <input 
          name="name"
          required
          placeholder="공정명을 입력하세요"
          className="w-full mt-1 p-2 text-sm border rounded"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-600">시작일</label>
          <input 
            type="date"
            name="startDate"
            className="w-full mt-1 p-2 text-sm border rounded"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">종료일</label>
          <input 
            type="date"
            name="endDate"
            className="w-full mt-1 p-2 text-sm border rounded"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-600">계획 일수</label>
          <input 
            type="number"
            name="plannedDays"
            placeholder="일"
            className="w-full mt-1 p-2 text-sm border rounded"
          />
        </div>
        <div>
          <label className="text-xs text-slate-600">진도율 (%)</label>
          <input 
            type="number"
            name="progress"
            defaultValue={0}
            min={0}
            max={100}
            className="w-full mt-1 p-2 text-sm border rounded"
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-slate-600">상태</label>
        <select name="status" className="w-full mt-1 p-2 text-sm border rounded">
          <option value="PENDING">대기</option>
          <option value="IN_PROGRESS">진행중</option>
          <option value="COMPLETED">완료</option>
          <option value="DELAYED">지연</option>
        </select>
      </div>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={loading}>
          {loading ? '저장중...' : '저장'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => setShowForm(false)}
        >
          취소
        </Button>
      </div>
    </form>
  )
}
