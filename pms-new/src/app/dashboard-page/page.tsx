import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listProjects } from '@/app/actions/projects'
import { getProjectDashboardData } from '@/app/actions/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DashboardAlerts } from '@/components/dashboard-alerts'

export default async function DashboardPage() {
  const session = await auth()
  if (!session) return null

  const projects = await listProjects()

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  const projectKPIs = await Promise.all(
    projects.slice(0, 5).map(async (p) => {
      const dash = await getProjectDashboardData(p.id)
      return { ...p, dash }
    })
  )

  const inProgress = projects.filter((p) =>
    ['CONTRACT', 'DESIGN', 'PROCUREMENT', 'CONSTRUCTION'].includes(p.status)
  ).length

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{today}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {session.user.role === 'ADMIN' ? '관리자' : session.user.role === 'PM' ? '项目经理' : 'Staff'}
        </Badge>
      </div>

      <DashboardAlerts />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">전체 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}</div>
            <p className="text-xs text-gray-500">진행 중: {inProgress}개</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">진행 중인 프로젝트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inProgress}</div>
            <p className="text-xs text-gray-500">진행 중</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">전체 계약금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fmt(projects.reduce((s, p) => s + p.contractAmount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">평균 예산 사용률</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {projectKPIs.length > 0
                ? (projectKPIs.reduce((s, p) => s + p.dash.budgetUsageRate, 0) / projectKPIs.length).toFixed(1)
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {projectKPIs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>프로젝트별 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectKPIs.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50 dark:hover:bg-gray-900"
                >
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-gray-500">{p.code}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{fmt(p.dash.contractAmount)}</p>
                      <p className="text-xs text-gray-500">
                        사용률: {p.dash.budgetUsageRate.toFixed(1)}%
                      </p>
                    </div>
                    <Badge
                      variant={p.dash.isOnBudget ? 'secondary' : 'destructive'}
                    >
                      {p.dash.isOnBudget ? '정상' : '초과'}
                    </Badge>
                    <Badge
                      variant={p.dash.profitRate >= 0 ? 'secondary' : 'destructive'}
                    >
                      {p.dash.profitRate >= 0 ? `이익 ${p.dash.profitRate.toFixed(1)}%` : `손실 ${Math.abs(p.dash.profitRate).toFixed(1)}%`}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
            {projects.length > 5 && (
              <p className="mt-3 text-center text-sm text-gray-500">
                +{projects.length - 5}개 더보기
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>환영합니다, {session.user.name ?? '사용자'}님</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>PMS 2.0 프로젝트 관리 시스템에 오신 것을 환영합니다.</p>
          <div className="grid gap-2 md:grid-cols-3">
            <Link href="/projects/new" className="rounded-md border p-2 text-center hover:bg-gray-50 dark:hover:bg-gray-900">
              <p className="font-medium">+ 프로젝트</p>
              <p className="text-xs text-gray-500">새 프로젝트 등록</p>
            </Link>
            <Link href="/cost" className="rounded-md border p-2 text-center hover:bg-gray-50 dark:hover:bg-gray-900">
              <p className="font-medium">원가관리</p>
              <p className="text-xs text-gray-500">견적/실행원가</p>
            </Link>
            <Link href="/orders" className="rounded-md border p-2 text-center hover:bg-gray-50 dark:hover:bg-gray-900">
              <p className="font-medium">발주관리</p>
              <p className="text-xs text-gray-500">발주서/입고</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
