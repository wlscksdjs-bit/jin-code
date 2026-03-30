import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { parseProjectsFromExcel, createProjectTemplate } from '@/lib/excel-import'

export async function GET() {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const buffer = createProjectTemplate()

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="projects-template.xlsx"',
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
    const projects = parseProjectsFromExcel(buffer)

    const results = []
    const errors = []

    for (let i = 0; i < projects.length; i++) {
      const row = projects[i]
      try {
        const project = await prisma.project.create({
          data: {
            code: row.코드,
            name: row.프로젝트명,
            status: row.상태 || 'REGISTERED',
            contractAmount: row.계약금액 || 0,
            estimatedBudget: row.예산 || 0,
            startDate: row.착공일 ? new Date(row.착공일) : null,
            endDate: row.완공일 ? new Date(row.완공일) : null,
            location: row.현장주소,
            description: row.비고,
          },
        })
        results.push({ row: i + 1, id: project.id, code: project.code })
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
