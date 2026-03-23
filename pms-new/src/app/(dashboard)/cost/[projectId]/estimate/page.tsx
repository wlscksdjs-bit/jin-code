import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getProject, getCostEstimate } from '@/app/actions/projects'
import { CostEstimateForm } from './CostEstimateForm'

export default async function CostEstimateFormPage({ params }: { params: Promise<{ projectId: string; id?: string }> }) {
  const session = await auth()
  if (!session) redirect('/signin')
  
  const { projectId, id } = await params
  const project = await getProject(projectId)
  if (!project) notFound()

  let existing: Record<string, unknown> | undefined
  if (id) {
    existing = await getCostEstimate(id) as Record<string, unknown> | undefined
  }

  return <CostEstimateForm projectId={projectId} projectName={project.name} id={id} existing={existing} />
}
