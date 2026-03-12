import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getStatusColor } from '@/lib/utils'
import { Plus, Users, Shield, Trash2, Edit } from 'lucide-react'
import Link from 'next/link'
import { deleteUser } from '@/app/actions/users'

async function getUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
  })
}

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  const users = await getUsers()

  const currentUserId = session.user.id

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">설정</h1>
          <p className="text-slate-500">시스템 설정 및 사용자 관리</p>
        </div>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <CardTitle>사용자 관리</CardTitle>
          </div>
          <Link href="/settings/new-user">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              사용자 추가
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">이름</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">이메일</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">부서</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">직위</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">역할</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-500">상태</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-slate-500">작업</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{user.name || '-'}</td>
                    <td className="py-3 px-4 text-sm">{user.email}</td>
                    <td className="py-3 px-4 text-sm">{user.department || '-'}</td>
                    <td className="py-3 px-4 text-sm">{user.position || '-'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs flex items-center gap-1 w-fit ${
                        user.role === 'ADMIN' 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusColor(user.isActive ? 'ACTIVE' : 'INACTIVE')}`}>
                        {user.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/settings/${user.id}/edit`}>
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </Link>
                        {user.id !== currentUserId && (
                          <form action={deleteUser.bind(null, user.id)}>
                            <Button variant="ghost" size="icon" type="submit">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </form>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      등록된 사용자가 없습니다
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
