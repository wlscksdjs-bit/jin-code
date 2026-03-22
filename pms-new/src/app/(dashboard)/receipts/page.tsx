import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listMaterialReceipts } from '@/app/actions/material-receipts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ReceiptsPage() {
  const session = await auth()
  if (!session) return null

  const receipts = await listMaterialReceipts()
  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">입고 관리</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">자재 입고 현황</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {receipts.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">입고 내역이 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-900">
                  <th className="px-4 py-2 text-left text-xs text-gray-500">입고번호</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">발주번호</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">거래처</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">프로젝트</th>
                  <th className="px-4 py-2 text-right text-xs text-gray-500">금액</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">입고일</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {receipts.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-4 py-2 font-mono text-xs">{r.receiptNumber}</td>
                    <td className="px-4 py-2 text-gray-500">{r.purchaseOrder.orderNumber}</td>
                    <td className="px-4 py-2">{r.purchaseOrder.vendor.name}</td>
                    <td className="px-4 py-2">{r.purchaseOrder.project.name}</td>
                    <td className="px-4 py-2 text-right">{fmt(r.totalAmount)}</td>
                    <td className="px-4 py-2 text-gray-500">{new Date(r.receiptDate).toLocaleDateString('ko-KR')}</td>
                    <td className="px-4 py-2"><Badge variant="secondary">{r.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
