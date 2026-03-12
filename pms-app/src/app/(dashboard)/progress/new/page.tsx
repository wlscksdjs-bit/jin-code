import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createProgress } from '@/app/actions/progress'
import Link from 'next/link'
import { ArrowLeft, BarChart3 } from 'lucide-react'

async function getProjects() {
  return prisma.project.findMany({
    where: { isActive: true, status: { not: 'COMPLETED' } },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true }
  })
}

async function getWbsItems(projectId: string) {
  return prisma.wbsItem.findMany({
    where: { projectId },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, code: true, name: true }
  })
}

export default async function NewProgressPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/progress">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">진행 상황 기록</h1>
          <p className="text-slate-500">프로젝트 진행 상황을 기록하세요</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>진행 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createProgress} className="space-y-4">
            <div>
              <label className="text-sm font-medium">프로젝트</label>
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

            <div>
              <label className="text-sm font-medium">공정 (WBS)</label>
              <select 
                name="wbsItemId" 
                className="w-full mt-1 p-2 border rounded-md"
              >
                <option value="">전체 공정</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">기록일</label>
                <input 
                  type="date" 
                  name="date" 
                  required
                  className="w-full mt-1 p-2 border rounded-md"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="text-sm font-medium">상태</label>
                <select 
                  name="status" 
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="NORMAL">정상</option>
                  <option value="DELAYED">지연</option>
                  <option value="AHEAD">선행</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">계획 진도 (%)</label>
                <input 
                  type="number" 
                  name="plannedProgress" 
                  required
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="예: 50"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="text-sm font-medium">실제 진도 (%)</label>
                <input 
                  type="number" 
                  name="actualProgress" 
                  required
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="예: 45"
                  min="0"
                  max="100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">진행 내용</label>
              <textarea 
                name="description" 
                className="w-full mt-1 p-2 border rounded-md"
                rows={3}
                placeholder="진행 상황을 설명하세요"
              />
            </div>

            <div>
              <label className="text-sm font-medium">이슈/문제점</label>
              <textarea 
                name="issues" 
                className="w-full mt-1 p-2 border rounded-md"
                rows={2}
                placeholder="문제가 있으면 작성하세요"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">
                등록
              </Button>
              <Link href="/progress">
                <Button variant="outline" type="button">
                  취소
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
