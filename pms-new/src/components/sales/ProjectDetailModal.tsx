'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { WaitingProject } from '@/app/actions/waiting-projects'

interface ProjectDetailModalProps {
  project: WaitingProject
  isOpen: boolean
  onClose: () => void
}

const INDIRECT_COST_RATE = 0.055
const SELLING_ADMIN_RATE = 0.123

export function ProjectDetailModal({ project, isOpen, onClose }: ProjectDetailModalProps) {
  const router = useRouter()
  const [formData, setFormData] = useState({
    title: project.title,
    bidNumber: project.bidNumber || '',
    bidAmount: project.bidAmount,
    winProbability: (project.winProbability || 0) * 100,
    submissionDate: project.submissionDate ? new Date(project.submissionDate).toISOString().split('T')[0] : '',
    contractDate: project.contractDate ? new Date(project.contractDate).toISOString().split('T')[0] : '',
    laborCost: project.laborCost,
    materialCost: project.materialCost,
    outsourceCost: project.outsourceCost,
    equipmentCost: project.equipmentCost,
    otherCost: project.otherCost,
  })
  const [saving, setSaving] = useState(false)

  const directCost = 
    formData.laborCost + 
    formData.materialCost + 
    formData.outsourceCost + 
    formData.equipmentCost + 
    formData.otherCost
  const indirectCost = directCost * INDIRECT_COST_RATE
  const manufacturingCost = directCost + indirectCost
  const sellingAdminCost = formData.bidAmount * SELLING_ADMIN_RATE
  const totalCost = manufacturingCost + sellingAdminCost
  const profit = formData.bidAmount - totalCost
  const profitRate = formData.bidAmount ? (profit / formData.bidAmount) * 100 : 0

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-lg bg-white p-6 dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{project.title}</h2>
            <p className="text-sm text-gray-500">{project.customer?.name || '발주처 없음'}</p>
          </div>
          <Button variant="outline" onClick={onClose}>닫기</Button>
        </div>

        <div className="mb-6 flex gap-2">
          <Link href={`/cost/${project.id}/estimate`}>
            <Button variant="outline">실행예산 작성</Button>
          </Link>
          {project.status === 'WON' && (
            <Link href={`/cost/${project.id}/execution`}>
              <Button variant="default">실행원가 관리</Button>
            </Link>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base">기본 정보</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>프로젝트명</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>프로젝트 코드</Label>
                <Input 
                  value={formData.bidNumber}
                  onChange={(e) => setFormData({ ...formData, bidNumber: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>계약예정일</Label>
                <Input 
                  type="date"
                  value={formData.submissionDate}
                  onChange={(e) => setFormData({ ...formData, submissionDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>계약일</Label>
                <Input 
                  type="date"
                  value={formData.contractDate}
                  onChange={(e) => setFormData({ ...formData, contractDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>진행률 (%)</Label>
                <Input 
                  type="number"
                  min="0"
                  max="100"
                  value={formData.winProbability}
                  onChange={(e) => setFormData({ ...formData, winProbability: Number(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">원가 구성</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>계약예정금액</Label>
                <Input 
                  type="number"
                  value={formData.bidAmount}
                  onChange={(e) => setFormData({ ...formData, bidAmount: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>인건비</Label>
                <Input 
                  type="number"
                  value={formData.laborCost}
                  onChange={(e) => setFormData({ ...formData, laborCost: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>자재비</Label>
                <Input 
                  type="number"
                  value={formData.materialCost}
                  onChange={(e) => setFormData({ ...formData, materialCost: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>외주비</Label>
                <Input 
                  type="number"
                  value={formData.outsourceCost}
                  onChange={(e) => setFormData({ ...formData, outsourceCost: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>설비비</Label>
                <Input 
                  type="number"
                  value={formData.equipmentCost}
                  onChange={(e) => setFormData({ ...formData, equipmentCost: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>기타</Label>
                <Input 
                  type="number"
                  value={formData.otherCost}
                  onChange={(e) => setFormData({ ...formData, otherCost: Number(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader><CardTitle className="text-base">원가 요약</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded bg-gray-50 p-3 dark:bg-gray-800">
                <div className="text-xs text-gray-500">제조직접원가</div>
                <div className="text-lg font-semibold">{formatCurrency(directCost)}</div>
              </div>
              <div className="rounded bg-gray-50 p-3 dark:bg-gray-800">
                <div className="text-xs text-gray-500">제조간접원가 ({INDIRECT_COST_RATE * 100}%)</div>
                <div className="text-lg font-semibold">{formatCurrency(indirectCost)}</div>
              </div>
              <div className="rounded bg-gray-50 p-3 dark:bg-gray-800">
                <div className="text-xs text-gray-500">제조원가</div>
                <div className="text-lg font-semibold">{formatCurrency(manufacturingCost)}</div>
              </div>
              <div className="rounded bg-gray-50 p-3 dark:bg-gray-800">
                <div className="text-xs text-gray-500">판관비 ({SELLING_ADMIN_RATE * 100}%)</div>
                <div className="text-lg font-semibold">{formatCurrency(sellingAdminCost)}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="rounded bg-blue-50 p-3 dark:bg-blue-900">
                <div className="text-xs text-blue-600 dark:text-blue-400">총원가</div>
                <div className="text-xl font-bold">{formatCurrency(totalCost)}</div>
              </div>
              <div className={`rounded p-3 ${profit >= 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
                <div className={`text-xs ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  예상이익
                </div>
                <div className={`text-xl font-bold ${profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatCurrency(profit)}
                </div>
              </div>
              <div className={`rounded p-3 ${profitRate >= 0 ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'}`}>
                <div className={`text-xs ${profitRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  이익률
                </div>
                <div className={`text-xl font-bold ${profitRate >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {formatPercent(profitRate / 100)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button>저장</Button>
        </div>
      </div>
    </div>
  )
}
