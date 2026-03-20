'use server'

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getProject } from '@/app/actions/projects'
import { createCostExecution, updateCostExecution } from '@/app/actions/cost-executions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const COST_ROWS = [
  { key: 'materialCost', label: '재료비' },
  { key: 'laborCost', label: '노무비' },
  { key: 'outsourceFabrication', label: '외주비(제작)' },
  { key: 'outsourceService', label: '외주비(용역)' },
  { key: 'consumableOther', label: '소모품/기타' },
  { key: 'consumableSafety', label: '안전용품' },
  { key: 'travelExpense', label: '여비교통비' },
  { key: 'insuranceWarranty', label: '보험/보증' },
  { key: 'dormitoryCost', label: '宿舍비' },
  { key: 'miscellaneous', label: '잡비' },
  { key: 'paymentFeeOther', label: '지급수수료' },
  { key: 'rentalForklift', label: '지반료(지게차)' },
  { key: 'rentalOther', label: '지반료(기타)' },
  { key: 'vehicleRepair', label: '차량수리비' },
  { key: 'vehicleFuel', label: '차량유류비' },
  { key: 'vehicleOther', label: '차량기타' },
  { key: 'welfareBusiness', label: '복리후생' },
  { key: 'reserveFund', label: '예비비' },
  { key: 'indirectCost', label: '간접비' },
] as const

export default async function CostExecutionFormPage({ params }: { params: Promise<{ projectId: string; id?: string }> }) {
  const { projectId, id } = await params
  const project = await getProject(projectId)
  if (!project) notFound()

  let existing: Record<string, unknown> | undefined
  if (id) {
    const { getCostExecution } = await import('@/app/actions/cost-executions')
    existing = await getCostExecution(id) as Record<string, unknown> | undefined
  }

  const v = (key: string, def = 0) => existing ? (existing[key] as number ?? def) : def
  const now = new Date()
  const defaultYear = existing ? (existing.periodYear as number) : now.getFullYear()
  const defaultMonth = existing ? (existing.periodMonth as number) : now.getMonth() + 1

  async function handleSubmit(formData: FormData) {
    'use server'
    const data: Record<string, number | string> = {
      projectId,
      periodYear: parseInt(formData.get('periodYear') as string),
      periodMonth: parseInt(formData.get('periodMonth') as string),
      status: formData.get('status') as string,
      contractAmount: parseFloat(formData.get('contractAmount') as string) || 0,
      sellingAdminRate: parseFloat(formData.get('sellingAdminRate') as string) || 12,
    }
    for (const row of COST_ROWS) {
      data[row.key] = parseFloat(formData.get(row.key) as string) || 0
    }
    if (id) {
      await updateCostExecution(id, data as Parameters<typeof updateCostExecution>[1])
      redirect(`/cost/${projectId}/execution/${id}`)
    } else {
      const exec = await createCostExecution(data as Parameters<typeof createCostExecution>[0])
      redirect(`/cost/${projectId}/execution/${(exec as { id: string }).id}`)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {id ? '실행원가 편집' : '실행원가 등록'}
        </h1>
        <p className="text-sm text-gray-500">{project.name}</p>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>기간 정보</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">연도 *</label>
              <input name="periodYear" type="number" defaultValue={defaultYear} required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">월 *</label>
              <input name="periodMonth" type="number" min="1" max="12" defaultValue={defaultMonth} required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상태</label>
              <select name="status" defaultValue={(existing?.status as string) ?? 'DRAFT'}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                <option value="DRAFT">작성중</option>
                <option value="CONFIRMED">확정</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">계약금액</label>
              <input name="contractAmount" type="number" step="1" defaultValue={v('contractAmount')}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">판관비율 (%)</label>
              <input name="sellingAdminRate" type="number" step="0.1" defaultValue={v('sellingAdminRate', 12)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>원가 항목</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {COST_ROWS.map((row) => (
                <div key={row.key} className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm font-medium">{row.label}</label>
                  <input name={row.key} type="number" step="1" min="0" defaultValue={v(row.key)}
                    className="col-span-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-right dark:border-gray-800 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button type="submit">{id ? '저장' : '등록'}</Button>
          <Button type="button" variant="outline" onClick={() => redirect(`/projects/${projectId}`)}>취소</Button>
        </div>
      </form>
    </div>
  )
}
