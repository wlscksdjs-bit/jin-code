'use server'

import { redirect } from 'next/navigation'
import { deleteCostExecution } from '@/app/actions/cost-executions'

export async function deleteCostExecutionAction(id: string, projectId: string) {
  await deleteCostExecution(id)
  redirect(`/projects/${projectId}`)
}
