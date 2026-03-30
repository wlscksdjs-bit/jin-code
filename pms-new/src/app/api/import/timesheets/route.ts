import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseTimeSheetsFromExcel, createTimeSheetTemplate } from '@/lib/excel-import'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const buffer = createTimeSheetTemplate()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="timesheets-template.xlsx"',
    },
  })
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const timeSheets = parseTimeSheetsFromExcel(buffer)

    const results = []
    const errors = []

    for (let i = 0; i < timeSheets.length; i++) {
      const row = timeSheets[i]
      try {
        const resource = await prisma.resource.findUnique({
          where: { employeeNumber: row.사번 },
        })

        const project = await prisma.project.findFirst({
          where: { code: row.프로젝트코드 },
        })

        if (!project) {
          errors.push({ row: i + 1, error: `프로젝트 코드 '${row.프로젝트코드}'를 찾을 수 없습니다` })
          continue
        }

        const hourlyRate = row.시간단가 || resource?.hourlyRate || 0
        const totalCost = row.시간 * hourlyRate

        const timeSheet = await prisma.timeSheet.create({
          data: {
            date: new Date(row.날짜),
            hours: row.시간,
            workType: row.작업유형,
            description: row.설명,
            hourlyRate,
            totalCost,
            projectId: project.id,
            resourceId: resource?.id,
            userId: session.user.id,
            status: 'DRAFT',
          },
        })
        results.push({ row: i + 1, id: timeSheet.id, date: row.날짜 })
      } catch (err) {
        errors.push({ row: i + 1, error: (err as Error).message })
      }
    }

    return NextResponse.json({
      success: true,
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}
