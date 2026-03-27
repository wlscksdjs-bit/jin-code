import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listSales } from '@/app/actions/sales'
import { computeSalesCost } from '@/lib/sales-utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<string, string> = {
  WAITING: '대기', IN_PROGRESS: '진행', COMPLETED: '완료',
  DRAFT: '작성중', SUBMITTED: '제출', EVALUATING: '평가중',
  WON: '수주', LOST: '실패', CANCELLED: '취소',
}

const PIPELINE = ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'DRAFT', 'SUBMITTED', 'EVALUATING', 'WON', 'LOST', 'CANCELLED']

export default async function SalesPage() {
  const session = await auth()
  if (!session) return null

  const allSales = await listSales()

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`
  const fmtPct = (n: number) => `${n.toFixed(1)}%`

  const byStatus = PIPELINE.reduce<Record<string, typeof allSales>>((acc, s) => {
    acc[s] = allSales.filter((x) => x.status === s)
    return acc
  }, {})

  const totalBid = allSales.reduce((s, x) => s + x.bidAmount, 0)
  const totalWon = allSales.filter((x) => x.status === 'WON').reduce((s, x) => s + x.contractAmount, 0)

  const computed = allSales.map(s => ({
    ...s,
    ...computeSalesCost(s)
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">수주 영업</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{allSales.length}건</p>
        </div>
        <Link href="/sales/new"><Button>새 영업</Button></Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">총 입찰 금액</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(totalBid)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">수주 금액</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{fmt(totalWon)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">수주율</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBid > 0 ? ((totalWon / totalBid) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>파이프라인</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {PIPELINE.map((s) => (
              <div key={s} className="min-w-[200px] rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">{STATUS_LABELS[s]}</span>
                  <Badge variant="secondary">{byStatus[s].length}</Badge>
                </div>
                <div className="space-y-2">
                  {byStatus[s].slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded bg-gray-50 p-2 dark:bg-gray-900">
                      <p className="truncate text-xs font-medium">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.customer?.name ?? '-'}</p>
                      <p className="text-xs font-bold">{fmt(item.status === 'WON' ? item.contractAmount : item.bidAmount)}</p>
                    </div>
                  ))}
                  {byStatus[s].length > 3 && (
                    <p className="text-center text-xs text-gray-400">+{byStatus[s].length - 3}건</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>전체 목록</CardTitle></CardHeader>
        <CardContent className="p-0">
          {allSales.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">영업 데이터가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-900">
                    <th className="px-3 py-2 text-left text-xs text-gray-500">프로젝트명</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">발주처</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">구분</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">현 상태</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">입찰금액</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">입찰마감일</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">개찰일</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">수주확실도</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">원가</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">이익</th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">이익률</th>
                    <th className="px-3 py-2 text-left text-xs text-gray-500">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {computed.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-3 py-2 font-medium">{s.title}</td>
                      <td className="px-3 py-2 text-gray-500">{s.customer?.name ?? '-'}</td>
                      <td className="px-3 py-2">
                        <Badge variant="outline">{s.type === 'BIDDING' ? '입찰' : s.type === 'CHANGE_ORDER' ? '수주변경' : '수주'}</Badge>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant={s.status === 'COMPLETED' ? 'default' : s.status === 'IN_PROGRESS' ? 'blue' : s.status === 'WAITING' ? 'secondary' : 'outline'}>
                          {STATUS_LABELS[s.status] ?? s.status}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right">{fmt(s.bidAmount)}</td>
                      <td className="px-3 py-2 text-gray-500">
                        {s.submissionDate ? new Date(s.submissionDate).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {s.bidOpenDate ? new Date(s.bidOpenDate).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {s.winProbability ? fmtPct(s.winProbability) : '-'}
                      </td>
                      <td className="px-3 py-2 text-right">{fmt(s.totalCost)}</td>
                      <td className={`px-3 py-2 text-right ${s.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(s.profit)}
                      </td>
                      <td className={`px-3 py-2 text-right ${s.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmtPct(s.profitRate)}
                      </td>
                      <td className="px-3 py-2 text-gray-500 max-w-[100px] truncate">{s.notes ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
