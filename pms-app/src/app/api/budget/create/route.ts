import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkApiPermission, type UserRole } from '@/lib/rbac'

export async function POST(request: Request) {
  try {
    const { allowed, error, user } = await checkApiPermission(['ADMIN', 'PM'])
    
    if (!allowed || !user) {
      return error
    }

    let projectId: string
    let type: string
    let status: string
    let effectiveDate: string | null
    let indirectCostRate: number
    let sellingAdminCostRate: number
    let items: Array<{
      name: string
      category: string
      costType?: string
      plannedAmount: number
      previousAmount: number
      currentAmount: number
      description?: string
    }>

    const contentType = request.headers.get('content-type') || ''
    
    if (contentType.includes('application/json')) {
      const body = await request.json()
      projectId = body.projectId
      type = body.type
      status = body.status
      effectiveDate = body.effectiveDate
      indirectCostRate = body.indirectCostRate || 0
      sellingAdminCostRate = body.sellingAdminCostRate || 0
      items = body.items || []
    } else {
      const formData = await request.formData()
      projectId = formData.get('projectId') as string
      type = formData.get('type') as string
      status = formData.get('status') as string
      effectiveDate = formData.get('effectiveDate') as string
      indirectCostRate = Number(formData.get('indirectCostRate')) || 0
      sellingAdminCostRate = Number(formData.get('sellingAdminCostRate')) || 0
      
      const itemsJson = formData.get('itemsJson') as string
      items = itemsJson ? JSON.parse(itemsJson) : []
    }

    if (!projectId || !type) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    if (user.role === 'PM') {
      const project = await prisma.project.findFirst({
        where: { 
          id: projectId,
          members: { some: { userId: user.id } }
        }
      })
      
      if (!project) {
        return NextResponse.json(
          { error: '권한이 없습니다.' },
          { status: 403 }
        )
      }
    }

    const totalBudget = items.reduce((sum, item) => sum + (item.plannedAmount || 0), 0)
    const totalPrevious = items.reduce((sum, item) => sum + (item.previousAmount || 0), 0)
    const totalCurrent = items.reduce((sum, item) => sum + (item.currentAmount || 0), 0)
    const actualCost = totalPrevious + totalCurrent

    const budget = await prisma.budget.create({
      data: {
        projectId,
        type,
        totalBudget,
        actualCost,
        status: status || 'DRAFT',
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        indirectCostRate,
        sellingAdminCostRate,
        items: {
          create: items.map((item, index) => ({
            name: item.name,
            category: item.category,
            plannedAmount: item.plannedAmount || 0,
            previousAmount: item.previousAmount || 0,
            currentAmount: item.currentAmount || 0,
            actualAmount: (item.previousAmount || 0) + (item.currentAmount || 0),
            description: item.description || null,
            sortOrder: index,
          }))
        }
      },
      include: {
        items: true
      }
    })

    revalidatePath('/budget')
    revalidatePath(`/projects/${projectId}`)

    return NextResponse.json({ success: true, budget })
  } catch (error) {
    console.error('Error creating budget:', error)
    return NextResponse.json(
      { error: '예산 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
