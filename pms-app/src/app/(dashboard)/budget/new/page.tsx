import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createBudget } from '@/app/actions/budget'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

async function getProjects() {
  return prisma.project.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, code: true, name: true }
  })
}

export default async function NewBudgetPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/budget">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">새 예산 등록</h1>
          <p className="text-slate-500">예산을 등록하세요</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>예산 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBudget} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">예산 유형</label>
                <select 
                  name="type" 
                  required
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="INITIAL">초기 예산</option>
                  <option value="REVISED">수정 예산</option>
                  <option value="FINAL">최종 예산</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">상태</label>
                <select 
                  name="status" 
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="DRAFT">임시저장</option>
                  <option value="APPROVED">승인됨</option>
                  <option value="IN_PROGRESS">진행중</option>
                  <option value="CLOSED">종료</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">총 예산 (원)</label>
              <input 
                type="number" 
                name="totalBudget" 
                required
                className="w-full mt-1 p-2 border rounded-md"
                placeholder="예: 10000000"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">인건비 (원)</label>
                <input 
                  type="number" 
                  name="laborCost" 
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">자재비 (원)</label>
                <input 
                  type="number" 
                  name="materialCost" 
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">외주비 (원)</label>
                <input 
                  type="number" 
                  name="outsourceCost" 
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">장비비 (원)</label>
                <input 
                  type="number" 
                  name="equipmentCost" 
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">기타비용 (원)</label>
                <input 
                  type="number" 
                  name="otherCost" 
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">적용 시작일</label>
                <input 
                  type="date" 
                  name="effectiveDate" 
                  className="w-full mt-1 p-2 border rounded-md"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">간접비율 (%)</label>
                <input 
                  type="number" 
                  name="indirectCostRate" 
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="예: 10"
                  defaultValue="0"
                />
              </div>
              <div>
                <label className="text-sm font-medium">판관비율 (%)</label>
                <input 
                  type="number" 
                  name="sellingAdminCostRate" 
                  className="w-full mt-1 p-2 border rounded-md"
                  placeholder="예: 5"
                  defaultValue="0"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">
                등록
              </Button>
              <Link href="/budget">
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
