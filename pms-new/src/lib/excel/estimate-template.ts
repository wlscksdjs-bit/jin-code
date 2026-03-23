import * as XLSX from 'xlsx'

export interface ParsedEstimateData {
  title: string
  version: string
  contractAmount: number
  sellingAdminRate: number
  costs: {
    materialCost: number
    laborCost: number
    outsourceFabrication: number
    outsourceService: number
    consumableOther: number
    consumableSafety: number
    travelExpense: number
    insuranceWarranty: number
    dormitoryCost: number
    miscellaneous: number
    paymentFeeOther: number
    rentalForklift: number
    rentalOther: number
    vehicleRepair: number
    vehicleFuel: number
    vehicleOther: number
    welfareBusiness: number
    reserveFund: number
    indirectCost: number
  }
  calculated: {
    totalDirectCost: number
    totalIndirectCost: number
    totalManufacturingCost: number
    sellingAdminCost: number
    grossProfit: number
    operatingProfit: number
    profitRate: number
  }
}

const INDIRECT_COST_FIELDS: { key: keyof ParsedEstimateData['costs']; label: string }[] = [
  { key: 'consumableOther', label: '소모품/기타' },
  { key: 'consumableSafety', label: '안전용품' },
  { key: 'travelExpense', label: '여비교통비' },
  { key: 'insuranceWarranty', label: '보험/보증' },
  { key: 'dormitoryCost', label: '숙소비' },
  { key: 'miscellaneous', label: '잡비' },
  { key: 'paymentFeeOther', label: '지급수수료' },
  { key: 'rentalForklift', label: '장비임대(지게차)' },
  { key: 'rentalOther', label: '장비임대(기타)' },
  { key: 'vehicleRepair', label: '차량수리비' },
  { key: 'vehicleFuel', label: '차량유류비' },
  { key: 'vehicleOther', label: '차량기타' },
  { key: 'welfareBusiness', label: '복리후생' },
  { key: 'reserveFund', label: '예비비' },
  { key: 'indirectCost', label: '간접비' },
]

const DIRECT_COST_FIELDS: { key: keyof ParsedEstimateData['costs']; label: string }[] = [
  { key: 'materialCost', label: '재료비' },
  { key: 'laborCost', label: '노무비' },
  { key: 'outsourceFabrication', label: '외주비(제작)' },
  { key: 'outsourceService', label: '외주비(용역)' },
]

export function generateEstimateTemplate(projectName: string): XLSX.Workbook {
  const wb = XLSX.utils.book_new()

  const guideData = [
    ['견적원가 등록 Excel 양식'],
    [''],
    ['작성법:'],
    ['1. 기본정보 시트에서 프로젝트명, 제목, 버전, 계약금액, 판관비율을 입력하세요'],
    ['2. 직접비 시트에서 각 항목의 금액을 입력하세요'],
    ['3. 간접비 시트에서 각 항목의 금액을 입력하세요'],
    ['4. 금액은 숫자만 입력하세요 (원, 천원 등 단위 불가)'],
    [''],
    ['주의사항:'],
    ['- 금액은 숫자만 입력하세요'],
    ['- 판관비율은 % 단위로 입력하세요 (예: 5.5)'],
  ]
  const guideSheet = XLSX.utils.aoa_to_sheet(guideData)
  guideSheet['!cols'] = [{ wch: 60 }]
  XLSX.utils.book_append_sheet(wb, guideSheet, '안내')

  const infoData = [
    ['항목', '내용'],
    ['프로젝트명', projectName],
    ['제목', ''],
    ['버전', 'v1.0'],
    ['계약금액', 0],
    ['판관비율(%)', 0],
  ]
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  infoSheet['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, infoSheet, '기본정보')

  const directData = [['항목', '금액']]
  for (const field of DIRECT_COST_FIELDS) {
    directData.push([field.label, 0])
  }
  const directSheet = XLSX.utils.aoa_to_sheet(directData)
  directSheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, directSheet, '직접비')

  const indirectData = [['항목', '금액']]
  for (const field of INDIRECT_COST_FIELDS) {
    indirectData.push([field.label, 0])
  }
  const indirectSheet = XLSX.utils.aoa_to_sheet(indirectData)
  indirectSheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, indirectSheet, '간접비')

  const summaryData = [
    ['항목', '금액'],
    ['직접비 합계', 0],
    ['간접비 합계', 0],
    ['총제조원가', 0],
    ['판관비', 0],
    ['매출총이익', 0],
    ['영업이익', 0],
    ['이익률(%)', 0],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, '요약')

  return wb
}

