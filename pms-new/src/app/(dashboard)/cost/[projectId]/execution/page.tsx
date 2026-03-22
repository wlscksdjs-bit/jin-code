import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { CostExecutionForm } from './CostExecutionForm'

export default async function CostExecutionPage({ params }: { params: Promise<{ projectId: string; id?: string }> }) {
  const session = await auth()
  if (!session) redirect('/signin')

  const { projectId, id } = await params

  return <CostExecutionForm projectId={projectId} id={id} />
}
