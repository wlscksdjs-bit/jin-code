'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { submitCostEstimate } from './actions'
import { generateEstimateTemplate } from '@/lib/excel/estimate-template'
import * as XLSX from 'xlsx'

const DIRECT_ITEMS = [
  { key: 'materialCost', label: '재료비' },
  { key: 'laborCost', label: '노무비' },
  { key: 'outsourceFabrication', label: '외주비(제작)' },
  { key: 'outsourceService', label: '외주비(용역)' },
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

interface CostEstimateFormProps {
  projectId: string
  projectName: string
  id?: string
  existing?: Record<string, unknown>
}

export function CostEstimateForm({ projectId, projectName, id, existing }: CostEstimateFormProps) {
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  
  const v = (key: string, def = 0) => existing ? (existing[key] as number ?? def) : def
  const titleVal = existing ? (existing.title as string) ?? '' : ''
  const versionVal = existing ? (existing.version as string) ?? '1.0' : '1.0'
  const statusVal = existing ? (existing.status as string) ?? 'DRAFT' : 'DRAFT'

  const downloadTemplate = () => {
    const wb = generateEstimateTemplate(projectName)
    XLSX.writeFile(wb, '견적원가_템플릿.xlsx')
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('projectId', projectId)

      const res = await fetch('/api/cost-estimate/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await res.json()
      if (result.success && result.data) {
        setUploadMessage('✓ Excel 파일을 성공적으로 불러왔습니다. 저장 버튼을 클릭하여 저장하세요.')
      } else {
        setUploadMessage('❌ Excel 파싱 실패: ' + (result.error || '알 수 없는 오류'))
      }
    } catch (err) {
      setUploadMessage('❌ 업로드 오류: ' + String(err))
    }
    setTimeout(() => setUploadMessage(null), 5000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {id ? '견적원가 편집' : '견적원가 등록'}
          </h1>
          <p className="text-sm text-gray-500">{projectName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            📥 템플릿 다운로드
          </Button>
          <label className="cursor-pointer">
            <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:hover:bg-gray-700">
              📤 Excel 업로드
            </span>
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleExcelUpload} />
          </label>
        </div>
      </div>
      
      {uploadMessage && (
        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
          {uploadMessage}
        </div>
      )}

      <form action={submitCostEstimate.bind(null, projectId, id)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>기본 정보</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">제목 *</label>
              <input name="title" defaultValue={titleVal} required
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">버전</label>
              <input name="version" defaultValue={versionVal}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">상태</label>
              <select name="status" defaultValue={statusVal}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                <option value="DRAFT">작성중</option>
                <option value="REVIEW">검토중</option>
                <option value="APPROVED">승인</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">계약금액</label>
              <input name="contractAmount" type="number" step="1" defaultValue={v('contractAmount')}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">판관비율 (%)</label>
              <input name="sellingAdminRate" type="number" step="0.1" defaultValue={v('sellingAdminRate', 12)}
                className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
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
            <CardContent className="space-y-3 pt-4">
              {DIRECT_ITEMS.map((item) => (
                <div key={item.key} className="grid grid-cols-3 items-center gap-4">
                  <label className="text-sm font-medium">{item.label}</label>
                  <input name={item.key} type="number" step="1" min="0" defaultValue={v(item.key)}
                    className="col-span-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-right dark:border-gray-800 dark:bg-gray-800" />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-orange-50 dark:bg-orange-950/30">
              <CardTitle className="text-orange-700 dark:text-orange-400 flex items-center gap-2">
                <span className="text-xl">🟠</span> 간접비
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid gap-3 md:grid-cols-2">
                {INDIRECT_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <label className="text-sm font-medium w-32">{item.label}</label>
                    <input name={item.key} type="number" step="1" min="0" defaultValue={v(item.key)}
                      className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-right dark:border-gray-800 dark:bg-gray-800" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button type="submit">{id ? '저장' : '등록'}</Button>
        </div>
      </form>
    </div>
  )
}
