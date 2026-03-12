import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { BarChart3, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

async function getProgressData() {
  const projects = await prisma.project.findMany({
    where: { status: { not: 'COMPLETED' } },
    include: {
      wbsItems: {
        orderBy: { sortOrder: 'asc' },
      },
      progress: {
        orderBy: { date: 'desc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  return { projects }
}

export default async function ProgressPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const { projects } = await getProgressData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">공사진행 관리</h1>
          <p className="text-slate-500">공정별 진도율 및 진행 상황</p>
        </div>
        <Link href="/progress/new">
          <Button>
            <BarChart3 className="w-4 h-4 mr-2" />
            진행 기록
          </Button>
        </Link>
      </div>

      {/* Projects Progress */}
      <div className="grid gap-6">
        {projects.map((project) => {
          const avgProgress = project.wbsItems.length > 0
            ? Math.round(project.wbsItems.reduce((sum, w) => sum + w.progress, 0) / project.wbsItems.length)
            : 0

          const completedCount = project.wbsItems.filter(w => w.status === 'COMPLETED').length
          const inProgressCount = project.wbsItems.filter(w => w.status === 'IN_PROGRESS').length

          return (
            <Card key={project.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Link href={`/projects/${project.id}`}>
                      <CardTitle className="text-lg hover:underline">
                        {project.name}
                      </CardTitle>
                    </Link>
                    <p className="text-sm text-slate-500">{project.code}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{avgProgress}%</div>
                    <p className="text-xs text-slate-500">전체 진도</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          avgProgress >= 80 ? 'bg-green-500' :
                          avgProgress >= 50 ? 'bg-blue-500' :
                          avgProgress >= 25 ? 'bg-orange-500' : 'bg-slate-400'
                        }`}
                        style={{ width: `${avgProgress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      완료: {completedCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-blue-500" />
                      진행: {inProgressCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                      대기: {project.wbsItems.length - completedCount - inProgressCount}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.wbsItems.map((wbs) => (
                    <div 
                      key={wbs.id}
                      className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg"
                    >
                      <div className="w-8 text-sm font-medium text-slate-500">{wbs.code}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium truncate">{wbs.name}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getStatusColor(wbs.status)}`}>
                            {wbs.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${wbs.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 w-10 text-right">{wbs.progress}%</span>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 text-right whitespace-nowrap">
                        {wbs.startDate && formatDate(wbs.startDate)} ~ {wbs.endDate && formatDate(wbs.endDate)}
                      </div>
                    </div>
                  ))}
                  {project.wbsItems.length === 0 && (
                    <div className="text-center py-4 text-slate-500 text-sm">
                      등록된 공정이 없습니다
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {projects.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-slate-500">
              진행 중인 프로젝트가 없습니다
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
