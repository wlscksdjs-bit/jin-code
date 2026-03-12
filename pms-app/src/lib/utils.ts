import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    REGISTERED: 'bg-blue-100 text-blue-800',
    CONTRACT: 'bg-green-100 text-green-800',
    DESIGN: 'bg-purple-100 text-purple-800',
    CONSTRUCTION: 'bg-orange-100 text-orange-800',
    COMPLETED: 'bg-gray-100 text-gray-800',
    CANCELLED: 'bg-red-100 text-red-800',
    DRAFT: 'bg-gray-100 text-gray-800',
    SUBMITTED: 'bg-yellow-100 text-yellow-800',
    EVALUATING: 'bg-blue-100 text-blue-800',
    WON: 'bg-green-100 text-green-800',
    LOST: 'bg-red-100 text-red-800',
    APPROVED: 'bg-green-100 text-green-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    CLOSED: 'bg-gray-100 text-gray-800',
    TODO: 'bg-gray-100 text-gray-800',
    REVIEW: 'bg-yellow-100 text-yellow-800',
    DONE: 'bg-green-100 text-green-800',
    LOW: 'bg-gray-100 text-gray-800',
    MEDIUM: 'bg-blue-100 text-blue-800',
    HIGH: 'bg-orange-100 text-orange-800',
    URGENT: 'bg-red-100 text-red-800',
  }
  
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function getProjectTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    ENVIRONMENT: '환경플랜트',
    FACILITY: '설비',
    PROCESS: '공정개선',
    CONSTRUCTION: '건설',
    OTHER: '기타',
  }
  return labels[type] || type
}
