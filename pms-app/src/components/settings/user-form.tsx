'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { createUser } from '@/app/actions/users'

const roles = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'PM', label: 'PM' },
  { value: 'STAFF', label: 'Staff' },
]

interface User {
  id: string
  name: string | null
  email: string
  role: string
  department: string | null
  position: string | null
  phone: string | null
  isActive: boolean
}

export function UserForm({ user }: { user?: User }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!user

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    
    try {
      if (isEdit) {
        const { updateUser } = await import('@/app/actions/users')
        await updateUser(user.id, formData)
      } else {
        await createUser(formData)
      }
      router.push('/settings')
      router.refresh()
    } catch (err) {
      setError(isEdit ? '수정' : '생성' + ' 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!user) return
    if (!confirm('삭제하시겠습니까?')) return
    
    setLoading(true)
    try {
      const { deleteUser } = await import('@/app/actions/users')
      await deleteUser(user.id)
      router.push('/settings')
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
          <Input id="name" name="name" defaultValue={user?.name || ''} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">이메일 *</Label>
          <Input 
            id="email" 
            name="email" 
            type="email" 
            defaultValue={user?.email} 
            required 
            disabled={isEdit}
            className={isEdit ? 'bg-slate-50' : ''}
          />
        </div>

        {!isEdit && (
          <div className="space-y-2">
            <Label htmlFor="password">비밀번호 *</Label>
            <Input id="password" name="password" type="password" required minLength={6} />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="role">역할 *</Label>
          <select 
            id="role" 
            name="role" 
            defaultValue={user?.role || 'PM'}
            required
            className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            {roles.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="department">부서</Label>
          <Input id="department" name="department" defaultValue={user?.department || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="position">직위</Label>
          <Input id="position" name="position" defaultValue={user?.position || ''} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">연락처</Label>
          <Input id="phone" name="phone" defaultValue={user?.phone || ''} />
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label>상태</Label>
            <select 
              name="isActive"
              defaultValue={user?.isActive ? 'true' : 'false'}
              className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>
        )}
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
