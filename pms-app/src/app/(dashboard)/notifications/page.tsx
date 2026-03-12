import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import NotificationList from './notification-list'

async function getNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.notification.count({
      where: { userId, isRead: false },
    }),
  ])
  
  return { notifications, unreadCount }
}

export default async function NotificationsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }
  
  const userId = session.user.id
  const { notifications, unreadCount } = await getNotifications(userId)
  
  return (
    <NotificationList 
      notifications={notifications} 
      unreadCount={unreadCount}
      userId={userId}
    />
  )
}
