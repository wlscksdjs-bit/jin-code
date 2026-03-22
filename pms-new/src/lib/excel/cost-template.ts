import * as XLSX from 'xlsx'

export interface ParsedCostData {
  directCosts: { category: string; vendor?: string; amount: number }[]
  indirectCosts: { category: string; amount: number }[]
  summary: {
    contractAmount: number
    totalDirect: number
    totalIndirect: number
    totalCost: number
  }
}

export function generateCostTemplate(): XLSX.Workbook {
  const wb = XLSX.utils.book_new()

  const guideData = [
    ['실행원가 등록 Excel 양식'],
    [''],
    ['작성법:'],
    ['1. 직접비 시트에서 직접비 항목을 입력하세요'],
    ['2. 간접비 시트에서 간접비 항목을 입력하세요'],
    ['3. 금액은 숫자만 입력하세요 (원, 천원 등 단위 불가)'],
    ['4. 외주비 항목에는 반드시 업체명을 입력하세요'],
    [''],
    ['주의사항:'],
    ['- 금액은 숫자만 입력하세요'],
    ['- 외주비 항목에는 업체명을 반드시 입력하세요'],
  ]
  const guideSheet = XLSX.utils.aoa_to_sheet(guideData)
  guideSheet['!cols'] = [{ wch: 50 }]
  XLSX.utils.book_append_sheet(wb, guideSheet, '안내')

  const directData = [
    ['구분', '항목', '업체명', '금액', '비고'],
    ['직접비', '재료비', '', ''],
    ['직접비', '노무비', '', ''],
    ['직접비', '외주비(제작)', '', ''],
    ['직접비', '외주비(용역)', '', ''],
  ]
  const directSheet = XLSX.utils.aoa_to_sheet(directData)
  directSheet['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, directSheet, '직접비')

  const indirectCategories = [
    '소모품/기타', '안전용품', '여비교통비', '보험/보증', '숙소비', '잡비',
    '지급수수료', '장비임대(지게차)', '장비임대(기타)', '차량수리비', '차량유류비',
    '차량기타', '복리후생', '예비비', '간접비'
  ]
  const indirectData = [['구분', '항목', '금액', '비고']]
  for (const cat of indirectCategories) {
    indirectData.push(['간접비', cat, ''])
  }
  const indirectSheet = XLSX.utils.aoa_to_sheet(indirectData)
  indirectSheet['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, indirectSheet, '간접비')

  const summaryData = [
    ['항목', '금액'],
    ['계약금액', ''],
    ['직접비 합계', ''],
    ['간접비 합계', ''],
    ['총원가', ''],
    ['판관비', ''],
    ['영업이익', ''],
  ]
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  summarySheet['!cols'] = [{ wch: 15 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, summarySheet, '요약')

  return wb
}

export function parseCostExcel(buffer: ArrayBuffer): ParsedCostData {
  const wb = XLSX.read(buffer, { type: 'array' })
  
  const directCosts: { category: string; vendor?: string; amount: number }[] = []
  const indirectCosts: { category: string; amount: number }[] = []
  
  const directSheet = wb.Sheets['직접비']
  if (directSheet) {
    const range = XLSX.utils.decode_range(directSheet['!ref'] || 'A1:E10')
    for (let r = 1; r <= range.e.r; r++) {
      const category = directSheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v as string
      const vendor = directSheet[XLSX.utils.encode_cell({ r, c: 2 })]?.v as string
      const amount = (directSheet[XLSX.utils.encode_cell({ r, c: 3 })]?.v as number) || 0
      if (category) {
        directCosts.push({ category, vendor: vendor || undefined, amount })
      }
    }
  }

  const indirectSheet = wb.Sheets['간접비']
  if (indirectSheet) {
    const range = XLSX.utils.decode_range(indirectSheet['!ref'] || 'A1:D20')
    for (let r = 1; r <= range.e.r; r++) {
      const category = indirectSheet[XLSX.utils.encode_cell({ r, c: 1 })]?.v as string
      const item = indirectSheet[XLSX.utils.encode_cell({ r, c: 2 })]?.v as string
      const amount = (indirectSheet[XLSX.utils.encode_cell({ r, c: 3 })]?.v as number) || 0
      if (category && item) {
        indirectCosts.push({ category: item, amount })
      }
    }
  }

  const totalDirect = directCosts.reduce((s, c) => s + c.amount, 0)
  const totalIndirect = indirectCosts.reduce((s, c) => s + c.amount, 0)

  return {
    directCosts,
    indirectCosts,
    summary: {
      contractAmount: 0,
      totalDirect,
      totalIndirect,
      totalCost: totalDirect + totalIndirect
    }
  }
}

export function exportCostToExcel(execution: Record<string, unknown>, filename: string): XLSX.Workbook {
  const wb = XLSX.utils.book_new()
  
  const data = [
    ['항목', '금액'],
    ['계약금액', execution.contractAmount as number],
    ['재료비', execution.materialCost as number],
    ['노무비', execution.laborCost as number],
    ['외주비(제작)', execution.outsourceFabrication as number],
    ['외주비(용역)', execution.outsourceService as number],
    ['직접비 합계', execution.totalDirectCost as number],
    ['', ''],
    ['간접비 항목', ''],
    ...(Object.entries(execution).filter(([k]) => 
      ['consumableOther', 'consumableSafety', 'travelExpense', 'insuranceWarranty',
       'dormitoryCost', 'miscellaneous', 'paymentFeeOther', 'rentalForklift',
       'rentalOther', 'vehicleRepair', 'vehicleFuel', 'vehicleOther',
       'welfareBusiness', 'reserveFund', 'indirectCost'].includes(k)
    ).map(([k, v]) => [k, v as number])),
    ['', ''],
    ['총제조원가', execution.totalManufacturingCost as number],
    ['판관비', execution.sellingAdminCost as number],
    ['총원가', execution.totalExpense as number],
  ]
  
  const sheet = XLSX.utils.aoa_to_sheet(data)
  sheet['!cols'] = [{ wch: 20 }, { wch: 15 }]
  XLSX.utils.book_append_sheet(wb, sheet, '원가내역')
  
  return wb
}
