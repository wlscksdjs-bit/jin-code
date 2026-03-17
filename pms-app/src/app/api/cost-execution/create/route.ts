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
    const { projectId, costEstimateId, type, periodYear, periodMonth, status, description } = body

    const costs = body.costs || {}
    const materialCost = body.materialCost ?? costs.materialCost ?? 0
    const laborCost = body.laborCost ?? costs.laborCost ?? 0
    const outsourceFabrication = body.outsourceFabrication ?? costs.outsourceFabrication ?? 0
    const outsourceService = body.outsourceService ?? costs.outsourceService ?? 0
    const consumableOther = body.consumableOther ?? costs.consumableOther ?? 0
    const consumableSafety = body.consumableSafety ?? costs.consumableSafety ?? 0
    const travelExpense = body.travelExpense ?? costs.travelExpense ?? 0
    const insuranceWarranty = body.insuranceWarranty ?? costs.insuranceWarranty ?? 0
    const dormitoryCost = body.dormitoryCost ?? costs.dormitoryCost ?? 0
    const miscellaneous = body.miscellaneous ?? costs.miscellaneous ?? 0
    const indirectCost = body.indirectCost ?? costs.indirectCost ?? 0

    const paymentFeeOther = body.paymentFeeOther ?? costs.paymentFeeOther ?? 0
    const rentalForklift = body.rentalForklift ?? costs.rentalForklift ?? 0
    const rentalOther = body.rentalOther ?? costs.rentalOther ?? 0
    const vehicleRepair = body.vehicleRepair ?? costs.vehicleRepair ?? 0
    const vehicleFuel = body.vehicleFuel ?? costs.vehicleFuel ?? 0
    const vehicleOther = body.vehicleOther ?? costs.vehicleOther ?? 0
    const welfareBusiness = body.welfareBusiness ?? costs.welfareBusiness ?? 0
    const reserveFund = body.reserveFund ?? costs.reserveFund ?? 0

    const contractAmount = body.contractAmount ?? 0
    const sellingAdminRate = body.sellingAdminRate ?? 12

    if (!projectId || !type || !periodYear) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    const totalExpense = outsourceFabrication + outsourceService + consumableOther + consumableSafety +
      travelExpense + insuranceWarranty + dormitoryCost + miscellaneous + paymentFeeOther +
      rentalForklift + rentalOther + vehicleRepair + vehicleFuel + vehicleOther + welfareBusiness + reserveFund
    const totalDirectCost = materialCost + laborCost + totalExpense
    const totalManufacturingCost = totalDirectCost + indirectCost
    const sellingAdminCostValue = contractAmount * ((sellingAdminRate || 12) / 100)
    const grossProfit = contractAmount - totalManufacturingCost
    const operatingProfit = grossProfit - sellingAdminCostValue

    const costExecution = await prisma.costExecution.create({
      data: {
        projectId,
        costEstimateId: costEstimateId || null,
        type,
        periodYear,
        periodMonth: periodMonth || null,
        status: status || 'DRAFT',
        contractAmount: contractAmount || 0,
        sellingAdminRate: sellingAdminRate || 12,
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
        sellingAdminCost: sellingAdminCostValue,
        grossProfit,
        operatingProfit,
        description: description || null,
      }
    })

    revalidatePath('/cost')
    revalidatePath(`/projects/${projectId}`)

    return NextResponse.json({ success: true, costExecution })
  } catch (error) {
    console.error('Error creating cost execution:', error)
    return NextResponse.json(
      { error: '실행 원가 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
