'use server'

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getProject } from '@/app/actions/projects'
import { createCostEstimate, updateCostEstimate } from '@/app/actions/cost-estimates'
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

type CostEstimateFormProps = {
  projectId: string
  id?: string
  existing?: Record<string, unknown>
}

async function handleSubmit(isEdit: boolean, id: string | undefined, projectId: string, formData: FormData) {
  'use server'
  const data: Record<string, number | string> = {
    projectId,
    title: formData.get('title') as string,
    version: formData.get('version') as string,
    status: formData.get('status') as string,
    contractAmount: parseFloat(formData.get('contractAmount') as string) || 0,
    sellingAdminRate: parseFloat(formData.get('sellingAdminRate') as string) || 12,
  }
  for (const row of COST_ROWS) {
    data[row.key] = parseFloat(formData.get(row.key) as string) || 0
  }
  if (isEdit && id) {
    await updateCostEstimate(id, data)
    redirect(`/cost/${projectId}/estimate/${id}`)
  } else {
    const est = await createCostEstimate(data as Parameters<typeof createCostEstimate>[0])
    redirect(`/cost/${projectId}/estimate/${(est as { id: string }).id}`)
  }
}

export default async function CostEstimateFormPage({ params }: { params: Promise<{ projectId: string; id?: string }> }) {
  const { projectId, id } = await params
  const project = await getProject(projectId)
  if (!project) notFound()

  let existing: Record<string, unknown> | undefined
  if (id) {
    const { getCostEstimate } = await import('@/app/actions/cost-estimates')
    existing = await getCostEstimate(id) as Record<string, unknown> | undefined
  }

  const v = (key: string, def = 0) => existing ? (existing[key] as number ?? def) : def
  const fmt = (n: number) => n.toLocaleString('ko-KR')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {id ? '견적원가 편집' : '견적원가 등록'}
        </h1>
        <p className="text-sm text-gray-500">{project.name}</p>
      </div>

      <form action={handleSubmit.bind(null, !!id, id, projectId)} className="space-y-6">
        <input type="hidden" name="projectId" value={projectId} />

        <Card>
          <CardHeader><CardTitle>基本信息</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">标题 *</label>
              <input name="title" defaultValue={(existing?.title as string) ?? ''} required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">버전</label>
              <input name="version" defaultValue={(existing?.version as string) ?? '1.0'}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상태</label>
              <select name="status" defaultValue={(existing?.status as string) ?? 'DRAFT'}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                <option value="DRAFT">작성중</option>
                <option value="REVIEW">검토중</option>
                <option value="APPROVED">승인</option>
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
                  <input
                    name={row.key}
                    type="number"
                    step="1"
                    min="0"
                    defaultValue={v(row.key)}
                    className="col-span-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-right dark:border-gray-800 dark:bg-gray-800"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>자동 계산 결과</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[
                { label: '총직접비 (재료+노무+외주)', key: 'totalDirectCost' },
                { label: '총제조원가', key: 'totalManufacturingCost' },
                { label: '판관비', key: 'sellingAdminCost' },
                { label: '제조이익', key: 'grossProfit' },
                { label: '영업이익', key: 'operatingProfit' },
                { label: '이익률 (%)', key: 'profitRate' },
              ].map((r) => (
                <div key={r.key} className="rounded-md border bg-gray-50 p-3 dark:bg-gray-900">
                  <p className="text-xs text-gray-500">{r.label}</p>
                  <p className="text-lg font-bold">
                    {r.key === 'profitRate' ? `${v(r.key, 0).toFixed(1)}%` : `${fmt(v(r.key, 0))}원`}
                  </p>
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
