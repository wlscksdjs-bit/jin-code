export interface CPMTask {
  id: string
  name: string
  duration: number
  predecessorIds?: string[]
  earlyStart?: number
  earlyFinish?: number
  lateStart?: number
  lateFinish?: number
  slack?: number
  isCritical?: boolean
}

export interface CPMResult {
  tasks: CPMTask[]
  criticalPath: string[]
  projectDuration: number
  calculatedAt: Date
}

export function calculateCPM(tasks: CPMTask[]): CPMResult {
  const taskMap = new Map<string, CPMTask>()
  tasks.forEach(t => taskMap.set(t.id, { ...t }))

  const sorted = topologicalSort([...taskMap.values()])

  sorted.forEach(task => {
    if (!task.predecessorIds || task.predecessorIds.length === 0) {
      task.earlyStart = 0
    } else {
      task.earlyStart = Math.max(
        ...task.predecessorIds.map(pid => taskMap.get(pid)?.earlyFinish || 0)
      )
    }
    task.earlyFinish = (task.earlyStart || 0) + task.duration
  })

  const projectDuration = Math.max(...sorted.map(t => t.earlyFinish || 0), 0)

  const reverseSorted = [...sorted].reverse()
  reverseSorted.forEach((task, idx) => {
    const successors = sorted.filter(t => t.predecessorIds?.includes(task.id))
    if (successors.length === 0) {
      task.lateFinish = projectDuration
    } else {
      task.lateFinish = Math.min(...successors.map(s => s.lateStart || projectDuration))
    }
    task.lateStart = (task.lateFinish || projectDuration) - task.duration
    task.slack = (task.lateStart || 0) - (task.earlyStart || 0)
    task.isCritical = (task.slack || 0) === 0
  })

  const criticalPath = sorted.filter(t => t.isCritical).map(t => t.id)

  return {
    tasks: sorted.map(t => taskMap.get(t.id)!),
    criticalPath,
    projectDuration,
    calculatedAt: new Date(),
  }
}

function topologicalSort(tasks: CPMTask[]): CPMTask[] {
  const visited = new Set<string>()
  const result: CPMTask[] = []
  const taskMap = new Map<string, CPMTask>()
  tasks.forEach(t => taskMap.set(t.id, t))

  function visit(task: CPMTask) {
    if (visited.has(task.id)) return
    visited.add(task.id)
    task.predecessorIds?.forEach(pid => {
      const pred = taskMap.get(pid)
      if (pred) visit(pred)
    })
    result.push(task)
  }

  tasks.forEach(task => visit(task))
  return result
}

export function generateCPMFromWbsItems(
  wbsItems: Array<{
    id: string
    name: string
    startDate?: Date | string | null
    endDate?: Date | string | null
    sortOrder?: number
    parentId?: string | null
  }>
): CPMTask[] {
  const items = [...wbsItems].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  const predecessors = new Map<string, string[]>()
  items.forEach((item, idx) => {
    if (idx === 0) {
      predecessors.set(item.id, [])
    } else {
      const sameParent = items.filter(i =>
        i.parentId === item.parentId &&
        (i.sortOrder || 0) < (item.sortOrder || 0)
      )
      if (sameParent.length > 0) {
        predecessors.set(item.id, [sameParent[sameParent.length - 1].id])
      } else {
        predecessors.set(item.id, [])
      }
    }
  })

  return items.map(item => {
    let duration = 0
    if (item.startDate && item.endDate) {
      const start = new Date(item.startDate).getTime()
      const end = new Date(item.endDate).getTime()
      duration = Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
    }
    return {
      id: item.id,
      name: item.name,
      duration,
      predecessorIds: predecessors.get(item.id) || [],
    }
  })
}

export function findCriticalPath(result: CPMResult): string[] {
  return result.tasks.filter(t => t.isCritical).map(t => t.id)
}

export function getCriticalPathTasks(result: CPMResult): CPMTask[] {
  return result.tasks.filter(t => t.isCritical)
}
