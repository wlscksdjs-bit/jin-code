import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Building2, Phone, Mail, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { deleteVendor } from '@/app/actions/vendors'

async function getVendorsData() {
  return prisma.vendor.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { orders: true },
      },
    },
  })
}

function getCategoryBadge(category: string) {
  const styles: Record<string, string> = {
    MATERIAL: 'bg-blue-100 text-blue-700',
    EQUIPMENT: 'bg-purple-100 text-purple-700',
    SERVICE: 'bg-green-100 text-green-700',
    LABOR: 'bg-orange-100 text-orange-700',
  }
  return styles[category] || 'bg-slate-100 text-slate-700'
}

function getCategoryLabel(category: string) {
  const labels: Record<string, string> = {
    MATERIAL: '자재',
    EQUIPMENT: '장비',
    SERVICE: '용역',
    LABOR: '인건비',
  }
  return labels[category] || category
}

export default async function VendorsPage() {
  const session = await auth()
  if (!session) {
    redirect('/login')
  }

  if (session.user.role === 'STAFF') {
    redirect('/')
  }

  const vendors = await getVendorsData()

  const stats = {
    total: vendors.length,
    material: vendors.filter(v => v.category === 'MATERIAL').length,
    equipment: vendors.filter(v => v.category === 'EQUIPMENT').length,
    service: vendors.filter(v => v.category === 'SERVICE').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">거래처 관리</h1>
            <p className="text-slate-500">자재, 장비, 용역 거래처를 관리합니다</p>
          </div>
        </div>
        <Link href="/vendors/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            거래처 등록
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">전체</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">자재</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.material}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">장비</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.equipment}개</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-500">용역</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.service}개</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>거래처 목록</CardTitle>
        </CardHeader>
        <CardContent>
          {vendors.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>거래처가 없습니다.</p>
              <Link href="/vendors/new">
                <Button variant="outline" className="mt-4">
                  첫 거래처 등록
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {vendors.map((vendor) => (
                <div 
                  key={vendor.id} 
                  className={`p-4 border rounded-lg hover:bg-slate-50 transition-colors ${
                    !vendor.isActive ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium">{vendor.name}</h3>
                      <span className={`px-2 py-0.5 rounded text-xs ${getCategoryBadge(vendor.category)}`}>
                        {getCategoryLabel(vendor.category)}
                      </span>
                    </div>
                    {!vendor.isActive && (
                      <span className="px-2 py-0.5 rounded text-xs bg-slate-100 text-slate-500">
                        비활성
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-slate-500">
                    {vendor.contactPerson && (
                      <p>담당: {vendor.contactPerson}</p>
                    )}
                    {vendor.contactPhone && (
                      <p className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {vendor.contactPhone}
                      </p>
                    )}
                    {vendor.contactEmail && (
                      <p className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {vendor.contactEmail}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t flex justify-between items-center">
                    <span className="text-sm text-slate-500">
                      발주 {vendor._count.orders}건
                    </span>
                    <Link href={`/vendors/${vendor.id}`}>
                      <Button variant="ghost" size="sm">
                        상세
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
