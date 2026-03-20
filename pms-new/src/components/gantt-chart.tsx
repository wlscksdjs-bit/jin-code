'use client'

import { useEffect, useState } from 'react'

type GanttItem = {
  id: string
  name: string
  code: string
  startDate: string | null
  endDate: string | null
  progress: number
  isMilestone: boolean
  isCritical: boolean
  status: string
}

export function GanttChart({ projectId }: { projectId: string }) {
  const [items, setItems] = useState<GanttItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/wbs/${projectId}`)
      .then((r) => r.json())
      .then((data) => {
        setItems(data.nodes ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [projectId])

  if (loading) return <div className="py-8 text-center text-sm text-gray-500">로딩 중...</div>
  if (items.length === 0) return <div className="py-8 text-center text-sm text-gray-500">WBS 항목이 없습니다.</div>

  const allDates = items
    .flatMap((i) => [i.startDate, i.endDate].filter(Boolean) as string[])
    .map((d) => new Date(d))

  const minDate = allDates.length > 0
    ? new Date(Math.min(...allDates.map((d) => d.getTime())))
    : new Date()
  const maxDate = allDates.length > 0
    ? new Date(Math.max(...allDates.map((d) => d.getTime())))
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const totalDays = Math.max(1, Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)))

  const dayWidth = 30
  const chartWidth = totalDays * dayWidth

  const getOffset = (dateStr: string | null) => {
    if (!dateStr) return 0
    const d = new Date(dateStr)
    return Math.max(0, Math.ceil((d.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))) * dayWidth
  }

  const getWidth = (item: GanttItem) => {
    const start = getOffset(item.startDate)
    const end = getOffset(item.endDate)
    return Math.max(dayWidth, end - start)
  }

  const months: { label: string; offset: number; width: number }[] = []
  const cursor = new Date(minDate)
  cursor.setDate(1)
  while (cursor <= maxDate) {
    const monthStart = cursor.getTime()
    const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1).getTime()
    const offset = Math.max(0, Math.ceil((monthStart - minDate.getTime()) / (1000 * 60 * 60 * 24))) * dayWidth
    const daysInMonth = Math.ceil((Math.min(monthEnd, maxDate.getTime() + 86400000) - monthStart) / 86400000)
    months.push({
      label: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`,
      offset,
      width: daysInMonth * dayWidth,
    })
    cursor.setMonth(cursor.getMonth() + 1)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border">
        <div style={{ width: chartWidth + 200, minWidth: '100%' }}>
          <div className="flex border-b bg-gray-50 dark:bg-gray-900" style={{ width: chartWidth }}>
            {months.map((m) => (
              <div key={m.label} className="border-r px-2 py-1 text-center text-xs text-gray-500" style={{ width: m.width }}>
                {m.label}
              </div>
            ))}
          </div>
          <div className="relative" style={{ width: chartWidth + 200 }}>
            <div className="float-left w-[200px] border-r">
              {items.map((item) => (
                <div key={item.id} className="flex h-8 items-center border-b px-2 text-xs">
                  <span className="truncate font-medium">{item.name}</span>
                </div>
              ))}
            </div>
            <div className="relative" style={{ marginLeft: 200, width: chartWidth }}>
              <div className="absolute inset-0 flex">
                {months.map((m) => (
                  <div key={m.label} className="border-r border-gray-100 dark:border-gray-800" style={{ width: m.width }} />
                ))}
              </div>
              {items.map((item, idx) => (
                <div key={item.id} className="relative h-8 border-b border-gray-50 dark:border-gray-800">
                  {item.isMilestone ? (
                    <div
                      className="absolute top-1/2 -translate-y-1/2 text-yellow-500"
                      style={{ left: getOffset(item.startDate) - 6 }}
                    >
                      ◆
                    </div>
                  ) : (
                    <div
                      className={`absolute top-1 my-1 h-6 rounded-sm ${item.isCritical ? 'bg-red-400' : 'bg-blue-400'}`}
                      style={{
                        left: getOffset(item.startDate),
                        width: getWidth(item),
                        opacity: 0.6 + (item.progress / 100) * 0.4,
                      }}
                      title={`${item.progress}%`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-blue-400" /> 일반</span>
        <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-sm bg-red-400" /> CRITICAL</span>
        <span className="flex items-center gap-1"><span className="text-yellow-500">◆</span> 마일스톤</span>
      </div>
    </div>
  )
}
