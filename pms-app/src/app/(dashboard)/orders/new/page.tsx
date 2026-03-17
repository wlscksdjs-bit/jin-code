import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { CreateOrderForm } from '@/components/orders/create-order-form'
import { Package } from 'lucide-react'

async function getVendors() {
  return prisma.vendor.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true },
  })
}

async function getProjects() {
  return prisma.project.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, code: true },
  })
}

export default async function NewOrderPage({
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
  const [vendors, projects] = await Promise.all([
    getVendors(),
    getProjects(),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Package className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold">새 발주서</h1>
          <p className="text-slate-500">자재 또는 용역 발주서를 작성합니다</p>
        </div>
      </div>

      <CreateOrderForm 
        vendors={vendors} 
        projects={projects}
        defaultProjectId={params.projectId}
      />
    </div>
  )
}
