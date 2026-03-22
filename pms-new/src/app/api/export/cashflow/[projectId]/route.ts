import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { exportCashFlow } from '@/lib/excel-export'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { projectId } = await params

  const cashFlows = await prisma.cashFlow.findMany({
    where: { projectId },
    orderBy: { plannedDate: 'asc' },
  })

  if (cashFlows.length === 0) {
    return NextResponse.json({ error: 'No cash flow data found' }, { status: 404 })
  }

  const buffer = exportCashFlow(cashFlows)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="cashflow-${projectId}.xlsx"`,
    },
  })
}
