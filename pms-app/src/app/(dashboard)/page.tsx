import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  FolderKanban, 
  TrendingUp, 
  Users, 
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Activity,
  Plus,
  Calculator,
  ClipboardList,
  TrendingDown,
  Target,
  Zap
} from 'lucide-react'
import { formatCurrency, formatDate, getStatusColor, getProjectTypeLabel } from '@/lib/utils'
import Link from 'next/link'

async function getDashboardData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [
    totalProjects,
    activeProjects,
    totalSales,
    activeResources,
    recentProjects,
    budgetSummary,
    projectStats,
    delayedProjects,
    upcomingMilestones,
    recentFinances,
    completedThisMonth,
    costEstimateSummary,
    costExecutionSummary,
    salesSummary,
    profitAnalysis
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: { not: 'COMPLETED' } } }),
    prisma.sales.count({ where: { status: 'WON' } }),
    prisma.resource.count({ where: { isActive: true } }),
    prisma.project.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { customer: true, _count: { select: { wbsItems: true } } }
    }),
    prisma.budget.aggregate({
      _sum: { totalBudget: true, actualCost: true }
    }),
    prisma.project.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.project.findMany({
      where: {
        status: { not: 'COMPLETED' },
        wbsItems: {
          some: {
            status: 'DELAYED'
          }
        }
      },
      select: { id: true, name: true }
    }),
    prisma.wbsItem.findMany({
      where: {
        isMilestone: true,
        status: { not: 'COMPLETED' },
        endDate: {
          gte: today,
          lte: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)
        }
      },
      include: { project: { select: { name: true, id: true } } },
      orderBy: { endDate: 'asc' },
      take: 5
    }),
    prisma.finance.findMany({
      orderBy: { occurDate: 'desc' },
      take: 5,
      include: { project: { select: { name: true } } }
    }),
    prisma.project.count({
      where: {
        status: 'COMPLETED',
        updatedAt: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1)
        }
      }
    }),
    prisma.costEstimate.aggregate({
      _sum: { contractAmount: true, operatingProfit: true }
    }),
    prisma.costExecution.aggregate({
      _sum: { totalManufacturingCost: true, operatingProfit: true }
    }),
    prisma.sales.aggregate({
      where: { status: { in: ['WON', 'SUBMITTED', 'EVALUATING'] } },
      _sum: { contractAmount: true, bidAmount: true }
    }),
    prisma.project.aggregate({
      _sum: { contractAmount: true }
    })
  ])

  const statusCounts = projectStats.reduce((acc, p) => {
    acc[p.status] = p._count
    return acc
  }, {} as Record<string, number>)

  return {
    totalProjects,
    activeProjects,
    totalSales,
    activeResources,
    recentProjects,
    totalBudget: budgetSummary._sum.totalBudget || 0,
    totalActual: budgetSummary._sum.actualCost || 0,
    statusCounts,
    delayedProjects,
    upcomingMilestones,
    recentFinances,
    completedThisMonth,
    totalEstimateAmount: costEstimateSummary._sum.contractAmount || 0,
    totalEstimateProfit: costEstimateSummary._sum.operatingProfit || 0,
    totalExecutionCost: costExecutionSummary._sum.totalManufacturingCost || 0,
    totalExecutionProfit: costExecutionSummary._sum.operatingProfit || 0,
    potentialContract: salesSummary._sum.bidAmount || 0,
    totalProjectContract: profitAnalysis._sum.contractAmount || 0
  }
}

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const data = await getDashboardData()
  const budgetProgress = data.totalBudget > 0 
    ? Math.round((data.totalActual / data.totalBudget) * 100) 
    : 0

  const alerts = [
    ...data.delayedProjects.map(p => ({
      type: 'error' as const,
      message: `프로젝트 "${p.name}"이/가 지연되었습니다`,
      link: `/projects/${p.id}`
    })),
    ...data.upcomingMilestones.map(m => ({
      type: 'warning' as const,
      message: `마일스톤: ${m.name} (${m.project.name})`,
      link: `/projects/${m.projectId}`
    }))
  ]

  const budgetWarning = budgetProgress > 100 
    ? { type: 'error' as const, message: `예산 초과: ${budgetProgress}%` }
    : budgetProgress > 85 
      ? { type: 'warning' as const, message: `예산 사용률 높음: ${budgetProgress}%` }
      : null

  const kpiCards = [
    {
      title: '전체 프로젝트',
      value: data.totalProjects,
      subValue: `${data.activeProjects} 진행 중`,
      icon: FolderKanban,
      color: 'blue',
      link: '/projects',
      progress: data.totalProjects > 0 ? (data.activeProjects / data.totalProjects) * 100 : 0
    },
    {
      title: '수주 프로젝트',
      value: data.totalSales,
      subValue: `${data.completedThisMonth} 이번달 완료`,
      icon: TrendingUp,
      color: 'green',
      link: '/sales',
      progress: 100
    },
    {
      title: '총 예산',
      value: formatCurrency(data.totalBudget),
      subValue: `${budgetProgress}% 사용`,
      icon: DollarSign,
      color: budgetProgress > 100 ? 'red' : budgetProgress > 85 ? 'orange' : 'green',
      link: '/budget',
      progress: Math.min(budgetProgress, 100),
      isCurrency: true
    },
    {
      title: '활성 인력',
      value: data.activeResources,
      subValue: '투입 가능',
      icon: Users,
      color: 'purple',
      link: '/resources',
      progress: 100
    }
  ]

  const quickActions = [
    { icon: Plus, label: '새 프로젝트', href: '/projects/new', color: 'blue' },
    { icon: Calculator, label: '예산 등록', href: '/budget/new', color: 'green' },
    { icon: ClipboardList, label: '진행 기록', href: '/progress/new', color: 'orange' },
    { icon: TrendingUp, label: '영업 수주', href: '/sales/new', color: 'purple' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">안녕하세요, {session.user.name || 'PM'}님</h1>
          <p className="text-slate-500">오늘도 효율적인 프로젝트 관리를 시작하세요.</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-lg font-medium">{new Date().toLocaleDateString('ko-KR', { weekday: 'long' })}</p>
          <p className="text-sm text-slate-500">{new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Alerts */}
      {(alerts.length > 0 || budgetWarning) && (
        <div className="space-y-2 animate-fade-in">
          {budgetWarning && (
            <Link href="/budget" className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              budgetWarning.type === 'error' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{budgetWarning.message}</span>
              <span className="ml-auto text-xs">보기 →</span>
            </Link>
          )}
          {alerts.slice(0, 3).map((alert, i) => (
            <Link key={i} href={alert.link} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
              alert.type === 'error' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
            }`}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{alert.message}</span>
            </Link>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, i) => {
          const Icon = kpi.icon
          const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            red: 'from-red-500 to-red-600',
            orange: 'from-orange-500 to-orange-600',
            purple: 'from-purple-500 to-purple-600'
          }
          
          return (
            <Link key={i} href={kpi.link} className="group">
              <Card className="overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer border-0">
                <div className={`h-1.5 bg-gradient-to-r ${colorClasses[kpi.color as keyof typeof colorClasses]}`} />
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-slate-600">{kpi.title}</CardTitle>
                  <div className={`p-2 rounded-lg bg-${kpi.color}-100 text-${kpi.color}-600`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kpi.isCurrency ? kpi.value : kpi.value}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${
                      kpi.color === 'red' ? 'text-red-600' : 
                      kpi.color === 'orange' ? 'text-orange-600' : 
                      'text-slate-500'
                    }`}>{kpi.subValue}</span>
                  </div>
                  <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${colorClasses[kpi.color as keyof typeof colorClasses]} transition-all duration-500`}
                      style={{ width: `${kpi.progress}%` }}
                    />
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Cost Summary Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-green-500" />
            원가 요약 (견적 vs 실행)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">총 견적금액</div>
              <div className="text-xl font-bold">{formatCurrency(data.totalEstimateAmount)}</div>
            </div>
            <div className={`p-4 rounded-lg ${data.totalEstimateProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-sm mb-1 ${data.totalEstimateProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>견적이익</div>
              <div className={`text-xl font-bold ${data.totalEstimateProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.totalEstimateProfit >= 0 ? '+' : ''}{formatCurrency(data.totalEstimateProfit)}
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">총 실행원가</div>
              <div className="text-xl font-bold">{formatCurrency(data.totalExecutionCost)}</div>
            </div>
            <div className={`p-4 rounded-lg ${data.totalExecutionProfit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className={`text-sm mb-1 ${data.totalExecutionProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>실행이익</div>
              <div className={`text-xl font-bold ${data.totalExecutionProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.totalExecutionProfit >= 0 ? '+' : ''}{formatCurrency(data.totalExecutionProfit)}
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Link href="/cost">
              <Button variant="outline" size="sm">
                원가 관리 →
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Business Plan vs Actual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            사업 계획 대비 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 mb-1">총 계약금액</div>
              <div className="text-xl font-bold">{formatCurrency(data.totalProjectContract)}</div>
              <div className="text-xs text-purple-500 mt-1">진행 중인 입찰: {formatCurrency(data.potentialContract)}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 mb-1">견적·실행 이익</div>
              <div className={`text-xl font-bold ${data.totalExecutionProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.totalExecutionProfit >= 0 ? '+' : ''}{formatCurrency(data.totalExecutionProfit)}
              </div>
              <div className="text-xs text-green-500 mt-1">견적 이익: {formatCurrency(data.totalEstimateProfit)}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 mb-1">수주 프로젝트</div>
              <div className="text-xl font-bold">{data.totalSales}건</div>
              <div className="text-xs text-blue-500 mt-1">진행 중: {data.activeProjects}건</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="text-sm text-orange-600 mb-1">예산 사용률</div>
              <div className="text-xl font-bold">{budgetProgress}%</div>
              <div className="text-xs text-orange-500 mt-1">
                {formatCurrency(data.totalActual)} / {formatCurrency(data.totalBudget)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '진행 중', count: data.statusCounts.CONSTRUCTION || 0, color: 'blue', icon: Activity },
          { label: '설계/준비', count: (data.statusCounts.REGISTERED || 0) + (data.statusCounts.DESIGN || 0), color: 'orange', icon: Clock },
          { label: '완료', count: data.statusCounts.COMPLETED || 0, color: 'green', icon: CheckCircle },
          { label: '지연', count: (data.statusCounts.DELAYED || 0) + (data.statusCounts.CANCELLED || 0), color: 'red', icon: AlertTriangle },
        ].map((status, i) => {
          const Icon = status.icon
          const colorMap = {
            blue: 'bg-blue-50 text-blue-700 border-blue-200',
            green: 'bg-green-50 text-green-700 border-green-200',
            orange: 'bg-orange-50 text-orange-700 border-orange-200',
            red: 'bg-red-50 text-red-700 border-red-200'
          }
          
          return (
            <Link key={i} href={`/projects?status=${status.label}`} className={colorMap[status.color as keyof typeof colorMap].split(' ')[0]}>
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${colorMap[status.color as keyof typeof colorMap]} transition-all hover:scale-[1.02]`}>
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <p className="text-xs opacity-80">{status.label}</p>
                  <p className="text-xl font-bold">{status.count}</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Main Content */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Projects */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              최근 프로젝트
            </CardTitle>
            <Link href="/projects" className="text-sm text-blue-600 hover:underline font-medium">
              전체 보기 →
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentProjects.length === 0 ? (
              <div className="text-center py-12">
                <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-4">프로젝트가 없습니다</p>
                <Link href="/projects/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    새 프로젝트 만들기
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {data.recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-start gap-3 p-3 rounded-lg border hover:bg-slate-50 hover:border-blue-300 transition-all group"
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${
                      project.status === 'COMPLETED' ? 'bg-green-500' :
                      project.status === 'CONSTRUCTION' ? 'bg-blue-500' :
                      project.status === 'DESIGN' ? 'bg-purple-500' :
                      'bg-slate-400'
                    }`}>
                      {project._count.wbsItems}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate group-hover:text-blue-600">{project.name}</p>
                      <p className="text-xs text-slate-500 truncate">{project.customer?.name || '고객사 미지정'}</p>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-xs ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Finance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              최근 거래
            </CardTitle>
            <Link href="/finance" className="text-sm text-blue-600 hover:underline font-medium">
              전체 보기 →
            </Link>
          </CardHeader>
          <CardContent>
            {data.recentFinances.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">거래 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {data.recentFinances.map((finance) => (
                  <div key={finance.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{finance.project.name}</p>
                      <p className="text-xs text-slate-500">{finance.category}</p>
                    </div>
                    <span className={`text-sm font-bold whitespace-nowrap ${
                      finance.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {finance.type === 'REVENUE' ? '+' : '-'}{formatCurrency(finance.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            빠른 작업
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, i) => {
              const Icon = action.icon
              const colorMap = {
                blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
                green: 'border-green-200 hover:border-green-400 hover:bg-green-50',
                orange: 'border-orange-200 hover:border-orange-400 hover:bg-orange-50',
                purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
              }
              
              return (
                <Link
                  key={i}
                  href={action.href}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${colorMap[action.color as keyof typeof colorMap]}`}
                >
                  <div className={`p-2 rounded-lg bg-${action.color}-100`}>
                    <Icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <span className="font-medium text-sm">{action.label}</span>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Hint */}
      <div className="text-center text-xs text-slate-400 py-2">
        키보드 단축키: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600">N</kbd> 새 프로젝트 <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 ml-2">B</kbd> 예산
      </div>
    </div>
  )
}
