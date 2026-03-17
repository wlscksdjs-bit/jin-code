'use client'

import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToXLSX } from '@/lib/export'

type CostExecution = {
  id: string
  periodYear: number
  periodMonth: number | null
  type: string
  totalManufacturingCost: number
  operatingProfit: number
  grossProfit: number
  contractAmount: number
  status: string
  project?: { id: string; name: string } | null
}

type CostExecutionsExportButtonProps = {
  executions: CostExecution[]
}

export function CostExecutionsExportButton({ executions }: CostExecutionsExportButtonProps) {
  const handleExport = () => {
    const columns = [
      { key: 'period', header: '기간' },
      { key: 'project', header: '프로젝트' },
      { key: 'type', header: '유형' },
      { key: 'contractAmount', header: '계약금액' },
      { key: 'totalManufacturingCost', header: '제조원가' },
      { key: 'grossProfit', header: '매출이익' },
      { key: 'operatingProfit', header: '영업이익' },
      { key: 'profitRate', header: '이익률(%)' },
      { key: 'status', header: '상태' },
    ]

    const data = executions.map(e => ({
      period: `${e.periodYear}년 ${e.periodMonth || 0}월`,
      project: e.project?.name || '-',
      type: e.type,
      contractAmount: e.contractAmount.toLocaleString('ko-KR'),
      totalManufacturingCost: e.totalManufacturingCost.toLocaleString('ko-KR'),
      grossProfit: e.grossProfit.toLocaleString('ko-KR'),
      operatingProfit: e.operatingProfit.toLocaleString('ko-KR'),
      profitRate: e.contractAmount > 0 
        ? ((e.operatingProfit / e.contractAmount) * 100).toFixed(2)
        : '0.00',
      status: e.status,
    }))

    exportToXLSX(data, columns, 'cost-executions')
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      Excel 내보내기
    </Button>
  )
}
