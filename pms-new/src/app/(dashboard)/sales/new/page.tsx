import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listCustomers } from '@/app/actions/sales'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { submitSalesAction } from './actions'

export default async function NewSalesPage() {
  const session = await auth()
  if (!session) redirect('/signin')

  const customers = await listCustomers()

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">새 영업</h1></div>
      <Card>
        <CardHeader><CardTitle>영업 정보</CardTitle></CardHeader>
        <CardContent>
          <form action={submitSalesAction} className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-3">기본 정보</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">프로젝트명 *</label>
                  <input name="title" required placeholder="프로젝트명을 입력하세요" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">구분</label>
                  <select name="type" defaultValue="BIDDING" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                    <option value="BIDDING">입찰</option>
                    <option value="CONTRACT">수주</option>
                    <option value="CHANGE_ORDER">수주변경</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">현 상태</label>
                  <select name="status" defaultValue="WAITING" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                    <option value="WAITING">대기</option>
                    <option value="IN_PROGRESS">진행</option>
                    <option value="COMPLETED">완료</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">진행사항 (%)</label>
                  <input name="progress" type="number" min="0" max="100" defaultValue="0"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">입찰번호</label>
                  <input name="bidNumber" placeholder="입찰번호" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">발주처</label>
                  <select name="customerId" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                    <option value="">선택</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">일정 및 금액</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">입찰금액</label>
                  <input name="bidAmount" type="number" step="1" placeholder="0" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">수주확실도 (%)</label>
                  <input name="winProbability" type="number" min="0" max="100" defaultValue="50"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">입찰마감일</label>
                  <input name="submissionDate" type="date" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">개찰일</label>
                  <input name="bidOpenDate" type="date" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-3">원가 (자동 계산)</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">인건비</label>
                  <input name="laborCost" type="number" step="1" defaultValue="0" placeholder="0"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">자재비</label>
                  <input name="materialCost" type="number" step="1" defaultValue="0" placeholder="0"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">외주비</label>
                  <input name="outsourceCost" type="number" step="1" defaultValue="0" placeholder="0"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">설비비</label>
                  <input name="equipmentCost" type="number" step="1" defaultValue="0" placeholder="0"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium">기타</label>
                  <input name="otherCost" type="number" step="1" defaultValue="0" placeholder="0"
                    className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
                </div>
              </div>
            </div>

            <div>
              <div className="space-y-2">
                <label className="text-sm font-medium">비고</label>
                <textarea name="notes" rows={3} placeholder="메모를 입력하세요" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="submit">생성</Button>
              <Link href="/sales"><Button variant="outline" type="button">취소</Button></Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
