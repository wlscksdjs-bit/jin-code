import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { importWaitingProjectsFromExcel } from '@/app/actions/waiting-projects'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await importWaitingProjectsFromExcel(buffer)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import' }, { status: 500 })
  }
}
