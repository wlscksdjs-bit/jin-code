'use client'

import { FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { exportToXLSX } from '@/lib/export'

type Order = {
  id: string
  orderNumber: string
  title: string
  status: string
  totalAmount: number
  orderDate: Date | string
  requiredDate: Date | string | null
  vendor: { name: string; category: string }
  project: { name: string } | null
}

type OrdersExportButtonProps = {
  orders: Order[]
}

export function OrdersExportButton({ orders }: OrdersExportButtonProps) {
  const handleExport = () => {
    const columns = [
      { key: 'orderNumber', header: '발주번호' },
      { key: 'title', header: '제목' },
      { key: 'vendor', header: '거래처' },
      { key: 'category', header: '분류' },
      { key: 'project', header: '프로젝트' },
      { key: 'orderDate', header: '발주일' },
      { key: 'requiredDate', header: '납기일' },
      { key: 'totalAmount', header: '금액' },
      { key: 'status', header: '상태' },
    ]

    const data = orders.map(o => ({
      orderNumber: o.orderNumber,
      title: o.title,
      vendor: o.vendor.name,
      category: o.vendor.category,
      project: o.project?.name || '-',
      orderDate: new Date(o.orderDate).toLocaleDateString('ko-KR'),
      requiredDate: o.requiredDate ? new Date(o.requiredDate).toLocaleDateString('ko-KR') : '-',
      totalAmount: o.totalAmount.toLocaleString('ko-KR'),
      status: o.status,
    }))

    exportToXLSX(data, columns, 'orders')
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <FileSpreadsheet className="w-4 h-4 mr-2" />
      Excel 내보내기
    </Button>
  )
}
