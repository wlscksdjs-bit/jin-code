import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listProjects } from '@/app/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function CostPage() {
  const session = await auth()
  if (!session) return null

  const projects = await listProjects()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">원가관리</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">프로젝트별 견적원가 및 실행원가 관리</p>
      </div>

      <Card>
        <CardHeader><CardTitle>프로젝트별 원가 현황</CardTitle></CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">프로젝트가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {projects.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-4">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="font-mono text-xs text-gray-500">{p.code}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/cost/${p.id}/estimate`}><Badge variant="secondary">견적원가</Badge></Link>
                    <Link href={`/cost/${p.id}/execution`}><Badge variant="secondary">실행원가</Badge></Link>
                    <Link href={`/budget/${p.id}`}><Badge variant="secondary">예산</Badge></Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
