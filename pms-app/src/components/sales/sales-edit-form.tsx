'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { updateSales } from '@/app/actions/sales'

const salesTypes = [
  { value: 'BIDDING', label: '입찰' },
  { value: 'CONTRACT', label: '계약' },
  { value: 'CHANGE_ORDER', label: '변경주문' },
]

const salesStatuses = [
  { value: 'DRAFT', label: '작성중' },
  { value: 'SUBMITTED', label: '제출됨' },
  { value: 'EVALUATING', label: '평가중' },
  { value: 'WON', label: '수주成功' },
  { value: 'LOST', label: '수주실패' },
  { value: 'CANCELLED', label: '취소' },
]

const bidResults = [
  { value: 'PENDING', label: '진행중' },
  { value: 'WON', label: '수주成功' },
  { value: 'LOST', label: '수주실패' },
]

interface Customer {
  id: string
  name: string
}

interface Project {
  id: string
  name: string
  code: string
}

interface User {
  id: string
  name: string | null
}

interface Sales {
  id: string
  type: string
  status: string
  title: string
  bidNumber: string | null
  bidAmount: number | null
  winProbability: number | null
  contractAmount: number | null
  bidOpenDate: Date | null
  submissionDate: Date | null
  contractDate: Date | null
  customerId: string | null
  projectId: string | null
  managerId: string | null
  customerBudget: number | null
  competitorInfo: string | null
  laborCost: number | null
  materialCost: number | null
  outsourceCost: number | null
  equipmentCost: number | null
  otherCost: number | null
  executionCost: number | null
  bidResult: string | null
  resultDate: Date | null
  description: string | null
}

function formatDateForInput(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function SalesEditForm({ 
  customers, 
  projects, 
  managers,
  sales
}: { 
  customers: Customer[]
  projects: Project[]
  managers: User[]
  sales: Sales
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [laborCost, setLaborCost] = useState(sales.laborCost || 0)
  const [materialCost, setMaterialCost] = useState(sales.materialCost || 0)
  const [outsourceCost, setOutsourceCost] = useState(sales.outsourceCost || 0)
  const [equipmentCost, setEquipmentCost] = useState(sales.equipmentCost || 0)
  const [otherCost, setOtherCost] = useState(sales.otherCost || 0)

  const executionCost = laborCost + materialCost + outsourceCost + equipmentCost + otherCost

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    try {
      await updateSales(sales.id, formData)
      router.push(`/sales/${sales.id}`)
      router.refresh()
    } catch (err) {
      setError('영업 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">제목 *</Label>
          <Input id="title" name="title" defaultValue={sales.title} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">구분 *</Label>
          <select 
            id="type" 
            name="type" 
            defaultValue={sales.type}
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {salesTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">상태 *</Label>
          <select 
            id="status" 
            name="status" 
            defaultValue={sales.status}
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {salesStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bidResult">입찰 결과</Label>
          <select 
            id="bidResult" 
            name="bidResult" 
            defaultValue={sales.bidResult || ''}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {bidResults.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerId">고객사</Label>
          <select 
            id="customerId" 
            name="customerId" 
            defaultValue={sales.customerId || ''}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectId">연결 프로젝트</Label>
          <select 
            id="projectId" 
            name="projectId" 
            defaultValue={sales.projectId || ''}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="managerId">담당자</Label>
          <select 
            id="managerId" 
            name="managerId" 
            defaultValue={sales.managerId || ''}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {managers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bidNumber">입찰번호</Label>
          <Input id="bidNumber" name="bidNumber" defaultValue={sales.bidNumber || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bidAmount">입찰금액</Label>
          <Input id="bidAmount" name="bidAmount" type="number" defaultValue={sales.bidAmount || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="winProbability">수주 확률 (%)</Label>
          <Input id="winProbability" name="winProbability" type="number" min="0" max="100" defaultValue={sales.winProbability || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerBudget">고객사 예산</Label>
          <Input id="customerBudget" name="customerBudget" type="number" defaultValue={sales.customerBudget || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractAmount">계약금액</Label>
          <Input id="contractAmount" name="contractAmount" type="number" defaultValue={sales.contractAmount || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bidOpenDate">개찰일</Label>
          <Input id="bidOpenDate" name="bidOpenDate" type="date" defaultValue={formatDateForInput(sales.bidOpenDate)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="submissionDate">제출기한</Label>
          <Input id="submissionDate" name="submissionDate" type="date" defaultValue={formatDateForInput(sales.submissionDate)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractDate">계약일</Label>
          <Input id="contractDate" name="contractDate" type="date" defaultValue={formatDateForInput(sales.contractDate)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resultDate">결과 확정일</Label>
          <Input id="resultDate" name="resultDate" type="date" defaultValue={formatDateForInput(sales.resultDate)} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">실행원가 산출</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="laborCost">인건비</Label>
              <Input 
                id="laborCost" 
                name="laborCost" 
                type="number" 
                placeholder="0" 
                value={laborCost}
                onChange={(e) => setLaborCost(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="materialCost">자재비</Label>
              <Input 
                id="materialCost" 
                name="materialCost" 
                type="number" 
                placeholder="0" 
                value={materialCost}
                onChange={(e) => setMaterialCost(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outsourceCost">외주비</Label>
              <Input 
                id="outsourceCost" 
                name="outsourceCost" 
                type="number" 
                placeholder="0" 
                value={outsourceCost}
                onChange={(e) => setOutsourceCost(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipmentCost">장비비</Label>
              <Input 
                id="equipmentCost" 
                name="equipmentCost" 
                type="number" 
                placeholder="0" 
                value={equipmentCost}
                onChange={(e) => setEquipmentCost(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="otherCost">기타비용</Label>
              <Input 
                id="otherCost" 
                name="otherCost" 
                type="number" 
                placeholder="0" 
                value={otherCost}
                onChange={(e) => setOtherCost(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>실행원가 합계</Label>
              <div className="flex h-10 items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium">
                {executionCost.toLocaleString()}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">경쟁사 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="competitorInfo">경쟁사 정보 (JSON)</Label>
            <textarea 
              id="competitorInfo" 
              name="competitorInfo" 
              rows={4}
              defaultValue={sales.competitorInfo || ''}
              className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-mono"
              placeholder='[{"name": "경쟁사A", "amount": 100000000, "status": "참여", "notes": "비고"}]'
            />
            <p className="text-xs text-slate-500">JSON 형식으로 입력하세요.</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2 md:col-span-2">
        <Label htmlFor="description">설명</Label>
        <textarea 
          id="description" 
          name="description" 
          rows={3}
          defaultValue={sales.description || ''}
          className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '저장 중...' : '저장'}
        </Button>
      </div>
    </form>
  )
}
