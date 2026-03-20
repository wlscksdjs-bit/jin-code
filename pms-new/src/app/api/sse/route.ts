import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const session = await auth()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  const userId = session.user.id

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
      }

      send('connected', { userId, timestamp: Date.now() })

      let intervalId: ReturnType<typeof setInterval>

      const checkNotifications = async () => {
        try {
          const notifications = await prisma.notification.findMany({
            where: { userId, isRead: false },
            orderBy: { createdAt: 'desc' },
            take: 5,
          })
          if (notifications.length > 0) {
            send('notifications', { count: notifications.length, items: notifications })
          }

          const projects = await prisma.project.findMany({
            where: { isActive: true, status: { in: ['CONSTRUCTION', 'CONTRACT', 'DESIGN'] } },
            select: {
              id: true,
              name: true,
              code: true,
              budgetUsageRate: true,
              endDate: true,
            },
          })

          const alerts = []
          for (const p of projects) {
            if (p.budgetUsageRate >= 80) {
              alerts.push({
                type: 'budget',
                projectId: p.id,
                projectName: p.name,
                message: `${p.name}: 예산 사용률 ${p.budgetUsageRate.toFixed(0)}%`,
                severity: p.budgetUsageRate >= 100 ? 'critical' : p.budgetUsageRate >= 90 ? 'warning' : 'info',
              })
            }
            if (p.endDate) {
              const daysLeft = Math.ceil((new Date(p.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              if (daysLeft <= 7 && daysLeft >= 0) {
                alerts.push({
                  type: 'milestone',
                  projectId: p.id,
                  projectName: p.name,
                  message: `${p.name}: 종료 ${daysLeft}일 전`,
                  severity: daysLeft <= 3 ? 'warning' : 'info',
                })
              }
            }
          }
          if (alerts.length > 0) {
            send('alerts', alerts)
          }
        } catch (_) {}
      }

      await checkNotifications()
      intervalId = setInterval(checkNotifications, 30000)

      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
