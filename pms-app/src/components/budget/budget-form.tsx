'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

interface Project {
  id: string
  code: string
  name: string
}

const CATEGORY_OPTIONS = [
  { value: '인건비', label: '인건비' },
  { value: '자재비', label: '자재비' },
  { value: '외주비', label: '외주비' },
  { value: '장비비', label: '장비비' },
  { value: '기계설비', label: '기계설비' },
  { value: '전장', label: '전장' },
  { value: '기타', label: '기타' },
]

const COST_TYPE_OPTIONS = [
  { value: '직접비', label: '직접비' },
  { value: '간접비', label: '간접비' },
]

interface BudgetItem {
  id: string
  name: string
  category: string
  costType: string
  plannedAmount: number
  previousAmount: number
  currentAmount: number
  description: string
}

interface BudgetFormProps {
  projects: Project[]
}

export function BudgetForm({ projects }: BudgetFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState<BudgetItem[]>([
    { id: '1', name: '', category: '자재비', costType: '직접비', plannedAmount: 0, previousAmount: 0, currentAmount: 0, description: '' }
  ])

  const addItem = () => {
    setItems([...items, {
      id: Date.now().toString(),
      name: '',
      category: '자재비',
      costType: '직접비',
      plannedAmount: 0,
      previousAmount: 0,
      currentAmount: 0,
      description: ''
    }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id))
    }
  }

  const updateItem = (id: string, field: keyof BudgetItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const totalPlanned = items.reduce((sum, item) => sum + (item.plannedAmount || 0), 0)
  const totalPrevious = items.reduce((sum, item) => sum + (item.previousAmount || 0), 0)
  const totalCurrent = items.reduce((sum, item) => sum + (item.currentAmount || 0), 0)
  const totalActual = totalPrevious + totalCurrent

  const directCostTotal = items
    .filter(item => item.costType === '직접비')
    .reduce((sum, item) => sum + (item.plannedAmount || 0), 0)
  
  const indirectCostTotal = items
    .filter(item => item.costType === '간접비')
    .reduce((sum, item) => sum + (item.plannedAmount || 0), 0)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    try {
      const budgetData = {
        projectId: formData.get('projectId'),
        type: formData.get('type'),
        status: formData.get('status'),
        indirectCostRate: Number(formData.get('indirectCostRate')) || 0,
        sellingAdminCostRate: Number(formData.get('sellingAdminCostRate')) || 0,
        effectiveDate: formData.get('effectiveDate') || null,
        items: items.filter(item => item.name && item.plannedAmount > 0)
      }

      const response = await fetch('/api/budget/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(budgetData)
      })

      if (response.ok) {
        router.push('/budget')
        router.refresh()
      } else {
        alert('예산 생성 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error(error)
      alert('예산 생성 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>예산 기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>프로젝트</Label>
            <select 
              name="projectId" 
              required
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="">프로젝트 선택...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name} ({project.code})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>예산 유형</Label>
              <select name="type" required className="w-full mt-1 p-2 border rounded-md">
                <option value="INITIAL">초기 예산</option>
                <option value="REVISED">수정 예산</option>
                <option value="FINAL">최종 예산</option>
              </select>
            </div>
            <div>
              <Label>상태</Label>
              <select name="status" className="w-full mt-1 p-2 border rounded-md">
                <option value="DRAFT">임시저장</option>
                <option value="APPROVED">승인됨</option>
                <option value="IN_PROGRESS">진행중</option>
                <option value="CLOSED">종료</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>적용 시작일</Label>
              <Input type="date" name="effectiveDate" />
            </div>
            <div>
              <Label>간접비율 (%)</Label>
              <Input type="number" name="indirectCostRate" placeholder="0" defaultValue="0" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>예산 항목 상세 (직접비 / 간접비)</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="w-4 h-4 mr-1" />
            항목 추가
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => (
              <div key={item.id} className="flex gap-3 items-start p-4 border rounded-lg bg-slate-50">
                <div className="w-8 h-8 flex items-center justify-center bg-slate-200 rounded-full text-sm font-medium">
                  {index + 1}
                </div>
                
                <div className="flex-1 grid grid-cols-2 md:grid-cols-6 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs text-slate-500">항목명</Label>
                    <Input 
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                      placeholder="품목명"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-500">유형</Label>
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                      className="w-full mt-1 p-2 text-sm border rounded"
                    >
                      {CATEGORY_OPTIONS.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-500">구분</Label>
                    <select
                      value={item.costType}
                      onChange={(e) => updateItem(item.id, 'costType', e.target.value)}
                      className="w-full mt-1 p-2 text-sm border rounded"
                    >
                      {COST_TYPE_OPTIONS.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-500">예정 (원)</Label>
                    <Input 
                      type="number"
                      value={item.plannedAmount || ''}
                      onChange={(e) => updateItem(item.id, 'plannedAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="text-xs text-slate-500">금번실행 (원)</Label>
                    <Input 
                      type="number"
                      value={item.currentAmount || ''}
                      onChange={(e) => updateItem(item.id, 'currentAmount', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeItem(item.id)}
                  disabled={items.length === 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-slate-100 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">직접비 합계</span>
              <span className="font-bold text-blue-600">{directCostTotal.toLocaleString()}원</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">간접비 합계</span>
              <span className="font-bold text-orange-600">{indirectCostTotal.toLocaleString()}원</span>
            </div>
            <div className="flex items-center justify-between text-sm border-t pt-2">
              <span className="text-slate-600">예정 합계</span>
              <span className="font-bold">{totalPlanned.toLocaleString()}원</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">금번실행 합계</span>
              <span className="font-bold text-green-600">{totalCurrent.toLocaleString()}원</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">잔액 (예정 - 실행)</span>
              <span className={`font-bold ${totalPlanned - totalActual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {(totalPlanned - totalActual).toLocaleString()}원
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? '저장 중...' : '예산 등록'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          취소
        </Button>
      </div>
    </form>
  )
}
