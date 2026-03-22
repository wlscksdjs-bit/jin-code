import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    include: {
      customer: true,
      _count: {
        select: {
          tasks: true,
          purchaseOrders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(projects)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const project = await prisma.project.create({
      data: {
        code: body.code,
        name: body.name,
        type: body.type,
        status: body.status || 'REGISTERED',
        contractType: body.contractType,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        contractDate: body.contractDate ? new Date(body.contractDate) : null,
        contractAmount: body.contractAmount || 0,
        estimatedBudget: body.estimatedBudget || 0,
        location: body.location,
        address: body.address,
        description: body.description,
        customerId: body.customerId,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
