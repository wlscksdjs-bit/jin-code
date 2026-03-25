import { notFound } from 'next/navigation'
import { getCostExecutionMonthlySummary } from '@/app/actions/dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function MonthlyCostPage({ params }: { params: Promise<{ projectId: string> }) {
  const { projectId } = await params
  const { rows, contractAmount } = await getCostExecutionMonthlySummary(projectId)

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`
  const fmtNum = (n: number) => n.toLocaleString('ko-KR')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">월별 원가 실적</h1>
        <p className="text-sm text-gray-500">누적 비용 추이 및 손익 분석</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">계약금액</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(contractAmount)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">누적 지출</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(rows.length > 0 ? rows[rows.length - 1].cumTotal : 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">예산 사용률</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rows.length > 0 ? rows[rows.length - 1].cumBudgetUsage.toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            등록된 월별 실적이 없습니다.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader><CardTitle>월별 누적 비용 추이</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2">기간</th>
                  <th className="pb-2 text-right">재료비</th>
                  <th className="pb-2 text-right">노무비</th>
                  <th className="pb-2 text-right">외주비</th>
                  <th className="pb-2 text-right">경비</th>
                  <th className="pb-2 text-right">간접비</th>
                  <th className="pb-2 text-right font-medium">당월 지출</th>
                  <th className="pb-2 text-right font-medium">누적 지출</th>
                  <th className="pb-2 text-right font-medium">누적 사용률</th>
                  <th className="pb-2 text-right font-medium">제조이익</th>
                  <th className="pb-2 text-right font-medium">영업이익</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {rows.map((r) => (
                  <tr key={`${r.periodYear}-${r.periodMonth}`}>
                    <td className="py-2 font-medium">{r.periodLabel}</td>
                    <td className="py-2 text-right">{fmtNum(r.cumMaterial)}</td>
                    <td className="py-2 text-right">{fmtNum(r.cumLabor)}</td>
                    <td className="py-2 text-right">{fmtNum(r.cumOutsource)}</td>
                    <td className="py-2 text-right">{fmtNum(r.cumOther + r.cumEquipment)}</td>
                    <td className="py-2 text-right">{fmtNum(r.cumIndirect)}</td>
                    <td className="py-2 text-right">{fmtNum(r.totalExpense)}</td>
                    <td className="py-2 text-right font-medium">{fmtNum(r.cumTotal)}</td>
                    <td className="py-2 text-right">
                      <Badge variant={r.cumBudgetUsage > 100 ? 'destructive' : r.cumBudgetUsage > 80 ? 'default' : 'secondary'}>
                        {r.cumBudgetUsage.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className={`py-2 text-right ${r.cumGrossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmtNum(r.cumGrossProfit)}
                    </td>
                    <td className={`py-2 text-right ${r.cumOperatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmtNum(r.cumOperatingProfit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>손익 누계</CardTitle></CardHeader>
        <CardContent>
          {rows.length > 0 && (
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">누적 제조이익</p>
                <p className={`text-lg font-bold ${rows[rows.length - 1].cumGrossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(rows[rows.length - 1].cumGrossProfit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">누적 판관비</p>
                <p className="text-lg font-bold">{fmt(rows[rows.length - 1].cumSellingAdmin)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">누적 영업이익</p>
                <p className={`text-lg font-bold ${rows[rows.length - 1].cumOperatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {fmt(rows[rows.length - 1].cumOperatingProfit)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">이익률</p>
                <p className={`text-lg font-bold ${rows[rows.length - 1].cumOperatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {contractAmount > 0 ? ((rows[rows.length - 1].cumOperatingProfit / contractAmount) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
