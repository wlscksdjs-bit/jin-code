'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { convertWonToProject } from '@/app/actions/sales'
import { Briefcase } from 'lucide-react'

interface ConvertButtonProps {
  salesId: string
  projectId: string | null
  disabled?: boolean
}

export function ConvertToProjectButton({ salesId, projectId, disabled }: ConvertButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleConvert() {
    if (!confirm('수주건을 프로젝트로 전환하시겠습니까?\n\n프로젝트와 초기 예산이 자동 생성됩니다.')) {
      return
    }

    setLoading(true)
    try {
      const result = await convertWonToProject(salesId)
      if (result.success) {
        alert('프로젝트가 생성되었습니다.')
        router.push(`/projects/${result.projectId}`)
        router.refresh()
      } else {
        alert(result.error || '오류가 발생했습니다.')
      }
    } catch (err) {
      alert('오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (projectId) {
    return (
      <Button variant="outline" disabled>
        프로젝트 연결됨
      </Button>
    )
  }

  return (
    <Button 
      variant="outline" 
      onClick={handleConvert} 
      disabled={loading || disabled}
    >
      <Briefcase className="w-4 h-4 mr-2" />
      {loading ? '전환 중...' : '프로젝트로 전환'}
    </Button>
  )
}
