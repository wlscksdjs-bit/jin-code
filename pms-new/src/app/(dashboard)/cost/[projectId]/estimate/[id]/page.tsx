'use client'
import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCostEstimate, deleteCostEstimate } from '@/app/actions/cost-estimates'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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

export default async function CostEstimateDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; id: string }>
}) {
  const { projectId, id } = await params
  const estimate = await getCostEstimate(id)
  if (!estimate) notFound()

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  async function handleDelete() {
    'use server'
    await deleteCostEstimate(id)
    redirect(`/projects/${projectId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{estimate.title}</h1>
          <p className="text-sm text-gray-500">
            v{estimate.version} · {estimate.project.name} ·{' '}
            {estimate.estimatedDate
              ? new Date(estimate.estimatedDate).toLocaleDateString('ko-KR')
              : new Date(estimate.createdAt).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/cost/${projectId}/estimate/${id}`}><Button>편집</Button></Link>
          <form action={handleDelete}>
            <Button type="submit" variant="destructive">삭제</Button>
          </form>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">계약금액</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">{fmt(estimate.contractAmount)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">영업이익</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${estimate.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(estimate.operatingProfit)}
            </div>
            <p className="text-xs text-gray-500">{estimate.profitRate.toFixed(1)}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">제조이익</CardTitle></CardHeader>
          <CardContent><div className={`text-2xl font-bold ${estimate.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(estimate.grossProfit)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>원가 항목</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {COST_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="py-2 font-medium">{row.label}</td>
                  <td className="py-2 text-right">{fmt(estimate[row.key as keyof typeof estimate] as number ?? 0)}</td>
                </tr>
              ))}
              <tr className="border-t-2 font-bold">
                <td className="py-2">총직접비</td>
                <td className="py-2 text-right">{fmt(estimate.totalDirectCost)}</td>
              </tr>
              <tr className="border-t-2 font-bold">
                <td className="py-2">총제조원가</td>
                <td className="py-2 text-right">{fmt(estimate.totalManufacturingCost)}</td>
              </tr>
              <tr>
                <td className="py-2">판관비 ({(estimate as { sellingAdminRate?: number }).sellingAdminRate ?? 12}%)</td>
                <td className="py-2 text-right">{fmt(estimate.sellingAdminCost)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>손익 요약</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            <div><p className="text-xs text-gray-500">총제조원가</p><p className="font-bold">{fmt(estimate.totalManufacturingCost)}</p></div>
            <div><p className="text-xs text-gray-500">판관비</p><p className="font-bold">{fmt(estimate.sellingAdminCost)}</p></div>
            <div><p className="text-xs text-gray-500">제조이익</p><p className={`font-bold ${estimate.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(estimate.grossProfit)}</p></div>
            <div><p className="text-xs text-gray-500">영업이익</p><p className={`font-bold ${estimate.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{fmt(estimate.operatingProfit)}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
