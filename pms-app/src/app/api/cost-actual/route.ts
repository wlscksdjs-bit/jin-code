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
      projectId, type, asOfDate, contractAmount, sellingAdminRate,
      materialCost, laborCost,
      outsourceFabrication, outsourceService,
      consumableOther, consumableSafety,
      travelExpense, insuranceWarranty, dormitoryCost, miscellaneous, paymentFeeOther,
      rentalForklift, rentalOther,
      vehicleRepair, vehicleFuel, vehicleOther,
      welfareBusiness, reserveFund,
      indirectCost
    } = body

    if (!projectId || !type || !asOfDate) {
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
    const profitRate = contractAmount > 0 ? (operatingProfit / contractAmount) * 100 : 0

    const costActual = await prisma.costActual.create({
      data: {
        projectId,
        type,
        asOfDate: new Date(asOfDate),
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
        profitRate,
      }
    })

    revalidatePath('/cost')
    revalidatePath(`/projects/${projectId}`)

    return NextResponse.json({ success: true, costActual })
  } catch (error) {
    console.error('Error creating cost actual:', error)
    return NextResponse.json(
      { error: '실적 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { allowed, error } = await checkApiPermission(['ADMIN', 'PM', 'STAFF'])
    
    if (!allowed) {
      return error
    }

    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    const where = projectId ? { projectId } : {}

    const costActuals = await prisma.costActual.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, code: true }
        }
      },
      orderBy: { asOfDate: 'desc' }
    })

    return NextResponse.json({ costActuals })
  } catch (error) {
    console.error('Error fetching cost actuals:', error)
    return NextResponse.json(
      { error: '실적 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
