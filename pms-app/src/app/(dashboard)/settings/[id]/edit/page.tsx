import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import prisma from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserForm } from '@/components/settings/user-form'

async function getUser(id: string) {
  return prisma.user.findUnique({
    where: { id },
  })
}

export default async function EditUserPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const session = await auth()
  const { id } = await params
  
  if (!session) {
    redirect('/login')
  }

  const user = await getUser(id)

  if (!user) {
    redirect('/settings')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 수정</h1>
        <p className="text-slate-500">{user.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm user={user} />
        </CardContent>
      </Card>
    </div>
  )
}
