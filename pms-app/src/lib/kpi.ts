/**
 * PMS 2.0 - KPI / Earned Value Management (EVM) Calculations
 */

export interface WbsItemProgress {
  id: string
  name?: string
  plannedCost?: number | null
  actualCost?: number | null
  progress: number
  startDate?: Date | string | null
  endDate?: Date | string | null
}

export interface ProjectKPI {
  pv: number
  ev: number
  ac: number
  bac: number
  cpi: number
  spi: number
  eac: number
  vac: number
  progress: number
  isOnSchedule: boolean
  isOnBudget: boolean
}

export function calculatePV(wbsItems: WbsItemProgress[]): number {
  return wbsItems.reduce((sum, item) => sum + (item.plannedCost || 0), 0)
}

export function calculateEV(wbsItems: WbsItemProgress[], totalPlannedCost: number): number {
  return wbsItems.reduce((sum, item) => {
    const plannedCost = item.plannedCost || 0
    const earnedValue = plannedCost * (item.progress / 100)
    return sum + earnedValue
  }, 0)
}

export function calculateAC(costExecutions: Array<{ totalManufacturingCost?: number | null }>): number {
  return costExecutions.reduce((sum, exec) => sum + (exec.totalManufacturingCost || 0), 0)
}

export function calculateCPI(ev: number, ac: number): number {
  if (ac === 0) return ev === 0 ? 1 : 0
  return ev / ac
}

export function calculateEAC(bac: number, cpi: number): number {
  if (cpi === 0) return bac
  return bac / cpi
}

export function calculateVAC(bac: number, eac: number): number {
  return bac - eac
}

export function calculateSPI(
  wbsItems: WbsItemProgress[],
  ev: number,
  projectStartDate?: Date | string | null,
  projectEndDate?: Date | string | null
): number {
  if (!projectStartDate || !projectEndDate) return 1
  const start = new Date(projectStartDate).getTime()
  const end = new Date(projectEndDate).getTime()
  const now = Date.now()

  const totalDuration = end - start
  if (totalDuration <= 0) return 1

  const plannedProgress = Math.min(100, Math.max(0, ((now - start) / totalDuration) * 100))
  const actualProgress = ev > 0 && wbsItems.length > 0
    ? wbsItems.reduce((sum, item) => sum + item.progress, 0) / wbsItems.length
    : 0

  if (plannedProgress === 0) return 1
  return actualProgress / plannedProgress
}

export function calculateProjectKPI(
  wbsItems: WbsItemProgress[],
  costExecutions: Array<{ totalManufacturingCost?: number | null }>,
  projectStartDate?: Date | string | null,
  projectEndDate?: Date | string | null
): ProjectKPI {
  const pv = calculatePV(wbsItems)
  const ev = calculateEV(wbsItems, pv)
  const ac = calculateAC(costExecutions)
  const bac = pv
  const cpi = calculateCPI(ev, ac)
  const spi = calculateSPI(wbsItems, ev, projectStartDate, projectEndDate)
  const eac = calculateEAC(bac, cpi)
  const vac = calculateVAC(bac, eac)
  const progress = wbsItems.length > 0
    ? wbsItems.reduce((sum, item) => sum + item.progress, 0) / wbsItems.length
    : 0

  return {
    pv,
    ev,
    ac,
    bac,
    cpi,
    spi,
    eac,
    vac,
    progress,
    isOnSchedule: spi >= 0.9,
    isOnBudget: cpi >= 0.9,
  }
}

export function getCPIStatus(cpi: number): 'good' | 'warning' | 'danger' {
  if (cpi >= 1.0) return 'good'
  if (cpi >= 0.9) return 'warning'
  return 'danger'
}

export function getSPIStatus(spi: number): 'good' | 'warning' | 'danger' {
  if (spi >= 1.0) return 'good'
  if (spi >= 0.9) return 'warning'
  return 'danger'
}

export function getVACLabel(vac: number): string {
  if (vac > 0) return `절감 ₩${Math.abs(vac).toLocaleString('ko-KR')}`
  if (vac < 0) return `초과 ₩${Math.abs(vac).toLocaleString('ko-KR')}`
  return '예산 내'
}

export function getKPIColor(value: number, type: 'cpi' | 'spi'): string {
  if (type === 'cpi') {
    if (value >= 1.0) return 'text-green-600'
    if (value >= 0.9) return 'text-yellow-600'
    return 'text-red-600'
  }
  if (value >= 1.0) return 'text-blue-600'
  if (value >= 0.9) return 'text-yellow-600'
  return 'text-red-600'
}
