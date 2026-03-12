import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProjectEditForm } from '@/components/projects/project-edit-form'

async function getCustomers() {
  return prisma.customer.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })
}

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
  })
}

export default async function EditProjectPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    redirect('/login')
  }

  const [customers, project] = await Promise.all([
    getCustomers(),
    getProject(id)
  ])

  if (!project) {
    redirect('/projects')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">프로젝트 수정</h1>
        <p className="text-slate-500">{project.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>프로젝트 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <ProjectEditForm customers={customers} project={project} />
        </CardContent>
      </Card>
    </div>
  )
}
