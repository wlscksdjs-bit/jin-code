'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export interface VendorCost {
  vendor: string
  amount: number
}

export interface VendorManagerProps {
  type: 'FABRICATION' | 'SERVICE'
  vendors: VendorCost[]
  onChange: (vendors: VendorCost[]) => void
}

export function VendorManager({ type, vendors, onChange }: VendorManagerProps) {
  const [newVendor, setNewVendor] = useState('')
  const [newAmount, setNewAmount] = useState('')

  const label = type === 'FABRICATION' ? '외주비(제작)' : '외주비(용역)'
  const total = vendors.reduce((sum, v) => sum + v.amount, 0)

  const addVendor = () => {
    if (newVendor.trim() && newAmount) {
      onChange([...vendors, { vendor: newVendor.trim(), amount: parseFloat(newAmount) || 0 }])
      setNewVendor('')
      setNewAmount('')
    }
  }

  const removeVendor = (index: number) => {
    onChange(vendors.filter((_, i) => i !== index))
  }

  const fmt = (n: number) => `${n.toLocaleString('ko-KR')}원`

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {vendors.length > 0 && (
          <div className="space-y-2">
            {vendors.map((v, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate">{v.vendor}</span>
                <span className="font-mono">{fmt(v.amount)}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVendor(i)}
                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                >
                  ✕
                </Button>
              </div>
            ))}
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>합계</span>
              <span className="font-bold">{fmt(total)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="업체명"
            value={newVendor}
            onChange={(e) => setNewVendor(e.target.value)}
            className="flex-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm dark:border-gray-800 dark:bg-gray-800"
          />
          <input
            type="number"
            placeholder="금액"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="w-28 rounded-md border border-gray-200 bg-white px-2 py-1 text-sm text-right dark:border-gray-800 dark:bg-gray-800"
          />
          <Button type="button" variant="outline" size="sm" onClick={addVendor} className="shrink-0">
            +추가
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
