import { NextResponse } from 'next/server'
import { deletePurchaseOrder } from '@/app/actions/purchase-orders'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await deletePurchaseOrder(id)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json(
      { success: false, error: '삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
