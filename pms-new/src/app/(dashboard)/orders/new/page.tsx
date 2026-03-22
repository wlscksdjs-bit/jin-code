'use client'
'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listProjects } from '@/app/actions/projects'
import { createPurchaseOrder, listVendors } from '@/app/actions/purchase-orders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function NewOrderPage() {
  const session = await auth()
  if (!session) return null

  const [projects, vendors] = await Promise.all([listProjects(), listVendors()])

  async function handleSubmit(formData: FormData) {
    'use server'
    const itemCount = parseInt(formData.get('itemCount') as string) || 0
    const items = []
    for (let i = 0; i < itemCount; i++) {
      const name = formData.get(`item_name_${i}`) as string
      if (name) {
          items.push({
          itemName: name,
          specification: formData.get(`item_spec_${i}`) as string,
          unit: formData.get(`item_unit_${i}`) as string,
          quantity: parseFloat(formData.get(`item_qty_${i}`) as string) || 0,
          unitPrice: parseFloat(formData.get(`item_price_${i}`) as string) || 0,
          amount: (parseFloat(formData.get(`item_qty_${i}`) as string) || 0) * (parseFloat(formData.get(`item_price_${i}`) as string) || 0),
          orderedQuantity: 0,
          receivedQuantity: 0,
          rejectedQuantity: 0,
        })
      }
    }

    const data = {
      projectId: formData.get('projectId') as string,
      vendorId: formData.get('vendorId') as string,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || undefined,
      orderDate: formData.get('orderDate') as string,
      requiredDate: (formData.get('requiredDate') as string) || undefined,
      items,
    }
    const po = await createPurchaseOrder(data)
    redirect(`/orders/${(po as { id: string }).id}`)
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">새 발주서</h1></div>
      <Card>
        <CardHeader><CardTitle>발주 정보</CardTitle></CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">프로젝트 *</label>
                <select name="projectId" required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="">선택</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">거래처 *</label>
                <select name="vendorId" required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="">선택</option>
                  {vendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">발주 제목 *</label>
                <input name="title" required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" placeholder="자재 구매" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">발주일 *</label>
                <input name="orderDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">필요일</label>
                <input name="requiredDate" type="date"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <textarea name="description" rows={2} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">발주 품목</p>
              <input type="hidden" name="itemCount" id="itemCount" value="0" />
              <div id="items-container" className="space-y-2">
              </div>
              <button type="button"
                className="mt-2 rounded-md border border-dashed border-gray-300 px-3 py-1 text-sm text-gray-500 hover:border-gray-400">
                + 품목 추가
              </button>
            </div>

            <div className="flex gap-2">
              <Button type="submit">발주서 생성</Button>
              <a href="/orders"><Button variant="outline" type="button">취소</Button></a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
