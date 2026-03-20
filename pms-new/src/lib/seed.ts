import 'dotenv/config'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

async function seed() {
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

  console.log('Seed complete: admin@pms.com / admin123, pm@pms.com / pm123')
}

seed()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
