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
    const { 
      projectId, title, version, status, contractAmount,
      materialCost, laborCost,
      outsourceFabrication, outsourceService,
      consumableOther, consumableSafety,
      travelExpense, insuranceWarranty, dormitoryCost, miscellaneous, paymentFeeOther,
      rentalForklift, rentalOther,
      vehicleRepair, vehicleFuel, vehicleOther,
      welfareBusiness, reserveFund,
      indirectCost, sellingAdminRate,
      notes, estimatedDate, validUntil
    } = body

    if (!projectId || !title || contractAmount === undefined) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 손익 계산
    const totalExpense = outsourceFabrication + outsourceService + consumableOther + consumableSafety +
      travelExpense + insuranceWarranty + dormitoryCost + miscellaneous + paymentFeeOther +
      rentalForklift + rentalOther + vehicleRepair + vehicleFuel + vehicleOther + welfareBusiness + reserveFund
    const totalDirectCost = materialCost + laborCost + totalExpense
    const totalManufacturingCost = totalDirectCost + indirectCost
    const sellingAdminCost = contractAmount * ((sellingAdminRate || 12) / 100)
    const grossProfit = contractAmount - totalManufacturingCost
    const operatingProfit = grossProfit - sellingAdminCost
    const profitRate = contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0

    const costEstimate = await prisma.costEstimate.create({
      data: {
        projectId,
        title,
        version: version || 1,
        status: status || 'DRAFT',
        contractAmount,
        materialCost: materialCost || 0,
        laborCost: laborCost || 0,
        outsourceFabrication: outsourceFabrication || 0,
        outsourceService: outsourceService || 0,
        consumableOther: consumableOther || 0,
        consumableSafety: consumableSafety || 0,
        travelExpense: travelExpense || 0,
        insuranceWarranty: insuranceWarranty || 0,
        dormitoryCost: dormitoryCost || 0,
        miscellaneous: miscellaneous || 0,
        paymentFeeOther: paymentFeeOther || 0,
        rentalForklift: rentalForklift || 0,
        rentalOther: rentalOther || 0,
        vehicleRepair: vehicleRepair || 0,
        vehicleFuel: vehicleFuel || 0,
        vehicleOther: vehicleOther || 0,
        welfareBusiness: welfareBusiness || 0,
        reserveFund: reserveFund || 0,
        indirectCost: indirectCost || 0,
        totalExpense,
        totalDirectCost,
        totalManufacturingCost,
        sellingAdminRate: sellingAdminRate || 12,
        sellingAdminCost,
        grossProfit,
        operatingProfit,
        profitRate,
        notes: notes || null,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
      }
    })

    revalidatePath('/cost')
    revalidatePath(`/projects/${projectId}`)

    return NextResponse.json({ success: true, costEstimate })
  } catch (error) {
    console.error('Error creating cost estimate:', error)
    return NextResponse.json(
      { error: '견적 원가 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
