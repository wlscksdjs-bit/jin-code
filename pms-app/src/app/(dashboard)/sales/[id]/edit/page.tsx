import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SalesEditForm } from '@/components/sales/sales-edit-form'

async function getData() {
  const [customers, projects, managers] = await Promise.all([
    prisma.customer.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
    prisma.project.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }),
  ])
  return { customers, projects, managers }
}

async function getSales(id: string) {
  return prisma.sales.findUnique({
    where: { id },
  })
}

export default async function EditSalesPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    redirect('/login')
  }

  const [data, sales] = await Promise.all([
    getData(),
    getSales(id)
  ])

  if (!sales) {
    redirect('/sales')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">영업수주 수정</h1>
        <p className="text-slate-500">{sales.title}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>영업 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesEditForm {...data} sales={sales} />
        </CardContent>
      </Card>
    </div>
  )
}
