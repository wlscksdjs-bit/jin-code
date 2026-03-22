import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getPurchaseOrder, listPurchaseOrderItems } from '@/app/actions/purchase-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { submitReceipt } from './actions'

export default async function NewReceiptPage({ searchParams }: { params: Promise<Record<string, string>>; searchParams: Promise<{ poId?: string }> }) {
  const sp = await searchParams
  const session = await auth()
  if (!session) return null

  let order = null
  let poItems: Awaited<ReturnType<typeof listPurchaseOrderItems>> = []
  if (sp.poId) {
    order = await getPurchaseOrder(sp.poId)
    poItems = await listPurchaseOrderItems(sp.poId)
  }

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  if (!order) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">입고 등록</h1>
        <Card><CardContent className="py-12 text-center text-sm text-gray-500">발주서를 먼저 선택하세요.</CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">입고 등록</h1>
        <p className="text-sm text-gray-500">
          {order.orderNumber} · {order.vendor.name} · {order.project.name}
        </p>
      </div>
      <Card>
        <CardHeader><CardTitle>입고 품목</CardTitle></CardHeader>
        <CardContent>
          <form action={submitReceipt.bind(null, sp.poId!)} className="space-y-4">
            <input type="hidden" name="itemCount" id="itemCount" value={poItems.length} />
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2">품명</th>
                  <th className="py-2">규격</th>
                  <th className="py-2 text-right">발주수량</th>
                  <th className="py-2 text-right">입고수량</th>
                  <th className="py-2 text-right">단가</th>
                  <th className="py-2 text-right">금액</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {poItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="py-2">
                      {item.itemName}
                      <input type="hidden" name={`item_name_${idx}`} value={item.itemName} />
                      <input type="hidden" name={`item_spec_${idx}`} value={item.specification ?? ''} />
                      <input type="hidden" name={`item_unit_${idx}`} value={item.unit ?? ''} />
                      <input type="hidden" name={`item_price_${idx}`} value={item.unitPrice} />
                    </td>
                    <td className="py-2 text-gray-500">{item.specification ?? '-'}</td>
                    <td className="py-2 text-right">{item.quantity} {item.unit}</td>
                    <td className="py-2 text-right">
                      <input
                        name={`item_qty_${idx}`}
                        type="number"
                        min="0"
                        max={item.quantity}
                        step="0.1"
                        defaultValue={item.quantity}
                        className="w-24 rounded-md border border-gray-200 bg-white px-2 py-1 text-right text-sm dark:border-gray-800 dark:bg-gray-800"
                      />
                    </td>
                    <td className="py-2 text-right">{fmt(item.unitPrice)}</td>
                    <td className="py-2 text-right">{fmt(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">입고일 *</label>
                <input name="receiptDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">입고자</label>
                <input name="receivedBy" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
            </div>
            <div className="flex gap-2 border-t pt-4">
              <Button type="submit">입고 완료</Button>
              <Link href={'/receipts'}><Button variant="outline" type="button">취소</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
