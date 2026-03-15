import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkApiPermission } from '@/lib/rbac'

export async function GET(request: Request) {
  try {
    const { allowed, error } = await checkApiPermission(['ADMIN', 'PM', 'STAFF'])
    
    if (!allowed) {
      return error
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const where = projectId ? { projectId } : {}

    const costExecutions = await prisma.costExecution.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, code: true }
        },
        costEstimate: {
          select: { id: true, title: true }
        }
      },
      orderBy: { recordedDate: 'desc' }
    })

    return NextResponse.json({ costExecutions })
  } catch (error) {
    console.error('Error fetching cost executions:', error)
    return NextResponse.json(
      { error: '실행 원가 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
