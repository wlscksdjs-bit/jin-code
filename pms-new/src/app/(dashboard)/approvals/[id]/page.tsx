import { notFound } from 'next/navigation'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getApproval, submitApproval, reviewApproval, APPROVAL_TYPES, APPROVAL_STATUSES } from '@/app/actions/approvals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ReviewForm } from './review-form'

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

export default async function ApprovalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session) return null

  const approval = await getApproval(id)
  if (!approval) notFound()

  const fmt = (n: number) => n.toLocaleString('ko-KR') + '원'
  const isSubmitter = approval.submitterId === session.user.id
  const currentApproverIndex = approval.approvers.findIndex(a => a.userId === session.user.id && a.status === 'PENDING')
  const canReview = currentApproverIndex >= 0 && ['SUBMITTED', 'REVIEWING'].includes(approval.status)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/approvals" className="text-sm text-gray-500 hover:underline">
            ← 결재 목록
          </Link>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{approval.title}</h1>
        </div>
        <Badge variant={getStatusColor(approval.status) as 'secondary' | 'outline' | 'warning' | 'success' | 'destructive'}>
          {APPROVAL_STATUSES.find(s => s.value === approval.status)?.label || approval.status}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">기본 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">결재 유형</span>
              <span className="font-medium">{getTypeLabel(approval.type)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">프로젝트</span>
              <span className="font-medium">{approval.project?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">협력사</span>
              <span className="font-medium">{approval.vendor?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">申请人</span>
              <span className="font-medium">{approval.submitter.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">신청일</span>
              <span className="font-medium">{approval.createdAt.toLocaleDateString('ko-KR')}</span>
            </div>
            {approval.submittedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">상신일</span>
                <span className="font-medium">{approval.submittedAt.toLocaleDateString('ko-KR')}</span>
              </div>
            )}
            {approval.approvedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">승인일</span>
                <span className="font-medium">{approval.approvedAt.toLocaleDateString('ko-KR')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">결재 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-right">{fmt(approval.amount)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">결재 내용</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm">{approval.content || '내용 없음'}</pre>
        </CardContent>
      </Card>

      {approval.lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">결재 항목</CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">항목</th>
                  <th className="text-right py-2">수량</th>
                  <th className="text-right py-2">단가</th>
                  <th className="text-right py-2">금액</th>
                </tr>
              </thead>
              <tbody>
                {approval.lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.description}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">{fmt(item.unitPrice)}</td>
                    <td className="text-right font-medium">{fmt(item.totalPrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td className="py-2">합계</td>
                  <td></td>
                  <td></td>
                  <td className="text-right">{fmt(approval.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">결재선</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {approval.approvers.map((approver, index) => (
              <div key={approver.id} className="flex items-center gap-2">
                <div className={`px-3 py-2 rounded-full text-sm ${
                  approver.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  approver.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                  index === currentApproverIndex ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {approver.user.name} 
                  {approver.status === 'APPROVED' && ' ✓'}
                  {approver.status === 'REJECTED' && ' ✗'}
                </div>
                {index < approval.approvers.length - 1 && <span className="text-gray-400">→</span>}
              </div>
            ))}
            {approval.approvers.length === 0 && (
              <span className="text-gray-500">결재선 없음</span>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <div>
          {isSubmitter && approval.status === 'DRAFT' && (
            <form action={async () => {
              'use server'
              await submitApproval(id)
            }}>
              <Button type="submit">결재 상신</Button>
            </form>
          )}
        </div>
        <div className="flex gap-2">
          {canReview && (
            <ReviewForm 
              approvalId={id}
              approverIndex={currentApproverIndex}
              totalApprovers={approval.approvers.length}
            />
          )}
        </div>
      </div>
    </div>
  )
}
