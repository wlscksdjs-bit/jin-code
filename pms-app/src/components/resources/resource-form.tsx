'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createResource, updateResource, deleteResource } from '@/app/actions/resources'

const grades = [
  { value: 'SE', label: '선임엔지니어' },
  { value: 'TE', label: '엔지니어' },
  { value: 'AE', label: '주임엔지니어' },
  { value: 'JE', label: '조엔지니어' },
  { value: 'SM', label: '안전관리자' },
]

const availabilities = [
  { value: 'AVAILABLE', label: '가용' },
  { value: 'ASSIGNED', label: '배정됨' },
  { value: 'ON_LEAVE', label: '휴가' },
  { value: 'UNAVAILABLE', label: '불가' },
]

interface Resource {
  id: string
  name: string
  employeeNumber: string
  department: string | null
  position: string | null
  grade: string | null
  hourlyRate: number | null
  availability: string
  phone: string | null
  email: string | null
}

export function ResourceForm({ resource }: { resource?: Resource }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!resource

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    try {
      if (isEdit) {
        await updateResource(resource.id, formData)
        router.push('/resources')
      } else {
        await createResource(formData)
        router.push('/resources')
      }
      router.refresh()
    } catch (err) {
      setError(isEdit ? '수정' : '생성' + ' 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!resource) return
    if (!confirm('삭제하시겠습니까?')) return
    
    setLoading(true)
    try {
      await deleteResource(resource.id)
      router.push('/resources')
      router.refresh()
    } catch {
      setError('삭제 중 오류가 발생했습니다.')
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
          <Label htmlFor="name">이름 *</Label>
          <Input id="name" name="name" defaultValue={resource?.name} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="employeeNumber">사번 *</Label>
          <Input 
            id="employeeNumber" 
            name="employeeNumber" 
            defaultValue={resource?.employeeNumber} 
            required 
            disabled={isEdit}
            className={isEdit ? 'bg-slate-50' : ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">부서</Label>
          <Input id="department" name="department" defaultValue={resource?.department || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">직위</Label>
          <Input id="position" name="position" defaultValue={resource?.position || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="grade">등급</Label>
          <select 
            id="grade" 
            name="grade" 
            defaultValue={resource?.grade || ''}
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">선택</option>
            {grades.map(g => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label htmlFor="availability">상태</Label>
            <select 
              id="availability" 
              name="availability" 
              defaultValue={resource?.availability || 'AVAILABLE'}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {availabilities.map(a => (
                <option key={a.value} value={a.value}>{a.label}</option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="hourlyRate">시급</Label>
          <Input id="hourlyRate" name="hourlyRate" type="number" defaultValue={resource?.hourlyRate || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">연락처</Label>
          <Input id="phone" name="phone" defaultValue={resource?.phone || ''} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">이메일</Label>
          <Input id="email" name="email" type="email" defaultValue={resource?.email || ''} />
        </div>
      </div>

      <div className="flex justify-between">
        {isEdit && (
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
            삭제
          </Button>
        )}
        <div className="flex gap-2 ml-auto">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '저장 중...' : (isEdit ? '저장' : '생성')}
          </Button>
        </div>
      </div>
    </form>
  )
}
