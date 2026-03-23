import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getProject } from '@/app/actions/projects'
import { listBudgets } from '@/app/actions/budgets'
import { listCostExecutions } from '@/app/actions/cost-executions'
import { BudgetComparison } from '@/components/cost/BudgetComparison'
import { Button } from '@/components/ui/button'

export default async function BudgetComparisonPage({ params }: { params: Promise<{ projectId: string }> }) {
  const session = await auth()
  if (!session) redirect('/signin')

  const { projectId } = await params
  const project = await getProject(projectId)
  if (!project) notFound()

  const budgets = await listBudgets(projectId)
  const executions = await listCostExecutions(projectId)

  const currentBudget = budgets[0]

  if (!currentBudget) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">예산대비 현황</h1>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center dark:bg-yellow-900/20 dark:border-yellow-800">
          <p className="text-yellow-700 dark:text-yellow-400">설정된 예산이 없습니다.</p>
          <p className="text-sm text-yellow-600 dark:text-yellow-500 mt-2">
            견적원가를 작성하고 승인을 완료한 후 예산을 설정하세요.
          </p>
          <Link href={`/cost/${projectId}/estimate`}>
            <Button className="mt-4">견적원가 작성</Button>
          </Link>
        </div>
      </div>
    )
  }

  const executionsWithData = executions.map(e => ({
    data: [e],
    periodYear: e.periodYear,
    periodMonth: e.periodMonth,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">예산대비 현황</h1>
          <p className="text-sm text-gray-500">{project.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/cost/${projectId}/execution`}>
            <Button variant="outline">실행원가 등록</Button>
          </Link>
        </div>
      </div>

      <BudgetComparison
        budget={{
          id: currentBudget.id,
          totalBudget: currentBudget.totalBudget,
          materialCost: currentBudget.materialCost,
          laborCost: currentBudget.laborCost,
          items: currentBudget.items.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category,
            plannedAmount: item.plannedAmount,
            actualAmount: item.actualAmount,
          })),
        }}
        executions={executionsWithData}
      />
    </div>
  )
}
