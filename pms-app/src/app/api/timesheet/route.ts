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
    const userId = searchParams.get('userId')
    const month = searchParams.get('month')

    const where: any = {}
    if (projectId) where.projectId = projectId
    if (userId) where.userId = userId
    if (month) {
      const [year, m] = month.split('-').map(Number)
      const startDate = new Date(year, m - 1, 1)
      const endDate = new Date(year, m, 0)
      where.date = { gte: startDate, lte: endDate }
    }

    const timeSheets = await prisma.timeSheet.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, department: true } },
        project: { select: { id: true, name: true, code: true } },
        resource: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    })

    return NextResponse.json({ timeSheets })
  } catch (err) {
    console.error('Error fetching timesheets:', err)
    return NextResponse.json({ error: '근무시간 조회 중 오류가 발생했습니다.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { allowed, error, user } = await checkApiPermission(['ADMIN', 'PM', 'STAFF'])
    
    if (!allowed || !user) {
      return error
    }

    const body = await request.json()
    const { projectId, userId, date, hours, workType, description, hourlyRate } = body

    if (!projectId || !userId || !date || !hours || !workType) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 })
    }

    const totalCost = hourlyRate ? hours * hourlyRate : null

    const timeSheet = await prisma.timeSheet.create({
      data: {
        projectId,
        userId,
        date: new Date(date),
        hours,
        workType,
        description: description || null,
        hourlyRate: hourlyRate || null,
        totalCost,
        status: 'DRAFT'
      }
    })

    revalidatePath(`/projects/${projectId}`)

    return NextResponse.json({ success: true, timeSheet })
  } catch (err) {
    console.error('Error creating timesheet:', err)
    return NextResponse.json({ error: '근무시간 등록 중 오류가 발생했습니다.' }, { status: 500 })
  }
}
