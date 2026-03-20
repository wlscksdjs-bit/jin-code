import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const adminPassword = await bcrypt.hash('admin123', 12)
    const pmPassword = await bcrypt.hash('pm123', 12)

    await prisma.user.upsert({
      where: { email: 'admin@pms.com' },
      update: {},
      create: {
        email: 'admin@pms.com',
        name: '관리자',
        password: adminPassword,
        role: 'ADMIN',
      },
    })

    await prisma.user.upsert({
      where: { email: 'pm@pms.com' },
      update: {},
      create: {
        email: 'pm@pms.com',
        name: '项目经理',
        password: pmPassword,
        role: 'PM',
      },
    })

    return NextResponse.json({ success: true, message: 'Seed complete' })
  } catch (error) {
    return NextResponse.json({ error: 'Seed failed', detail: String(error) }, { status: 500 })
  }
}
