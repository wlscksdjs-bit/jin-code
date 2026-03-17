'use client'

import { useState, useEffect } from 'react'
import { useSSE } from '@/hooks/useSSE'
import { useRouter } from 'next/navigation'

interface SSEMessage {
  type: string
  projectId?: string
  periodYear?: number
  periodMonth?: number
  previousPhase?: string
  newPhase?: string
}

interface DashboardSSEProps {
  onProjectUpdate?: (projectId: string) => void
  onCostUpdate?: (projectId: string) => void
  onPhaseChange?: (projectId: string, newPhase: string) => void
}

export function DashboardSSE({ onProjectUpdate, onCostUpdate, onPhaseChange }: DashboardSSEProps) {
  const router = useRouter()

  useSSE({
    url: '/api/events',
    enabled: true,
    onMessage: (data: SSEMessage) => {
      if (data.type === 'heartbeat') return

      if (data.type === 'PROJECT_UPDATED' && data.projectId) {
        onProjectUpdate?.(data.projectId)
      } else if (data.type === 'COST_UPDATED' && data.projectId) {
        onCostUpdate?.(data.projectId)
      } else if (data.type === 'PROJECT_PHASE_CHANGED' && data.projectId) {
        onPhaseChange?.(data.projectId, data.newPhase || '')
        router.refresh()
      } else if (data.type === 'BUDGET_ALERT') {
        router.refresh()
      } else if (data.type === 'MILESTONE_DUE') {
        router.refresh()
      }
    },
  })

  return null
}
