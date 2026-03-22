import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [
    totalProjects,
    activeProjects,
    totalSales,
    wonSales,
    pendingOrders,
    recentNotifications,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { isActive: true, status: { in: ['CONTRACT', 'CONSTRUCTION', 'DESIGN'] } } }),
    prisma.sales.count(),
    prisma.sales.count({ where: { status: 'WON' } }),
    prisma.purchaseOrder.count({ where: { status: { in: ['DRAFT', 'SENT', 'PARTIAL'] } } }),
    prisma.notification.findMany({
      where: { userId: session.user.id, isRead: false },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const projectStats = await prisma.project.groupBy({
    by: ['status'],
    _count: true,
  })

  const projects = await prisma.project.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      status: true,
      contractAmount: true,
      budgetUsageRate: true,
      endDate: true,
    },
    take: 10,
    orderBy: { updatedAt: 'desc' },
  })

  return NextResponse.json({
    stats: {
      totalProjects,
      activeProjects,
      totalSales,
      wonSales,
      pendingOrders,
      unreadNotifications: recentNotifications.length,
    },
    projectStats: projectStats.map(s => ({ status: s.status, count: s._count })),
    recentProjects: projects,
    recentNotifications,
  })
}
