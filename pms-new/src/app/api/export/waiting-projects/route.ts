import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { exportWaitingProjectsToExcel } from '@/app/actions/waiting-projects'

export async function POST() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const buffer = await exportWaitingProjectsToExcel()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="대기프로젝트.xlsx"',
      },
    })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export' }, { status: 500 })
  }
}
