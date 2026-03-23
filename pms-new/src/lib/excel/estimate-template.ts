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
}

const INDIRECT_ITEMS = [
  '소모품/기타', '안전용품', '여비교통비', '보험/보증', '숙소비', '잡비',
  '지급수수료', '장비임대(지게차)', '장비임대(기타)', '차량수리비', '차량유류비',
  '차량기타', '복리후생', '예비비', '간접비'
]

const INDIRECT_KEYS = [
  'consumableOther', 'consumableSafety', 'travelExpense', 'insuranceWarranty',
  'dormitoryCost', 'miscellaneous', 'paymentFeeOther', 'rentalForklift',
  'rentalOther', 'vehicleRepair', 'vehicleFuel', 'vehicleOther',
  'welfareBusiness', 'reserveFund', 'indirectCost'
]

export function generateEstimateTemplate(projectName: string): XLSX.Workbook {
  const wb = XLSX.utils.book_new()

  const guideData = [
    ['견적원가 등록 Excel 양식'],
    [''],
    [`프로젝트: ${projectName}`],
    [''],
    ['작성법:'],
    ['1. 기본정보 시트에서 제목, 버전, 계약금액, 판관비율을 입력하세요'],
    ['2. 직접비 시트에서 직접비 항목을 입력하세요'],
    ['3. 간접비 시트에서 간접비 항목을 입력하세요'],
    ['4. 요약 시트에서 계산 결과를 확인하세요'],
    [''],
    ['주의사항:'],
    ['- 금액은 숫자만 입력하세요 (원, 천원 등 단위 불가)'],
    ['- 판관비율은 % 단위로 입력하세요 (예: 12)'],
  ]
  const guideSheet = XLSX.utils.aoa_to_sheet(guideData)
  guideSheet['!cols'] = [{ wch: 50 }]
  XLSX.utils.book_append_sheet(wb, guideSheet, '안내')

  const basicData = [
    ['항목', '입력값'],
    ['제목', ''],
    ['버전', '1.0'],
    ['계약금액', ''],
    ['판관비율(%)', '12'],
  ]
  const basicSheet = XLSX.utils.aoa_to_sheet(basicData)
  basicSheet['!cols'] = [{ wch: 20 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, basicSheet, '기본정보')

  const directData = [
    ['구분', '항목', '금액', '비고'],
    ['직접비', '재료비', '', ''],
    ['직접비', '노무비', '', ''],
    ['직접비', '외주비(제작)', '', ''],
    ['직접비', '외주비(용역)', '', ''],
  ]
  const directSheet = XLSX.utils.aoa_to_sheet(directData)
  directSheet['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, directSheet, '직접비')

  const indirectData = [['구분', '항목', '금액', '비고']]
  for (const cat of INDIRECT_ITEMS) {
    indirectData.push(['간접비', cat, '', ''])
  }
  const indirectSheet = XLSX.utils.aoa_to_sheet(indirectData)
  indirectSheet['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, indirectSheet, '간접비')

  const summaryData = [
    ['항목', '금액'],
    ['계약금액', ''],
    ['직접비 합계', ''],
    ['간접비 합계', ''],
    ['총제조원가', ''],
    ['판관비', ''],
    ['총원가', ''],
    ['영업이익', ''],
    ['이익률(%)', ''],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, '요약')

  return wb
}

export function parseEstimateExcel(buffer: ArrayBuffer): ParsedEstimateData {
  const wb = XLSX.read(buffer, { type: 'array' })
  
  let title = '견적원가'
  let version = '1.0'
  let contractAmount = 0
  let sellingAdminRate = 12

  const basicSheet = wb.Sheets['기본정보']
  if (basicSheet) {
    title = (basicSheet['B2']?.v as string) || '견적원가'
    version = (basicSheet['B3']?.v as string) || '1.0'
    contractAmount = (basicSheet['B4']?.v as number) || 0
    sellingAdminRate = (basicSheet['B5']?.v as number) || 12
  }

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
    const range = XLSX.utils.decode_range(directSheet['!ref'] || 'A1:D10')
    for (let r = 1; r <= range.e.r; r++) {
      const item = directSheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v as string
      const amount = (directSheet[XLSX.utils.encode_cell({ r, c: 2 })]?.v as number) || 0
      if (item === '재료비') costs.materialCost = amount
      else if (item === '노무비') costs.laborCost = amount
      else if (item === '외주비(제작)') costs.outsourceFabrication = amount
      else if (item === '외주비(용역)') costs.outsourceService = amount
    }
  }

  const indirectSheet = wb.Sheets['간접비']
  if (indirectSheet) {
    const range = XLSX.utils.decode_range(indirectSheet['!ref'] || 'A1:D20')
    for (let r = 1; r <= range.e.r; r++) {
      const item = indirectSheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v as string
      const name = indirectSheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v as string
      const amount = (indirectSheet[XLSX.utils.encode_cell({ r, c: 2 })]?.v as number) || 0
      if (item === '간접비') {
        const idx = INDIRECT_ITEMS.indexOf(name)
        if (idx >= 0) {
          costs[INDIRECT_KEYS[idx] as keyof typeof costs] = amount
        }
      }
    }
  }

  return {
    title,
    version,
    contractAmount,
    sellingAdminRate,
    costs,
  }
}

export function exportEstimateToExcel(estimate: Record<string, unknown>): XLSX.Workbook {
  const wb = XLSX.utils.book_new()
  
  const data = [
    ['항목', '금액'],
    ['제목', estimate.title as string],
    ['버전', estimate.version as string],
    ['계약금액', estimate.contractAmount as number],
    ['', ''],
    ['직접비', ''],
    ['재료비', estimate.materialCost as number],
    ['노무비', estimate.laborCost as number],
    ['외주비(제작)', estimate.outsourceFabrication as number],
    ['외주비(용역)', estimate.outsourceService as number],
    ['직접비 합계', estimate.totalDirectCost as number],
    ['', ''],
    ['간접비 항목', ''],
    ['소모품/기타', estimate.consumableOther as number],
    ['안전용품', estimate.consumableSafety as number],
    ['여비교통비', estimate.travelExpense as number],
    ['보험/보증', estimate.insuranceWarranty as number],
    ['숙소비', estimate.dormitoryCost as number],
    ['잡비', estimate.miscellaneous as number],
    ['지급수수료', estimate.paymentFeeOther as number],
    ['장비임대(지게차)', estimate.rentalForklift as number],
    ['장비임대(기타)', estimate.rentalOther as number],
    ['차량수리비', estimate.vehicleRepair as number],
    ['차량유류비', estimate.vehicleFuel as number],
    ['차량기타', estimate.vehicleOther as number],
    ['복리후생', estimate.welfareBusiness as number],
    ['예비비', estimate.reserveFund as number],
    ['간접비', estimate.indirectCost as number],
    ['간접비 합계', (estimate.totalManufacturingCost as number) - (estimate.totalDirectCost as number)],
    ['', ''],
    ['총제조원가', estimate.totalManufacturingCost as number],
    ['판관비', estimate.sellingAdminCost as number],
    ['총원가', estimate.totalExpense as number],
    ['영업이익', estimate.operatingProfit as number],
    ['이익률(%)', estimate.profitRate as number],
  ]
  
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [{ wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, sheet, '견적원가내역')
  
  return wb
}
