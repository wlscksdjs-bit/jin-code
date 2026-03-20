'use server'

import { redirect } from 'next/navigation'
import { createProject, listCustomers } from '@/app/actions/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default async function NewProjectPage() {
  const customers = await listCustomers()

  async function handleSubmit(formData: FormData) {
    'use server'
    const data = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      type: formData.get('type') as string,
      status: 'REGISTERED',
      contractType: formData.get('contractType') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      contractAmount: parseFloat(formData.get('contractAmount') as string) || 0,
      estimatedBudget: parseFloat(formData.get('estimatedBudget') as string) || 0,
      location: formData.get('location') as string,
      description: formData.get('description') as string,
      customerId: formData.get('customerId') as string,
    }
    const project = await createProject(data)
    redirect(`/projects/${project.id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 프로젝트</h1>
      </div>
      <Card>
        <CardHeader><CardTitle>프로젝트 정보</CardTitle></CardHeader>
        <CardContent>
          <form action={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">프로젝트 코드 *</label>
                <input name="code" required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" placeholder="PJT-2026-001" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">프로젝트명 *</label>
                <input name="name" required className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">유형</label>
                <select name="type" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="">선택</option>
                  <option value="plant">플랜트</option>
                  <option value="building">건축</option>
                  <option value="infrastructure">인프라</option>
                  <option value="equipment">설비</option>
                  <option value="service">용역</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">계약 유형</label>
                <select name="contractType" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="">선택</option>
                  <option value=" lump-sum">총액</option>
                  <option value="unit-rate">단가</option>
                  <option value="cost-plus">원가_PLUS</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">발주처</label>
                <select name="customerId" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800">
                  <option value="">선택</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">위치</label>
                <input name="location" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">계약금액</label>
                <input name="contractAmount" type="number" step="1" min="0" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">예산</label>
                <input name="estimatedBudget" type="number" step="1" min="0" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">시작일</label>
                <input name="startDate" type="date" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">종료일</label>
                <input name="endDate" type="date" className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">설명</label>
              <textarea name="description" rows={3} className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-800 dark:bg-gray-800" />
            </div>
            <div className="flex gap-2">
              <Button type="submit">생성</Button>
              <Button type="button" variant="outline" onClick={() => redirect('/projects')}>취소</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
