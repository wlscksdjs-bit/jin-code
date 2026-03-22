'use client'

import { useState, useEffect, useTransition } from 'react'
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

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

type FilterType = 'all' | 'unread' | 'read'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const fetchNotifications = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const handleMarkAsRead = (id: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date() } : n))
          )
        }
      } catch (error) {
        console.error('Failed to mark as read:', error)
      }
    })
  }

  const handleMarkAllAsRead = () => {
    startTransition(async () => {
      try {
        const res = await fetch('/api/notifications/read-all', { method: 'POST' })
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) => ({ ...n, isRead: true, readAt: new Date() }))
          )
        }
      } catch (error) {
        console.error('Failed to mark all as read:', error)
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' })
        if (res.ok) {
          setNotifications((prev) => prev.filter((n) => n.id !== id))
        }
      } catch (error) {
        console.error('Failed to delete:', error)
      }
    })
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead
    if (filter === 'read') return n.isRead
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'PROJECT':
        return '📁'
      case 'TASK':
        return '✅'
      case 'BUDGET':
        return '💰'
      case 'ALERT':
        return '⚠️'
      default:
        return '🔔'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-28" />
        </div>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">알림</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount}개의 읽지 않은 알림이 있습니다` : '모든 알림을 확인했습니다'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} disabled={isPending}>
            <CheckCheck className="mr-2 h-4 w-4" />
            모두 읽음 처리
          </Button>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          전체 ({notifications.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          읽지 않음 ({notifications.filter((n) => !n.isRead).length})
        </Button>
        <Button
          variant={filter === 'read' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('read')}
        >
          읽음 ({notifications.filter((n) => n.isRead).length})
        </Button>
      </div>

      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filter === 'all'
                ? '알림이 없습니다'
                : filter === 'unread'
                ? '읽지 않은 알림이 없습니다'
                : '읽은 알림이 없습니다'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`transition-colors ${
                !notification.isRead
                  ? 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                  : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    <div>
                      <CardTitle className="text-base">{notification.title}</CardTitle>
                      {!notification.isRead && (
                        <Badge variant="default" className="mt-1 text-xs">
                          신규
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {notification.link && (
                      <a href={notification.link} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" className="h-8 w-8">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(notification.id)}
                      disabled={isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">{notification.message}</CardDescription>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(notification.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
