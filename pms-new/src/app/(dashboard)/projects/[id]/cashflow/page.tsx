'use client'
import { notFound } from 'next/navigation'
import { getProject } from '@/app/actions/projects'
import { getCashFlowSummary, listCashFlows, createCashFlow } from '@/app/actions/cash-flow'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function CashFlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  const [summary, flows] = await Promise.all([
    getCashFlowSummary(id),
    listCashFlows(id),
  ])

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  const inflows = flows.filter((f) => f.type === 'INFLOW')
  const outflows = flows.filter((f) => f.type === 'OUTFLOW')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">자금수지</h1>
        <p className="text-sm text-gray-500">{project.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">계획 수입</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{fmt(summary.totalPlannedInflow)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">실제 수입</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-blue-600">{fmt(summary.totalActualInflow)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">실제 지출</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-red-600">{fmt(summary.totalActualOutflow)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">잔액</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(summary.balance)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>수입 흐름</CardTitle></CardHeader>
          <CardContent>
            {inflows.length === 0 ? (
              <p className="text-sm text-gray-500">수입 내역 없음</p>
            ) : (
              <div className="space-y-2">
                {inflows.map((f) => (
                  <div key={f.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="text-sm font-medium">{f.description ?? f.category ?? '수입'}</p>
                      <p className="text-xs text-gray-500">{new Date(f.plannedDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">+{fmt(f.actualAmount)}</p>
                      <p className="text-xs text-gray-500">계획: {fmt(f.plannedAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>지출 흐름</CardTitle></CardHeader>
          <CardContent>
            {outflows.length === 0 ? (
              <p className="text-sm text-gray-500">지출 내역 없음</p>
            ) : (
              <div className="space-y-2">
                {outflows.map((f) => (
                  <div key={f.id} className="flex items-center justify-between border-b pb-2">
                    <div>
                      <p className="text-sm font-medium">{f.description ?? f.category ?? '지출'}</p>
                      <p className="text-xs text-gray-500">{new Date(f.plannedDate).toLocaleDateString('ko-KR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-600">-{fmt(f.actualAmount)}</p>
                      <p className="text-xs text-gray-500">계획: {fmt(f.plannedAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
