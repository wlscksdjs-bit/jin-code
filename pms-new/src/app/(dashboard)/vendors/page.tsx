import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function VendorsPage() {
  const session = await auth()
  if (!session) return null

  const vendors = await prisma.vendor.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">거래처</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{vendors.length}건</p>
      </div>
      <Card>
        <CardContent className="p-0">
          {vendors.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">거래처가 없습니다.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 dark:bg-gray-900">
                  <th className="px-4 py-2 text-left text-xs text-gray-500">코드</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">거래처명</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">분류</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">연락처</th>
                  <th className="px-4 py-2 text-left text-xs text-gray-500">담당자</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="px-4 py-2 font-mono text-xs">{v.code}</td>
                    <td className="px-4 py-2 font-medium">{v.name}</td>
                    <td className="px-4 py-2"><Badge variant="secondary">{v.category ?? '-'}</Badge></td>
                    <td className="px-4 py-2 text-gray-500">{v.contactPhone ?? '-'}</td>
                    <td className="px-4 py-2 text-gray-500">{v.contactPerson ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
