'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { reviewApproval } from '@/app/actions/approvals'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface ReviewFormProps {
  approvalId: string
  approverIndex: number
  totalApprovers: number
}

export function ReviewForm({ approvalId, approverIndex, totalApprovers }: ReviewFormProps) {
  const router = useRouter()
  const [isProcessing, setIsProcessing] = useState(false)
  const [comments, setComments] = useState('')
  const [showForm, setShowForm] = useState(false)

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    setIsProcessing(true)
    try {
      await reviewApproval(approvalId, action, comments || undefined)
      router.refresh()
    } catch (error) {
      console.error('Review failed:', error)
      alert('결재 처리 실패')
    } finally {
      setIsProcessing(false)
      setShowForm(false)
    }
  }

  if (!showForm) {
    return (
      <div className="flex gap-2">
        <Button onClick={() => setShowForm(true)}>
          결재 처리
        </Button>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-start">
      <div className="flex-1">
        <Textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder="코멘트 (선택)"
          rows={2}
          className="mb-2"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleReview('REJECT')}
            disabled={isProcessing}
          >
            반려
          </Button>
          <Button
            onClick={() => handleReview('APPROVE')}
            disabled={isProcessing}
          >
            승인
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowForm(false)}
            disabled={isProcessing}
          >
            취소
          </Button>
        </div>
      </div>
    </div>
  )
}
