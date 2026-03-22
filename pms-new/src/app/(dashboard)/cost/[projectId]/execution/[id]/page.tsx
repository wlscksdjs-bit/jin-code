'use client'
import { notFound } from 'next/navigation'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCostExecution, deleteCostExecution } from '@/app/actions/cost-executions'
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

export default async function CostExecutionDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; id: string }>
}) {
  const { projectId, id } = await params
  const exec = await getCostExecution(id)
  if (!exec) notFound()

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  async function handleDelete() {
    'use server'
    await deleteCostExecution(id)
    redirect(`/projects/${projectId}`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {exec.periodYear}년 {exec.periodMonth}월 실행원가
          </h1>
          <p className="text-sm text-gray-500">{exec.project.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/cost/${projectId}/execution/${id}`}><Button>편집</Button></Link>
          <form action={handleDelete}>
            <Button type="submit" variant="destructive">삭제</Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>원가 항목</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {COST_ROWS.map((row) => (
                <tr key={row.key}>
                  <td className="py-2 font-medium">{row.label}</td>
                  <td className="py-2 text-right">{fmt(exec[row.key as keyof typeof exec] as number ?? 0)}</td>
                </tr>
              ))}
              <tr className="border-t-2 font-bold">
                <td className="py-2">총직접비</td>
                <td className="py-2 text-right">{fmt(exec.totalDirectCost)}</td>
              </tr>
              <tr className="border-t-2 font-bold">
                <td className="py-2">총제조원가</td>
                <td className="py-2 text-right">{fmt(exec.totalManufacturingCost)}</td>
              </tr>
              <tr className="border-t-2 font-bold">
                <td className="py-2">총지출</td>
                <td className="py-2 text-right">{fmt(exec.totalExpense)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
