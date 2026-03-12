'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Bell, 
  BellOff, 
  Trash2, 
  Check, 
  CheckCheck,
  ExternalLink,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from '@/app/actions/notifications'

type Notification = {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  isRead: boolean
  readAt: Date | null
  createdAt: Date
}

type NotificationListProps = {
  notifications: Notification[]
  unreadCount: number
  userId: string
}

function formatDate(date: Date | string) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  if (hours < 24) return `${hours}시간 전`
  if (days < 7) return `${days}일 전`
  return d.toLocaleDateString('ko-KR')
}

function getNotificationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    PROJECT_UPDATE: '프로젝트',
    TASK_ASSIGNED: '할당',
    BUDGET_ALERT: '예산',
    MILESTONE_DUE: '마일스톤',
    SYSTEM: '시스템',
  }
  return labels[type] || type
}

function getNotificationTypeColor(type: string) {
  const colors: Record<string, string> = {
    PROJECT_UPDATE: 'bg-blue-100 text-blue-800',
    TASK_ASSIGNED: 'bg-purple-100 text-purple-800',
    BUDGET_ALERT: 'bg-orange-100 text-orange-800',
    MILESTONE_DUE: 'bg-yellow-100 text-yellow-800',
    SYSTEM: 'bg-gray-100 text-gray-800',
  }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

export default function NotificationList({ notifications: initialNotifications, unreadCount: initialUnreadCount, userId }: NotificationListProps) {
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [isPending, startTransition] = useTransition()

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      const result = await markNotificationAsRead(id)
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date() } : n)
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsAsRead(userId)
      if (result.success) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, isRead: true, readAt: new Date() }))
        )
        setUnreadCount(0)
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const result = await deleteNotification(id)
      if (result.success) {
        const wasUnread = notifications.find(n => n.id === id)?.isRead === false
        setNotifications(prev => prev.filter(n => n.id !== id))
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1))
        }
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            알림
          </h1>
          <p className="text-slate-500">모든 알림을 확인하세요</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead} disabled={isPending}>
            {isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 mr-2" />
            )}
            모두 읽음 처리
          </Button>
        )}
      </div>

      {unreadCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">
            읽지 않은 알림 <span className="font-bold">{unreadCount}</span>건
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <BellOff className="w-12 h-12 mb-4 text-slate-300" />
              <p>알림이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getNotificationTypeColor(notification.type)}>
                          {getNotificationTypeLabel(notification.type)}
                        </Badge>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <span className="text-xs text-slate-400">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                      <h3 className={`font-medium ${
                        !notification.isRead ? 'text-black' : 'text-slate-700'
                      }`}>
                        {notification.title}
                      </h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      {notification.link && (
                        <Link 
                          href={notification.link}
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          이동하기
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={isPending}
                          title="읽음 처리"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(notification.id)}
                        disabled={isPending}
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
