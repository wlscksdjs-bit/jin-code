import type { CPMTask } from './cpm'

export interface GanttTaskColor {
  bg: string
  border: string
  label: string
}

export function getGanttTaskColor(
  isCritical: boolean,
  progress: number,
  cpiStatus: 'good' | 'warning' | 'danger' = 'good'
): GanttTaskColor {
  if (isCritical) {
    return { bg: 'bg-red-100', border: 'border-red-400', label: 'Critical' }
  }
  if (cpiStatus === 'danger') {
    return { bg: 'bg-orange-100', border: 'border-orange-400', label: 'Over Budget' }
  }
  if (cpiStatus === 'warning') {
    return { bg: 'bg-yellow-100', border: 'border-yellow-400', label: 'Warning' }
  }
  return { bg: 'bg-green-100', border: 'border-green-400', label: 'On Track' }
}

export function getGanttProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-green-500'
  if (progress >= 50) return 'bg-blue-500'
  if (progress >= 25) return 'bg-yellow-500'
  return 'bg-slate-400'
}

export function getGanttStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: '대기',
    IN_PROGRESS: '진행중',
    COMPLETED: '완료',
    DELAYED: '지연',
    ON_HOLD: '보류',
    CANCELLED: '취소',
  }
  return labels[status] || status
}
