import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { exportProjects } from '@/lib/excel-export'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      contractAmount: true,
      estimatedBudget: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  const buffer = exportProjects(projects)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="projects-${new Date().toISOString().split('T')[0]}.xlsx"`,
    },
  })
}
