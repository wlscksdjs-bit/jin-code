import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { checkApiPermission } from '@/lib/rbac'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed, error } = await checkApiPermission(['ADMIN', 'PM', 'STAFF'])
    
    if (!allowed) {
      return error
    }

    const { id } = await params

    const costEstimate = await prisma.costEstimate.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, name: true, code: true }
        },
        items: {
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!costEstimate) {
      return NextResponse.json(
        { error: '원가를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({ costEstimate })
  } catch (error) {
    console.error('Error fetching cost estimate:', error)
    return NextResponse.json(
      { error: '원가 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed, error } = await checkApiPermission(['ADMIN', 'PM'])
    
    if (!allowed) {
      return error
    }

    const { id } = await params
    const body = await request.json()

    const existing = await prisma.costEstimate.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: '원가를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const { 
      title, version, status, contractAmount,
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

    const totalExpense = (outsourceFabrication ?? existing.outsourceFabrication) + 
      (outsourceService ?? existing.outsourceService) + 
      (consumableOther ?? existing.consumableOther) + 
      (consumableSafety ?? existing.consumableSafety) +
      (travelExpense ?? existing.travelExpense) + 
      (insuranceWarranty ?? existing.insuranceWarranty) + 
      (dormitoryCost ?? existing.dormitoryCost) + 
      (miscellaneous ?? existing.miscellaneous) + 
      (paymentFeeOther ?? existing.paymentFeeOther) +
      (rentalForklift ?? existing.rentalForklift) + 
      (rentalOther ?? existing.rentalOther) + 
      (vehicleRepair ?? existing.vehicleRepair) + 
      (vehicleFuel ?? existing.vehicleFuel) + 
      (vehicleOther ?? existing.vehicleOther) + 
      (welfareBusiness ?? existing.welfareBusiness) + 
      (reserveFund ?? existing.reserveFund)
    
    const totalDirectCost = (materialCost ?? existing.materialCost) + 
      (laborCost ?? existing.laborCost) + 
      totalExpense
    
    const totalManufacturingCost = totalDirectCost + 
      (indirectCost ?? existing.indirectCost)
    
    const finalContractAmount = contractAmount ?? existing.contractAmount
    const finalSellingAdminRate = sellingAdminRate ?? existing.sellingAdminRate
    const sellingAdminCost = finalContractAmount * (finalSellingAdminRate / 100)
    const grossProfit = finalContractAmount - totalManufacturingCost
    const operatingProfit = grossProfit - sellingAdminCost
    const profitRate = finalContractAmount > 0 ? 
      (operatingProfit / finalContractAmount) * 100 : 0

    const costEstimate = await prisma.costEstimate.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        version: version ?? existing.version,
        status: status ?? existing.status,
        contractAmount: finalContractAmount,
        materialCost: materialCost ?? existing.materialCost,
        laborCost: laborCost ?? existing.laborCost,
        outsourceFabrication: outsourceFabrication ?? existing.outsourceFabrication,
        outsourceService: outsourceService ?? existing.outsourceService,
        consumableOther: consumableOther ?? existing.consumableOther,
        consumableSafety: consumableSafety ?? existing.consumableSafety,
        travelExpense: travelExpense ?? existing.travelExpense,
        insuranceWarranty: insuranceWarranty ?? existing.insuranceWarranty,
        dormitoryCost: dormitoryCost ?? existing.dormitoryCost,
        miscellaneous: miscellaneous ?? existing.miscellaneous,
        paymentFeeOther: paymentFeeOther ?? existing.paymentFeeOther,
        rentalForklift: rentalForklift ?? existing.rentalForklift,
        rentalOther: rentalOther ?? existing.rentalOther,
        vehicleRepair: vehicleRepair ?? existing.vehicleRepair,
        vehicleFuel: vehicleFuel ?? existing.vehicleFuel,
        vehicleOther: vehicleOther ?? existing.vehicleOther,
        welfareBusiness: welfareBusiness ?? existing.welfareBusiness,
        reserveFund: reserveFund ?? existing.reserveFund,
        indirectCost: indirectCost ?? existing.indirectCost,
        totalExpense,
        totalDirectCost,
        totalManufacturingCost,
        sellingAdminRate: finalSellingAdminRate,
        sellingAdminCost,
        grossProfit,
        operatingProfit,
        profitRate,
        notes: notes ?? existing.notes,
        estimatedDate: estimatedDate ? new Date(estimatedDate) : existing.estimatedDate,
        validUntil: validUntil ? new Date(validUntil) : existing.validUntil,
      }
    })

    revalidatePath('/cost')
    revalidatePath(`/projects/${existing.projectId}`)

    return NextResponse.json({ success: true, costEstimate })
  } catch (error) {
    console.error('Error updating cost estimate:', error)
    return NextResponse.json(
      { error: '원가 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
