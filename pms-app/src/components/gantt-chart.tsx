'use client'

import { useState, useCallback, useMemo } from 'react'
import { AlertTriangle, Flag, Calendar, CheckCircle, Clock, Pencil, HardHat, GripHorizontal, ChevronLeft, ChevronRight, X } from 'lucide-react'

interface GanttTask {
  id: string
  name: string
  startDate: Date | null
  endDate: Date | null
  progress: number
  status: string
  phaseType?: string | null
  isMilestone?: boolean
  milestoneType?: string | null
}

interface GanttChartProps {
  tasks: GanttTask[]
  startDate?: Date
  endDate?: Date
  showAlerts?: boolean
  onTaskUpdate?: (taskId: string, startDate: Date, endDate: Date) => void
}

const PHASE_COLORS: Record<string, { bg: string; label: string; icon: any }> = {
  PLANNING: { bg: 'bg-slate-400', label: '계획', icon: Pencil },
  DESIGN: { bg: 'bg-purple-500', label: '기본설계', icon: Pencil },
  DESIGN_DETAIL: { bg: 'bg-violet-500', label: '기본설계', icon: Pencil },
  DESIGN_BIDDING: { bg: 'bg-fuchsia-500', label: '설계발주', icon: Pencil },
  PROCUREMENT: { bg: 'bg-orange-500', label: '구매', icon: HardHat },
  CONSTRUCTION: { bg: 'bg-green-500', label: '시공', icon: HardHat },
  CONSTRUCTION_START: { bg: 'bg-emerald-500', label: '시공시작', icon: HardHat },
  CONSTRUCTION_PROGRESS: { bg: 'bg-lime-500', label: '시공중', icon: HardHat },
  CONSTRUCTION_COMPLETE: { bg: 'bg-teal-500', label: '시공완료', icon: HardHat },
  COMMISSIONING: { bg: 'bg-cyan-500', label: '시운전', icon: CheckCircle },
  HANDOVER: { bg: 'bg-blue-500', label: '인수인계', icon: CheckCircle },
}

const MILESTONE_LABELS: Record<string, string> = {
  PROJECT_START: '프로젝트 시작',
  PROJECT_END: '프로젝트 완료',
  DESIGN_COMPLETE: '설계 완료',
  CONSTRUCTION_START: '시공 시작',
  CONSTRUCTION_COMPLETE: '시공 완료',
  COMMISSIONING: '시운전',
  HANDOVER: '인수인계',
}

interface OverlapError {
  taskId1: string
  taskName1: string
  taskId2: string
  taskName2: string
}

