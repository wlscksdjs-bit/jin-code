'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function listNotifications() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })
}

export async function markAsRead(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!notification || notification.userId !== session.user.id) {
    throw new Error('Not found or unauthorized')
  }

  return prisma.notification.update({
    where: { id },
    data: { isRead: true, readAt: new Date() },
  })
}

export async function markAllAsRead() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
}

export async function deleteNotification(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  })

  if (!notification || notification.userId !== session.user.id) {
    throw new Error('Not found or unauthorized')
  }

  await prisma.notification.delete({ where: { id } })
  revalidatePath('/notifications')
}

export async function getUnreadCount() {
  const session = await auth()
  if (!session) return 0

  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  })
}
