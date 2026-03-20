'use client'

import { useState, useEffect } from 'react'
import { useSSE } from '@/hooks/useSSE'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface SSEMessage {
  type: string
  projectId?: string
  periodYear?: number
  periodMonth?: number
  previousPhase?: string
  newPhase?: string
}

export function DashboardSSE() {
  const router = useRouter()
  const { status } = useSession()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      setEnabled(true)
    } else if (status === 'unauthenticated') {
      setEnabled(false)
    }
  }, [status])

  useSSE({
    url: '/api/events',
    enabled,
    onMessage: (data: SSEMessage) => {
      if (!data?.type) return
      if (data.type === 'heartbeat') return

      if (data.type === 'PROJECT_UPDATED' && data.projectId) {
        router.refresh()
      } else if (data.type === 'COST_UPDATED' && data.projectId) {
        router.refresh()
      } else if (data.type === 'PROJECT_PHASE_CHANGED' && data.projectId) {
        router.refresh()
      } else if (data.type === 'BUDGET_ALERT' || data.type === 'MILESTONE_DUE') {
        router.refresh()
      }
    },
  })

  return null
}
