import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listWaitingProjects } from '@/app/actions/waiting-projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { WaitingProjectTable } from '@/components/sales/WaitingProjectTable'

export default async function WaitingProjectsPage() {
  const session = await auth()
  if (!session) return null

  const projects = await listWaitingProjects()

  const totalBidAmount = projects.reduce((sum, p) => sum + (p.bidAmount || 0), 0)
  const totalEstimatedCost = projects.reduce((sum, p) => {
    const directCost = (p.laborCost || 0) + (p.materialCost || 0) + (p.outsourceCost || 0) + (p.equipmentCost || 0) + (p.otherCost || 0)
    const indirectCost = directCost * 0.055
    const manufacturingCost = directCost + indirectCost
    const sellingAdminCost = (p.bidAmount || 0) * 0.123
    return sum + manufacturingCost + sellingAdminCost
  }, 0)

  const fmt = (n: number) => n.toLocaleString('ko-KR') + '원'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대기 프로젝트</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Excel 형식으로 프로젝트를 가로로 나열하여 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <form action="/api/export/waiting-projects" method="POST">
            <Button type="submit" variant="outline">Excel 다운로드</Button>
          </form>
          <form action="/api/import/waiting-projects" method="POST" encType="multipart/form-data">
            <input type="file" name="file" accept=".xlsx,.xls" className="hidden" id="excel-upload" />
            <Button type="button" variant="outline" onClick={() => document.getElementById('excel-upload')?.click()}>
              Excel 업로드
            </Button>
          </form>
          <Link href="/sales/new"><Button>새 프로젝트</Button></Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">대기 프로젝트 수</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects.length}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">총 입찰 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(totalBidAmount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">예상 총원가</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(totalEstimatedCost)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>프로젝트 목록 (가로 스크롤)</span>
            <Badge variant="secondary">틀고정 적용</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <WaitingProjectTable projects={projects} />
        </CardContent>
      </Card>

      <div className="text-xs text-gray-500">
        * 프로젝트를 클릭하면 상세 정보를 수정할 수 있습니다
        <br />
        * 수주 확정 버튼을 클릭하여 실행원가 관리로 전환할 수 있습니다
        <br />
        * 원가 자동 계산: 제조간접원가 5.5%, 판관비 12.3%
      </div>
    </div>
  )
}
