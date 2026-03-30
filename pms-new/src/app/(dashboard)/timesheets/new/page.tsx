'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTimeSheet } from '@/app/actions/timesheets'
import { listResources } from '@/app/actions/resources'
import { listProjects } from '@/app/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewTimeSheetPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 8,
    workType: '',
    description: '',
    projectId: '',
    resourceId: '',
    hourlyRate: 0,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const sessionRes = await fetch('/api/auth/session')
      const session = await sessionRes.json()

      if (!session?.user?.id) {
        setError('로그인이 필요합니다.')
        return
      }

      await createTimeSheet({
        ...formData,
        userId: session.user.id,
        hourlyRate: Number(formData.hourlyRate),
        hours: Number(formData.hours),
      })

      router.push('/timesheets')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">새 근태 기록</h1>
        </div>
        <Link href="/timesheets">
          <Button variant="ghost">목록</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>근태 기록 입력</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded">
                {error}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="date">날짜</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="hours">시간</Label>
                <Input
                  id="hours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  value={formData.hours}
                  onChange={(e) =>
                    setFormData({ ...formData, hours: Number(e.target.value) })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="projectId">프로젝트</Label>
                <select
                  id="projectId"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  required
                >
                  <option value="">프로젝트 선택</option>
                </select>
              </div>
              <div>
                <Label htmlFor="resourceId">인력</Label>
                <select
                  id="resourceId"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.resourceId}
                  onChange={(e) => {
                    setFormData({ ...formData, resourceId: e.target.value })
                  }}
                >
                  <option value="">인력 선택</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="hourlyRate">시간 단가 (원)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hourlyRate: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="workType">작업 유형</Label>
                <Input
                  id="workType"
                  value={formData.workType}
                  onChange={(e) =>
                    setFormData({ ...formData, workType: e.target.value })
                  }
                  placeholder="설계, 검토, 회의 등"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">설명</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Link href="/timesheets">
                <Button type="button" variant="ghost">
                  취소
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? '저장 중...' : '저장'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
