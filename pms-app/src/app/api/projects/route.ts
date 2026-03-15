import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { checkApiPermission } from '@/lib/rbac'

export async function GET() {
  try {
    const { allowed, error } = await checkApiPermission(['ADMIN', 'PM', 'STAFF'])
    
    if (!allowed) {
      return error
    }

    const projects = await prisma.project.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true }
    })

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json(
      { error: '프로젝트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
