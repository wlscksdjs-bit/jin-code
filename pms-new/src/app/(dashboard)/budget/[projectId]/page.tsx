import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getProject } from '@/app/actions/projects'
import { listBudgets, createBudget, updateBudget } from '@/app/actions/budgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function ProjectBudgetPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params
  const [project, budgets] = await Promise.all([getProject(projectId), listBudgets(projectId)])
  if (!project) notFound()

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">예산 관리</h1>
          <p className="text-sm text-gray-500">{project.name}</p>
        </div>
        <a href={`/budget/${projectId}/new`}><Button>예산 등록</Button></a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">총 예산</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(project.estimatedBudget)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">사용률</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{project.budgetUsageRate.toFixed(1)}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">계약금액</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(project.contractAmount)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>예산 목록 ({budgets.length})</CardTitle></CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">등록된 예산이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {budgets.map((b) => (
                <div key={b.id} className="rounded-md border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{b.type === 'INITIAL' ? '초기 예산' : b.type === 'REVISED' ? '수정 예산' : b.type}</p>
                      <p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={b.status === 'APPROVED' ? 'default' : 'secondary'}>{b.status}</Badge>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-4">
                    <div><p className="text-xs text-gray-500">총 예산</p><p className="font-bold">{fmt(b.totalBudget)}</p></div>
                    <div><p className="text-xs text-gray-500">실제 비용</p><p className="font-bold">{fmt(b.actualCost)}</p></div>
                    <div><p className="text-xs text-gray-500">차이</p><p className={`font-bold ${b.totalBudget - b.actualCost >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(b.totalBudget - b.actualCost)}</p></div>
                    <div><p className="text-xs text-gray-500">수익률</p><p className={`font-bold ${b.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{b.profitMargin.toFixed(1)}%</p></div>
                  </div>
                  {b.items.length > 0 && (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-t">
                            <th className="py-1 text-left text-gray-500">항목</th>
                            <th className="py-1 text-right text-gray-500">계획</th>
                            <th className="py-1 text-right text-gray-500">실제</th>
                            <th className="py-1 text-right text-gray-500">차이</th>
                          </tr>
                        </thead>
                        <tbody>
                          {b.items.slice(0, 5).map((item) => (
                            <tr key={item.id} className="border-t">
                              <td className="py-1">{item.name}</td>
                              <td className="py-1 text-right">{fmt(item.plannedAmount)}</td>
                              <td className="py-1 text-right">{fmt(item.actualAmount)}</td>
                              <td className={`py-1 text-right ${item.plannedAmount - item.actualAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {fmt(item.plannedAmount - item.actualAmount)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
