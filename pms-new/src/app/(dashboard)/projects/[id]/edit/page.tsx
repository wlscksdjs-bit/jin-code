'use server'

import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import { getProject, updateProject, listCustomers } from '@/app/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [project, customers] = await Promise.all([getProject(id), listCustomers()])
  if (!project) notFound()

  async function handleSubmit(formData: FormData) {
    'use server'
    const data = {
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      status: formData.get('status') as string,
      contractType: formData.get('contractType') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      contractAmount: parseFloat(formData.get('contractAmount') as string) || 0,
      estimatedBudget: parseFloat(formData.get('estimatedBudget') as string) || 0,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      customerId: formData.get('customerId') as string,
    }
    await updateProject(id, data)
    redirect(`/projects/${id}`)
  }

  const fmtDate = (d: Date | string | null) => d ? new Date(d).toISOString().split('T')[0] : ''

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold tracking-tight">프로젝트 편집</h1></div>
      <Card>
        <CardHeader><CardTitle>프로젝트 정보</CardTitle></CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">프로젝트 코드</label>
                <input name="code" defaultValue={project.code} disabled className="w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">프로젝트명 *</label>
                <input name="name" defaultValue={project.name} required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">상태</label>
                <select name="status" defaultValue={project.status} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="REGISTERED">등록</option>
                  <option value="CONTRACT">계약</option>
                  <option value="DESIGN">설계</option>
                  <option value="PROCUREMENT">조달</option>
                  <option value="CONSTRUCTION">시공</option>
                  <option value="COMPLETED">완료</option>
                  <option value="CANCELLED">취소</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">유형</label>
                <input name="type" defaultValue={project.type ?? ''} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">계약 유형</label>
                <input name="contractType" defaultValue={project.contractType ?? ''} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">발주처</label>
                <select name="customerId" defaultValue={project.customerId ?? ''} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="">선택</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">위치</label>
                <input name="location" defaultValue={project.location ?? ''} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">계약금액</label>
                <input name="contractAmount" type="number" step="1" defaultValue={project.contractAmount} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">예산</label>
                <input name="estimatedBudget" type="number" step="1" defaultValue={project.estimatedBudget} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <input name="startDate" type="date" defaultValue={fmtDate(project.startDate)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <input name="endDate" type="date" defaultValue={fmtDate(project.endDate)} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <textarea name="description" rows={3} defaultValue={project.description ?? ''} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">저장</Button>
              <Button type="button" variant="outline" onClick={() => redirect(`/projects/${id}`)}>취소</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
