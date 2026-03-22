import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const estimates = await prisma.costEstimate.findMany({
    include: {
      project: { select: { id: true, code: true, name: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(estimates)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const estimate = await prisma.costEstimate.create({
      data: {
        projectId: body.projectId,
        title: body.title,
        version: body.version || '1.0',
        status: body.status || 'DRAFT',
        contractAmount: body.contractAmount || 0,
        materialCost: body.materialCost || 0,
        laborCost: body.laborCost || 0,
        outsourceFabrication: body.outsourceFabrication || 0,
        outsourceService: body.outsourceService || 0,
        consumableOther: body.consumableOther || 0,
        consumableSafety: body.consumableSafety || 0,
        travelExpense: body.travelExpense || 0,
        insuranceWarranty: body.insuranceWarranty || 0,
        dormitoryCost: body.dormitoryCost || 0,
        miscellaneous: body.miscellaneous || 0,
        paymentFeeOther: body.paymentFeeOther || 0,
        rentalForklift: body.rentalForklift || 0,
        rentalOther: body.rentalOther || 0,
        vehicleRepair: body.vehicleRepair || 0,
        vehicleFuel: body.vehicleFuel || 0,
        vehicleOther: body.vehicleOther || 0,
        welfareBusiness: body.welfareBusiness || 0,
        reserveFund: body.reserveFund || 0,
        indirectCost: body.indirectCost || 0,
        totalExpense: body.totalExpense || 0,
        sellingAdminRate: body.sellingAdminRate || 12,
        sellingAdminCost: body.sellingAdminCost || 0,
        grossProfit: body.grossProfit || 0,
        notes: body.notes,
      },
    })

    return NextResponse.json(estimate)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create estimate' }, { status: 500 })
  }
}
