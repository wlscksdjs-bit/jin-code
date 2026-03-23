import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseEstimateExcel } from '@/lib/excel/estimate-template'
import prisma from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const projectId = formData.get('projectId') as string
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ error: 'No projectId provided' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const data = parseEstimateExcel(buffer)
    
    const totalDirect = data.costs.materialCost + data.costs.laborCost + 
      data.costs.outsourceFabrication + data.costs.outsourceService
    const totalIndirect = Object.values(data.costs).reduce((sum, v) => sum + v, 0) - totalDirect
    const totalManufacturingCost = totalDirect + totalIndirect
    const sellingAdminCostVal = totalManufacturingCost * (data.sellingAdminRate / 100)
    const totalExpense = totalManufacturingCost + sellingAdminCostVal
    const operatingProfit = data.contractAmount - totalExpense

    const estimate = await prisma.costEstimate.create({
      data: {
        projectId,
        title: data.title,
        version: data.version,
        status: 'DRAFT',
        contractAmount: data.contractAmount,
        sellingAdminRate: data.sellingAdminRate,
        materialCost: data.costs.materialCost,
        laborCost: data.costs.laborCost,
        outsourceFabrication: data.costs.outsourceFabrication,
        outsourceService: data.costs.outsourceService,
        consumableOther: data.costs.consumableOther,
        consumableSafety: data.costs.consumableSafety,
        travelExpense: data.costs.travelExpense,
        insuranceWarranty: data.costs.insuranceWarranty,
        dormitoryCost: data.costs.dormitoryCost,
        miscellaneous: data.costs.miscellaneous,
        paymentFeeOther: data.costs.paymentFeeOther,
        rentalForklift: data.costs.rentalForklift,
        rentalOther: data.costs.rentalOther,
        vehicleRepair: data.costs.vehicleRepair,
        vehicleFuel: data.costs.vehicleFuel,
        vehicleOther: data.costs.vehicleOther,
        welfareBusiness: data.costs.welfareBusiness,
        reserveFund: data.costs.reserveFund,
        indirectCost: data.costs.indirectCost,
        totalDirectCost: totalDirect,
        totalManufacturingCost,
        sellingAdminCost: sellingAdminCostVal,
        totalExpense,
        operatingProfit,
        profitRate: data.contractAmount > 0 ? (operatingProfit / data.contractAmount) * 100 : 0,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        id: estimate.id,
        title: estimate.title,
        contractAmount: estimate.contractAmount,
      }
    })
  } catch (error) {
    console.error('Estimate Excel upload error:', error)
    return NextResponse.json(
      { error: 'Failed to parse Excel file' },
      { status: 500 }
    )
  }
}
