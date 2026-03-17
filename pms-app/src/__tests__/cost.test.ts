import { describe, it, expect } from 'vitest'
import { aggregateCostItems } from '@/lib/excel-template'
import type { CostItemRow } from '@/lib/excel-template'

describe('aggregateCostItems', () => {
  it('should aggregate material cost', () => {
    const items: CostItemRow[] = [
      {
        sheet: '갑지',
        category: '직접공사비',
        subCategory: '재료비',
        description: '',
        vendor: '',
        itemName: '시멘트',
        specification: '',
        unit: 'EA',
        quantity: 1,
        unitPrice: 100000,
        amount: 100000,
      },
    ]
    
    const result = aggregateCostItems(items)
    expect(result.materialCost).toBe(100000)
  })

  it('should aggregate labor cost', () => {
    const items: CostItemRow[] = [
      {
        sheet: '갑지',
        category: '직접공사비',
        subCategory: '노무비',
        description: '',
        vendor: '',
        itemName: '인건비',
        specification: '',
        unit: 'MAN',
        quantity: 10,
        unitPrice: 50000,
        amount: 500000,
      },
    ]
    
    const result = aggregateCostItems(items)
    expect(result.laborCost).toBe(500000)
  })

  it('should calculate total direct cost', () => {
    const items: CostItemRow[] = [
      {
        sheet: '갑지',
        category: '직접공사비',
        subCategory: '재료비',
        description: '',
        vendor: '',
        itemName: '시멘트',
        specification: '',
        unit: 'EA',
        quantity: 1,
        unitPrice: 100000,
        amount: 100000,
      },
      {
        sheet: '갑지',
        category: '직접공사비',
        subCategory: '노무비',
        description: '',
        vendor: '',
        itemName: '인건비',
        specification: '',
        unit: 'MAN',
        quantity: 10,
        unitPrice: 50000,
        amount: 500000,
      },
      {
        sheet: '갑지',
        category: '직접공사비',
        subCategory: '경비',
        description: '',
        vendor: '',
        itemName: '외주비',
        specification: '',
        unit: 'EA',
        quantity: 1,
        unitPrice: 200000,
        amount: 200000,
      },
    ]
    
    const result = aggregateCostItems(items)
    expect(result.materialCost).toBe(100000)
    expect(result.laborCost).toBe(500000)
    expect(result.outsourceFabrication).toBe(200000)
  })

  it('should aggregate indirect cost', () => {
    const items: CostItemRow[] = [
      {
        sheet: '공사원가내역서',
        category: '간접공사비',
        subCategory: '간접노무비',
        description: '',
        vendor: '',
        itemName: '간접인건비',
        specification: '',
        unit: 'MAN',
        quantity: 5,
        unitPrice: 40000,
        amount: 200000,
      },
      {
        sheet: '공사원가내역서',
        category: '간접공사비',
        subCategory: '산업재해보상보험',
        description: '',
        vendor: '',
        itemName: '산재보험',
        specification: '',
        unit: 'EA',
        quantity: 1,
        unitPrice: 50000,
        amount: 50000,
      },
    ]
    
    const result = aggregateCostItems(items)
    expect(result.indirectLabor).toBe(200000)
    expect(result.industrialInsurance).toBe(50000)
    expect(result.indirectCost).toBeGreaterThan(0)
  })

  it('should handle empty items', () => {
    const items: CostItemRow[] = []
    
    const result = aggregateCostItems(items)
    expect(result.materialCost).toBe(0)
    expect(result.laborCost).toBe(0)
    expect(result.indirectCost).toBe(0)
  })
})
