import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkApiPermission } from '@/lib/rbac'

export async function POST(request: Request) {
  try {
    const { allowed, error, user } = await checkApiPermission(['ADMIN', 'PM'])
    
    if (!allowed || !user) {
      return error
    }

    const body = await request.json()
    const { costEstimateId, projectId, type, periodYear, periodMonth } = body

    if (!costEstimateId || !projectId || !type || !periodYear) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const estimate = await prisma.costEstimate.findUnique({
      where: { id: costEstimateId }
    })

    if (!estimate) {
      return NextResponse.json(
        { error: '견적원가를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const costExecution = await prisma.costExecution.create({
      data: {
        projectId,
        costEstimateId,
        type,
        periodYear,
        periodMonth: periodMonth || null,
        status: 'DRAFT',
        
        contractAmount: estimate.contractAmount,
        sellingAdminRate: estimate.sellingAdminRate,
        
        materialCost: estimate.materialCost,
        laborCost: estimate.laborCost,
        outsourceFabrication: estimate.outsourceFabrication,
        outsourceService: estimate.outsourceService,
        consumableOther: estimate.consumableOther,
        consumableSafety: estimate.consumableSafety,
        travelExpense: estimate.travelExpense,
        insuranceWarranty: estimate.insuranceWarranty,
        dormitoryCost: estimate.dormitoryCost,
        miscellaneous: estimate.miscellaneous,
        paymentFeeOther: estimate.paymentFeeOther,
        rentalForklift: estimate.rentalForklift,
        rentalOther: estimate.rentalOther,
        vehicleRepair: estimate.vehicleRepair,
        vehicleFuel: estimate.vehicleFuel,
        vehicleOther: estimate.vehicleOther,
        welfareBusiness: estimate.welfareBusiness,
        reserveFund: estimate.reserveFund,
        indirectCost: estimate.indirectCost,
        
        totalExpense: estimate.totalExpense,
        totalDirectCost: estimate.totalDirectCost,
        totalManufacturingCost: estimate.totalManufacturingCost,
        sellingAdminCost: estimate.sellingAdminCost,
        grossProfit: estimate.grossProfit,
        operatingProfit: estimate.operatingProfit,
      }
    })

    revalidatePath('/cost')
    revalidatePath(`/projects/${projectId}`)

    return NextResponse.json({ success: true, costExecution })
  } catch (error) {
    console.error('Error copying estimate to execution:', error)
    return NextResponse.json(
      { error: '실행원가 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
