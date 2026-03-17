'use client'

import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { printProject } from '@/lib/export'

interface ProjectPrintButtonProps {
  project: {
    code: string
    name: string
    status: string
    type: string
    contractAmount?: number | null
    estimatedBudget?: number | null
    startDate?: Date | string | null
    endDate?: Date | string | null
    location?: string | null
    address?: string | null
    description?: string | null
    customer?: { name?: string | null } | null
    contractType?: string | null
  }
}

export function ProjectPrintButton({ project }: ProjectPrintButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => printProject(project)}
      title="인쇄"
    >
      <Printer className="w-4 h-4 mr-2" />
      인쇄
    </Button>
  )
}
