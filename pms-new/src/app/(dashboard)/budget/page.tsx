import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listProjects } from '@/app/actions/projects'
import { listBudgets } from '@/app/actions/budgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function BudgetPage() {
  const session = await auth()
  if (!session) return null

  const projects = await listProjects()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">예산 관리</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">프로젝트별 예산 관리</p>
      </div>

      <Card>
        <CardHeader><CardTitle>프로젝트별 예산</CardTitle></CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">프로젝트가 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((p) => (
                <div key={p.id} className="rounded-md border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="font-mono text-xs text-gray-500">{p.code}</p>
                    </div>
                    <Link href={`/budget/${p.id}`}><Badge variant="secondary">예산 보기</Badge></Link>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div><p className="text-xs text-gray-500">예산</p><p className="font-bold">{p.estimatedBudget.toLocaleString('ko-KR')}원</p></div>
                    <div><p className="text-xs text-gray-500">사용률</p><p className="font-bold">{p.budgetUsageRate.toFixed(1)}%</p></div>
                    <div><p className="text-xs text-gray-500">잔액</p><p className="font-bold">{((p.estimatedBudget || 0) - ((p.estimatedBudget || 0) * (p.budgetUsageRate / 100))).toLocaleString('ko-KR')}원</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
