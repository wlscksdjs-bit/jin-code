import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, getProjectTypeLabel, formatDate, formatCurrency } from '@/lib/utils'
import { 
  FolderKanban, MapPin, Calendar, DollarSign, 
  Users, Edit, Trash2, ArrowLeft, Copy, TrendingUp, TrendingDown
} from 'lucide-react'
import Link from 'next/link'
import { deleteProject } from '@/app/actions/projects'
import { ProjectScheduleView } from '@/components/project-schedule-view'
import { ResourceAllocation } from '@/components/resource-allocation'
import { ProfitLossCard } from '@/components/profit-loss-card'
import { AddWbsForm } from '@/components/projects/add-wbs-form'
import { calculateProfitLoss } from '@/app/actions/profit-loss'
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart'
import { ProjectPrintButton } from '@/components/projects/project-print-button'
import { KPICard } from '@/components/dashboard/kpi-card'
import { calculateProjectKPI } from '@/lib/kpi'
import { calculateCPM, generateCPMFromWbsItems } from '@/lib/cpm'

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      members: { include: { user: true } },
      wbsItems: { 
        orderBy: { sortOrder: 'asc' },
        include: { componentOrders: true }
      },
      budgets: { orderBy: { createdAt: 'desc' }, take: 1 },
      sales: { orderBy: { createdAt: 'desc' }, take: 1 },
      costEstimates: { orderBy: { createdAt: 'desc' }, take: 5 },
      costExecutions: { orderBy: { recordedDate: 'desc' }, take: 12 },
      timeSheets: { 
        orderBy: { date: 'desc' },
        include: { user: { select: { id: true, name: true } } },
        take: 20
      },
      cashFlows: { 
        orderBy: { plannedDate: 'asc' }, 
        take: 24 
      }
    },
  })
}

async function getAvailableUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, department: true }
  })
}

