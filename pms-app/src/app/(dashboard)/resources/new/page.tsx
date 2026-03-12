import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ResourceForm } from '@/components/resources/resource-form'

export default async function NewResourcePage() {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">인력 등록</h1>
        <p className="text-slate-500">새 인력을 추가하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>인력 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <ResourceForm />
        </CardContent>
      </Card>
    </div>
  )
}
