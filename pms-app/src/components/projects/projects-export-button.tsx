'use client'

import { Download, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToXLSX } from '@/lib/export'

type Project = {
  id: string
  code: string
  name: string
  status: string
  type: string
  location: string | null
  startDate: Date | string | null
  endDate: Date | string | null
  contractAmount: number | null
  customer: { name: string | null } | null
  contractType: string | null
}

type ExportButtonProps = {
  projects: Project[]
}

export function ProjectsExportButton({ projects }: ExportButtonProps) {
  const handleExport = () => {
    const columns = [
      { key: 'code', header: '프로젝트 코드' },
      { key: 'name', header: '프로젝트명' },
      { key: 'status', header: '상태' },
      { key: 'type', header: '유형' },
      { key: 'customer', header: '고객사' },
      { key: 'contractType', header: '계약유형' },
      { key: 'contractAmount', header: '계약금액' },
      { key: 'location', header: '지역' },
      { key: 'startDate', header: '시작일' },
      { key: 'endDate', header: '종료일' },
    ]

    const data = projects.map(p => ({
      ...p,
      customer: p.customer?.name || '-',
      startDate: p.startDate ? new Date(p.startDate).toLocaleDateString('ko-KR') : '-',
      endDate: p.endDate ? new Date(p.endDate).toLocaleDateString('ko-KR') : '-',
      contractAmount: p.contractAmount ? p.contractAmount.toLocaleString('ko-KR') : '-',
    }))

    exportToXLSX(data, columns, 'projects')
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      Excel 내보내기
    </Button>
  )
}