export default async function ProjectDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    redirect('/login')
  }

  const project = await getProject(id)
  const availableUsers = await getAvailableUsers()
  const profitLossData = await calculateProfitLoss(id)

  if (!project) {
    redirect('/projects')
  }

  const monthlyDataMap = new Map<string, { month: string, inflow: number, outflow: number, balance: number }>()
  
  project.cashFlows.forEach(cf => {
    const month = cf.plannedDate.toISOString().substring(0, 7)
    const current = monthlyDataMap.get(month) || { month, inflow: 0, outflow: 0, balance: 0 }
    
    if (cf.type === 'INFLOW') {
      current.inflow += cf.plannedAmount
    } else {
      current.outflow += cf.plannedAmount
    }
    
    monthlyDataMap.set(month, current)
  })

  const cashFlowChartData = Array.from(monthlyDataMap.values())
    .sort((a, b) => a.month.localeCompare(b.month))
  
  let runningBalance = 0
  cashFlowChartData.forEach(data => {
    runningBalance += (data.inflow - data.outflow)
    data.balance = runningBalance
  })

  const deleteAction = deleteProject.bind(null, project.id)

  const kpi = calculateProjectKPI(
    project.wbsItems,
    project.costExecutions,
    project.startDate,
    project.endDate
  )

  const cpmResult = calculateCPM(generateCPMFromWbsItems(project.wbsItems))
  const criticalPathCount = cpmResult.criticalPath.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <p className="text-sm text-slate-500">{project.code}</p>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <ProjectPrintButton project={project} />
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
          </Link>
          <form action={deleteAction}>
            <Button variant="destructive" type="submit">
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </Button>
          </form>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700">
          {getProjectTypeLabel(project.type)}
        </span>
        {project.contractType && (
          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
            {project.contractType}
          </span>
        )}
      </div>

      {/* Main Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">계약금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.contractAmount ? formatCurrency(project.contractAmount) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">추정 예산</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">고객사</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {project.customer?.name || '-'}
            </div>
          </CardContent>
        </Card>
        <ResourceAllocation 
          projectId={project.id} 
          members={project.members} 
          availableUsers={availableUsers} 
        />
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              일정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">시작일</span>
              <span>{project.startDate ? formatDate(project.startDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">종료일</span>
              <span>{project.endDate ? formatDate(project.endDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">계약일</span>
              <span>{project.contractDate ? formatDate(project.contractDate) : '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              현장 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">지역</span>
              <span>{project.location || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">주소</span>
              <span>{project.address || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* WBS Progress / Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5" />
                공정 진행 ({project.wbsItems.length}건)
              </CardTitle>
              <AddWbsForm projectId={project.id} existingWbs={project.wbsItems} />
            </div>
          </CardHeader>
          <CardContent>
            <ProjectScheduleView 
              wbsItems={project.wbsItems} 
              projectStartDate={project.startDate}
              projectEndDate={project.endDate}
            />
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              예산 ({project.budgets.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.budgets.length === 0 ? (
              <p className="text-slate-500 text-center py-4">등록된 예산이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {project.budgets.map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">{budget.type}</div>
                      <div className={`px-2 py-0.5 rounded text-xs inline-block mt-1 ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(budget.totalBudget)}</div>
                      <div className="text-sm text-slate-500">
                        사용: {formatCurrency(budget.actualCost)} ({budget.totalBudget > 0 ? Math.round((budget.actualCost / budget.totalBudget) * 100) : 0}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Loss */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <ProfitLossCard data={profitLossData} />
          </CardContent>
        </Card>

        {/* Cost Management */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              원가 현황 (견적 vs 실행)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {project.costEstimates.length === 0 && project.costExecutions.length === 0 ? (
              <p className="text-slate-500 text-center py-4">등록된 원가 정보가 없습니다</p>
            ) : (
              <>
                {project.costEstimates.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-slate-500">견적원가</h4>
                    {project.costEstimates.map((ce) => (
                      <div key={ce.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div>
                          <div className="font-medium">{ce.title}</div>
                          <div className={`px-2 py-0.5 rounded text-xs inline-block mt-1 ${
                            ce.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 
                            ce.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100'
                          }`}>
                            {ce.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(ce.contractAmount)}</div>
                          <div className={`text-sm ${ce.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {ce.operatingProfit >= 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                            {ce.profitRate.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {project.costExecutions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-slate-500">실행원가</h4>
                    {project.costExecutions.slice(0, 3).map((ex) => (
                      <div key={ex.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium">{ex.type} - {ex.periodYear}/{ex.periodMonth || '-'}</div>
                          <div className={`px-2 py-0.5 rounded text-xs inline-block mt-1 ${
                            ex.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 
                            ex.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100'
                          }`}>
                            {ex.status}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{formatCurrency(ex.totalManufacturingCost)}</div>
                          <div className={`text-sm ${ex.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {ex.operatingProfit >= 0 ? <TrendingUp className="w-4 h-4 inline mr-1" /> : <TrendingDown className="w-4 h-4 inline mr-1" />}
                            {ex.operatingProfit.toLocaleString()}원
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Link href="/cost">
                <Button variant="outline" size="sm">
                  원가 관리 →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* TimeSheet */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              인력 투입 현황 (TimeSheet)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.timeSheets.length === 0 ? (
              <p className="text-slate-500 text-center py-4">등록된 근무시간이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {project.timeSheets.slice(0, 10).map((ts) => (
                  <div key={ts.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">{ts.user.name || 'Unknown'}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(ts.date).toLocaleDateString('ko-KR')} · {ts.workType}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{ts.hours}h</div>
                      {ts.totalCost && (
                        <div className="text-xs text-slate-500">{formatCurrency(ts.totalCost)}</div>
                      )}
                    </div>
                  </div>
                ))}
                {project.timeSheets.length > 10 && (
                  <p className="text-center text-sm text-slate-500 pt-2">
                    +{project.timeSheets.length - 10}건 더보기
                  </p>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Link href="/resources">
                <Button variant="outline" size="sm">
                  인력 관리 →
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        {project.description && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>설명</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        )}

        <div className="lg:col-span-2">
          <KPICard
            cpi={kpi.cpi}
            spi={kpi.spi}
            vac={kpi.vac}
            progress={kpi.progress}
          />
        </div>

        <div className="lg:col-span-2">
          <CashFlowChart data={cashFlowChartData} />
        </div>
      </div>
    </div>
  )
}
