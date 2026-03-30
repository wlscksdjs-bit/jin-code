import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseResourcesFromExcel, createResourceTemplate } from '@/lib/excel-import'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const buffer = createResourceTemplate()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="resources-template.xlsx"',
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
    const resources = parseResourcesFromExcel(buffer)

    const results = []
    const errors = []

    for (let i = 0; i < resources.length; i++) {
      const row = resources[i]
      try {
        const resource = await prisma.resource.create({
          data: {
            employeeNumber: row.사번,
            name: row.이름,
            department: row.부서,
            position: row.직위,
            grade: row.직급,
            hourlyRate: row.시간단가 || 0,
            monthlyRate: row.월단가 || 0,
            availability: row.가용률 || 100,
            phone: row.연락처,
            email: row.이메일,
            skills: row.보유기술,
            certifications: row.자격증,
          },
        })
        results.push({ row: i + 1, id: resource.id, name: resource.name })
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
