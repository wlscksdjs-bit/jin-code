'use client'

import { useSSE } from '@/components/use-sse'

export function DashboardAlerts() {
  const { alerts, connected } = useSSE()

  if (!connected || alerts.length === 0) return null

  return (
    <div className="space-y-2">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${
            alert.severity === 'critical'
              ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
              : alert.severity === 'warning'
              ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400'
              : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400'
          }`}
        >
          <span className="font-medium">
            {alert.type === 'budget' ? '⚠️' : '📅'}
          </span>
          <span>{alert.message}</span>
        </div>
      ))}
    </div>
  )
}
