import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listResources } from '@/app/actions/resources'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: { search?: string; department?: string }
}) {
  const session = await auth()
  if (!session) return null

  const search = searchParams.search
  const department = searchParams.department

  const resources = await listResources(search, department)

  const departments = [...new Set(resources.map((r) => r.department).filter(Boolean))]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">인력 관리</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{resources.length}명</p>
        </div>
        <Link href="/resources/new">
          <Button>새 인력</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>검색</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex gap-4">
            <Input
              name="search"
              placeholder="이름, 사번, 부서 검색..."
              defaultValue={search}
              className="max-w-xs"
            />
            <select
              name="department"
              defaultValue={department || ''}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">전체 부서</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <Button type="submit">검색</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.map((resource) => (
          <Link key={resource.id} href={`/resources/${resource.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{resource.name}</CardTitle>
                  <Badge variant={resource.isActive ? 'default' : 'secondary'}>
                    {resource.isActive ? '활성' : '비활성'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">사번:</span>
                    <span>{resource.employeeNumber}</span>
                  </div>
                  {resource.department && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">부서:</span>
                      <span>{resource.department}</span>
                    </div>
                  )}
                  {resource.position && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">직위:</span>
                      <span>{resource.position}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">가용률:</span>
                    <span>{resource.availability}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">월 단가:</span>
                    <span>{resource.monthlyRate.toLocaleString('ko-KR')}원</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {resources.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          등록된 인력이 없습니다.
        </div>
      )}
    </div>
  )
}
