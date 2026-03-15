import * as XLSX from 'xlsx'

export interface CostItemRow {
  sheet: string
  category: string
  subCategory: string
  description: string
  vendor: string
  itemName: string
  specification: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
  rate?: number
  notes?: string
}

export interface CostEstimateExcelData {
  docNumber: string
  docDate: string
  customerName: string
  projectName: string
  totalAmount: number
  paymentTerms: string
  items: CostItemRow[]
}

export interface AggregatedCost {
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
  indirectLabor: number
  industrialInsurance: number
  employmentInsurance: number
  healthInsurance: number
  nationalPension: number
  longTermCare: number
  safetyManagement: number
  environment: number
  retirement: number
  guaranteeFee: number
  constructionMachine: number
  otherIndirect: number
}

export function createCostTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  
  const gapjiData: any[][] = [
    ['', '', '', '', '', '', '', '', '', '', '', '제  -호'],
    ['', '', '', '', '', '', '', '', '', '', '', '見    積    書'],
    [],
    ['', '작성일자 :', '', '', '', '', '', '', '', '', '', new Date().toISOString().split('T')[0]],
    [],
    ['', '', '', '', '', '', '', '', '', '', '', '귀중'],
    [],
    ['', '아래와 같이 견적합니다'],
    [],
    ['', '프로젝트 :', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['', '合計金額 :', '', '', '', '', '', '', '', '', '', ''],
    [],
    [],
    [],
    ['', '지불조건 :', '', '', '', '', '', '', '', '', '', ''],
    [],
    ['', 'No.', '品名', '', '規 格', '', '數 量', '單 位', '單 價', '金 額'],
    [],
  ]

  const gapjiWs = XLSX.utils.aoa_to_sheet(gapjiData)
  gapjiWs['!cols'] = Array(12).fill({ wch: 3 })
  gapjiWs['!cols'][11] = { wch: 15 }
  XLSX.utils.book_append_sheet(wb, gapjiWs, '갑지')

  const costData: any[][] = [
    [],
    [],
    ['', '프로젝트 :', '', '', '', '', '', ''],
    ['번호', '구분', '항목', '수량', '단위', '단가', '금액', '비고'],
    [],
    ['1.', '직접공사비'],
    ['1)', '재료비', '재료비 (완제품가액 포함)', '', 'Lot', '', ''],
    ['2)', '노무비', '직접노무비', '', 'Lot', '', ''],
    ['3)', '경비', '경비 (외주비, 소모품 등)', '', 'Lot', '', ''],
    ['소계', '', '', '', '', '', ''],
    [],
    ['2.', '간접공사비'],
    ['1)', '간접노무비', '직접노무비의', '', '%', '', ''],
    ['2)', '산업재해보상보험료', '노무비의', '', '%', '', ''],
    ['3)', '고용보험료', '노무비의', '', '%', '', ''],
    ['4)', '국민건강보험료', '직접노무비의', '', '%', '', ''],
    ['5)', '국민연금보험료', '직접노무비의', '', '%', '', ''],
    ['6)', '노인장기요양보험료', '건강보험료의', '', '%', '', ''],
    ['7)', '산업안전보건관리비', '재료비+노무비 기준', '', '%', '', ''],
    ['8)', '환경보전비', '직접공사비의', '', '%', '', ''],
    ['9)', '퇴직공제부금비', '직접노무비의', '', '%', '', ''],
    ['10)', '하도급대금 지급보증 수수료', '직접공사비의', '', '%', '', ''],
    ['11)', '건설기계대여대금 지급보증서 발급비', '직접공사비의', '', '%', '', ''],
    ['12)', '기타간접비', '직접공사비의', '', '%', '', ''],
    ['소계', '', '', '', '', '', ''],
    [],
    ['합계', '', '', '', '', '', ''],
    [],
    [],
    ['매출이익', '', '', '', '', '', ''],
    ['판관비', '', '', '', '', '', ''],
    ['영업이익', '', '', '', '', '', ''],
  ]

  const costWs = XLSX.utils.aoa_to_sheet(costData)
  costWs['!cols'] = [
    { wch: 8 }, { wch: 15 }, { wch: 35 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
  ]
  XLSX.utils.book_append_sheet(wb, costWs, '공사원가내역서')

  const euljiData: any[][] = [
    [],
    [],
    ['', '프로젝트 :', '', '', '', '', '', ''],
    ['No.', '항목', '규격', '수량', '단위', '단가', '금액', '비고'],
  ]
  const euljiWs = XLSX.utils.aoa_to_sheet(euljiData)
  euljiWs['!cols'] = [
    { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 20 }
  ]
  XLSX.utils.book_append_sheet(wb, euljiWs, '을지')

  const guideData = [
    ['원가 관리 엑셀 업로드 양식'],
    [''],
    ['=== 시트 구성 ==='],
    ['- 갑지: 견적서 기본 정보 및 품목'],
    ['- 공사원가내역서: 원가 내역 (직접비/간접비)'],
    ['- 을지: 추가 품목 (선택)'],
    [''],
    ['=== 작성 방법 ==='],
    ['1. 갑지 시트:'],
    ['   - 문서번호, 작성일자, 고객사, 프로젝트명 입력'],
    ['   - 품목 테이블에 항목 추가'],
    [''],
    ['2. 공사원가내역서 시트:'],
    ['   - 직접공사비: 재료비, 노무비, 경비 입력'],
    ['   - 간접공사비: 비율(%) 또는 금액 입력'],
    [''],
  ]
  const guideWs = XLSX.utils.aoa_to_sheet(guideData)
  guideWs['!cols'] = [{ wch: 50 }]
  XLSX.utils.book_append_sheet(wb, guideWs, '안내')

  return wb
}

export function parseCostExcel(file: File): Promise<CostEstimateExcelData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        const items: CostItemRow[] = []
        let projectName = ''
        let totalAmount = 0

        if (workbook.Sheets['갑지']) {
          const gapjiSheet = workbook.Sheets['갑지']
          const gapjiData = XLSX.utils.sheet_to_json(gapjiSheet, { header: 1 }) as any[][]
          
          gapjiData.forEach((row) => {
            if (row[1] && String(row[1]).includes('프로젝트')) projectName = String(row[3] || '')
            if (row[1] && String(row[1]).includes('合計')) totalAmount = Number(row[3]) || 0
            
            const rowIdx = gapjiData.indexOf(row)
            if (rowIdx >= 17 && row[1] && !isNaN(Number(row[1]))) {
              items.push({
                sheet: '갑지',
                category: '직접공사비',
                subCategory: '품목',
                description: '',
                vendor: '',
                itemName: String(row[2] || ''),
                specification: String(row[4] || ''),
                unit: String(row[6] || ''),
                quantity: Number(row[5]) || 1,
                unitPrice: Number(row[7]) || 0,
                amount: Number(row[8]) || 0
              })
            }
          })
        }

        if (workbook.Sheets['공사원가내역서']) {
          const costSheet = workbook.Sheets['공사원가내역서']
          const costData = XLSX.utils.sheet_to_json(costSheet, { header: 1 }) as any[][]
          
          let currentCategory = ''
          costData.forEach((row) => {
            if (row[1] && String(row[1]).includes('직접공사비')) currentCategory = '직접공사비'
            else if (row[1] && String(row[1]).includes('간접공사비')) currentCategory = '간접공사비'
            else if (row[1] && (String(row[1]).includes(')') || String(row[1]).includes('.')) && row[2]) {
              items.push({
                sheet: '공사원가내역서',
                category: currentCategory,
                subCategory: String(row[1] || ''),
                description: String(row[2] || ''),
                vendor: '',
                itemName: '',
                specification: '',
                unit: String(row[4] || ''),
                quantity: 1,
                unitPrice: Number(row[6]) || 0,
                amount: Number(row[6]) || 0,
                rate: String(row[4]).includes('%') ? Number(row[3]) : undefined,
                notes: String(row[7] || '')
              })
            }
          })
        }

        resolve({
          docNumber: '',
          docDate: '',
          customerName: '',
          projectName,
          totalAmount,
          paymentTerms: '',
          items
        })
      } catch (error) {
        reject(error)
      }
    }
    
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsArrayBuffer(file)
  })
}

