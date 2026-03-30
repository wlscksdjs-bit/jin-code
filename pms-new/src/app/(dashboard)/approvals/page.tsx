import Link from 'next/link'
import { auth } from '@/lib/auth'
import { listApprovals, listMyApprovals, listPendingApprovalsForReview, APPROVAL_TYPES, APPROVAL_STATUSES } from '@/app/actions/approvals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function getStatusColor(status: string) {
  switch (status) {
    case 'DRAFT': return 'secondary'
    case 'SUBMITTED': return 'outline'
    case 'REVIEWING': return 'warning'
    case 'APPROVED': return 'success'
    case 'REJECTED': return 'destructive'
    default: return 'secondary'
  }
}

function getTypeLabel(type: string) {
  return APPROVAL_TYPES.find(t => t.value === type)?.label || type
}

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ tab?: string; status?: string }> }) {
  const session = await auth()
  if (!session) return null

  const { tab, status } = await searchParams
  const activeTab = tab || 'all'
  const filterStatus = status || undefined

  const [allApprovals, myApprovals, pendingReviews] = await Promise.all([
    listApprovals(filterStatus),
    listMyApprovals(),
    listPendingApprovalsForReview(),
  ])

  const displayApprovals = activeTab === 'my' ? myApprovals : activeTab === 'pending' ? pendingReviews : allApprovals
  const fmt = (n: number) => n.toLocaleString('ko-KR') + '원'

  const tabs = [
    { value: 'all', label: '전체 결재', count: allApprovals.length },
    { value: 'my', label: '내 결재', count: myApprovals.length },
    { value: 'pending', label: '검토 대기', count: pendingReviews.length },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">전자 결재</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            비용 지출, 외주 기성, 대금 청구 결재 관리
          </p>
        </div>
        <Link href="/approvals/new">
          <Button>새 결재 작성</Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">전체 결재</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allApprovals.length}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">내 결재</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myApprovals.length}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">검토 대기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReviews.length}건</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>결재 목록</CardTitle>
            <div className="flex gap-2">
              {tabs.map(t => (
                <Link key={t.value} href={`/approvals?tab=${t.value}`}>
                  <Button variant={activeTab === t.value ? 'default' : 'outline'} size="sm">
                    {t.label} ({t.count})
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {displayApprovals.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              결재 목록이 없습니다.
            </div>
          ) : (
            <div className="space-y-2">
              {displayApprovals.map((approval) => (
                <Link 
                  key={approval.id} 
                  href={`/approvals/${approval.id}`}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex-1">
                    <div className="font-medium">{approval.title}</div>
                    <div className="text-sm text-gray-500">
                      {getTypeLabel(approval.type)} | {approval.project?.name || '-'} | {approval.submitter.name}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {approval.createdAt.toLocaleDateString('ko-KR')}
                      {approval.approvers.length > 0 && (
                        <> | 결재선: {approval.approvers.map(a => a.user.name).join(' → ')}</>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={getStatusColor(approval.status) as 'secondary' | 'outline' | 'warning' | 'success' | 'destructive'}>
                      {APPROVAL_STATUSES.find(s => s.value === approval.status)?.label || approval.status}
                    </Badge>
                    <div className="text-sm font-medium mt-1">{fmt(approval.amount)}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
