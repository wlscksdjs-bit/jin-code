'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CategorySelect, type CategorySelectValue } from './category-select'
import { VendorInput } from './vendor-input'

export interface CostTableItem {
  id: string
  sheet: string
  category: string
  description: string
  majorCategory: string
  subCategory: string
  vendor: string
  itemName: string
  specification: string
  unit: string
  quantity: number
  unitPrice: number
  amount: number
}

interface CostItemsTableProps {
  items: CostTableItem[]
  onAddItem: () => void
  onDeleteItem: (id: string) => void
  onUpdateItem: (id: string, field: keyof CostTableItem, value: string | number) => void
}

export function CostItemsTable({
  items,
  onAddItem,
  onDeleteItem,
  onUpdateItem,
}: CostItemsTableProps) {
  const formatNumber = (num: number) => new Intl.NumberFormat('ko-KR').format(num)

  const handleQuantityOrPriceChange = (
    id: string,
    field: 'quantity' | 'unitPrice',
    value: string
  ) => {
    const numValue = Number(value) || 0
    const item = items.find(i => i.id === id)
    if (item) {
      const amount = field === 'quantity' 
        ? numValue * item.unitPrice 
        : item.quantity * numValue
      onUpdateItem(id, field, numValue)
      onUpdateItem(id, 'amount', amount)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={onAddItem}>
          <Plus className="w-4 h-4 mr-1" />
          행 추가
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-slate-500 border-2 border-dashed rounded-lg">
          행 추가 버튼을 클릭하여 품목을 추가하세요
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-2 py-2 text-left w-8">#</th>
                <th className="px-2 py-2 text-left w-24">대분류</th>
                <th className="px-2 py-2 text-left w-24">중분류</th>
                <th className="px-2 py-2 text-left w-32">업체명</th>
                <th className="px-2 py-2 text-left">품목명</th>
                <th className="px-2 py-2 text-left">규격</th>
                <th className="px-2 py-2 text-left w-16">단위</th>
                <th className="px-2 py-2 text-right w-20">수량</th>
                <th className="px-2 py-2 text-right w-24">단가</th>
                <th className="px-2 py-2 text-right w-28">금액</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-t hover:bg-slate-50">
                  <td className="px-2 py-2">{index + 1}</td>
                  <td className="px-2 py-2">
                    <CategorySelect
                      majorValue={item.majorCategory}
                      subValue={item.subCategory}
                      onMajorChange={(val) => {
                        onUpdateItem(item.id, 'majorCategory', val)
                        onUpdateItem(item.id, 'subCategory', '')
                      }}
                      onSubChange={(val) => onUpdateItem(item.id, 'subCategory', val)}
                    />
                  </td>
                  <td className="px-2 py-2">
                  </td>
                  <td className="px-2 py-2">
                    <VendorInput
                      value={item.vendor}
                      onChange={(val) => onUpdateItem(item.id, 'vendor', val)}
                      required
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={item.itemName}
                      onChange={(e) => onUpdateItem(item.id, 'itemName', e.target.value)}
                      placeholder="품목명"
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={item.specification}
                      onChange={(e) => onUpdateItem(item.id, 'specification', e.target.value)}
                      placeholder="규격"
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      value={item.unit}
                      onChange={(e) => onUpdateItem(item.id, 'unit', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      value={item.quantity || ''}
                      onChange={(e) => handleQuantityOrPriceChange(item.id, 'quantity', e.target.value)}
                      className="h-8 text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <Input
                      type="number"
                      value={item.unitPrice || ''}
                      onChange={(e) => handleQuantityOrPriceChange(item.id, 'unitPrice', e.target.value)}
                      className="h-8 text-right"
                    />
                  </td>
                  <td className="px-2 py-2 text-right font-medium">
                    {formatNumber(item.amount)}
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteItem(item.id)}
                      className="h-8 w-8 text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex justify-end pr-4">
          <div className="text-sm">
            <span className="text-slate-500">합계: </span>
            <span className="font-medium">
              {formatNumber(items.reduce((sum, item) => sum + item.amount, 0))}원
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
