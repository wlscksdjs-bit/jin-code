import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listProjects } from '@/app/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const STATUS_LABELS: Record<string, string> = {
  REGISTERED: '등록',
  CONTRACT: '계약',
  DESIGN: '설계',
  PROCUREMENT: '조달',
  CONSTRUCTION: '시공',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

const STATUS_VARIANT = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  if (status === 'COMPLETED') return 'default'
  if (status === 'CANCELLED') return 'destructive'
  return 'secondary'
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>
}) {
  const sp = await searchParams
  const session = await auth()
  if (!session) return null

  const projects = await listProjects(sp.q, sp.status)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">프로젝트</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">전체 {projects.length}건</p>
        </div>
        <Link href="/projects/new"><Button>새 프로젝트</Button></Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로젝트 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-3">
            <form method="get" className="flex flex-1 gap-2">
              <input
                name="q"
                defaultValue={sp.q}
                placeholder="프로젝트명, 코드 검색..."
                className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800"
              />
              <select
                name="status"
                defaultValue={sp.status}
                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800"
              >
                <option value="">전체 상태</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <Button type="submit" variant="secondary">검색</Button>
            </form>
          </div>

          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">프로젝트가 없습니다.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="py-2 text-left font-medium text-gray-500">코드</th>
                    <th className="py-2 text-left font-medium text-gray-500">프로젝트명</th>
                    <th className="py-2 text-left font-medium text-gray-500">상태</th>
                    <th className="py-2 text-left font-medium text-gray-500">발주처</th>
                    <th className="py-2 text-right font-medium text-gray-500">계약금액</th>
                    <th className="py-2 text-left font-medium text-gray-500">시작일</th>
                    <th className="py-2 text-center font-medium text-gray-500">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {projects.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="py-2 font-mono text-xs">{p.code}</td>
                      <td className="py-2 font-medium">{p.name}</td>
                      <td className="py-2">
                        <Badge variant={STATUS_VARIANT(p.status)}>
                          {STATUS_LABELS[p.status] ?? p.status}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-500">{p.customer?.name ?? '-'}</td>
                      <td className="py-2 text-right">
                        {p.contractAmount > 0 ? `${p.contractAmount.toLocaleString()}원` : '-'}
                      </td>
                      <td className="py-2 text-gray-500">
                        {p.startDate ? new Date(p.startDate).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td className="py-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Link href={`/projects/${p.id}`}><Button variant="ghost" size="sm">보기</Button></Link>
                          <Link href={`/projects/${p.id}/edit`}><Button variant="ghost" size="sm">편집</Button></Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