export function aggregateCostItems(items: CostItemRow[]): AggregatedCost {
  const aggregated: AggregatedCost = {
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
    indirectLabor: 0,
    industrialInsurance: 0,
    employmentInsurance: 0,
    healthInsurance: 0,
    nationalPension: 0,
    longTermCare: 0,
    safetyManagement: 0,
    environment: 0,
    retirement: 0,
    guaranteeFee: 0,
    constructionMachine: 0,
    otherIndirect: 0
  }

  items.forEach(item => {
    const sheet = item.sheet
    const subCat = item.subCategory
    
    if (sheet === '갑지' || item.category === '직접공사비') {
      if (subCat.includes('재료비')) aggregated.materialCost += item.amount
      else if (subCat.includes('노무비')) aggregated.laborCost += item.amount
      else if (subCat.includes('경비') || subCat === '품목') aggregated.outsourceFabrication += item.amount
    } else if (sheet === '공사원가내역서' || item.category === '간접공사비') {
      if (subCat.includes('간접노무비')) aggregated.indirectLabor += item.amount
      else if (subCat.includes('산업재해보상')) aggregated.industrialInsurance += item.amount
      else if (subCat.includes('고용보험')) aggregated.employmentInsurance += item.amount
      else if (subCat.includes('건강보험')) aggregated.healthInsurance += item.amount
      else if (subCat.includes('국민연금')) aggregated.nationalPension += item.amount
      else if (subCat.includes('요양')) aggregated.longTermCare += item.amount
      else if (subCat.includes('산업안전')) aggregated.safetyManagement += item.amount
      else if (subCat.includes('환경')) aggregated.environment += item.amount
      else if (subCat.includes('퇴직')) aggregated.retirement += item.amount
      else if (subCat.includes('하도급')) aggregated.guaranteeFee += item.amount
      else if (subCat.includes('건설기계')) aggregated.constructionMachine += item.amount
      else aggregated.otherIndirect += item.amount
    }
  })

  aggregated.indirectCost = aggregated.indirectLabor + aggregated.industrialInsurance + 
    aggregated.employmentInsurance + aggregated.healthInsurance + aggregated.nationalPension +
    aggregated.longTermCare + aggregated.safetyManagement + aggregated.environment +
    aggregated.retirement + aggregated.guaranteeFee + aggregated.constructionMachine + aggregated.otherIndirect

  return aggregated
}
