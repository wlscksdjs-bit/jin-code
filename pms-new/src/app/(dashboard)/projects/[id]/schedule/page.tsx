'use client'
import { notFound } from 'next/navigation'
import { getProject } from '@/app/actions/projects'
import { calculateCPM } from '@/app/actions/wbs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GanttChart } from '@/components/gantt-chart'

export default async function SchedulePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const project = await getProject(id)
  if (!project) notFound()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">간트차트</h1>
        <p className="text-sm text-gray-500">{project.name}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>일정 간트차트</CardTitle></CardHeader>
        <CardContent>
          <GanttChart projectId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
