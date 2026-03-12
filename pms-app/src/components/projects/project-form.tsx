'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createProject } from '@/app/actions/projects'
import { createCustomer } from '@/app/actions/customers'

const projectTypes = [
  { value: 'ENVIRONMENT', label: '환경플랜트' },
  { value: 'FACILITY', label: '설비' },
  { value: 'PROCESS', label: '공정개선' },
  { value: 'CONSTRUCTION', label: '건설' },
  { value: 'OTHER', label: '기타' },
]

const projectStatuses = [
  { value: 'REGISTERED', label: '등록됨' },
  { value: 'CONTRACT', label: '계약' },
  { value: 'DESIGN', label: '설계' },
  { value: 'CONSTRUCTION', label: '시공' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'CANCELLED', label: '취소' },
]

const contractTypes = [
  { value: '수주', label: '수주' },
  { value: '용역', label: '용역' },
  { value: '시공', label: '시공' },
]

const industries = [
  { value: '환경', label: '환경' },
  { value: '플랜트', label: '플랜트' },
  { value: '건설', label: '건설' },
  { value: '제조', label: '제조' },
  { value: '에너지', label: '에너지' },
  { value: '기타', label: '기타' },
]

interface Customer {
  id: string
  name: string
}

export function ProjectForm({ customers }: { customers: Customer[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customerMode, setCustomerMode] = useState<'select' | 'new'>('select')
  const [newCustomerName, setNewCustomerName] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    try {
      let customerId = formData.get('customerId') as string
      
      if (customerMode === 'new' && newCustomerName) {
        const customerFormData = new FormData()
        customerFormData.set('name', newCustomerName)
        customerFormData.set('code', `CUST${Date.now()}`)
        customerFormData.set('industry', formData.get('customerIndustry') as string || '')
        customerFormData.set('contactPerson', formData.get('contactPerson') as string || '')
        customerFormData.set('contactPhone', formData.get('contactPhone') as string || '')
        customerFormData.set('contactEmail', formData.get('contactEmail') as string || '')
        
        await createCustomer(customerFormData)
      }
      
      await createProject(formData)
      router.push('/projects')
      router.refresh()
    } catch (err) {
      setError('프로젝트 생성 중 오류가 발생했습니다.')
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
          <Label htmlFor="code">프로젝트 코드 *</Label>
          <Input id="code" name="code" placeholder="PJT001" required />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">프로젝트명 *</Label>
          <Input id="name" name="name" placeholder="프로젝트명" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">프로젝트 유형 *</Label>
          <select 
            id="type" 
            name="type" 
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {projectTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">상태 *</Label>
          <select 
            id="status" 
            name="status" 
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {projectStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractType">계약 유형</Label>
          <select 
            id="contractType" 
            name="contractType" 
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {contractTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>고객사 *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={customerMode === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomerMode('select')}
            >
              선택
            </Button>
            <Button
              type="button"
              variant={customerMode === 'new' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCustomerMode('new')}
            >
              신규등록
            </Button>
          </div>
        </div>

        {customerMode === 'select' ? (
          <div className="space-y-2">
            <Label htmlFor="customerId">기존 고객사 선택</Label>
            <select 
              id="customerId" 
              name="customerId" 
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">선택</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="newCustomerName">신규 고객사명 *</Label>
            <Input 
              id="newCustomerName" 
              placeholder="고객사명" 
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              required
            />
          </div>
        )}

        {customerMode === 'new' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="customerIndustry">업종</Label>
              <select 
                id="customerIndustry" 
                name="customerIndustry"
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">선택</option>
                {industries.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPerson">담당자</Label>
              <Input id="contactPerson" name="contactPerson" placeholder="담당자명" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">연락처</Label>
              <Input id="contactPhone" name="contactPhone" placeholder="010-1234-5678" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">이메일</Label>
              <Input id="contactEmail" name="contactEmail" type="email" placeholder="email@company.com" />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="contractAmount">계약금액</Label>
          <Input id="contractAmount" name="contractAmount" type="number" placeholder="0" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedBudget">추정 예산</Label>
          <Input id="estimatedBudget" name="estimatedBudget" type="number" placeholder="0" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">시작일</Label>
          <Input id="startDate" name="startDate" type="date" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">종료일</Label>
          <Input id="endDate" name="endDate" type="date" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractDate">계약일</Label>
          <Input id="contractDate" name="contractDate" type="date" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">지역</Label>
          <Input id="location" name="location" placeholder="경기도" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">상세 주소</Label>
          <Input id="address" name="address" placeholder="주소" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">설명</Label>
          <textarea 
            id="description" 
            name="description" 
            rows={3}
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            placeholder="프로젝트 설명"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '생성 중...' : '생성'}
        </Button>
      </div>
    </form>
  )
}
