'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { updateProject } from '@/app/actions/projects'

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

interface Customer {
  id: string
  name: string
}

interface Project {
  id: string
  code: string
  name: string
  type: string
  status: string
  contractType: string | null
  customerId: string | null
  contractAmount: number | null
  estimatedBudget: number | null
  startDate: Date | null
  endDate: Date | null
  contractDate: Date | null
  location: string | null
  address: string | null
  description: string | null
}

function formatDateForInput(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function ProjectEditForm({ 
  customers, 
  project 
}: { 
  customers: Customer[]
  project: Project 
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    try {
      await updateProject(project.id, formData)
      router.push(`/projects/${project.id}`)
      router.refresh()
    } catch (err) {
      setError('프로젝트 수정 중 오류가 발생했습니다.')
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
          <Label>프로젝트 코드</Label>
          <Input value={project.code} disabled className="bg-slate-50" />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="name">프로젝트명 *</Label>
          <Input id="name" name="name" defaultValue={project.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">프로젝트 유형 *</Label>
          <select 
            id="type" 
            name="type" 
            defaultValue={project.type}
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
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
            defaultValue={project.status}
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
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
            defaultValue={project.contractType || ''}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {contractTypes.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customerId">고객사</Label>
          <select 
            id="customerId" 
            name="customerId" 
            defaultValue={project.customerId || ''}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractAmount">계약금액</Label>
          <Input 
            id="contractAmount" 
            name="contractAmount" 
            type="number" 
            defaultValue={project.contractAmount || ''} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimatedBudget">추정 예산</Label>
          <Input 
            id="estimatedBudget" 
            name="estimatedBudget" 
            type="number" 
            defaultValue={project.estimatedBudget || ''} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">시작일</Label>
          <Input 
            id="startDate" 
            name="startDate" 
            type="date" 
            defaultValue={formatDateForInput(project.startDate)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">종료일</Label>
          <Input 
            id="endDate" 
            name="endDate" 
            type="date" 
            defaultValue={formatDateForInput(project.endDate)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractDate">계약일</Label>
          <Input 
            id="contractDate" 
            name="contractDate" 
            type="date" 
            defaultValue={formatDateForInput(project.contractDate)} 
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">지역</Label>
          <Input id="location" name="location" defaultValue={project.location || ''} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">상세 주소</Label>
          <Input id="address" name="address" defaultValue={project.address || ''} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">설명</Label>
          <textarea 
            id="description" 
            name="description" 
            rows={3}
            defaultValue={project.description || ''}
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          />
        </div>
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
