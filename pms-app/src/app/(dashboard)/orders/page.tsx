import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Plus, Package } from 'lucide-react'
import Link from 'next/link'
import { OrdersExportButton } from '@/components/orders/orders-export-button'

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-slate-100 text-slate-700',
    SENT: 'bg-blue-100 text-blue-700',
    PARTIAL: 'bg-yellow-100 text-yellow-700',
    RECEIVED: 'bg-green-100 text-green-700',
    INSTALLED: 'bg-purple-100 text-purple-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }
  return styles[status] || 'bg-slate-100 text-slate-700'
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    DRAFT: '임시저장',
    SENT: '발송됨',
    PARTIAL: '부분입고',
    RECEIVED: '입고완료',
    INSTALLED: '설치완료',
    CANCELLED: '취소',
  }
  return labels[status] || status
}

async function getOrdersData() {
  const orders = await prisma.purchaseOrder.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      vendor: { select: { id: true, name: true, category: true } },
      project: { select: { id: true, name: true, code: true } },
      items: true,
    },
  })

  const stats = {
    total: orders.length,
    draft: orders.filter(o => o.status === 'DRAFT').length,
    sent: orders.filter(o => o.status === 'SENT').length,
    partial: orders.filter(o => o.status === 'PARTIAL').length,
    received: orders.filter(o => o.status === 'RECEIVED').length,
    totalAmount: orders.reduce((sum, o) => sum + o.totalAmount, 0),
  }

  return { orders, stats }
}

export default async function PurchaseOrdersPage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  if (session.user.role === 'STAFF') {
    redirect('/')
  }

  const { orders, stats } = await getOrdersData()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">발주 관리</h1>
            <p className="text-slate-500">자재 및 용역 발주를 관리합니다</p>
          </div>
        </div>
        <div className="flex gap-2">
          <OrdersExportButton orders={orders} />
          <Link href="/orders/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              새 발주서
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">전체</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">임시저장</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-600">{stats.draft}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">발송/부분입고</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent + stats.partial}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">총 금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>발주서 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>발주서가 없습니다.</p>
              <Link href="/orders/new">
                <Button variant="outline" className="mt-4">
                  첫 발주서 만들기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">발주번호</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">제목</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">거래처</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">프로젝트</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">발주일</th>
                    <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">납기일</th>
                    <th className="text-right py-3 px-2 text-sm font-medium text-slate-500">금액</th>
                    <th className="text-center py-3 px-2 text-sm font-medium text-slate-500">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-2">
                        <Link 
                          href={`/orders/${order.id}`}
                          className="text-blue-600 hover:underline font-mono text-sm"
                        >
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-2">
                        <Link 
                          href={`/orders/${order.id}`}
                          className="hover:underline"
                        >
                          {order.title}
                        </Link>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {order.vendor.name}
                        <span className="text-slate-500 ml-1">({order.vendor.category})</span>
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {order.project ? (
                          <Link 
                            href={`/projects/${order.project.id}`}
                            className="text-blue-600 hover:underline"
                          >
                            {order.project.name}
                          </Link>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {formatDate(order.orderDate)}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        {order.requiredDate ? formatDate(order.requiredDate) : '-'}
                      </td>
                      <td className="py-3 px-2 text-right font-medium">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
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
