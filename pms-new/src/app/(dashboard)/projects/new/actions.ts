'use server'

import { redirect } from 'next/navigation'
import { createProject } from '@/app/actions/projects'

export async function createProjectAction(formData: FormData) {
  const data = {
    code: formData.get('code') as string,
    name: formData.get('name') as string,
    type: formData.get('type') as string || undefined,
    status: 'REGISTERED',
    contractType: formData.get('contractType') as string || undefined,
    startDate: formData.get('startDate') as string || undefined,
    endDate: formData.get('endDate') as string || undefined,
    contractAmount: parseFloat(formData.get('contractAmount') as string) || 0,
    estimatedBudget: parseFloat(formData.get('estimatedBudget') as string) || 0,
    location: formData.get('location') as string || undefined,
    description: formData.get('description') as string || undefined,
    customerId: formData.get('customerId') as string || undefined,
  }
  const project = await createProject(data)
  redirect(`/projects/${project.id}`)
}
