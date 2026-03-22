'use client'
import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPurchaseOrder, updatePurchaseOrderStatus, deletePurchaseOrder } from '@/app/actions/purchase-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '작성중', SENT: '발송', PARTIAL: '부분입고',
  RECEIVED: '입고완료', INSTALLED: '설치완료', CANCELLED: '취소',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getPurchaseOrder(id)
  if (!order) notFound()

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  async function handleStatusChange(status: string) {
    'use server'
    await updatePurchaseOrderStatus(id, status)
    redirect(`/orders/${id}`)
  }

  async function handleDelete() {
    'use server'
    await deletePurchaseOrder(id)
    redirect('/orders')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{order.title}</h1>
          <p className="font-mono text-sm text-gray-500">{order.orderNumber}</p>
        </div>
        <div className="flex gap-2">
          {order.status === 'DRAFT' && (
            <form action={handleStatusChange.bind(null, 'SENT')}>
              <Button type="submit">발송 처리</Button>
            </form>
          )}
          {order.status === 'SENT' && (
            <form action={handleStatusChange.bind(null, 'RECEIVED')}>
              <Button type="submit">입고 완료</Button>
            </form>
          )}
          <Link href={`/receipts/new?poId=${order.id}`}>
            <Button variant="secondary">입고 등록</Button>
          </Link>
          <form action={handleDelete}>
            <Button type="submit" variant="destructive">삭제</Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>발주 정보</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-gray-500">거래처</p><p className="font-medium">{order.vendor.name}</p></div>
              <div><p className="text-gray-500">프로젝트</p><p className="font-medium">{order.project.name}</p></div>
              <div><p className="text-gray-500">발주일</p><p className="font-medium">{new Date(order.orderDate).toLocaleDateString('ko-KR')}</p></div>
              <div><p className="text-gray-500">필요일</p><p className="font-medium">{order.requiredDate ? new Date(order.requiredDate).toLocaleDateString('ko-KR') : '-'}</p></div>
              <div><p className="text-gray-500">상태</p><Badge variant="secondary">{STATUS_LABELS[order.status] ?? order.status}</Badge></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>금액</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div><p className="text-gray-500">공급가액</p><p className="font-bold">{fmt(order.subtotal)}</p></div>
              <div><p className="text-gray-500">부가세(10%)</p><p className="font-bold">{fmt(order.tax)}</p></div>
              <div className="col-span-2 border-t pt-2"><p className="text-gray-500">합계</p><p className="text-xl font-bold">{fmt(order.totalAmount)}</p></div>
              <div><p className="text-gray-500">지급 금액</p><p className="font-medium">{fmt(order.paidAmount)}</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>발주 품목 ({order.items.length})</CardTitle></CardHeader>
        <CardContent>
          {order.items.length === 0 ? (
            <p className="text-sm text-gray-500">품목 없음</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">품명</th>
                  <th className="py-2">규격</th>
                  <th className="py-2 text-right">수량</th>
                  <th className="py-2 text-right">단가</th>
                  <th className="py-2 text-right">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2">{item.itemName}</td>
                    <td className="py-2 text-gray-500">{item.specification ?? '-'}</td>
                    <td className="py-2 text-right">{item.quantity} {item.unit ?? ''}</td>
                    <td className="py-2 text-right">{fmt(item.unitPrice)}</td>
                    <td className="py-2 text-right font-medium">{fmt(item.amount)}</td>
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
