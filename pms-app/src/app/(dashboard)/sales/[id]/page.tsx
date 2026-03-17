import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, formatDate, formatCurrency } from '@/lib/utils'
import { Edit, Trash2, ArrowLeft, TrendingUp, FileText, Users, DollarSign, Calculator } from 'lucide-react'
import Link from 'next/link'
import { deleteSales } from '@/app/actions/sales'
import { ConvertToProjectButton } from '@/components/sales/convert-to-project-button'
import { ConfirmContractButton } from '@/components/sales/confirm-contract-button'

async function getSales(id: string) {
  return prisma.sales.findUnique({
    where: { id },
    include: {
      customer: true,
      project: true,
      manager: true,
    },
  })
}

function parseCompetitorInfo(info: string | null): any[] {
  if (!info) return []
  try {
    return JSON.parse(info)
  } catch {
    return []
  }
}

function formatCurrencyValue(value: number | null | undefined): string {
  if (value == null || value === 0) return '-'
  return formatCurrency(value)
}

export default async function SalesDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    redirect('/login')
  }

  const sales = await getSales(id)

  if (!sales) {
    redirect('/sales')
  }

  const competitors = parseCompetitorInfo(sales.competitorInfo)
  const executionCost = 
    (sales.laborCost || 0) +
    (sales.materialCost || 0) +
    (sales.outsourceCost || 0) +
    (sales.equipmentCost || 0) +
    (sales.otherCost || 0)
  
  const profitLoss = (sales.contractAmount || 0) - executionCost
  const profitMargin = sales.contractAmount ? ((profitLoss / sales.contractAmount) * 100).toFixed(1) : null

  const deleteAction = deleteSales.bind(null, sales.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/sales">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <p className="text-sm text-slate-500">{sales.type}</p>
            <h1 className="text-2xl font-bold">{sales.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          {!['WON', 'LOST', 'CANCELLED'].includes(sales.status) && (
            <ConfirmContractButton
              salesId={sales.id}
              salesTitle={sales.title}
              contractAmount={sales.contractAmount}
            />
          )}
          {sales.status === 'WON' && (
            <ConvertToProjectButton 
              salesId={sales.id} 
              projectId={sales.projectId}
              disabled={!sales.contractAmount}
            />
          )}
          <Link href={`/sales/${sales.id}/edit`}>
            <Button variant="outline">
              <Edit className="w-4 h-4 mr-2" />
              수정
            </Button>
          </Link>
          <form action={deleteAction}>
            <Button variant="destructive" type="submit">
              <Trash2 className="w-4 h-4 mr-2" />
              삭제
            </Button>
          </form>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(sales.status)}`}>
          {sales.status}
        </span>
        {sales.winProbability && (
          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
            수주확률: {sales.winProbability}%
          </span>
        )}
        {sales.bidResult && (
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            sales.bidResult === 'WON' ? 'bg-green-100 text-green-700' : 
            sales.bidResult === 'LOST' ? 'bg-red-100 text-red-700' : 
            'bg-yellow-100 text-yellow-700'
          }`}>
            결과: {sales.bidResult}
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">입찰금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrencyValue(sales.bidAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">계약금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrencyValue(sales.contractAmount)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">고객사</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {sales.customer?.name || '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">담당자</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {sales.manager?.name || '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              일정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">입찰번호</span>
              <span>{sales.bidNumber || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">개찰일</span>
              <span>{sales.bidOpenDate ? formatDate(sales.bidOpenDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">제출기한</span>
              <span>{sales.submissionDate ? formatDate(sales.submissionDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">계약일</span>
              <span>{sales.contractDate ? formatDate(sales.contractDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">결과 확정일</span>
              <span>{sales.resultDate ? formatDate(sales.resultDate) : '-'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              연결 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">연결 프로젝트</span>
              <span>
                {sales.project ? (
                  <Link href={`/projects/${sales.project.id}`} className="text-blue-600 hover:underline">
                    {sales.project.name}
                  </Link>
                ) : '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              고객사 및 경쟁사 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-500">고객사 예산</span>
              <span className="font-medium">{formatCurrencyValue(sales.customerBudget)}</span>
            </div>
            
            {competitors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-2">경쟁사 현황</h4>
                <div className="space-y-2">
                  {competitors.map((comp: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded text-sm">
                      <div>
                        <span className="font-medium">{comp.name}</span>
                        <span className="text-slate-500 ml-2">({comp.status})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrencyValue(comp.amount)}</div>
                        {comp.notes && <div className="text-xs text-slate-500">{comp.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {competitors.length === 0 && (
              <p className="text-sm text-slate-500">경쟁사 정보가 없습니다.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              실행원가 산출
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">인건비</span>
              <span>{formatCurrencyValue(sales.laborCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">자재비</span>
              <span>{formatCurrencyValue(sales.materialCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">외주비</span>
              <span>{formatCurrencyValue(sales.outsourceCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">장비비</span>
              <span>{formatCurrencyValue(sales.equipmentCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">기타비용</span>
              <span>{formatCurrencyValue(sales.otherCost)}</span>
            </div>
            <div className="border-t pt-3 flex justify-between font-medium">
              <span>실행원가 합계</span>
              <span className="text-lg">{formatCurrencyValue(executionCost)}</span>
            </div>
          </CardContent>
        </Card>

        {sales.contractAmount && executionCost > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                손익 분석
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-500">계약금액</div>
                  <div className="text-xl font-bold text-green-600">{formatCurrencyValue(sales.contractAmount)}</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-500">실행원가</div>
                  <div className="text-xl font-bold text-red-600">{formatCurrencyValue(executionCost)}</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-500">손익</div>
                  <div className={`text-xl font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrencyValue(profitLoss)}
                  </div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-500">이익률</div>
                  <div className={`text-xl font-bold ${profitMargin && parseFloat(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitMargin ? `${profitMargin}%` : '-'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {sales.description && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>설명</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 whitespace-pre-wrap">{sales.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
