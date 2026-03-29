import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getWaitingProject, confirmContract } from '@/app/actions/waiting-projects'
import { listCustomers } from '@/app/actions/sales'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency } from '@/lib/utils'

export default async function ConfirmContractPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session) redirect('/signin')

  const { id } = await params
  const project = await getWaitingProject(id)
  
  if (!project) {
    return <div>프로젝트를 찾을 수 없습니다.</div>
  }

  const directCost = 
    (project.laborCost || 0) + 
    (project.materialCost || 0) + 
    (project.outsourceCost || 0) + 
    (project.equipmentCost || 0) + 
    (project.otherCost || 0)
  const indirectCost = directCost * 0.055
  const manufacturingCost = directCost + indirectCost
  const sellingAdminCost = (project.bidAmount || 0) * 0.123
  const totalCost = manufacturingCost + sellingAdminCost
  const expectedProfit = (project.bidAmount || 0) - totalCost

  async function confirmAction(formData: FormData) {
    'use server'
    const code = formData.get('code') as string
    const name = formData.get('name') as string
    const contractAmount = Number(formData.get('contractAmount'))
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string

    await confirmContract(id, { code, name, contractAmount, startDate, endDate })
    redirect('/projects')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">수주 확정</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {project.title}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">프로젝트 정보</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">프로젝트명</span>
              <span className="font-medium">{project.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">발주처</span>
              <span className="font-medium">{project.customer?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">입찰금액</span>
              <span className="font-medium">{formatCurrency(project.bidAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">진행률</span>
              <span className="font-medium">{((project.winProbability || 0) * 100).toFixed(0)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">원가 요약</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">제조직접원가</span>
              <span className="font-medium">{formatCurrency(directCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">제조간접원가 (5.5%)</span>
              <span className="font-medium">{formatCurrency(indirectCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">제조원가</span>
              <span className="font-medium">{formatCurrency(manufacturingCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">판관비 (12.3%)</span>
              <span className="font-medium">{formatCurrency(sellingAdminCost)}</span>
            </div>
            <div className="flex justify-between border-t pt-4">
              <span className="text-gray-500">예상이익</span>
              <span className={`font-medium ${expectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(expectedProfit)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">수주 확정 등록</CardTitle></CardHeader>
        <CardContent>
          <form action={confirmAction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>프로젝트 코드 *</Label>
                <Input name="code" required placeholder="PROJ-2026-001" />
              </div>
              <div className="space-y-2">
                <Label>프로젝트명 *</Label>
                <Input name="name" required defaultValue={project.title} />
              </div>
              <div className="space-y-2">
                <Label>계약금액 *</Label>
                <Input 
                  name="contractAmount" 
                  type="number" 
                  required 
                  defaultValue={project.bidAmount}
                />
              </div>
              <div className="space-y-2">
                <Label>시작일 *</Label>
                <Input name="startDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label>종료일 *</Label>
                <Input name="endDate" type="date" required />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit">수주 확정</Button>
              <Link href="/sales/waiting">
                <Button variant="outline" type="button">취소</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="rounded bg-blue-50 p-4 text-sm text-blue-700 dark:bg-blue-900 dark:text-blue-300">
        <strong>참고:</strong> 수주 확정이 완료되면 실행원가 관리 페이지에서 원가를 관리할 수 있습니다.
        프로젝트 상태가 '계약'로 변경되며, 영업 목록에서 '수주(WON)' 상태로 표시됩니다.
      </div>
    </div>
  )
}