export function parseEstimateExcel(buffer: ArrayBuffer): ParsedEstimateData {
  const wb = XLSX.read(buffer, { type: 'array' })

  const infoSheet = wb.Sheets['기본정보']
  const title = (infoSheet?.['B3']?.v as string) || ''
  const version = (infoSheet?.['B4']?.v as string) || ''
  const contractAmount = (infoSheet?.['B5']?.v as number) || 0
  const sellingAdminRate = (infoSheet?.['B6']?.v as number) || 0

  const costs: ParsedEstimateData['costs'] = {
    materialCost: 0,
    laborCost: 0,
    outsourceFabrication: 0,
    outsourceService: 0,
    consumableOther: 0,
    consumableSafety: 0,
    travelExpense: 0,
    insuranceWarranty: 0,
    dormitoryCost: 0,
    miscellaneous: 0,
    paymentFeeOther: 0,
    rentalForklift: 0,
    rentalOther: 0,
    vehicleRepair: 0,
    vehicleFuel: 0,
    vehicleOther: 0,
    welfareBusiness: 0,
    reserveFund: 0,
    indirectCost: 0,
  }

  const directSheet = wb.Sheets['직접비']
  if (directSheet) {
    const range = XLSX.utils.decode_range(directSheet['!ref'] || 'A1:B5')
    for (let r = 1; r <= range.e.r; r++) {
      const label = directSheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v as string
      const amount = (directSheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v as number) || 0
      const field = DIRECT_COST_FIELDS.find((f) => f.label === label)
      if (field) {
        costs[field.key] = amount
      }
    }
  }

  const indirectSheet = wb.Sheets['간접비']
  if (indirectSheet) {
    const range = XLSX.utils.decode_range(indirectSheet['!ref'] || 'A1:B16')
    for (let r = 1; r <= range.e.r; r++) {
      const label = indirectSheet[XLSX.utils.encode_cell({ r, c: 0 })]?.v as string
      const amount = (indirectSheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v as number) || 0
      const field = INDIRECT_COST_FIELDS.find((f) => f.label === label)
      if (field) {
        costs[field.key] = amount
      }
    }
  }

  const totalDirectCost =
    costs.materialCost + costs.laborCost + costs.outsourceFabrication + costs.outsourceService
  const totalIndirectCost =
    costs.consumableOther +
    costs.consumableSafety +
    costs.travelExpense +
    costs.insuranceWarranty +
    costs.dormitoryCost +
    costs.miscellaneous +
    costs.paymentFeeOther +
    costs.rentalForklift +
    costs.rentalOther +
    costs.vehicleRepair +
    costs.vehicleFuel +
    costs.vehicleOther +
    costs.welfareBusiness +
    costs.reserveFund +
    costs.indirectCost

  const totalManufacturingCost = totalDirectCost + totalIndirectCost
  const sellingAdminCost = Math.round(contractAmount * (sellingAdminRate / 100))
  const grossProfit = contractAmount - totalManufacturingCost
  const operatingProfit = grossProfit - sellingAdminCost
  const profitRate = contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0

  return {
    title,
    version,
    contractAmount,
    sellingAdminRate,
    costs,
    calculated: {
      totalDirectCost,
      totalIndirectCost,
      totalManufacturingCost,
      sellingAdminCost,
      grossProfit,
      operatingProfit,
      profitRate,
    },
  }
}

export function exportEstimateToExcel(estimate: Record<string, unknown>): XLSX.Workbook {
  const wb = XLSX.utils.book_new()

  const infoData = [
    ['항목', '내용'],
    ['프로젝트명', (estimate['projectName'] as string) || ''],
    ['제목', (estimate['title'] as string) || ''],
    ['버전', (estimate['version'] as string) || ''],
    ['계약금액', (estimate['contractAmount'] as number) || 0],
    ['판관비율(%)', (estimate['sellingAdminRate'] as number) || 0],
  ]
  const infoSheet = XLSX.utils.aoa_to_sheet(infoData)
  infoSheet['!cols'] = [{ wch: 20 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, infoSheet, '기본정보')

  const directData = [['항목', '금액']]
  for (const field of DIRECT_COST_FIELDS) {
    directData.push([field.label, (estimate[field.key] as number) || 0])
  }
  const directSheet = XLSX.utils.aoa_to_sheet(directData)
  directSheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, directSheet, '직접비')

  const indirectData = [['항목', '금액']]
  for (const field of INDIRECT_COST_FIELDS) {
    indirectData.push([field.label, (estimate[field.key] as number) || 0])
  }
  const indirectSheet = XLSX.utils.aoa_to_sheet(indirectData)
  indirectSheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, indirectSheet, '간접비')

  const summaryData = [
    ['항목', '금액'],
    ['직접비 합계', (estimate['totalDirectCost'] as number) || 0],
    ['간접비 합계', (estimate['totalIndirectCost'] as number) || 0],
    ['총제조원가', (estimate['totalManufacturingCost'] as number) || 0],
    ['판관비', (estimate['sellingAdminCost'] as number) || 0],
    ['매출총이익', (estimate['grossProfit'] as number) || 0],
    ['영업이익', (estimate['operatingProfit'] as number) || 0],
    ['이익률(%)', (estimate['profitRate'] as number) || 0],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 20 }, { wch: 20 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, '요약')

  return wb
}
