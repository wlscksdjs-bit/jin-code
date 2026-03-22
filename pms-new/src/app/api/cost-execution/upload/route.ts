import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { parseCostExcel } from '@/lib/excel/cost-template'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const data = parseCostExcel(buffer)
    
    return NextResponse.json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Excel upload error:', error)
    return NextResponse.json(
      { error: 'Failed to parse Excel file' },
      { status: 500 }
    )
  }
}
