'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { WaitingProject } from '@/app/actions/waiting-projects'

interface WaitingProjectTableProps {
  projects: WaitingProject[]
  onProjectClick?: (project: WaitingProject) => void
}

const ROW_LABELS = [
  { key: 'bidNumber', label: '프로젝트 코드', type: 'text' },
  { key: 'title', label: '프로젝트명', type: 'text' },
  { key: 'submissionDate', label: '계약예정일', type: 'date' },
  { key: 'bidAmount', label: '계약예정금액', type: 'currency' },
  { key: 'maxNegoAmount', label: '최대 Nego 금액', type: 'currency' },
  { key: 'progress', label: '진행률', type: 'percent' },
  { key: 'customer', label: '발주처', type: 'text' },
  { key: 'laborCost', label: '인건비', type: 'currency' },
  { key: 'materialCost', label: '자재비', type: 'currency' },
  { key: 'outsourceCost', label: '외주비', type: 'currency' },
  { key: 'equipmentCost', label: '설비비', type: 'currency' },
  { key: 'otherCost', label: '기타', type: 'currency' },
  { key: 'directCost', label: '제조직접원가', type: 'currency' },
  { key: 'indirectCost', label: '제조간접원가', type: 'currency' },
  { key: 'manufacturingCost', label: '제조원가', type: 'currency' },
  { key: 'sellingAdminCost', label: '판관비', type: 'currency' },
  { key: 'totalCost', label: '총원가', type: 'currency' },
  { key: 'profit', label: '예상이익', type: 'currency' },
  { key: 'profitRate', label: '이익률', type: 'percent' },
]

const INDIRECT_COST_RATE = 0.055
const SELLING_ADMIN_RATE = 0.123

function calculateCosts(project: WaitingProject) {
  const directCost = 
    (project.laborCost || 0) + 
    (project.materialCost || 0) + 
    (project.outsourceCost || 0) + 
    (project.equipmentCost || 0) + 
    (project.otherCost || 0)
  
  const indirectCost = directCost * INDIRECT_COST_RATE
  const manufacturingCost = directCost + indirectCost
  const sellingAdminCost = (project.bidAmount || 0) * SELLING_ADMIN_RATE
  const totalCost = manufacturingCost + sellingAdminCost
  const profit = (project.bidAmount || 0) - totalCost
  const profitRate = project.bidAmount ? (profit / project.bidAmount) * 100 : 0

  return {
    directCost,
    indirectCost,
    manufacturingCost,
    sellingAdminCost,
    totalCost,
    profit,
    profitRate,
  }
}

function getValue(project: WaitingProject, key: string, costs: ReturnType<typeof calculateCosts>) {
  switch (key) {
    case 'bidNumber': return project.bidNumber || '-'
    case 'title': return project.title
    case 'submissionDate': return project.submissionDate 
      ? new Date(project.submissionDate).toLocaleDateString('ko-KR') 
      : '-'
    case 'bidAmount': return project.bidAmount || 0
    case 'maxNegoAmount': return 0
    case 'progress': return (project.winProbability || 0) * 100
    case 'customer': return project.customer?.name || '-'
    case 'laborCost': return project.laborCost || 0
    case 'materialCost': return project.materialCost || 0
    case 'outsourceCost': return project.outsourceCost || 0
    case 'equipmentCost': return project.equipmentCost || 0
    case 'otherCost': return project.otherCost || 0
    case 'directCost': return costs.directCost
    case 'indirectCost': return costs.indirectCost
    case 'manufacturingCost': return costs.manufacturingCost
    case 'sellingAdminCost': return costs.sellingAdminCost
    case 'totalCost': return costs.totalCost
    case 'profit': return costs.profit
    case 'profitRate': return costs.profitRate
    default: return '-'
  }
}

function formatValue(value: unknown, type: string): string {
  if (type === 'currency') return formatCurrency(value as number)
  if (type === 'percent') return formatPercent((value as number) / 100)
  if (type === 'date') return String(value)
  return String(value)
}

export function WaitingProjectTable({ projects, onProjectClick }: WaitingProjectTableProps) {
  const [hoveredProject, setHoveredProject] = useState<string | null>(null)

  if (projects.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">
        대기 중인 프로젝트가 없습니다.
      </div>
    )
  }

  return (
    <div className="overflow-auto border rounded-md">
      <table className="w-full min-w-[1200px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="sticky left-0 z-20 border bg-gray-100 dark:bg-gray-800 p-2 text-left font-medium text-gray-600 dark:text-gray-300 min-w-[120px]">
              구분
            </th>
            {projects.map((project) => (
              <th 
                key={project.id}
                className={`border p-2 text-center font-medium min-w-[180px] cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors
                  ${hoveredProject === project.id ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                onClick={() => onProjectClick?.(project)}
                onMouseEnter={() => setHoveredProject(project.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <div className="truncate font-semibold text-blue-600 dark:text-blue-400">
                  {project.title}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {project.customer?.name || '-'}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {ROW_LABELS.map((row) => (
            <tr key={row.key} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="sticky left-0 z-10 border bg-gray-50 dark:bg-gray-800 p-2 font-medium text-gray-700 dark:text-gray-300">
                {row.label}
              </td>
              {projects.map((project) => {
                const costs = calculateCosts(project)
                const value = getValue(project, row.key, costs)
                const isNegative = row.key === 'profit' && (value as number) < 0
                
                return (
                  <td 
                    key={project.id}
                    className={`border p-2 text-right cursor-pointer
                      ${hoveredProject === project.id ? 'bg-blue-50 dark:bg-blue-900' : ''}
                      ${isNegative ? 'text-red-600 dark:text-red-400' : ''}`}
                    onClick={() => onProjectClick?.(project)}
                  >
                    <span className={row.type === 'currency' ? 'font-mono' : ''}>
                      {formatValue(value, row.type)}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
          <tr className="bg-gray-100 dark:bg-gray-800 font-semibold">
            <td className="sticky left-0 z-10 border p-2">수주확정</td>
            {projects.map((project) => (
              <td key={project.id} className="border p-2 text-center">
                <Link href={`/sales/waiting/${project.id}/confirm`}>
                  <Button variant="outline" size="sm">
                    수주확정
                  </Button>
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}
