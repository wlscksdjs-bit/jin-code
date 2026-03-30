import * as XLSX from 'xlsx'

type Project = {
  id: string
  code: string
  name: string
  status: string
  contractAmount: number
  estimatedBudget: number
  customerId?: string
}

type CostEstimate = {
  id: string
  projectId: string
  title: string
  version: string
  status: string
  contractAmount: number
  totalExpense: number
  materialCost: number
  laborCost: number
  outsourceFabrication: number
  outsourceService: number
  consumableOther: number
  indirectCost: number
  sellingAdminCost: number
  grossProfit: number
  profitRate: number
  items?: Array<{
    id: string
    itemName: string
    specification?: string
    unit?: string
    quantity: number
    unitPrice: number
    amount: number
  }>
}

type CostExecution = {
  id: string
  projectId: string
  type: string
  periodYear: number
  periodMonth: number
  status: string
  materialCost: number
  laborCost: number
  outsourceFabrication: number
  outsourceService: number
  consumableOther: number
  totalExpense: number
  contractAmount: number
  items?: Array<{
    id: string
    itemName: string
    quantity: number
    unitPrice: number
    amount: number
  }>
}

type CashFlow = {
  id: string
  projectId: string
  type: string
  category?: string
  plannedAmount: number
  actualAmount: number
  plannedDate: Date
  actualDate?: Date
  status: string
  description?: string
}

export function exportProjects(projects: Project[]): Buffer {
  const data = projects.map(p => ({
    코드: p.code,
    프로젝트명: p.name,
    상태: p.status,
    계약금액: p.contractAmount,
    예산: p.estimatedBudget,
  }))

  const ws = XLSX.utils.json_to_sheet(data)
  ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  ws['!freeze'] = { top: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '프로젝트 목록')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer
}

export function exportCostEstimate(estimate: CostEstimate): Buffer {
  const summaryData = [
    { 항목: '프로젝트 ID', 내용: estimate.projectId },
    { 항목: '제목', 내용: estimate.title },
    { 항목: '버전', 내용: estimate.version },
    { 항목: '상태', 내용: estimate.status },
    { 항목: '계약금액', 내용: estimate.contractAmount },
    { 항목: '재료비', 내용: estimate.materialCost },
    { 항목: '인건비', 내용: estimate.laborCost },
    { 항목: '외주 Fabrication', 내용: estimate.outsourceFabrication },
    { 항목: '외주 Service', 내용: estimate.outsourceService },
    { 항목: '소모품 기타', 내용: estimate.consumableOther },
    { 항목: '간접비', 내용: estimate.indirectCost },
    { 항목: '판관비', 내용: estimate.sellingAdminCost },
    { 항목: '총 비용', 내용: estimate.totalExpense },
    { 항목: '총이익', 내용: estimate.grossProfit },
    { 항목: '이익률', 내용: `${estimate.profitRate.toFixed(2)}%` },
  ]

  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsSummary, '요약')

  if (estimate.items && estimate.items.length > 0) {
    const itemsData = estimate.items.map(item => ({
      항목명: item.itemName,
      규격: item.specification || '',
      단위: item.unit || '',
      수량: item.quantity,
      단가: item.unitPrice,
      금액: item.amount,
    }))

    const wsItems = XLSX.utils.json_to_sheet(itemsData)
    wsItems['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsItems, '세부항목')
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer
}

export function exportCostExecution(execution: CostExecution): Buffer {
  const summaryData = [
    { 항목: '프로젝트 ID', 내용: execution.projectId },
    { 항목: '유형', 내용: execution.type },
    { 항목: '기간', 내용: `${execution.periodYear}-${execution.periodMonth}` },
    { 항목: '상태', 내용: execution.status },
    { 항목: '계약금액', 내용: execution.contractAmount },
    { 항목: '재료비', 내용: execution.materialCost },
    { 항목: '인건비', 내용: execution.laborCost },
    { 항목: '외주 Fabrication', 내용: execution.outsourceFabrication },
    { 항목: '외주 Service', 내용: execution.outsourceService },
    { 항목: '소모품 기타', 내용: execution.consumableOther },
    { 항목: '총 비용', 내용: execution.totalExpense },
  ]

  const wsSummary = XLSX.utils.json_to_sheet(summaryData)
  wsSummary['!cols'] = [{ wch: 20 }, { wch: 40 }]
  wsSummary['!freeze'] = { top: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, wsSummary, '요약')

  if (execution.items && execution.items.length > 0) {
    const itemsData = execution.items.map(item => ({
      항목명: item.itemName,
      수량: item.quantity,
      단가: item.unitPrice,
      금액: item.amount,
    }))

    const wsItems = XLSX.utils.json_to_sheet(itemsData)
    wsItems['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, wsItems, '세부항목')
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer
}

export function exportCashFlow(cashFlows: CashFlow[]): Buffer {
  const inflowData = cashFlows
    .filter(cf => cf.type === 'INFLOW')
    .map(cf => ({
      계획일: cf.plannedDate,
      실제일: cf.actualDate || '',
      구분: cf.category || '',
      계획금액: cf.plannedAmount,
      실제금액: cf.actualAmount,
      상태: cf.status,
      비고: cf.description || '',
    }))

  const outflowData = cashFlows
    .filter(cf => cf.type === 'OUTFLOW')
    .map(cf => ({
      계획일: cf.plannedDate,
      실제일: cf.actualDate || '',
      구분: cf.category || '',
      계획금액: cf.plannedAmount,
      실제금액: cf.actualAmount,
      상태: cf.status,
      비고: cf.description || '',
    }))

  const wb = XLSX.utils.book_new()

  if (inflowData.length > 0) {
    const wsInflow = XLSX.utils.json_to_sheet(inflowData)
    wsInflow['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }]
    wsInflow['!freeze'] = { top: 1 }
    XLSX.utils.book_append_sheet(wb, wsInflow, '수입')
  }

  if (outflowData.length > 0) {
    const wsOutflow = XLSX.utils.json_to_sheet(outflowData)
    wsOutflow['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 }]
    wsOutflow['!freeze'] = { top: 1 }
    XLSX.utils.book_append_sheet(wb, wsOutflow, '지출')
  }

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer
}
