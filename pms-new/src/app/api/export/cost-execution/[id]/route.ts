import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { exportCostExecution } from '@/lib/excel-export'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const execution = await prisma.costExecution.findUnique({
    where: { id },
    include: { items: true },
  })

  if (!execution) {
    return NextResponse.json({ error: 'Execution not found' }, { status: 404 })
  }

  const buffer = exportCostExecution(execution)

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="cost-execution-${execution.periodYear}-${execution.periodMonth}.xlsx"`,
    },
  })
}
