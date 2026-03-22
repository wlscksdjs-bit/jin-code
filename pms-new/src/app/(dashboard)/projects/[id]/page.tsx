'use client'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getProject } from '@/app/actions/projects'
import { listCostEstimates } from '@/app/actions/cost-estimates'
import { listCostExecutions } from '@/app/actions/cost-executions'
import { listBudgets } from '@/app/actions/budgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: '등록',
  CONTRACT: '계약',
  DESIGN: '설계',
  PROCUREMENT: '조달',
  CONSTRUCTION: '시공',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

const TABS = [
  { key: 'overview', label: '개요' },
  { key: 'estimate', label: '견적원가' },
  { key: 'execution', label: '실행원가' },
  { key: 'budget', label: '예산' },
]

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return null

  const [project, estimates, executions, budgets] = await Promise.all([
    getProject(id),
    listCostEstimates(id),
    listCostExecutions(id),
    listBudgets(id),
  ])

  if (!project) notFound()

  const fmt = (v: number) => `${v.toLocaleString('ko-KR')}원`
  const latestEstimate = estimates[0]
  const latestExecution = executions[0]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            <Badge variant="secondary">{STATUS_LABELS[project.status] ?? project.status}</Badge>
          </div>
          <p className="mt-1 font-mono text-sm text-gray-500">{project.code}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/edit`}><Button variant="outline">편집</Button></Link>
          <Link href={`/cost/${id}/estimate`}><Button>견적원가 등록</Button></Link>
          <Link href={`/cost/${id}/execution`}><Button>실행원가 등록</Button></Link>
          <Link href={`/cost/${id}/monthly`}><Button variant="secondary">월별 실적</Button></Link>
          <Link href={`/projects/${id}/cashflow`}><Button variant="secondary">자금수지</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">계약금액</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(project.contractAmount)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">예산</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(project.estimatedBudget)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">예산 사용률</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{project.budgetUsageRate.toFixed(1)}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">영업이익</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(project.dashboard?.profitRate ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {project.dashboard?.profitRate?.toFixed(1) ?? '-'}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>기본 정보</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div><p className="text-xs text-gray-500">발주처</p><p className="font-medium">{project.customer?.name ?? '-'}</p></div>
            <div><p className="text-xs text-gray-500">유형</p><p className="font-medium">{project.type ?? '-'}</p></div>
            <div><p className="text-xs text-gray-500">계약유형</p><p className="font-medium">{project.contractType ?? '-'}</p></div>
            <div><p className="text-xs text-gray-500">위치</p><p className="font-medium">{project.location ?? '-'}</p></div>
            <div><p className="text-xs text-gray-500">시작일</p><p className="font-medium">{project.startDate ? new Date(project.startDate).toLocaleDateString('ko-KR') : '-'}</p></div>
            <div><p className="text-xs text-gray-500">종료일</p><p className="font-medium">{project.endDate ? new Date(project.endDate).toLocaleDateString('ko-KR') : '-'}</p></div>
          </div>
          {project.description && (
            <>
              <Separator className="my-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400">{project.description}</p>
            </>
          )}
        </CardContent>
      </Card>

      {latestEstimate && (
        <Card>
          <CardHeader><CardTitle>최근 견적원가</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div><p className="text-xs text-gray-500">총제조원가</p><p className="font-bold">{fmt(latestEstimate.totalManufacturingCost)}</p></div>
              <div><p className="text-xs text-gray-500">판관비(12%)</p><p className="font-bold">{fmt(latestEstimate.sellingAdminCost)}</p></div>
              <div><p className="text-xs text-gray-500">제조이익</p><p className="font-bold">{fmt(latestEstimate.grossProfit)}</p></div>
              <div><p className="text-xs text-gray-500">영업이익</p><p className={`font-bold ${latestEstimate.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(latestEstimate.operatingProfit)}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      {executions.length > 0 && (
        <Card>
          <CardHeader><CardTitle>최근 실행원가 ({executions[0].periodYear}-{String(executions[0].periodMonth).padStart(2, '0')})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div><p className="text-xs text-gray-500">재료비</p><p className="font-bold">{fmt(latestExecution?.materialCost ?? 0)}</p></div>
              <div><p className="text-xs text-gray-500">노무비</p><p className="font-bold">{fmt(latestExecution?.laborCost ?? 0)}</p></div>
              <div><p className="text-xs text-gray-500">외주비</p><p className="font-bold">{fmt((latestExecution?.outsourceFabrication ?? 0) + (latestExecution?.outsourceService ?? 0))}</p></div>
              <div><p className="text-xs text-gray-500">경비</p><p className="font-bold">{fmt(latestExecution?.totalExpense ?? 0)}</p></div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle> 견적원가 목록 ({estimates.length})</CardTitle></CardHeader>
        <CardContent>
          {estimates.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">등록된 견적원가가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {estimates.map((e) => (
                <Link key={e.id} href={`/cost/${id}/estimate/${e.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-xs text-gray-500">v{e.version} · {new Date(e.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{fmt(e.operatingProfit)}</p>
                    <p className="text-xs text-gray-500">{e.profitRate?.toFixed(1)}%</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>실행원가 목록 ({executions.length})</CardTitle></CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="py-4 text-sm text-gray-500">등록된 실행원가가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {executions.map((e) => (
                <Link key={e.id} href={`/cost/${id}/execution/${e.id}`} className="flex items-center justify-between rounded-md border p-3 hover:bg-gray-50 dark:hover:bg-gray-900">
                  <div>
                    <p className="font-medium">{e.periodYear}-{String(e.periodMonth).padStart(2, '0')}</p>
                    <p className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleDateString('ko-KR')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{fmt(e.totalExpense)}</p>
                    <p className="text-xs text-gray-500">지출</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
