import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UserForm } from '@/components/settings/user-form'

export default async function NewUserPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">사용자 추가</h1>
        <p className="text-slate-500">새 사용자를 등록하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>사용자 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <UserForm />
        </CardContent>
      </Card>
    </div>
  )
}
