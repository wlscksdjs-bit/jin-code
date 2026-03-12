import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SalesForm } from '@/components/sales/sales-form'

async function getData() {
  const [customers, projects, managers] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.project.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])
  return { customers, projects, managers }
}

export default async function NewSalesPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const data = await getData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">영업수주 등록</h1>
        <p className="text-slate-500">새 영업 수주를 등록하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>영업 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesForm {...data} />
        </CardContent>
      </Card>
    </div>
  )
}
