'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Minus } from 'lucide-react'

export interface VendorCost {
  vendor: string
  amount: number
}

export interface VendorManagerProps {
  type: 'FABRICATION' | 'SERVICE' // 외주제작 or 외주용역
  vendors: VendorCost[]
  onChange: (vendors: VendorCost[]) => void
}

export function VendorManager({ type, vendors, onChange }: VendorManagerProps) {
  const [newVendor, setNewVendor] = React.useState('')
  const [newAmount, setNewAmount] = React.useState<number | ''>('')

  const label = type === 'FABRICATION' ? '외주비(제작)' : '외주비(용역)'

  const handleAdd = () => {
    if (!newVendor.trim() || newAmount === '') return
    
    const updatedVendors = [...vendors, { vendor: newVendor.trim(), amount: Number(newAmount) }]
    onChange(updatedVendors)
    setNewVendor('')
    setNewAmount('')
  }

  const handleRemove = (index: number) => {
    const updatedVendors = vendors.filter((_, i) => i !== index)
    onChange(updatedVendors)
  }

  const totalAmount = vendors.reduce((sum, v) => sum + v.amount, 0)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end border-b pb-4">
          <div className="space-y-2">
            <Label htmlFor="vendor-name">업체명</Label>
            <Input
              id="vendor-name"
              placeholder="업체명을 입력하세요"
              value={newVendor}
              onChange={(e) => setNewVendor(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendor-amount">금액</Label>
            <Input
              id="vendor-amount"
              type="number"
              placeholder="금액을 입력하세요"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value === '' ? '' : Number(e.target.value))}
            />
          </div>
          <Button onClick={handleAdd} className="w-full md:w-auto">
            <Plus className="w-4 h-4 mr-1" /> 추가
          </Button>
        </div>

        <div className="space-y-2">
          {vendors.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">등록된 업체가 없습니다.</p>
          ) : (
            vendors.map((v, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <span className="text-sm font-medium truncate">{v.vendor}</span>
                  <span className="text-sm text-right font-mono">{v.amount.toLocaleString()}원</span>
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="ml-4 h-8 w-8"
                  onClick={() => handleRemove(index)}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t font-bold">
          <span>합계</span>
          <span className="text-blue-600">{totalAmount.toLocaleString()}원</span>
        </div>
      </CardContent>
    </Card>
  )
}
