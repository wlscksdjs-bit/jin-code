'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { 
  Calculator, Upload, Download,
  TrendingUp, TrendingDown, Save, Plus, FileText, Calendar
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/toast'
import { createCostTemplate, parseCostExcel, aggregateCostItems } from '@/lib/excel-template'
import { CostItemsTable, type CostTableItem } from '@/components/cost/cost-items-table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { CostExecutionsExportButton } from '@/components/cost/cost-executions-export-button'

type Project = { id: string; name: string; code: string }

type CostFormData = {
  projectId: string
  title: string
  contractAmount: number
  sellingAdminRate: number
  items: CostTableItem[]
}

const initialFormData: CostFormData = {
  projectId: '',
  title: '',
  contractAmount: 0,
  sellingAdminRate: 12,
  items: []
}

export default function CostManagementPage() {
  const { addToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [executions, setExecutions] = useState<any[]>([])
  const [formData, setFormData] = useState<CostFormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'estimate' | 'monthly'>('estimate')

  useEffect(() => {
    fetchProjects()
    fetchExecutions()
  }, [])

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects')
      const data = await res.json()
      setProjects(data.projects || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const fetchExecutions = async () => {
    try {
      const res = await fetch('/api/cost-execution')
      const data = await res.json()
      setExecutions(data.costExecutions || [])
    } catch (error) {
      console.error('Error fetching executions:', error)
    }
  }

  const calculated = useMemo(() => {
    const aggregated = aggregateCostItems(formData.items)
    
    const totalExpense = aggregated.outsourceFabrication + aggregated.outsourceService +
      aggregated.consumableOther + aggregated.consumableSafety +
      aggregated.travelExpense + aggregated.insuranceWarranty + aggregated.dormitoryCost +
      aggregated.miscellaneous + aggregated.paymentFeeOther +
      aggregated.rentalForklift + aggregated.rentalOther +
      aggregated.vehicleRepair + aggregated.vehicleFuel + aggregated.vehicleOther +
      aggregated.welfareBusiness + aggregated.reserveFund
    
    const totalDirectCost = aggregated.materialCost + aggregated.laborCost + totalExpense
    const totalManufacturingCost = totalDirectCost + aggregated.indirectCost
    const sellingAdminCost = formData.contractAmount * (formData.sellingAdminRate / 100)
    const grossProfit = formData.contractAmount - totalManufacturingCost
    const operatingProfit = grossProfit - sellingAdminCost
    const profitRate = formData.contractAmount > 0 ? (operatingProfit / formData.contractAmount) * 100 : 0

    return { 
      ...aggregated, 
      totalExpense, 
      totalDirectCost, 
      totalManufacturingCost, 
      sellingAdminCost, 
      grossProfit, 
      operatingProfit, 
      profitRate 
    }
  }, [formData.items, formData.contractAmount, formData.sellingAdminRate])

  const handleAddItem = () => {
    const newItem: CostTableItem = {
      id: Math.random().toString(36).substr(2, 9),
      sheet: '직접공사비',
      category: '직접공사비',
      description: '',
      majorCategory: '',
      subCategory: '',
      vendor: '',
      itemName: '',
      specification: '',
      unit: 'EA',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    }
    setFormData(prev => ({ ...prev, items: [...prev.items, newItem] }))
  }

  const handleUpdateItem = (id: string, field: keyof CostTableItem, value: string | number) => {
    setFormData(prev => {
      const newItems = prev.items.map(item => {
        if (item.id !== id) return item
        
        const updated = { ...item }
        
        if (field === 'quantity' || field === 'unitPrice') {
          (updated as any)[field] = Number(value)
          updated.amount = updated.quantity * updated.unitPrice
        } else {
          (updated as any)[field] = value
        }
        
        return updated
      })
      return { ...prev, items: newItems }
    })
  }

  const handleDeleteItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }))
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const data = await parseCostExcel(file)
      
      const newItems: CostTableItem[] = data.items.map((item, idx) => ({
        id: Math.random().toString(36).substr(2, 9) + idx,
        sheet: item.sheet || '직접공사비',
        category: item.category || '직접공사비',
        description: item.description || '',
        majorCategory: '',
        subCategory: item.subCategory || '',
        vendor: item.vendor || '',
        itemName: item.itemName,
        specification: item.specification,
        unit: item.unit,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      }))

      setFormData(prev => ({ 
        ...prev, 
        title: data.projectName || prev.title,
        contractAmount: data.totalAmount || prev.contractAmount,
        items: [...prev.items, ...newItems] 
      }))
      addToast('success', `엑셀 데이터 ${newItems.length}개가 추가되었습니다.`)
    } catch (error) {
      addToast('error', '엑셀 파일 읽기 실패')
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleExcelDownload = () => {
    const wb = createCostTemplate()
    import('xlsx').then(XLSX => {
      XLSX.writeFile(wb, '실행예산서_양식.xlsx')
      addToast('success', '양식을 다운로드했습니다.')
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.projectId || !formData.title || formData.contractAmount <= 0) {
      addToast('error', '프로젝트, 제목, 계약금액을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const aggregated = aggregateCostItems(formData.items)
      
      const payload = { ...formData, ...aggregated }

      const res = await fetch('/api/cost-estimate/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await res.json()
      
      if (data.success) {
        addToast('success', '견적 원가가 저장되었습니다.')
        setFormData(initialFormData)
      } else {
        addToast('error', data.error || '저장 중 오류가 발생했습니다.')
      }
    } catch (error) {
      addToast('error', '저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calculator className="w-8 h-8" />
          <h1 className="text-2xl font-bold">원가 관리</h1>
        </div>
        <div className="flex gap-2">
          {activeTab === 'monthly' ? (
            <Link href="/cost/monthly">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                월별 원가 입력
              </Button>
            </Link>
          ) : (
            <>
              <Button variant="outline" onClick={handleExcelDownload}>
                <Download className="w-4 h-4 mr-2" />
                양식 다운로드
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                엑셀 업로드
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleExcelUpload} className="hidden" />
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('estimate')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'estimate'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          견적원가
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'monthly'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar className="w-4 h-4 inline mr-2" />
          월별 원가
        </button>
      </div>

      {activeTab === 'estimate' ? (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>기본 정보</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>프로젝트</Label>
                  <select 
                    className="w-full h-10 px-3 border rounded-md bg-white"
                    value={formData.projectId}
                    onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                  >
                    <option value="">프로젝트 선택</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>견적 제목</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="프로젝트명 또는 견적명"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>계약금액 (원)</Label>
                  <Input 
                    type="number"
                    value={formData.contractAmount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, contractAmount: Number(e.target.value) }))}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>판관비율 (%)</Label>
                  <Input 
                    type="number"
                    value={formData.sellingAdminRate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, sellingAdminRate: Number(e.target.value) }))}
                    placeholder="12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>원가 항목</CardTitle>
            </CardHeader>
            <CardContent>
              <CostItemsTable
                items={formData.items}
                onAddItem={handleAddItem}
                onDeleteItem={handleDeleteItem}
                onUpdateItem={handleUpdateItem}
              />
            </CardContent>
          </Card>

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {loading ? '저장 중...' : '저장'}
          </Button>
        </div>

        <div className="space-y-4">
          <Card className={calculated.operatingProfit >= 0 ? 'border-green-500' : 'border-red-500'}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                {calculated.operatingProfit >= 0 ? <TrendingUp className="w-5 h-5 text-green-500" /> : <TrendingDown className="w-5 h-5 text-red-500" />}
                손익 계산
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">계약금액</span>
                <span className="font-medium">{formatNumber(formData.contractAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">제조원가</span>
                <span className="font-medium">-{formatNumber(calculated.totalManufacturingCost)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="text-slate-500">매출이익</span>
                <span className="font-medium">{formatNumber(calculated.grossProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">판관비</span>
                <span className="font-medium">-{formatNumber(calculated.sellingAdminCost)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between text-lg font-bold">
                <span>영업이익</span>
                <span className={calculated.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatNumber(calculated.operatingProfit)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">이익률</span>
                <span className={calculated.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {calculated.profitRate.toFixed(2)}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">원가 요약</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm max-h-96 overflow-y-auto">
              <div className="flex justify-between p-2 bg-blue-50 rounded font-medium">
                <span>직접공사비</span>
                <span>{formatNumber(calculated.totalDirectCost)}</span>
              </div>
              <div className="flex justify-between pl-4"><span>- 재료비</span><span>{formatNumber(calculated.materialCost)}</span></div>
              <div className="flex justify-between pl-4"><span>- 노무비</span><span>{formatNumber(calculated.laborCost)}</span></div>
              <div className="flex justify-between pl-4"><span>- 경비</span><span>{formatNumber(calculated.totalExpense)}</span></div>
              <div className="flex justify-between p-2 bg-orange-50 rounded font-medium">
                <span>간접공사비</span>
                <span>{formatNumber(calculated.indirectCost)}</span>
              </div>
              {calculated.indirectLabor > 0 && <div className="flex justify-between pl-4"><span>- 간접노무비</span><span>{formatNumber(calculated.indirectLabor)}</span></div>}
              {calculated.industrialInsurance > 0 && <div className="flex justify-between pl-4"><span>- 산재보험</span><span>{formatNumber(calculated.industrialInsurance)}</span></div>}
              {calculated.safetyManagement > 0 && <div className="flex justify-between pl-4"><span>- 안전보건관리비</span><span>{formatNumber(calculated.safetyManagement)}</span></div>}
              <div className="flex justify-between p-2 bg-slate-100 rounded font-bold">
                <span>총 제조원가</span>
                <span>{formatNumber(calculated.totalManufacturingCost)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      ) : (
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>월별 원가 현황</CardTitle>
            <div className="flex gap-2">
              <Link href="/cost/monthly">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  월별 원가 입력
                </Button>
              </Link>
              {executions.length > 0 && (
                <CostExecutionsExportButton executions={executions} />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {executions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>등록된 월별 원가가 없습니다.</p>
                <Link href="/cost/monthly">
                  <Button variant="outline" className="mt-4">
                    첫 월별 원가 입력
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">기간</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-slate-500">프로젝트</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-500">제조원가</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-500">영업이익</th>
                      <th className="text-right py-3 px-2 text-sm font-medium text-slate-500">이익률</th>
                      <th className="text-center py-3 px-2 text-sm font-medium text-slate-500">상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec) => (
                      <tr key={exec.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-2">
                          {exec.periodYear}년 {exec.periodMonth}월
                        </td>
                        <td className="py-3 px-2">
                          <Link href={`/projects/${exec.project?.id}`} className="text-blue-600 hover:underline">
                            {exec.project?.name}
                          </Link>
                        </td>
                        <td className="py-3 px-2 text-right font-mono">
                          {formatCurrency(exec.totalManufacturingCost)}
                        </td>
                        <td className={`py-3 px-2 text-right font-mono ${exec.operatingProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {exec.operatingProfit >= 0 ? '+' : ''}{formatCurrency(exec.operatingProfit)}
                        </td>
                        <td className={`py-3 px-2 text-right ${
                          exec.grossProfit / (exec.contractAmount || 1) >= 0.1 ? 'text-green-600' :
                          exec.grossProfit / (exec.contractAmount || 1) >= 0 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {((exec.grossProfit / (exec.contractAmount || 1)) * 100).toFixed(1)}%
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            exec.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                            exec.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {exec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  )
}
