'use client'
'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { createSales, listCustomers } from '@/app/actions/sales'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function NewSalesPage() {
  const session = await auth()
  if (!session) return null

  const customers = await listCustomers()

  async function handleSubmit(formData: FormData) {
    'use server'
    const data = {
      title: formData.get('title') as string,
      type: formData.get('type') as string,
      status: 'DRAFT',
      bidNumber: formData.get('bidNumber') as string,
      bidAmount: parseFloat(formData.get('bidAmount') as string) || 0,
      contractAmount: 0,
      winProbability: parseFloat(formData.get('winProbability') as string) || undefined,
      bidOpenDate: formData.get('bidOpenDate') as string,
      customerId: formData.get('customerId') as string,
      description: formData.get('description') as string,
    }
    const sales = await createSales(data)
    redirect('/sales')
  }

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">새 영업</h1></div>
      <Card>
        <CardHeader><CardTitle>영업 정보</CardTitle></CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">현황명 *</label>
                <input name="title" required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">유형</label>
                <select name="type" defaultValue="BIDDING" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="BIDDING">입찰</option>
                  <option value="CONTRACT">수주</option>
                  <option value="CHANGE_ORDER">변경</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">입찰번호</label>
                <input name="bidNumber" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">발주처</label>
                <select name="customerId" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="">선택</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">입찰금액</label>
                <input name="bidAmount" type="number" step="1" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">낙찰 확률 (%)</label>
                <input name="winProbability" type="number" min="0" max="100" defaultValue="50"
                  className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">입찰 공개일</label>
                <input name="bidOpenDate" type="date" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <textarea name="description" rows={3} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">생성</Button>
              <a href="/sales"><Button variant="outline" type="button">취소</Button></a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
