import 'dotenv/config'
import { PrismaClient } from '@/generated/prisma'
import { PrismaLibSql } from '@prisma/adapter-libsql'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _prisma: PrismaClient | undefined

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const dbUrl = process.env.DATABASE_URL ?? 'file:./dev.db'
    const filePath = dbUrl.startsWith('file:')
      ? path.resolve(process.cwd(), dbUrl.slice(5))
      : dbUrl
    const adapter = new PrismaLibSql({ url: `file:${filePath}` })
    globalForPrisma.prisma = new PrismaClient({ adapter } as unknown as ConstructorParameters<typeof PrismaClient>[0])
  }
  return globalForPrisma.prisma
}

const prisma = getPrisma()

export default prisma
