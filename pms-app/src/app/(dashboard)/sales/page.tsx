import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Plus, TrendingUp, FileText, Clock, Calendar, Users, AlertCircle } from 'lucide-react'

async function getSalesData() {
  const [sales, stats] = await Promise.all([
    prisma.sales.findMany({
      include: {
        customer: true,
        project: true,
        manager: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.sales.groupBy({
      by: ['status'],
      _count: true,
    }),
  ])

  return { sales, stats }
}

function formatCurrencyValue(value: number | null | undefined): string {
  if (value == null || value === 0) return '-'
  if (value >= 100000000) {
    return `₩${(value / 100000000).toFixed(1)}억`
  }
  if (value >= 10000) {
    return `₩${(value / 10000).toFixed(0)}만`
  }
  return `₩${value.toLocaleString()}`
}

function getBidResultBadge(result: string | null): string {
  if (!result) return 'bg-slate-100 text-slate-500'
  switch (result) {
    case 'WON': return 'bg-green-100 text-green-700'
    case 'LOST': return 'bg-red-100 text-red-700'
    default: return 'bg-yellow-100 text-yellow-700'
  }
}

function isBidOpenSoon(date: Date | null): boolean {
  if (!date) return false
  const daysUntil = Math.ceil((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  return daysUntil >= 0 && daysUntil <= 7
}

function isOverdue(date: Date | null): boolean {
  if (!date) return false
  return new Date(date) < new Date()
}

export default async function SalesPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const { sales, stats } = await getSalesData()
  
  const statusCounts = stats.reduce((acc, s) => {
    acc[s.status] = s._count
    return acc
  }, {} as Record<string, number>)

  const totalBidAmount = sales.reduce((sum, s) => sum + (s.bidAmount || 0), 0)
  const totalContractAmount = sales.filter(s => s.status === 'WON').reduce((sum, s) => sum + (s.contractAmount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">영업수주관리</h1>
          <p className="text-slate-500">입찰 및 계약 관리</p>
        </div>
        <Link href="/sales/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            신규 등록
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">진행중</CardTitle>
            <Clock className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statusCounts.SUBMITTED || 0) + (statusCounts.EVALUATING || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">수주성공</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.WON || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">수주 실패</CardTitle>
            <FileText className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.LOST || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">등록됨</CardTitle>
            <FileText className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statusCounts.DRAFT || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">총 입찰금액</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-600">
              {formatCurrencyValue(totalBidAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">수주실적</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {formatCurrencyValue(totalContractAmount)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>입찰 검토 PJT 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">상태</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">구분</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">제목</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">고객사</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">고객사 예산</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">입찰금액</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-500">계약금액</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">수주확률</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">입찰결과</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">입찰기일</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((item) => {
                  const isUrgent = isBidOpenSoon(item.bidOpenDate)
                  const isPast = isOverdue(item.submissionDate)
                  
                  return (
                    <tr key={item.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">{item.type}</td>
                      <td className="py-3 px-4">
                        <Link href={`/sales/${item.id}`} className="hover:underline font-medium">
                          {item.title}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-sm">{item.customer?.name || '-'}</td>
                      <td className="py-3 px-4 text-right text-sm">
                        {formatCurrencyValue(item.customerBudget)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm">
                        {formatCurrencyValue(item.bidAmount)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm font-medium text-green-600">
                        {formatCurrencyValue(item.contractAmount)}
                      </td>
                      <td className="py-3 px-4 text-center text-sm">
                        {item.winProbability ? (
                          <span className={`font-medium ${
                            item.winProbability >= 70 ? 'text-green-600' :
                            item.winProbability >= 40 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {item.winProbability}%
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {item.bidResult && (
                          <span className={`px-2 py-1 rounded text-xs ${getBidResultBadge(item.bidResult)}`}>
                            {item.bidResult}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {item.bidOpenDate ? (
                            <>
                              {isUrgent && <AlertCircle className="h-3 w-3 text-orange-500" />}
                              <span className={`text-sm ${
                                isPast ? 'text-red-600 font-medium' : 
                                isUrgent ? 'text-orange-600' : ''
                              }`}>
                                {formatDate(item.bidOpenDate)}
                              </span>
                            </>
                          ) : '-'}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      데이터가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
