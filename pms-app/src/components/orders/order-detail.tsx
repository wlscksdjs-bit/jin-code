'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Send, CheckCircle, Package, Trash2 } from 'lucide-react'

interface OrderItem {
  id: string
  itemName: string
  specification: string | null
  unit: string
  quantity: number
  unitPrice: number
  amount: number
  orderedQuantity: number
  receivedQuantity: number
  rejectedQuantity: number
  status: string
}

interface Order {
  id: string
  orderNumber: string
  title: string
  description: string | null
  orderDate: string
  requiredDate: string | null
  deliveryDate: string | null
  subtotal: number
  tax: number
  totalAmount: number
  paidAmount: number
  status: string
  notes: string | null
  vendor: {
    id: string
    name: string
    category: string
    contactPerson: string | null
    contactPhone: string | null
    contactEmail: string | null
    bankName: string | null
    accountNumber: string | null
    accountHolder: string | null
  }
  project: {
    id: string
    name: string
    code: string
  }
  items: OrderItem[]
}

interface OrderDetailProps {
  order: Order
}

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

export function OrderDetail({ order }: OrderDetailProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [action, setAction] = useState<string | null>(null)

  async function handleSend() {
    if (!confirm('발주서를 발송하시겠습니까?')) return
    setLoading(true)
    setAction('send')
    try {
      const res = await fetch(`/api/orders/${order.id}/send`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        alert('발송되었습니다.')
        router.refresh()
      } else {
        alert(result.error || '오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  async function handleDelete() {
    if (!confirm('이 발주서를 삭제하시겠습니까?')) return
    setLoading(true)
    setAction('delete')
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        alert('삭제되었습니다.')
        router.push('/orders')
      } else {
        alert(result.error || '오류가 발생했습니다.')
      }
    } finally {
      setLoading(false)
      setAction(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-sm text-slate-500 font-mono">{order.orderNumber}</p>
            <h1 className="text-2xl font-bold">{order.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status === 'DRAFT' && (
            <>
              <Button variant="outline" onClick={() => router.push(`/orders/${order.id}/edit`)}>
                수정
              </Button>
              <Button onClick={handleSend} disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                {loading && action === 'send' ? '발송 중...' : '발송'}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                <Trash2 className="w-4 h-4 mr-2" />
                {loading && action === 'delete' ? '삭제 중...' : '삭제'}
              </Button>
            </>
          )}
          {order.status === 'SENT' && (
            <Button onClick={() => router.push(`/orders/${order.id}/receive`)}>
              <CheckCircle className="w-4 h-4 mr-2" />
              입고 처리
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(order.status)}`}>
          {getStatusLabel(order.status)}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>발주 품목</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-sm">
                      <th className="text-left py-2 px-2 font-medium text-slate-500">품목</th>
                      <th className="text-left py-2 px-2 font-medium text-slate-500">규격</th>
                      <th className="text-right py-2 px-2 font-medium text-slate-500">단위</th>
                      <th className="text-right py-2 px-2 font-medium text-slate-500">수량</th>
                      <th className="text-right py-2 px-2 font-medium text-slate-500">단가</th>
                      <th className="text-right py-2 px-2 font-medium text-slate-500">금액</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-2 px-2">{item.itemName}</td>
                        <td className="py-2 px-2 text-slate-500 text-sm">{item.specification || '-'}</td>
                        <td className="py-2 px-2 text-right">{item.unit}</td>
                        <td className="py-2 px-2 text-right">{item.quantity.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right">{item.unitPrice.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right font-medium">{item.amount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 border-t pt-4 space-y-2">
                <div className="flex justify-between text-slate-500">
                  <span>소계</span>
                  <span>{order.subtotal.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>부가세 (10%)</span>
                  <span>{order.tax.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>합계</span>
                  <span className="text-green-600">{order.totalAmount.toLocaleString()}원</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {order.status !== 'DRAFT' && (
            <Card>
              <CardHeader>
                <CardTitle>입고 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-sm">
                        <th className="text-left py-2 px-2 font-medium text-slate-500">품목</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-500">발주수량</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-500">입고수량</th>
                        <th className="text-right py-2 px-2 font-medium text-slate-500">반품수량</th>
                        <th className="text-center py-2 px-2 font-medium text-slate-500">상태</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2 px-2">{item.itemName}</td>
                          <td className="py-2 px-2 text-right">{item.orderedQuantity.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-green-600">{item.receivedQuantity.toLocaleString()}</td>
                          <td className="py-2 px-2 text-right text-red-500">{item.rejectedQuantity.toLocaleString()}</td>
                          <td className="py-2 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              item.status === 'RECEIVED' ? 'bg-green-100 text-green-700' :
                              item.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-slate-100 text-slate-700'
                            }`}>
                              {item.status === 'RECEIVED' ? '완료' : item.status === 'PARTIAL' ? '부분' : '대기'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500">프로젝트</span>
                <span>{order.project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">발주일</span>
                <span>{formatDate(new Date(order.orderDate))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">납기일</span>
                <span>{order.requiredDate ? formatDate(new Date(order.requiredDate)) : '-'}</span>
              </div>
              {order.deliveryDate && (
                <div className="flex justify-between">
                  <span className="text-slate-500">입고일</span>
                  <span>{formatDate(new Date(order.deliveryDate))}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">결제 금액</span>
                <span className="font-medium">{order.paidAmount.toLocaleString()}원</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>거래처</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-slate-400" />
                <span className="font-medium">{order.vendor.name}</span>
              </div>
              <div className="text-sm text-slate-500">
                <p>{order.vendor.category}</p>
                {order.vendor.contactPerson && (
                  <p className="mt-2">담당자: {order.vendor.contactPerson}</p>
                )}
                {order.vendor.contactPhone && (
                  <p>연락처: {order.vendor.contactPhone}</p>
                )}
                {order.vendor.contactEmail && (
                  <p>이메일: {order.vendor.contactEmail}</p>
                )}
              </div>
              {order.vendor.bankName && order.vendor.accountNumber && (
                <div className="border-t pt-3 mt-3 text-sm">
                  <p className="text-slate-500">입금 계좌</p>
                  <p>{order.vendor.bankName} {order.vendor.accountNumber}</p>
                  {order.vendor.accountHolder && (
                    <p className="text-slate-500">예금주: {order.vendor.accountHolder}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle>비고</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
