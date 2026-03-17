import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { MonthlyCostForm } from '@/components/cost/monthly-cost-form'
import { Calculator } from 'lucide-react'

async function getProjects() {
  return prisma.project.findMany({
    where: { 
      isActive: true,
      status: { in: ['CONTRACT', 'DESIGN', 'CONSTRUCTION'] }
    },
    orderBy: { name: 'asc' },
    select: { 
      id: true, 
      name: true, 
      code: true,
      contractAmount: true 
    }
  })
}

export default async function NewMonthlyCostPage({
  searchParams
}: {
  searchParams: Promise<{ projectId?: string }>
}) {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  if (session.user.role === 'STAFF') {
    redirect('/')
  }

  const params = await searchParams
  const projects = await getProjects()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calculator className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold">월별 원가 입력</h1>
          <p className="text-slate-500">프로젝트의 월별 실행원가를 등록합니다</p>
        </div>
      </div>

      <MonthlyCostForm 
        projects={projects}
        projectId={params.projectId}
      />
    </div>
  )
}
