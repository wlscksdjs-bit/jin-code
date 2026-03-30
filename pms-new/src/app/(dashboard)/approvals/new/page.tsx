'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createApproval } from '@/app/actions/approvals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

const APPROVAL_TYPES = [
  { value: 'INTERNAL_COST', label: '당월 현장/본사 비용 내부 품의' },
  { value: 'EXTERNAL_PAYMENT', label: '외주 협력사 기성 지급 품의' },
  { value: 'CUSTOMER_CLAIM', label: '고객사 대금 청구 품의' },
]

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export default function NewApprovalPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    type: 'INTERNAL_COST' as string,
    content: '',
    projectId: '',
    vendorId: '',
  })
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
  ])
  const [approverIds, setApproverIds] = useState<string[]>([])

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string | number) => {
    const newItems = [...lineItems]
    newItems[index] = { ...newItems[index], [field]: value }
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice
    }
    setLineItems(newItems)
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }])
  }

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + item.totalPrice, 0)

  const handleSubmit = async (action: 'save' | 'submit') => {
    setIsSubmitting(true)
    try {
      const validLineItems = lineItems.filter(item => item.description && item.totalPrice > 0)
      
      const approval = await createApproval({
        title: formData.title,
        type: formData.type as 'INTERNAL_COST' | 'EXTERNAL_PAYMENT' | 'CUSTOMER_CLAIM',
        content: formData.content || undefined,
        amount: totalAmount,
        projectId: formData.projectId || undefined,
        vendorId: formData.vendorId || undefined,
        approverIds: approverIds.length > 0 ? approverIds : ['user_demo_id'],
        lineItems: validLineItems,
      })

      if (action === 'submit' && approval) {
        router.push(`/approvals/${approval.id}`)
      } else {
        router.push('/approvals')
      }
    } catch (error) {
      console.error('Failed to create approval:', error)
      alert('결재 생성에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 결재 작성</h1>
        <p className="text-sm text-gray-500">결재 내용을 입력하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="결재 제목"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="type">결재 유형</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVAL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="content">상세 내용</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="결재 상세 내용"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>프로젝트</Label>
              <Input
                value={formData.projectId}
                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                placeholder="프로젝트 ID (선택)"
              />
            </div>
            <div className="grid gap-2">
              <Label>협력사</Label>
              <Input
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                placeholder="협력사 ID (선택)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>결재 항목</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
              + 항목 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="grid grid-cols-12 gap-2 text-sm font-medium text-gray-500">
              <div className="col-span-5">항목</div>
              <div className="col-span-2">수량</div>
              <div className="col-span-2">단가</div>
              <div className="col-span-2">금액</div>
              <div className="col-span-1"></div>
            </div>
            {lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                <Input
                  className="col-span-5"
                  value={item.description}
                  onChange={(e) => handleLineItemChange(index, 'description', e.target.value)}
                  placeholder="항목명"
                />
                <Input
                  className="col-span-2"
                  type="number"
                  value={item.quantity}
                  onChange={(e) => handleLineItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                />
                <Input
                  className="col-span-2"
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => handleLineItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                />
                <div className="col-span-2 text-right font-medium">
                  {item.totalPrice.toLocaleString('ko-KR')}원
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeLineItem(index)}
                  disabled={lineItems.length === 1}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4 text-right font-bold text-lg">
            총액: {totalAmount.toLocaleString('ko-KR')}원
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => handleSubmit('save')} disabled={isSubmitting}>
          임시저장
        </Button>
        <Button onClick={() => handleSubmit('submit')} disabled={isSubmitting || !formData.title}>
          결재 상신
        </Button>
      </div>
    </div>
  )
}
