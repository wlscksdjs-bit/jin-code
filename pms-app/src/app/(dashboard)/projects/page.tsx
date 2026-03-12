import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor, getProjectTypeLabel, formatDate, formatCurrency } from '@/lib/utils'
import { Pagination } from '@/components/ui/search-filter'
import Link from 'next/link'
import { Plus, FolderKanban, MapPin, Calendar, Search, Users, Clock, CheckCircle, AlertTriangle, X, ArrowUpDown, FileSpreadsheet } from 'lucide-react'
import { ProjectsExportButton } from '@/components/projects/projects-export-button'
import { SortSelect } from '@/components/projects/sort-select'

interface Project {
  id: string
  code: string
  name: string
  status: string
  type: string
  location: string | null
  startDate: Date | null
  endDate: Date | null
  contractAmount: number | null
  customer: { name: string | null } | null
  _count: { members: number; wbsItems: number }
}

interface Props {
  searchParams: { 
    status?: string; 
    search?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
    type?: string;
    customerId?: string;
  }
}

const ITEMS_PER_PAGE = 12

async function getProjectsData(
  status?: string, 
  search?: string,
  page = 1,
  sortBy = 'createdAt',
  sortOrder: 'asc' | 'desc' = 'desc',
  type?: string,
  customerId?: string
) {
  const where: any = {}
  
  if (status && status !== 'all') {
    where.status = status
  }
  
  if (type) {
    where.type = type
  }
  
  if (customerId) {
    where.customerId = customerId
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { code: { contains: search } },
      { customer: { name: { contains: search } } }
    ]
  }

  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        customer: true,
        _count: { select: { members: true, wbsItems: true, budgets: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.project.count({ where })
  ])

  const allStats = await prisma.project.groupBy({
    by: ['status'],
    _count: true,
  })

  return { projects, allStats, total, totalPages: Math.ceil(total / ITEMS_PER_PAGE) }
}

const statusTabs = [
  { value: 'all', label: '전체', color: 'gray' },
  { value: 'REGISTERED', label: '등록됨', color: 'slate' },
  { value: 'CONTRACT', label: '계약', color: 'blue' },
  { value: 'DESIGN', label: '설계', color: 'purple' },
  { value: 'CONSTRUCTION', label: '시공', color: 'green' },
  { value: 'COMPLETED', label: '완료', color: 'emerald' },
  { value: 'DELAYED', label: '지연', color: 'red' },
]

export default async function ProjectsPage({ searchParams }: Props) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const currentStatus = searchParams.status || 'all'
  const search = searchParams.search || ''
  const page = parseInt(searchParams.page || '1')
  const sortBy = searchParams.sortBy || 'createdAt'
  const sortOrder = (searchParams.sortOrder as 'asc' | 'desc') || 'desc'
  const type = searchParams.type
  const customerId = searchParams.customerId
  
  const { projects, allStats, total, totalPages } = await getProjectsData(
    currentStatus === 'all' ? undefined : currentStatus,
    search,
    page,
    sortBy,
    sortOrder,
    type,
    customerId
  )
  
  const statusCounts = allStats.reduce((acc, s) => {
    acc[s.status] = s._count
    return acc
  }, {} as Record<string, number>)

  const totalCount = allStats.reduce((sum, s) => sum + s._count, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">프로젝트 관리</h1>
          <p className="text-slate-500">전체 {total}개 프로젝트</p>
        </div>
        <div className="flex gap-2">
          <ProjectsExportButton projects={projects} />
          <Link href="/projects/new">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              신규 프로젝트
            </Button>
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form className="flex-1" action="/projects" method="GET">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="프로젝트명, 코드, 고객사 검색..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {search && (
              <Link href="/projects" className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
              </Link>
            )}
          </div>
          {currentStatus !== 'all' && <input type="hidden" name="status" value={currentStatus} />}
        </form>
        
        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-slate-400" />
          <SortSelect />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2">
        {statusTabs.map((tab) => {
          const count = tab.value === 'all' 
            ? totalCount 
            : statusCounts[tab.value] || 0
          
          return (
            <Link
              key={tab.value}
              href={search ? `/projects?status=${tab.value}&search=${search}` : `/projects?status=${tab.value}`}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                currentStatus === tab.value
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                currentStatus === tab.value 
                  ? 'bg-white/20' 
                  : 'bg-slate-200'
              }`}>
                {count}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FolderKanban className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-600 mb-2">
              {search ? '검색 결과가 없습니다' : '프로젝트가 없습니다'}
            </h3>
            <p className="text-slate-500 mb-4">
              {search 
                ? '다른 검색어를 시도해보세요' 
                : '새 프로젝트를 만들어 시작하세요'}
            </p>
            {!search && (
              <Link href="/projects/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  새 프로젝트 만들기
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-200 h-full border-2 border-transparent hover:border-blue-200 cursor-pointer group">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-slate-500">{project.code}</p>
                      <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">{project.name}</CardTitle>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-slate-600">
                      <FolderKanban className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{project.customer?.name || '고객사 미지정'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                        {getProjectTypeLabel(project.type)}
                      </span>
                    </div>
                    {project.location && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="truncate">{project.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-xs">
                        {project.startDate ? formatDate(project.startDate) : '-'} ~ {project.endDate ? formatDate(project.endDate) : '-'}
                      </span>
                    </div>
                    {project.contractAmount && (
                      <div className="pt-2 border-t">
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(project.contractAmount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t flex gap-4 text-xs">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Users className="w-3 h-3" />
                      {project._count.members}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      WBS {project._count.wbsItems}
                    </div>
                    <div className="flex items-center gap-1 text-slate-500">
                      <CheckCircle className="w-3 h-3" />
                      예산 {project._count.budgets}
                    </div>
                    {project.status === 'DELAYED' && (
                      <div className="flex items-center gap-1 text-red-500 ml-auto">
                        <AlertTriangle className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
        />
      )}
      
      {/* Results count */}
      {projects.length > 0 && (
        <p className="text-sm text-slate-500 text-center">
          {total}개 중 {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, total)}개 표시
        </p>
      )}
    </div>
  )
}
