'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calculator, Save, TrendingUp, TrendingDown, Calendar, Trash2, Plus } from 'lucide-react'

interface Project {
  id: string
  name: string
  code: string
  contractAmount?: number | null
}

const COST_CATEGORIES = [
  { key: 'materialCost', label: '재료비', color: 'bg-blue-50' },
  { key: 'laborCost', label: '노무비', color: 'bg-orange-50' },
  { key: 'outsourceFabrication', label: '외주가공비', color: 'bg-purple-50' },
  { key: 'outsourceService', label: '외주용역비', color: 'bg-pink-50' },
  { key: 'consumableOther', label: '소모품비-기타', color: 'bg-slate-50' },
  { key: 'consumableSafety', label: '소모품비-안전', color: 'bg-red-50' },
  { key: 'travelExpense', label: '여비교통비', color: 'bg-cyan-50' },
  { key: 'insuranceWarranty', label: '보험료', color: 'bg-indigo-50' },
  { key: 'dormitoryCost', label: '사택관리비', color: 'bg-amber-50' },
  { key: 'miscellaneous', label: '잡급', color: 'bg-stone-50' },
  { key: 'indirectCost', label: '제조간접비', color: 'bg-teal-50' },
]

export function MonthlyCostForm({ 
  projects, 
  projectId 
}: { 
  projects: Project[]
  projectId?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedProject, setSelectedProject] = useState(projectId || '')

  const currentDate = new Date()
  const [formData, setFormData] = useState({
    projectId: projectId || '',
    type: 'MONTHLY',
    periodYear: currentDate.getFullYear(),
    periodMonth: currentDate.getMonth() + 1,
    description: '',
    costs: {
      materialCost: 0,
      laborCost: 0,
      outsourceFabrication: 0,
      outsourceService: 0,
      consumableOther: 0,
      consumableSafety: 0,
      travelExpense: 0,
      insuranceWarranty: 0,
      dormitoryCost: 0,
      miscellaneous: 0,
      indirectCost: 0,
    }
  })

  const project = projects.find(p => p.id === selectedProject)

  const calculated = useMemo(() => {
    const costs = formData.costs
    const totalExpense = 
      costs.outsourceFabrication +
      costs.outsourceService +
      costs.consumableOther +
      costs.consumableSafety +
      costs.travelExpense +
      costs.insuranceWarranty +
      costs.dormitoryCost +
      costs.miscellaneous

    const totalDirectCost = costs.materialCost + costs.laborCost + totalExpense
    const totalManufacturingCost = totalDirectCost + costs.indirectCost
    const contractAmount = project?.contractAmount || 0
    const sellingAdminCost = contractAmount * 0.12
    const grossProfit = contractAmount - totalManufacturingCost
    const operatingProfit = grossProfit - sellingAdminCost
    const profitRate = contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0

    return {
      totalExpense,
      totalDirectCost,
      totalManufacturingCost,
      sellingAdminCost,
      grossProfit,
      operatingProfit,
      profitRate
    }
  }, [formData.costs, project])

  function updateCost(key: string, value: number) {
    setFormData(prev => ({
      ...prev,
      costs: { ...prev.costs, [key]: value }
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!formData.projectId) {
      alert('프로젝트를 선택해주세요.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/cost-execution/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await res.json()

      if (result.success) {
        alert('월별 원가가 등록되었습니다.')
        router.push('/cost')
        router.refresh()
      } else {
        alert(result.error || '오류가 발생했습니다.')
      }
    } catch (err) {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label>프로젝트 *</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>년 *</Label>
              <Select 
                value={formData.periodYear.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, periodYear: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[currentDate.getFullYear() - 1, currentDate.getFullYear(), currentDate.getFullYear() + 1].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}년</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>월 *</Label>
              <Select 
                value={formData.periodMonth.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, periodMonth: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                    <SelectItem key={month} value={month.toString()}>{month}월</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>유형</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">월별실적</SelectItem>
                  <SelectItem value="REVISED">정정</SelectItem>
                  <SelectItem value="FINAL">최종</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>비고</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="비고사항 입력"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>원가 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {COST_CATEGORIES.map(cat => (
              <div key={cat.key} className={`p-3 rounded-lg ${cat.color}`}>
                <div className="flex justify-between items-center mb-2">
                  <Label className="text-sm font-medium">{cat.label}</Label>
                </div>
                <Input
                  type="number"
                  min={0}
                  value={formData.costs[cat.key as keyof typeof formData.costs] || 0}
                  onChange={(e) => updateCost(cat.key, parseInt(e.target.value) || 0)}
                  className="text-right font-mono"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              원가 요약
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between p-2 bg-blue-50 rounded font-medium">
              <span>직접공사비</span>
              <span>{formatNumber(calculated.totalDirectCost)}</span>
            </div>
            <div className="flex justify-between pl-4"><span>- 재료비</span><span>{formatNumber(formData.costs.materialCost)}</span></div>
            <div className="flex justify-between pl-4"><span>- 노무비</span><span>{formatNumber(formData.costs.laborCost)}</span></div>
            <div className="flex justify-between pl-4"><span>- 경비</span><span>{formatNumber(calculated.totalExpense)}</span></div>

            <div className="flex justify-between p-2 bg-orange-50 rounded font-medium">
              <span>간접비</span>
              <span>{formatNumber(formData.costs.indirectCost)}</span>
            </div>

            <div className="flex justify-between p-2 bg-slate-100 rounded font-bold">
              <span>총 제조원가</span>
              <span>{formatNumber(calculated.totalManufacturingCost)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={calculated.operatingProfit >= 0 ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {calculated.operatingProfit >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              손익 현황
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">계약금액</span>
              <span className="font-medium">{formatNumber(project?.contractAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">총 제조원가</span>
              <span className="font-medium">-{formatNumber(calculated.totalManufacturingCost)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between">
              <span className="text-slate-500">매출이익</span>
              <span className="font-medium">{formatNumber(calculated.grossProfit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">판관비 (12%)</span>
              <span className="font-medium">-{formatNumber(calculated.sellingAdminCost)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between text-lg font-bold">
              <span>영업이익</span>
              <span className={calculated.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                {calculated.operatingProfit >= 0 ? '+' : ''}{formatNumber(calculated.operatingProfit)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">이익률</span>
              <span className={calculated.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                {calculated.profitRate.toFixed(2)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? '저장 중...' : '월별 원가 저장'}
        </Button>
      </div>
    </form>
  )
}
