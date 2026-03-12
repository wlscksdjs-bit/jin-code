import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Users, UserCheck, UserX, Briefcase, TrendingUp, Wrench, AlertTriangle } from 'lucide-react'

async function getResourcesData() {
  const [resources, stats, allocations] = await Promise.all([
    prisma.resource.findMany({
      orderBy: { name: 'asc' },
      include: {
        timeSheets: {
          where: {
            date: {
              gte: new Date(new Date().setDate(1)),
            },
          },
        },
      },
    }),
    prisma.resource.groupBy({
      by: ['availability'],
      _count: true,
    }),
    prisma.projectMember.findMany({
      include: {
        user: { select: { name: true } },
        project: { select: { name: true } },
      },
    }),
  ])

  const statusCounts = stats.reduce((acc, s) => {
    acc[s.availability] = s._count
    return acc
  }, {} as Record<string, number>)

  const resourceWorkload = resources.map(r => {
    const totalAllocation = allocations
      .filter(a => a.userId === r.employeeNumber)
      .reduce((sum, a) => sum + a.allocation, 0)
    
    const monthlyHours = r.timeSheets.reduce((sum, t) => sum + t.hours, 0)
    
    return {
      id: r.id,
      name: r.name,
      allocation: totalAllocation,
      monthlyHours,
    }
  })

  return { resources, statusCounts, resourceWorkload, allocations }
}

const AVAILABILITY_LABELS: Record<string, string> = {
  AVAILABLE: '가용',
  ASSIGNED: '배정됨',
  UNAVAILABLE: '불가',
  ON_LEAVE: '휴가',
}

export default async function ResourcesPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const { resources, statusCounts, resourceWorkload, allocations } = await getResourcesData()
  const totalResources = resources.length
  const availableCount = statusCounts.AVAILABLE || 0
  const assignedCount = statusCounts.ASSIGNED || 0

  const overloadedResources = resourceWorkload.filter(r => r.allocation > 1.0)
  const underutilizedResources = resourceWorkload.filter(r => r.allocation < 0.5 && r.allocation > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">인원리소스 관리</h1>
          <p className="text-slate-500">인력 현황 및 배정 관리</p>
        </div>
        <Link href="/resources/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            인력 등록
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">전체 인력</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              <div className="text-2xl font-bold">{totalResources}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">가용</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">배정됨</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-500" />
              <div className="text-2xl font-bold text-blue-600">{assignedCount}</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">휴가/불가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="w-5 h-5 text-orange-500" />
              <div className="text-2xl font-bold text-orange-600">
                {(statusCounts.ON_LEAVE || 0) + (statusCounts.UNAVAILABLE || 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workload Alerts */}
      {(overloadedResources.length > 0 || underutilizedResources.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {overloadedResources.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  부하 과다 ({overloadedResources.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overloadedResources.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span>{r.name}</span>
                      <span className="font-medium text-red-600">{Math.round(r.allocation * 100)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {underutilizedResources.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-blue-700">
                  <TrendingUp className="w-4 h-4" />
                  미활용 ({underutilizedResources.length}명)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {underutilizedResources.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span>{r.name}</span>
                      <span className="font-medium text-blue-600">{Math.round(r.allocation * 100)}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Resources Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => {
          const workload = resourceWorkload.find(w => w.id === resource.id)
          const allocationPercent = Math.round((workload?.allocation || 0) * 100)
          
          return (
            <Card key={resource.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                    <p className="text-sm text-slate-500">{resource.employeeNumber}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(resource.availability)}`}>
                    {AVAILABILITY_LABELS[resource.availability] || resource.availability}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">부서</span>
                    <span>{resource.department || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">직급</span>
                    <span>{resource.position || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">등급</span>
                    <span>{resource.grade || '-'}</span>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-500">현재 배정</span>
                      <span className={`font-medium ${
                        allocationPercent > 100 ? 'text-red-600' :
                        allocationPercent < 50 ? 'text-blue-600' : 'text-green-600'
                      }`}>
                        {allocationPercent}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          allocationPercent > 100 ? 'bg-red-500' :
                          allocationPercent < 50 ? 'bg-blue-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(allocationPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {resource.skills && (
                    <div className="pt-2 border-t">
                      <span className="text-slate-500 text-xs">보유 기술</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {JSON.parse(resource.skills).slice(0, 3).map((skill: string, i: number) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                        {JSON.parse(resource.skills).length > 3 && (
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                            +{JSON.parse(resource.skills).length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        {resources.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            등록된 인력이 없습니다
          </div>
        )}
      </div>
    </div>
  )
}
