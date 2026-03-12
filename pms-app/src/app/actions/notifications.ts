'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: link || null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error('createNotification error:', error)
    return { success: false, error: '알림 생성 중 오류가 발생했습니다.' }
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('markNotificationAsRead error:', error)
    return { success: false, error: '알림 읽음 처리 중 오류가 발생했습니다.' }
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error('markAllNotificationsAsRead error:', error)
    return { success: false, error: '알림 일괄 읽음 처리 중 오류가 발생했습니다.' }
  }
}

export async function deleteNotification(id: string) {
  try {
    await prisma.notification.delete({
      where: { id },
    })

    return { success: true }
  } catch (error) {
    console.error('deleteNotification error:', error)
    return { success: false, error: '알림 삭제 중 오류가 발생했습니다.' }
  }
}

export async function getUserNotifications(userId: string, limit = 10) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    })

    return { success: true, notifications, unreadCount }
  } catch (error) {
    console.error('getUserNotifications error:', error)
    return { success: false, error: '알림 조회 중 오류가 발생했습니다.' }
  }
}
