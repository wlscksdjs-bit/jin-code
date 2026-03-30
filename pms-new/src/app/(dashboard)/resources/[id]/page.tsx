import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getResource, getResourceUtilization } from '@/app/actions/resources'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

export default async function ResourceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const session = await auth()
  if (!session) return null

  const resource = await getResource(params.id)
  if (!resource) return notFound()

  const utilization = await getResourceUtilization(params.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{resource.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            사번: {resource.employeeNumber}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/resources/${params.id}/edit`}>
            <Button variant="outline">수정</Button>
          </Link>
          <Link href="/resources">
            <Button variant="ghost">목록</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">사번</span>
                <p className="font-medium">{resource.employeeNumber}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">상태</span>
                <p>
                  <Badge variant={resource.isActive ? 'default' : 'secondary'}>
                    {resource.isActive ? '활성' : '비활성'}
                  </Badge>
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">부서</span>
                <p className="font-medium">{resource.department || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">직위</span>
                <p className="font-medium">{resource.position || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">직급</span>
                <p className="font-medium">{resource.grade || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">가용률</span>
                <p className="font-medium">{resource.availability}%</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">연봉/월 단가</span>
                <p className="font-medium">{resource.monthlyRate.toLocaleString('ko-KR')}원</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">시간 단가</span>
                <p className="font-medium">{resource.hourlyRate.toLocaleString('ko-KR')}원</p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">연락처</span>
                <p className="font-medium">{resource.phone || '-'}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">이메일</span>
                <p className="font-medium">{resource.email || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>기술 및 자격</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-sm text-gray-500">보유 기술</span>
              <p className="font-medium">{resource.skills || '-'}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">자격증</span>
              <p className="font-medium">{resource.certifications || '-'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>근무 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold">{utilization.totalHours}</p>
              <p className="text-sm text-gray-500">총 시간</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold">{utilization.workingDays}</p>
              <p className="text-sm text-gray-500">근무일</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold">{utilization.avgHoursPerDay}</p>
              <p className="text-sm text-gray-500">일 평균</p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-2xl font-bold">
                {Object.keys(utilization.byProject).length}
              </p>
              <p className="text-sm text-gray-500">참여 프로젝트</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>최근 근태 기록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {utilization.timeSheets.length > 0 ? (
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500">
                    <th className="pb-2">날짜</th>
                    <th className="pb-2">프로젝트</th>
                    <th className="pb-2">시간</th>
                    <th className="pb-2">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {utilization.timeSheets.slice(0, 10).map((ts) => (
                    <tr key={ts.id} className="border-t">
                      <td className="py-2">
                        {new Date(ts.date).toLocaleDateString('ko-KR')}
                      </td>
                      <td className="py-2">{ts.project?.name || '-'}</td>
                      <td className="py-2">{ts.hours}h</td>
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
                          {ts.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-center text-gray-500 py-4">근태 기록이 없습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
