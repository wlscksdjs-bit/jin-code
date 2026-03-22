'use server'

import { redirect } from 'next/navigation'
import { deleteCostEstimate } from '@/app/actions/cost-estimates'

export async function deleteCostEstimateAction(id: string, projectId: string) {
  await deleteCostEstimate(id)
  redirect(`/projects/${projectId}`)
}
