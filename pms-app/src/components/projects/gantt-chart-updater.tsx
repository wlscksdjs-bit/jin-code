'use client'

import { useCallback } from 'react'
import { GanttChart } from '@/components/gantt-chart'
import { updateWbsItem } from '@/app/actions/wbs-items'
import { useToast } from '@/components/ui/toast'

interface WbsItem {
  id: string
  projectId?: string
  code: string
  name: string
  startDate: Date | null
  endDate: Date | null
  progress: number
  status: string
  phaseType: string | null
  isMilestone?: boolean
  milestoneType?: string | null
  componentOrders?: any[]
}

interface GanttChartUpdaterProps {
  tasks: WbsItem[]
  projectId?: string
  startDate?: Date
  endDate?: Date
  showAlerts?: boolean
}

export function GanttChartUpdater({ tasks, projectId, startDate, endDate, showAlerts }: GanttChartUpdaterProps) {
  const { addToast } = useToast()

  const handleTaskUpdate = useCallback(async (taskId: string, newStartDate: Date, endDate: Date) => {
    const formData = new FormData()
    const task = tasks.find(t => t.id === taskId)
    formData.append('startDate', newStartDate.toISOString().split('T')[0])
    formData.append('endDate', endDate.toISOString().split('T')[0])
    if (task?.projectId) formData.append('projectId', task.projectId)
    if (projectId) formData.append('projectId', projectId)

    try {
      await updateWbsItem(taskId, formData)
      addToast('success', '일정이 저장되었습니다')
    } catch {
      addToast('error', '일정 저장에 실패했습니다')
    }
  }, [tasks, projectId, addToast])

  return (
    <GanttChart
      tasks={tasks}
      startDate={startDate}
      endDate={endDate}
      showAlerts={showAlerts}
      onTaskUpdate={handleTaskUpdate}
    />
  )
}
