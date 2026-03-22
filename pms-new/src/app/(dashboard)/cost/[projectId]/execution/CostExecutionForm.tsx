'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CostSummary } from '@/components/cost/CostSummary'
import { VendorManager, VendorCost } from '@/components/cost/VendorManager'
import { generateCostTemplate } from '@/lib/excel/cost-template'
import * as XLSX from 'xlsx'
import { submitCostExecution } from './actions'

const DIRECT_ITEMS = [
  { key: 'materialCost', label: '재료비' },
  { key: 'laborCost', label: '노무비' },
]

const INDIRECT_ITEMS = [
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

interface CostExecutionFormProps {
  projectId: string
  id?: string
}

export function CostExecutionForm({ projectId, id }: CostExecutionFormProps) {
  const [fabVendors, setFabVendors] = useState<VendorCost[]>([])
  const [svcVendors, setSvcVendors] = useState<VendorCost[]>([])
  const [directCosts, setDirectCosts] = useState({ materialCost: 0, laborCost: 0 })
  const [indirectCosts, setIndirectCosts] = useState<Record<string, number>>({})
  const [contractAmount, setContractAmount] = useState(0)
  const [sellingAdminRate, setSellingAdminRate] = useState(12)
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)

  const now = new Date()
  const defaultYear = now.getFullYear()
  const defaultMonth = now.getMonth() + 1

  const updateCost = useCallback((setter: React.Dispatch<React.SetStateAction<Record<string, number>>>, key: string, value: number) => {
    setter(prev => ({ ...prev, [key]: value }))
  }, [])

  const downloadTemplate = () => {
    const wb = generateCostTemplate()
    XLSX.writeFile(wb, '실행원가_템플릿.xlsx')
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/cost-execution/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()
      if (result.success && result.data) {
        if (result.data.directCosts) {
          for (const item of result.data.directCosts) {
            if (item.category === '재료비') {
              setDirectCosts(prev => ({ ...prev, materialCost: item.amount }))
            } else if (item.category === '노무비') {
              setDirectCosts(prev => ({ ...prev, laborCost: item.amount }))
            } else if (item.category === '외주비(제작)' && item.vendor) {
              setFabVendors(prev => [...prev, { vendorName: item.vendor, amount: item.amount }])
            } else if (item.category === '외주비(용역)' && item.vendor) {
              setSvcVendors(prev => [...prev, { vendorName: item.vendor, amount: item.amount }])
            }
          }
        }
        if (result.data.indirectCosts) {
          const newIndirect: Record<string, number> = {}
          const mapping: Record<string, string> = {
            '소모품기타': 'consumableOther',
            '안전용품': 'consumableSafety',
            '여비교통비': 'travelExpense',
            '보험보증': 'insuranceWarranty',
            '숙소비': 'dormitoryCost',
            '잡비': 'miscellaneous',
            '지급수수료': 'paymentFeeOther',
            '장비임대지게차': 'rentalForklift',
            '장비임대기타': 'rentalOther',
            '차량수리비': 'vehicleRepair',
            '차량유류비': 'vehicleFuel',
            '차량기타': 'vehicleOther',
            '복리후생': 'welfareBusiness',
            '예비비': 'reserveFund',
            '간접비': 'indirectCost',
          }
          for (const item of result.data.indirectCosts) {
            const key = item.category.replace(/[()]/g, '').replace(/[/]/g, '').replace(/ frais/g, '')
            const mappedKey = mapping[key] || mapping[key.replace(/[/]/g, '')]
            if (mappedKey) newIndirect[mappedKey] = item.amount
          }
          setIndirectCosts(newIndirect)
        }
        setUploadMessage('✓ Excel 파일을 성공적으로 불러왔습니다.')
      } else {
        setUploadMessage('❌ Excel 파싱 실패: ' + (result.error || '알 수 없는 오류'))
      }
    } catch (err) {
      setUploadMessage('❌ 업로드 오류: ' + String(err))
    }
    setTimeout(() => setUploadMessage(null), 5000)
  }

  const fabTotal = fabVendors.reduce((s, v) => s + v.amount, 0)
  const svcTotal = svcVendors.reduce((s, v) => s + v.amount, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">실행원가 등록</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            📥 템플릿 다운로드
          </Button>
          <label className="cursor-pointer">
            <Button variant="outline" size="sm" asChild>
              <span>📤 Excel 업로드</span>
            </Button>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
          </label>
        </div>
      </div>
      {uploadMessage && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
          {uploadMessage}
        </div>
      )}

      <form action={submitCostExecution} className="space-y-6">
        <input type="hidden" name="projectId" value={projectId} />
        {id && <input type="hidden" name="id" value={id} />}
        <input type="hidden" name="fabricationVendors" value={JSON.stringify(fabVendors)} />
        <input type="hidden" name="serviceVendors" value={JSON.stringify(svcVendors)} />
        <Card>
          <CardHeader><CardTitle>기간 정보</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">연도 *</label>
              <input name="periodYear" type="number" defaultValue={defaultYear} required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">월 *</label>
              <input name="periodMonth" type="number" min="1" max="12" defaultValue={defaultMonth} required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상태</label>
              <select name="status" defaultValue="DRAFT"
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                <option value="DRAFT">작성중</option>
                <option value="CONFIRMED">확정</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">계약금액</label>
              <input name="contractAmount" type="number" step="1" defaultValue={0}
                onChange={(e) => setContractAmount(parseFloat(e.target.value) || 0)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2 md:col-span-4">
              <label className="text-sm font-medium">판관비율 (%)</label>
              <input name="sellingAdminRate" type="number" step="0.1" defaultValue={12}
                onChange={(e) => setSellingAdminRate(parseFloat(e.target.value) || 12)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800 md:w-48" />
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="bg-blue-50 dark:bg-blue-950/30">
              <CardTitle className="text-blue-700 dark:text-blue-400 flex items-center gap-2">
                <span className="text-xl">🔵</span> 직접비
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {DIRECT_ITEMS.map((item) => (
                <div key={item.key} className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm font-medium">{item.label}</label>
                  <input name={item.key} type="number" step="1" min="0" defaultValue={0}
                    onChange={(e) => updateCost(setDirectCosts, item.key, parseFloat(e.target.value) || 0)}
                    className="col-span-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-right dark:border-gray-800 dark:bg-gray-800" />
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <VendorManager
              type="FABRICATION"
              vendors={fabVendors}
              onChange={setFabVendors}
            />
            <VendorManager
              type="SERVICE"
              vendors={svcVendors}
              onChange={setSvcVendors}
            />
          </div>
        </div>

        <Card>
          <CardHeader className="bg-orange-50 dark:bg-orange-950/30">
            <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
              <span className="text-xl">🟠</span> 간접비
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {INDIRECT_ITEMS.map((item) => (
                <div key={item.key} className="flex items-center gap-2">
                  <label className="text-sm font-medium w-32">{item.label}</label>
                  <input name={item.key} type="number" step="1" min="0" defaultValue={0}
                    onChange={(e) => updateCost(setIndirectCosts, item.key, parseFloat(e.target.value) || 0)}
                    className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-right dark:border-gray-800 dark:bg-gray-800" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <CostSummary
          contractAmount={contractAmount}
          directCosts={{
            ...directCosts,
            outsourceFabrication: fabTotal,
            outsourceService: svcTotal
          }}
          indirectCosts={{
            consumableOther: indirectCosts.consumableOther || 0,
            consumableSafety: indirectCosts.consumableSafety || 0,
            travelExpense: indirectCosts.travelExpense || 0,
            insuranceWarranty: indirectCosts.insuranceWarranty || 0,
            dormitoryCost: indirectCosts.dormitoryCost || 0,
            miscellaneous: indirectCosts.miscellaneous || 0,
            paymentFeeOther: indirectCosts.paymentFeeOther || 0,
            rentalForklift: indirectCosts.rentalForklift || 0,
            rentalOther: indirectCosts.rentalOther || 0,
            vehicleRepair: indirectCosts.vehicleRepair || 0,
            vehicleFuel: indirectCosts.vehicleFuel || 0,
            vehicleOther: indirectCosts.vehicleOther || 0,
            welfareBusiness: indirectCosts.welfareBusiness || 0,
            reserveFund: indirectCosts.reserveFund || 0,
            indirectCost: indirectCosts.indirectCost || 0,
          }}
          sellingAdminRate={sellingAdminRate}
        />

        <div className="flex gap-2">
          <Button type="submit">저장</Button>
        </div>
      </form>
    </div>
  )
}
