import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkApiPermission } from '@/lib/rbac'

export async function POST(request: Request) {
  try {
    const { allowed, error, user } = await checkApiPermission(['ADMIN', 'PM'])
    
    if (!allowed || !user) {
      return error
    }

    const formData = await request.formData()
    
    const projectId = formData.get('projectId') as string
    const code = formData.get('code') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string
    const plannedDays = formData.get('plannedDays') as string
    const progress = formData.get('progress') as string
    const status = formData.get('status') as string
    const phaseType = formData.get('phaseType') as string
    const sortOrder = formData.get('sortOrder') as string

    if (!projectId || !code || !name) {
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

    await prisma.wbsItem.create({
      data: {
        projectId,
        code,
        name,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        plannedDays: plannedDays ? parseInt(plannedDays) : null,
        progress: progress ? parseInt(progress) : 0,
        status: status || 'PENDING',
        phaseType: phaseType || null,
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error creating WBS item:', error)
    return NextResponse.json(
      { error: 'WBS 항목 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
