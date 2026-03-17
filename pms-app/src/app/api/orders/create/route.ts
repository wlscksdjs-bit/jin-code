import { NextResponse } from 'next/server'
import { createPurchaseOrder } from '@/app/actions/purchase-orders'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const result = await createPurchaseOrder({
      projectId: body.projectId,
      vendorId: body.vendorId,
      title: body.title,
      description: body.description,
      orderDate: new Date(body.orderDate),
      requiredDate: body.requiredDate ? new Date(body.requiredDate) : undefined,
      notes: body.notes,
      items: body.items,
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { success: false, error: '발주서 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
