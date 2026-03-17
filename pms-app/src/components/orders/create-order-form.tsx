'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Save } from 'lucide-react'

interface Vendor {
  id: string
  name: string
  category: string
}

interface Project {
  id: string
  name: string
  code: string
}

interface Item {
  id: string
  itemName: string
  specification: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
}

interface CreateOrderFormProps {
  vendors: Vendor[]
  projects: Project[]
  defaultProjectId?: string
}

export function CreateOrderForm({ vendors, projects, defaultProjectId }: CreateOrderFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    projectId: defaultProjectId || '',
    vendorId: '',
    title: '',
    orderDate: new Date().toISOString().split('T')[0],
    requiredDate: '',
    notes: '',
  })
  const [items, setItems] = useState<Item[]>([
    { id: '1', itemName: '', specification: '', unit: 'EA', quantity: 1, unitPrice: 0, amount: 0 }
  ])

  function updateItem(id: string, field: keyof Item, value: string | number) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        updated.amount = updated.quantity * updated.unitPrice
      }
      return updated
    }))
  }

  function addItem() {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      itemName: '',
      specification: '',
      unit: 'EA',
      quantity: 1,
      unitPrice: 0,
      amount: 0
    }])
  }

  function removeItem(id: string) {
    if (items.length > 1) {
      setItems(prev => prev.filter(item => item.id !== id))
    }
  }

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + tax

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!formData.projectId || !formData.vendorId || !formData.title) {
      alert('프로젝트, 거래처, 제목을 입력해주세요.')
      return
    }

    const validItems = items.filter(item => item.itemName.trim())
    if (validItems.length === 0) {
      alert('최소 1개 이상의 품목을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          orderDate: new Date(formData.orderDate),
          requiredDate: formData.requiredDate ? new Date(formData.requiredDate) : undefined,
          items: validItems.map(item => ({
            itemName: item.itemName,
            specification: item.specification,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert('발주서가 생성되었습니다.')
        router.push(`/orders/${result.order.id}`)
      } else {
        alert(result.error || '오류가 발생했습니다.')
      }
    } catch (err) {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project">프로젝트 *</Label>
              <Select 
                value={formData.projectId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="프로젝트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor">거래처 *</Label>
              <Select 
                value={formData.vendorId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, vendorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="거래처 선택" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name} ({v.category})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">발주 제목 *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="발주 제목を入力"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderDate">발주일 *</Label>
              <Input
                id="orderDate"
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requiredDate">납기일</Label>
              <Input
                id="requiredDate"
                type="date"
                value={formData.requiredDate}
                onChange={(e) => setFormData(prev => ({ ...prev, requiredDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">비고</Label>
            <Input
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="비고사항 입력"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>발주 품목</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="w-4 h-4 mr-2" />
              품목 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-slate-500 px-1">
              <div className="col-span-4">품목명</div>
              <div className="col-span-3">규격</div>
              <div className="col-span-1">단위</div>
              <div className="col-span-1 text-right">수량</div>
              <div className="col-span-2 text-right">단가</div>
              <div className="col-span-1"></div>
            </div>

            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <Input
                    value={item.itemName}
                    onChange={(e) => updateItem(item.id, 'itemName', e.target.value)}
                    placeholder="품목명"
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    value={item.specification}
                    onChange={(e) => updateItem(item.id, 'specification', e.target.value)}
                    placeholder="규격"
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    value={item.unit}
                    onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                    placeholder="단위"
                  />
                </div>
                <div className="col-span-1">
                  <Input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.id, 'unitPrice', parseInt(e.target.value) || 0)}
                    className="text-right"
                  />
                </div>
                <div className="col-span-1 flex items-center gap-1">
                  <span className="text-sm font-medium w-full text-right">
                    {item.amount.toLocaleString()}
                  </span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-4 space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>소계</span>
              <span>{subtotal.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>부가세 (10%)</span>
              <span>{tax.toLocaleString()}원</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>합계</span>
              <span className="text-green-600">{total.toLocaleString()}원</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading ? '저장 중...' : '발주서 저장'}
        </Button>
      </div>
    </form>
  )
}
