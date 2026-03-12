import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, getProjectTypeLabel, formatDate, formatCurrency } from '@/lib/utils'
import { 
  FolderKanban, MapPin, Calendar, DollarSign, 
  Users, Edit, Trash2, ArrowLeft 
} from 'lucide-react'
import Link from 'next/link'
import { deleteProject } from '@/app/actions/projects'
import { ProjectScheduleView } from '@/components/project-schedule-view'
import { ResourceAllocation } from '@/components/resource-allocation'
import { ProfitLossCard } from '@/components/profit-loss-card'
import { AddWbsForm } from '@/components/projects/add-wbs-form'
import { calculateProfitLoss } from '@/app/actions/profit-loss'

async function getProject(id: string) {
  return prisma.project.findUnique({
    where: { id },
    include: {
      customer: true,
      members: { include: { user: true } },
      wbsItems: { 
        orderBy: { sortOrder: 'asc' },
        include: { componentOrders: true }
      },
      budgets: { orderBy: { createdAt: 'desc' }, take: 1 },
      sales: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
  })
}

async function getAvailableUsers() {
  return prisma.user.findMany({
    where: { isActive: true },
    select: { id: true, name: true, department: true }
  })
}

export default async function ProjectDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    redirect('/login')
  }

  const project = await getProject(id)
  const availableUsers = await getAvailableUsers()
  const profitLossData = await calculateProfitLoss(id)

  if (!project) {
    redirect('/projects')
  }

  const deleteAction = deleteProject.bind(null, project.id)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <p className="text-sm text-slate-500">{project.code}</p>
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${project.id}/edit`}>
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

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
          {project.status}
        </span>
        <span className="px-3 py-1 rounded-full text-sm bg-slate-100 text-slate-700">
          {getProjectTypeLabel(project.type)}
        </span>
        {project.contractType && (
          <span className="px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
            {project.contractType}
          </span>
        )}
      </div>

      {/* Main Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">계약금액</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.contractAmount ? formatCurrency(project.contractAmount) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">추정 예산</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {project.estimatedBudget ? formatCurrency(project.estimatedBudget) : '-'}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">고객사</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {project.customer?.name || '-'}
            </div>
          </CardContent>
        </Card>
        <ResourceAllocation 
          projectId={project.id} 
          members={project.members} 
          availableUsers={availableUsers} 
        />
      </div>

      {/* Details */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              일정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">시작일</span>
              <span>{project.startDate ? formatDate(project.startDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">종료일</span>
              <span>{project.endDate ? formatDate(project.endDate) : '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">계약일</span>
              <span>{project.contractDate ? formatDate(project.contractDate) : '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              현장 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-500">지역</span>
              <span>{project.location || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">주소</span>
              <span>{project.address || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* WBS Progress / Schedule */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5" />
                공정 진행 ({project.wbsItems.length}건)
              </CardTitle>
              <AddWbsForm projectId={project.id} existingWbs={project.wbsItems} />
            </div>
          </CardHeader>
          <CardContent>
            <ProjectScheduleView 
              wbsItems={project.wbsItems} 
              projectStartDate={project.startDate}
              projectEndDate={project.endDate}
            />
          </CardContent>
        </Card>

        {/* Budget */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              예산 ({project.budgets.length}건)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {project.budgets.length === 0 ? (
              <p className="text-slate-500 text-center py-4">등록된 예산이 없습니다</p>
            ) : (
              <div className="space-y-3">
                {project.budgets.map((budget) => (
                  <div key={budget.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <div className="font-medium">{budget.type}</div>
                      <div className={`px-2 py-0.5 rounded text-xs inline-block mt-1 ${getStatusColor(budget.status)}`}>
                        {budget.status}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{formatCurrency(budget.totalBudget)}</div>
                      <div className="text-sm text-slate-500">
                        사용: {formatCurrency(budget.actualCost)} ({budget.totalBudget > 0 ? Math.round((budget.actualCost / budget.totalBudget) * 100) : 0}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Loss */}
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <ProfitLossCard data={profitLossData} />
          </CardContent>
        </Card>

        {/* Description */}
        {project.description && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>설명</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 whitespace-pre-wrap">{project.description}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
