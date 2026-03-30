import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listTimeSheets, getTimeSheetSummary } from '@/app/actions/timesheets'
import { listResources } from '@/app/actions/resources'
import { listProjects } from '@/app/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const STATUS_LABELS: Record<string, string> = {
  DRAFT: '임시저장',
  SUBMITTED: '제출',
  APPROVED: '승인',
  REJECTED: '반려',
}

export default async function TimeSheetsPage({
  searchParams,
}: {
  searchParams: {
    resourceId?: string
    projectId?: string
    status?: string
    startDate?: string
    endDate?: string
  }
}) {
  const session = await auth()
  if (!session) return null

  const { resourceId, projectId, status, startDate, endDate } = searchParams

  const [timeSheets, resources, projects, summary] = await Promise.all([
    listTimeSheets(resourceId, projectId, status, startDate, endDate),
    listResources(),
    listProjects(),
    getTimeSheetSummary(resourceId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">근태 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {timeSheets.length}건
          </p>
        </div>
        <Link href="/timesheets/new">
          <Button>새 근태</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.summary.totalHours}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">총 비용</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {summary.summary.totalCost.toLocaleString('ko-KR')}원
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">승인 완료</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.summary.approvedHours}h</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">대기 중</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{summary.summary.pendingHours}h</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>검색</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-wrap gap-4">
            <select
              name="resourceId"
              defaultValue={resourceId || ''}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">전체 인력</option>
              {resources.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              name="projectId"
              defaultValue={projectId || ''}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">전체 프로젝트</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              name="status"
              defaultValue={status || ''}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">전체 상태</option>
              <option value="DRAFT">임시저장</option>
              <option value="SUBMITTED">제출</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">반려</option>
            </select>
            <Input
              type="date"
              name="startDate"
              defaultValue={startDate}
              className="max-w-[150px]"
            />
            <Input
              type="date"
              name="endDate"
              defaultValue={endDate}
              className="max-w-[150px]"
            />
            <Button type="submit">검색</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>근태 기록</CardTitle>
        </CardHeader>
        <CardContent>
          {timeSheets.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">날짜</th>
                  <th className="pb-2">인력</th>
                  <th className="pb-2">프로젝트</th>
                  <th className="pb-2">시간</th>
                  <th className="pb-2">비용</th>
                  <th className="pb-2">상태</th>
                </tr>
              </thead>
              <tbody>
                {timeSheets.map((ts) => (
                  <tr key={ts.id} className="border-b hover:bg-gray-50">
                    <td className="py-2">
                      {new Date(ts.date).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="py-2">{ts.resource?.name || ts.user?.name || '-'}</td>
                    <td className="py-2">{ts.project?.name || '-'}</td>
                    <td className="py-2">{ts.hours}h</td>
                    <td className="py-2">
                      {ts.totalCost.toLocaleString('ko-KR')}원
                    </td>
                    <td className="py-2">
                      <Badge
                        variant={
                          ts.status === 'APPROVED'
                            ? 'default'
                            : ts.status === 'REJECTED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {STATUS_LABELS[ts.status] || ts.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-8">근태 기록이 없습니다.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
