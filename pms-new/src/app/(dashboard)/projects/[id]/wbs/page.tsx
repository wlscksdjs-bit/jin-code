import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getProject } from '@/app/actions/projects'
import { listWbsItems, calculateCPM } from '@/app/actions/wbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function WbsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return null

  const [project, items] = await Promise.all([getProject(id), listWbsItems(id)])

  let cpmResult = null
  if (items.length > 0) {
    cpmResult = await calculateCPM(id)
  }

  const fmt = (n: number | null) => n ? `${n}일` : '-'
  const criticalIds = new Set(cpmResult?.criticalPathItems ?? [])

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const phase = item.phaseType ?? '일반'
    if (!acc[phase]) acc[phase] = []
    acc[phase].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WBS / 일정</h1>
          <p className="text-sm text-gray-500">{project?.name}</p>
        </div>
        <div className="flex gap-2">
          <a href={`/projects/${id}/wbs/new`}><Button>WBS 항목 추가</Button></a>
          <a href={`/projects/${id}/schedule`}><Button variant="secondary">간트차트</Button></a>
        </div>
      </div>

      {cpmResult && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">총 공정기간</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{cpmResult.projectDuration}일</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">WBS 항목</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{items.length}</div></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-500">비경로 공수</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-600">{items.length - criticalIds.size}건</div></CardContent>
          </Card>
        </div>
      )}

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-gray-500">
            등록된 WBS 항목이 없습니다.
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([phase, phaseItems]) => (
          <Card key={phase}>
            <CardHeader>
              <CardTitle className="text-base">{phase}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {phaseItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <code className="text-xs text-gray-500">{item.code}</code>
                      <div>
                        <p className="font-medium">
                          {item.isMilestone ? '⬡ ' : ''}{item.name}
                        </p>
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>계획: {fmt(item.plannedDays)}</span>
                          {item.startDate && <span>시작: {new Date(item.startDate).toLocaleDateString('ko-KR')}</span>}
                          {item.endDate && <span>종료: {new Date(item.endDate).toLocaleDateString('ko-KR')}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {criticalIds.has(item.id) && (
                        <Badge variant="destructive" className="text-xs">CRITICAL</Badge>
                      )}
                      <Badge variant="secondary">{item.status}</Badge>
                      <Badge variant="secondary">{item.progress}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
