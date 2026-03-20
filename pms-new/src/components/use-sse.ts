'use client'

import { useEffect, useState } from 'react'

type Alert = {
  type: string
  projectId: string
  projectName: string
  message: string
  severity: string
}

type Notification = {
  id: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

export function useSSE() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const es = new EventSource('/api/sse')

    es.addEventListener('connected', () => setConnected(true))
    es.addEventListener('notifications', (e) => {
      const data = JSON.parse(e.data)
      setNotifications(data.items)
    })
    es.addEventListener('alerts', (e) => {
      const data: Alert[] = JSON.parse(e.data)
      setAlerts(data)
    })

    es.onerror = () => {
      setConnected(false)
    }

    return () => {
      es.close()
    }
  }, [])

  return { alerts, notifications, connected }
}
