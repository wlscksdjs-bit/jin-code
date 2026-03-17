'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { confirmContract, ConfirmContractOptions } from '@/app/actions/workflow'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Calendar } from 'lucide-react'

interface ConfirmContractButtonProps {
  salesId: string
  salesTitle: string
  contractAmount?: number | null
}

export function ConfirmContractButton({ salesId, salesTitle, contractAmount }: ConfirmContractButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<ConfirmContractOptions>({
    createProject: true,
  })

  async function handleConfirm() {
    setLoading(true)
    try {
      const result = await confirmContract(salesId, options)
      if (result.success) {
        alert(result.message || '수주가 확정되었습니다.')
        setOpen(false)
        router.push(`/projects/${result.projectId}`)
        router.refresh()
      } else {
        alert(result.message || '오류가 발생했습니다.')
      }
    } catch (err: any) {
      alert(err.message || '오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <CheckCircle className="w-4 h-4 mr-2" />
          수주 확정
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>수주 확정</DialogTitle>
          <DialogDescription>
            &quot;{salesTitle}&quot; 건을 수주 확정 처리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-800">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">수주 확정이후:</span>
            </div>
            <ul className="mt-2 text-sm text-green-700 space-y-1">
              <li>• 영업 상태가 &quot;수주&quot;로 변경됩니다</li>
              <li>• 연결된 프로젝트가 있으면 업데이트됩니다</li>
              <li>• 프로젝트 단계가 &quot;계약&quot;으로 설정됩니다</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={options.createProject}
                  onChange={(e) => setOptions(prev => ({ ...prev, createProject: e.target.checked }))}
                  className="w-4 h-4"
                />
                <span>프로젝트 자동 생성</span>
              </label>
            </div>

            {options.createProject && (
              <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium text-slate-700">생성 될 내용:</div>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• 프로젝트 코드: PJT-{new Date().getFullYear()}-XXXX</li>
                  <li>• 프로젝트명: {salesTitle}</li>
                  <li>• 계약금액: {contractAmount?.toLocaleString() || 0}원</li>
                </ul>
                <div className="border-t pt-3 mt-3">
                  <div className="text-sm font-medium text-slate-700 mb-2">기본 마일스톤 자동 생성:</div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <span>• 프로젝트 시작</span>
                    <span>• 계약 체결</span>
                    <span>• 설계 완료</span>
                    <span>• 구매 완료</span>
                    <span>• 시공 시작</span>
                    <span>• 시공 완료</span>
                    <span>• 시운전</span>
                    <span>• 인수인계</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            취소
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? '처리 중...' : '수주 확정'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
