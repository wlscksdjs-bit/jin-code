import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listPurchaseOrders } from '@/app/actions/purchase-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '작성중',
  SENT: '발송',
  PARTIAL: '부분입고',
  RECEIVED: '입고완료',
  INSTALLED: '설치완료',
  CANCELLED: '취소',
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session) return null

  const orders = await listPurchaseOrders()

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">발주 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">발주서 목록 ({orders.length}건)</p>
        </div>
        <Link href="/orders/new"><Button>새 발주서</Button></Link>
      </div>

      <Card>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">발주서가 없습니다.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 dark:bg-gray-900">
                    <th className="px-4 py-2 text-left text-xs text-gray-500">발주번호</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-500">제목</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-500">거래처</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-500">프로젝트</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-500">상태</th>
                    <th className="px-4 py-2 text-right text-xs text-gray-500">금액</th>
                    <th className="px-4 py-2 text-left text-xs text-gray-500">발주일</th>
                    <th className="px-4 py-2 text-center text-xs text-gray-500">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="px-4 py-2 font-mono text-xs">{o.orderNumber}</td>
                      <td className="px-4 py-2 font-medium">{o.title}</td>
                      <td className="px-4 py-2 text-gray-500">{o.vendor.name}</td>
                      <td className="px-4 py-2 text-gray-500">{o.project.name}</td>
                      <td className="px-4 py-2">
                        <Badge variant="secondary">{STATUS_LABELS[o.status] ?? o.status}</Badge>
                      </td>
                      <td className="px-4 py-2 text-right">{fmt(o.totalAmount)}</td>
                      <td className="px-4 py-2 text-gray-500">
                        {new Date(o.orderDate).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/orders/${o.id}`}><Button variant="ghost" size="sm">보기</Button></Link>
                          {o.status === 'DRAFT' && (
                            <Link href={`/receipts/new?poId=${o.id}`}><Button variant="ghost" size="sm">입고</Button></Link>
                          )}
                        </div>
                      </td>
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
