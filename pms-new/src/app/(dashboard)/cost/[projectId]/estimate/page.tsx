import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getProject, getCostEstimate } from '@/app/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { submitCostEstimate } from './actions'

const COST_ROWS = [
  { key: 'materialCost', label: '재료비' },
  { key: 'laborCost', label: '노무비' },
  { key: 'outsourceFabrication', label: '외주비(제작)' },
  { key: 'outsourceService', label: '외주비(용역)' },
  { key: 'consumableOther', label: '소모품/기타' },
  { key: 'consumableSafety', label: '안전용품' },
  { key: 'travelExpense', label: '여비교통비' },
  { key: 'insuranceWarranty', label: '보험/보증' },
  { key: 'dormitoryCost', label: '숙소비' },
  { key: 'miscellaneous', label: '잡비' },
  { key: 'paymentFeeOther', label: '지급수수료' },
  { key: 'rentalForklift', label: '장비임대(지게차)' },
  { key: 'rentalOther', label: '장비임대(기타)' },
  { key: 'vehicleRepair', label: '차량수리비' },
  { key: 'vehicleFuel', label: '차량유류비' },
  { key: 'vehicleOther', label: '차량기타' },
  { key: 'welfareBusiness', label: '복리후생' },
  { key: 'reserveFund', label: '예비비' },
  { key: 'indirectCost', label: '간접비' },
] as const

export default async function CostEstimateFormPage({ params }: { params: Promise<{ projectId: string; id?: string }> }) {
  const { projectId, id } = await params
  const project = await getProject(projectId)
  if (!project) notFound()

  let existing: Record<string, unknown> | undefined
  if (id) {
    existing = await getCostEstimate(id) as Record<string, unknown> | undefined
  }

  const v = (key: string, def = 0) => existing ? (existing[key] as number ?? def) : def

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {id ? '견적원가 편집' : '견적원가 등록'}
        </h1>
        <p className="text-sm text-gray-500">{project.name}</p>
      </div>

      <form action={submitCostEstimate.bind(null, projectId, id)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>기본 정보</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">제목 *</label>
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

        <div className="flex gap-2">
          <Button type="submit">{id ? '저장' : '등록'}</Button>
          <Link href={`/projects/${projectId}`}><Button variant="outline" type="button">취소</Button></Link>
        </div>
      </form>
    </div>
  )
}
