import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectForm } from '@/components/projects/project-form'

async function getCustomers() {
  return prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

export default async function NewProjectPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const customers = await getCustomers()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">새 프로젝트</h1>
        <p className="text-slate-500">새 프로젝트를 등록하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectForm customers={customers} />
        </CardContent>
      </Card>
    </div>
  )
}