export function GanttChart({ tasks, startDate, endDate, showAlerts = true, onTaskUpdate }: GanttChartProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [draggingTask, setDraggingTask] = useState<string | null>(null)
  const [resizingTask, setResizingTask] = useState<{ taskId: string; edge: 'start' | 'end' } | null>(null)
  const [dragOffset, setDragOffset] = useState(0)
  const [localTasks, setLocalTasks] = useState<GanttTask[]>(tasks)
  const [overlapErrors, setOverlapErrors] = useState<OverlapError[]>([])

  useMemo(() => {
    setLocalTasks(tasks)
  }, [tasks])

  const checkOverlaps = useCallback((updatedTasks: GanttTask[]) => {
    const errors: OverlapError[] = []
    
    for (let i = 0; i < updatedTasks.length; i++) {
      for (let j = i + 1; j < updatedTasks.length; j++) {
        const task1 = updatedTasks[i]
        const task2 = updatedTasks[j]
        
        if (task1.isMilestone || task2.isMilestone) continue
        if (!task1.startDate || !task1.endDate || !task2.startDate || !task2.endDate) continue
        
        const start1 = new Date(task1.startDate).getTime()
        const end1 = new Date(task1.endDate).getTime()
        const start2 = new Date(task2.startDate).getTime()
        const end2 = new Date(task2.endDate).getTime()
        
        if (task1.phaseType === task2.phaseType && start1 < end2 && end1 > start2) {
          errors.push({
            taskId1: task1.id,
            taskName1: task1.name,
            taskId2: task2.id,
            taskName2: task2.name,
          })
        }
      }
    }
    
    setOverlapErrors(errors)
    return errors
  }, [])

  const handleDragStart = (taskId: string, e: React.MouseEvent) => {
    e.preventDefault()
    setDraggingTask(taskId)
    const task = localTasks.find(t => t.id === taskId)
    if (task?.startDate) {
      const rect = (e.target as HTMLElement).getBoundingClientRect()
      setDragOffset(e.clientX - rect.left)
    }
  }

  const handleResizeStart = (taskId: string, edge: 'start' | 'end', e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingTask({ taskId, edge })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingTask && !resizingTask) return
    
    const task = localTasks.find(t => t.id === (draggingTask || resizingTask?.taskId))
    if (!task || !task.startDate || !task.endDate) return

    const dayWidth = 25
    const container = e.currentTarget.closest('.gantt-container') as HTMLElement
    if (!container) return
    
    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left - 224
    const daysMoved = Math.round(x / dayWidth)

    if (draggingTask) {
      const currentStart = new Date(task.startDate!)
      const currentEnd = new Date(task.endDate!)
      const duration = currentEnd.getTime() - currentStart.getTime()
      
      const newStart = new Date(currentStart.getTime() + daysMoved * 24 * 60 * 60 * 1000)
      const newEnd = new Date(newStart.getTime() + duration)
      
      setLocalTasks(prev => {
        const updated = prev.map(t => 
          t.id === draggingTask 
            ? { ...t, startDate: newStart, endDate: newEnd }
            : t
        )
        checkOverlaps(updated)
        return updated
      })
    } else if (resizingTask) {
      const currentStart = new Date(task.startDate)
      const currentEnd = new Date(task.endDate)
      
      let newStart = currentStart
      let newEnd = currentEnd
      
      if (resizingTask.edge === 'start') {
        newStart = new Date(currentStart.getTime() + daysMoved * 24 * 60 * 60 * 1000)
        if (newStart >= currentEnd) newStart = new Date(currentEnd.getTime() - 24 * 60 * 60 * 1000)
      } else {
        newEnd = new Date(currentEnd.getTime() + daysMoved * 24 * 60 * 60 * 1000)
        if (newEnd <= currentStart) newEnd = new Date(currentStart.getTime() + 24 * 60 * 60 * 1000)
      }
      
      setLocalTasks(prev => {
        const updated = prev.map(t => 
          t.id === resizingTask.taskId 
            ? { ...t, startDate: newStart, endDate: newEnd }
            : t
        )
        checkOverlaps(updated)
        return updated
      })
    }
  }, [draggingTask, resizingTask, localTasks, checkOverlaps])

  const handleMouseUp = () => {
    if ((draggingTask || resizingTask) && overlapErrors.length === 0) {
      const taskId = draggingTask || resizingTask?.taskId
      const task = localTasks.find(t => t.id === taskId)
      if (task && onTaskUpdate) {
        onTaskUpdate(task.id, task.startDate!, task.endDate!)
      }
    }
    setDraggingTask(null)
    setResizingTask(null)
    setDragOffset(0)
  }

  const shiftTask = (taskId: string, days: number) => {
    setLocalTasks(prev => {
      const updated = prev.map(t => {
        if (t.id === taskId && t.startDate && t.endDate) {
          const newStart = new Date(t.startDate)
          const newEnd = new Date(t.endDate)
          newStart.setDate(newStart.getDate() + days)
          newEnd.setDate(newEnd.getDate() + days)
          return { ...t, startDate: newStart, endDate: newEnd }
        }
        return t
      })
      checkOverlaps(updated)
      return updated
    })
  }

  const { minDate, maxDate, totalDays, dayWidth, milestones, delayedTasks, upcomingTasks, designTasks, otherTasks } = useMemo(() => {
    if (!localTasks.length) {
      const now = new Date()
      return { 
        minDate: now, 
        maxDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), 
        totalDays: 30, 
        dayWidth: 40,
        milestones: [],
        delayedTasks: [],
        upcomingTasks: [],
        designTasks: [],
        otherTasks: []
      }
    }

    const validTasks = localTasks.filter(t => t.startDate || t.endDate)
    
    if (validTasks.length === 0) {
      const now = new Date()
      return { 
        minDate: now, 
        maxDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), 
        totalDays: 30, 
        dayWidth: 40,
        milestones: [],
        delayedTasks: [],
        upcomingTasks: [],
        designTasks: [],
        otherTasks: []
      }
    }

    let min = validTasks[0].startDate || validTasks[0].endDate || new Date()
    let max = validTasks[0].endDate || validTasks[0].startDate || new Date()

    validTasks.forEach(task => {
      const taskStart = task.startDate instanceof Date ? task.startDate : (task.startDate ? new Date(task.startDate) : null)
      const taskEnd = task.endDate instanceof Date ? task.endDate : (task.endDate ? new Date(task.endDate) : null)
      
      if (taskStart && taskStart < min) min = taskStart
      if (taskEnd && taskEnd > max) max = taskEnd
    })

    const propStart = startDate instanceof Date ? startDate : (startDate ? new Date(startDate) : null)
    const propEnd = endDate instanceof Date ? endDate : (endDate ? new Date(endDate) : null)
    
    if (propStart && propStart < min) min = propStart
    if (propEnd && propEnd > max) max = propEnd

    if (min > max) {
      max = new Date(min.getTime() + 30 * 24 * 60 * 60 * 1000)
    }

    min = new Date(min.getTime() - 7 * 24 * 60 * 60 * 1000)
    max = new Date(max.getTime() + 7 * 24 * 60 * 60 * 1000)

    const days = Math.ceil((max.getTime() - min.getTime()) / (1000 * 60 * 60 * 24))

    const milestones = localTasks.filter(t => t.isMilestone)
    const designTasks = localTasks.filter(t => t.phaseType?.includes('DESIGN') && !t.isMilestone)
    const otherTasks = localTasks.filter(t => !t.phaseType?.includes('DESIGN') && !t.isMilestone)
    
    const delayedTasks = localTasks.filter(t => {
      if (t.status === 'COMPLETED' || !t.endDate) return false
      const endDate = t.endDate instanceof Date ? t.endDate : new Date(t.endDate)
      return endDate < today && t.progress < 100
    })
    
    const upcomingTasks = localTasks.filter(t => {
      if (t.status === 'COMPLETED' || !t.endDate) return false
      const endDate = t.endDate instanceof Date ? t.endDate : new Date(t.endDate)
      const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilEnd > 0 && daysUntilEnd <= 7 && t.progress < 100
    })
    
    return { 
      minDate: min, 
      maxDate: max, 
      totalDays: days || 30, 
      dayWidth: 25,
      milestones,
      delayedTasks,
      upcomingTasks,
      designTasks,
      otherTasks
    }
  }, [localTasks, startDate, endDate])

  const getTaskPosition = (task: GanttTask) => {
    if (task.isMilestone) {
      const date = task.endDate instanceof Date ? task.endDate : (task.endDate ? new Date(task.endDate) : task.startDate ? new Date(task.startDate) : null)
      if (!date) return { left: 0, width: 0, display: 'none' }
      
      const diff = Math.max(0, date.getTime() - minDate.getTime())
      const left = (diff / (1000 * 60 * 60 * 24)) * dayWidth
      
      return { left, width: 4, display: 'block', isMilestone: true }
    }
    
    if (!task.startDate || !task.endDate) {
      return { left: 0, width: 0, display: 'none' }
    }
    
    const start = task.startDate instanceof Date ? task.startDate : new Date(task.startDate)
    const end = task.endDate instanceof Date ? task.endDate : new Date(task.endDate)
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { left: 0, width: 0, display: 'none' }
    }
    
    const startDiff = Math.max(0, start.getTime() - minDate.getTime())
    const duration = end.getTime() - start.getTime()
    
    const left = (startDiff / (1000 * 60 * 60 * 24)) * dayWidth
    const width = Math.max(20, (duration / (1000 * 60 * 60 * 24)) * dayWidth)
    
    return { left, width, display: 'block' }
  }

  const getPhaseColor = (phaseType: string | null | undefined) => {
    const phase = PHASE_COLORS[phaseType || '']
    return phase?.bg || 'bg-slate-500'
  }

  const getPhaseLabel = (phaseType: string | null | undefined) => {
    const phase = PHASE_COLORS[phaseType || '']
    return phase?.label || '기타'
  }

  const months = useMemo(() => {
    const result = []
    let current = new Date(minDate)
    current.setDate(1)
    
    while (current <= maxDate) {
      const month = current.toLocaleString('default', { month: 'short', year: '2-digit' })
      const daysInMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
      const startOfMonth = new Date(current)
      const offset = Math.max(0, (startOfMonth.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))
      
      result.push({
        month,
        left: offset * dayWidth,
        width: daysInMonth * dayWidth
      })
      
      current.setMonth(current.getMonth() + 1)
    }
    return result
  }, [minDate, maxDate, dayWidth])

  const isDelayed = (task: GanttTask) => {
    if (task.status === 'COMPLETED' || !task.endDate) return false
    const endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate)
    return endDate < today && task.progress < 100
  }

  const isUpcoming = (task: GanttTask) => {
    if (task.status === 'COMPLETED' || !task.endDate) return false
    const endDate = task.endDate instanceof Date ? task.endDate : new Date(task.endDate)
    const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilEnd > 0 && daysUntilEnd <= 7 && task.progress < 100
  }

  const hasOverlap = (taskId: string) => {
    return overlapErrors.some(e => e.taskId1 === taskId || e.taskId2 === taskId)
  }

  const renderTaskRow = (task: GanttTask) => {
    const pos = getTaskPosition(task)
    const delayed = isDelayed(task)
    const upcoming = isUpcoming(task)
    const isDragging = draggingTask === task.id
    const isResizing = resizingTask?.taskId === task.id
    const hasError = hasOverlap(task.id)
    
    return (
      <div key={task.id} className={`flex border-b hover:bg-slate-50 ${delayed ? 'bg-red-50' : upcoming ? 'bg-orange-50' : ''}`}>
        <div className="w-56 p-2 text-sm border-r flex-shrink-0 truncate flex items-center gap-2">
          {task.isMilestone ? (
            <Flag className="w-3 h-3 text-yellow-500 flex-shrink-0" />
          ) : (
            <button
              onMouseDown={(e) => handleDragStart(task.id, e)}
              className="cursor-grab active:cursor-grabbing hover:bg-slate-200 rounded p-0.5"
            >
              <GripHorizontal className="w-3 h-3 text-slate-400" />
            </button>
          )}
          {!task.isMilestone && (
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              task.status === 'COMPLETED' ? 'bg-green-500' :
              task.status === 'IN_PROGRESS' ? 'bg-blue-500' :
              delayed ? 'bg-red-500' : 'bg-slate-400'
            }`} />
          )}
          <span className="truncate">{task.name}</span>
          {hasError && <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />}
        </div>
        <div className="relative flex-1 h-10">
          {task.isMilestone ? (
            <div 
              className="absolute top-3 h-4 w-1 bg-yellow-500 rounded"
              style={{ left: pos.left }}
              title={`마일스톤: ${MILESTONE_LABELS[task.milestoneType || ''] || task.milestoneType || '마일스톤'}`}
            />
          ) : (
            <div 
              className={`absolute top-2 h-6 rounded-md text-xs text-white flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity ${
                delayed ? 'bg-red-500' : hasError ? 'bg-red-600 animate-pulse' : getPhaseColor(task.phaseType)
              } ${isDragging || isResizing ? 'opacity-75' : ''}`}
              style={{ left: pos.left, width: pos.width }}
              title={`${task.name}: ${task.progress}% (${getPhaseLabel(task.phaseType)})${delayed ? ' - 지연!' : ''}`}
            >
              <span className="px-1 truncate">{task.progress}%</span>
              <div 
                className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                onMouseDown={(e) => handleResizeStart(task.id, 'start', e)}
              />
              <div 
                className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30"
                onMouseDown={(e) => handleResizeStart(task.id, 'end', e)}
              />
            </div>
          )}
        </div>
        {!task.isMilestone && (
          <div className="flex items-center gap-1 pr-2">
            <button
              onClick={() => shiftTask(task.id, -1)}
              className="p-1 hover:bg-slate-200 rounded"
              title="1일 당기기"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => shiftTask(task.id, 1)}
              className="p-1 hover:bg-slate-200 rounded"
              title="1일 미루기"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {overlapErrors.length > 0 && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-medium text-red-700">공정이 겹칩니다!</div>
            <div className="text-sm text-red-600 mt-1">
              {overlapErrors.map((error, i) => (
                <div key={i} className="mb-1">
                  ⚠️ <span className="font-medium">{error.taskName1}</span>와(과) <span className="font-medium">{error.taskName2}</span>의 기간이 겹칩니다
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => setOverlapErrors([])} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showAlerts && (delayedTasks.length > 0 || upcomingTasks.length > 0 || milestones.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {delayedTasks.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>지연: {delayedTasks.length}건</span>
            </div>
          )}
          {upcomingTasks.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 text-orange-700 rounded-lg text-sm">
              <Calendar className="w-4 h-4" />
              <span>임박: {upcomingTasks.length}건 (7일 이내)</span>
            </div>
          )}
          {milestones.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm">
              <Flag className="w-4 h-4" />
              <span>마일스톤: {milestones.length}건</span>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        💡 도움말: 드래그로 이동 | 양쪽 가장자리로 리사이즈 | ◀ ▶ 버튼으로 1일씩 이동
      </div>

      <div className="flex flex-wrap gap-3 text-xs">
        <span className="text-slate-500 font-medium">구분:</span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-purple-500"></span>
          <span>설계</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-orange-500"></span>
          <span>구매</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-green-500"></span>
          <span>시공</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-cyan-500"></span>
          <span>시운전</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-yellow-500"></span>
          <span>마일스톤</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-600 animate-pulse"></span>
          <span>겹침오류</span>
        </span>
      </div>

      <div 
        className="overflow-x-auto border rounded-lg gantt-container"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="min-w-max">
          <div className="flex border-b bg-slate-50 sticky top-0 z-10">
            <div className="w-56 p-2 font-medium text-sm border-r flex-shrink-0">공정</div>
            <div className="w-16 flex-shrink-0 border-r" />
            <div className="relative flex-1">
              {months.map((m, i) => (
                <div 
                  key={i} 
                  className="absolute text-xs text-slate-500 p-1 border-r text-center"
                  style={{ left: m.left, width: m.width }}
                >
                  {m.month}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex pointer-events-none">
              {Array.from({ length: totalDays + 1 }).map((_, i) => (
                <div 
                  key={i} 
                  className="border-r border-slate-100 h-full"
                  style={{ width: dayWidth, marginLeft: i === 0 ? 288 : 0 }}
                />
              ))}
            </div>

            {designTasks.length > 0 && (
              <>
                <div className="bg-purple-50 px-4 py-1 text-xs font-medium text-purple-700 border-b">
                  ▶ 설계 공정 ({designTasks.length}건)
                </div>
                {designTasks.map(renderTaskRow)}
              </>
            )}

            {otherTasks.length > 0 && (
              <>
                <div className="bg-green-50 px-4 py-1 text-xs font-medium text-green-700 border-b">
                  ▶ 시공/구매 공정 ({otherTasks.length}건)
                </div>
                {otherTasks.map(renderTaskRow)}
              </>
            )}

            {milestones.length > 0 && (
              <>
                <div className="bg-yellow-50 px-4 py-1 text-xs font-medium text-yellow-700 border-b">
                  ▶ 마일스톤 ({milestones.length}건)
                </div>
                {milestones.map(renderTaskRow)}
              </>
            )}

            {localTasks.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                일정 데이터가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
