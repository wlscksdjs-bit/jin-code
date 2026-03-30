'use server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
const approvalSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['INTERNAL_COST', 'EXTERNAL_PAYMENT', 'CUSTOMER_CLAIM']),
  content: z.string().optional(),
  amount: z.number().default(0),
  projectId: z.string().optional(),
  vendorId: z.string().optional(),
  approverIds: z.array(z.string()),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().default(1),
    unitPrice: z.number().default(0),
    totalPrice: z.number().default(0),
    costCategoryId: z.string().optional(),
  })),
})
export type ApprovalWithDetails = Awaited<ReturnType<typeof listApprovals>>[number]
// 결재 목록 조회
export async function listApprovals(status?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const where = status && status !== 'ALL' 
    ? { status } 
    : {}
  return prisma.approval.findMany({
    where,
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, code: true } },
      vendor: { select: { id: true, name: true, code: true } },
      approvers: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { order: 'asc' },
      },
      lineItems: { include: { costCategory: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}
// 내 결재 목록 조회
export async function listMyApprovals() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.approval.findMany({
    where: { submitterId: session.user.id },
    include: {
      project: { select: { id: true, name: true, code: true } },
      vendor: { select: { id: true, name: true, code: true } },
      approvers: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { order: 'asc' },
      },
      lineItems: true,
    },
    orderBy: { createdAt: 'desc' },
  })
}
// 검토할 결재 목록 (내가 결재자인 것)
export async function listPendingApprovalsForReview() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const approvals = await prisma.approval.findMany({
    where: {
      status: { in: ['SUBMITTED', 'REVIEWING'] },
      approvers: {
        some: {
          userId: session.user.id,
          status: 'PENDING',
        },
      },
    },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, code: true } },
      vendor: { select: { id: true, name: true, code: true } },
      approvers: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { order: 'asc' },
      },
      lineItems: true,
    },
    orderBy: { submittedAt: 'asc' },
  })
  return approvals
}
// 단일 결재 조회
export async function getApproval(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  return prisma.approval.findUnique({
    where: { id },
    include: {
      submitter: { select: { id: true, name: true, email: true } },
      project: { select: { id: true, name: true, code: true } },
      vendor: { select: { id: true, name: true, code: true } },
      approvers: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { order: 'asc' },
      },
      lineItems: { include: { costCategory: true } },
    },
  })
}
export async function createApproval(data: z.infer<typeof approvalSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const parsed = approvalSchema.parse(data)
  const totalAmount = parsed.lineItems.reduce((sum, item) => sum + item.totalPrice, 0) || parsed.amount
  const approval = await prisma.approval.create({
    data: {
      title: parsed.title,
      type: parsed.type,
      content: parsed.content,
      amount: totalAmount,
      status: 'DRAFT',
      submitterId: session.user.id,
      projectId: parsed.projectId,
      vendorId: parsed.vendorId,
      approvers: {
        create: parsed.approverIds.map((userId, index) => ({
          userId,
          order: index,
          status: 'PENDING',
        })),
      },
      lineItems: {
        create: parsed.lineItems.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          costCategoryId: item.costCategoryId,
        })),
      },
    },
    include: {
      submitter: { select: { id: true, name: true } },
      approvers: true,
      lineItems: true,
    },
  })
  revalidatePath('/approvals')
  return approval
}
export async function updateApproval(id: string, data: Partial<z.infer<typeof approvalSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const approval = await prisma.approval.findUnique({ where: { id } })
  if (!approval) throw new Error('Not found')
  if (approval.submitterId !== session.user.id) throw new Error('Forbidden')
  if (approval.status !== 'DRAFT') throw new Error('Cannot update after submission')
  const parsed = approvalSchema.partial().parse(data)
  // 기존 lineItems 삭제 후 재생성
  if (parsed.lineItems) {
    await prisma.approvalLineItem.deleteMany({ where: { approvalId: id } })
  }
  // 기존 approvers 삭제 후 재생성
  if (parsed.approverIds) {
    await prisma.approvalApprover.deleteMany({ where: { approvalId: id } })
  }
  const totalAmount = parsed.lineItems?.reduce((sum, item) => sum + item.totalPrice, 0) ?? approval.amount
  const updated = await prisma.approval.update({
    where: { id },
    data: {
      ...(parsed.title && { title: parsed.title }),
      ...(parsed.type && { type: parsed.type }),
      ...(parsed.content !== undefined && { content: parsed.content }),
      amount: totalAmount,
      ...(parsed.projectId !== undefined && { projectId: parsed.projectId }),
      ...(parsed.vendorId !== undefined && { vendorId: parsed.vendorId }),
      ...(parsed.approverIds && {
        approvers: {
          create: parsed.approverIds.map((userId, index) => ({
            userId,
            order: index,
            status: 'PENDING',
          })),
        },
      }),
      ...(parsed.lineItems && {
        lineItems: {
          create: parsed.lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            costCategoryId: item.costCategoryId,
          })),
        },
      }),
    },
    include: {
      submitter: { select: { id: true, name: true } },
      approvers: true,
      lineItems: true,
    },
  })
  revalidatePath('/approvals')
  return updated
}
export async function submitApproval(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const approval = await prisma.approval.findUnique({ 
    where: { id },
    include: { approvers: true },
  })
  if (!approval) throw new Error('Not found')
  if (approval.submitterId !== session.user.id) throw new Error('Forbidden')
  if (approval.status !== 'DRAFT') throw new Error('Already submitted')
  if (approval.approvers.length === 0) throw new Error('No approvers')
  const updated = await prisma.approval.update({
    where: { id },
    data: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
  })
  revalidatePath('/approvals')
  return updated
}
export async function reviewApproval(id: string, action: 'APPROVE' | 'REJECT', comments?: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const approval = await prisma.approval.findUnique({
    where: { id },
    include: { approvers: { orderBy: { order: 'asc' } } },
  })
  if (!approval) throw new Error('Not found')
  // 현재 사용자가 결재자인지 확인
  const currentApprover = approval.approvers.find(a => a.userId === session.user.id)
  if (!currentApprover) throw new Error('Not authorized to review')
  if (currentApprover.status !== 'PENDING') throw new Error('Already reviewed')
  await prisma.approvalApprover.update({
    where: { id: currentApprover.id },
    data: {
      status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      comments,
      approvedAt: new Date(),
    },
  })
  // 모든 결재자 승인 여부 확인
  const allApprovers = await prisma.approvalApprover.findMany({
    where: { approvalId: id },
    orderBy: { order: 'asc' },
  })
  const pendingApprovers = allApprovers.filter(a => a.status === 'PENDING')
  const rejectedApprovers = allApprovers.filter(a => a.status === 'REJECTED')
  let newStatus = approval.status
  if (action === 'REJECT') {
    newStatus = 'REJECTED'
  } else if (pendingApprovers.length > 0) {
    newStatus = 'REVIEWING'
  } else {
    // 모두 승인했으면 최종 승인
    newStatus = 'APPROVED'
    
    // ★★★ 핵심 트리거: 외주 협력사 기성 지급 품의 승인 시 원가 데이터 업데이트
    if (approval.type === 'EXTERNAL_PAYMENT' && approval.vendorId && approval.projectId) {
      await handleExternalPaymentApproval(approval.id, approval.projectId, approval.vendorId, approval.amount)
    }
  }
  await prisma.approval.update({
    where: { id },
    data: {
      status: newStatus,
      ...(newStatus === 'APPROVED' && { approvedAt: new Date() }),
    },
  })
  revalidatePath('/approvals')
  return { success: true, status: newStatus }
}
// 외주 협력사 기성 지급 승인 시 원가 업데이트 트리거
async function handleExternalPaymentApproval(approvalId: string, projectId: string, vendorId: string, amount: number) {
  // 가장 최근 실행원가 조회
  const latestExecution = await prisma.costExecution.findFirst({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
  if (latestExecution) {
    // 이 금액을 기사용금액에 추가 (실행원가의AccumulatedActual 업데이트)
    // 여기서는 간단하게 이 결재 금액을 기록하는 것으로 함
    await prisma.costActual.create({
      data: {
        projectId,
        executionId: latestExecution.id,
        type: 'VENDOR_PAYMENT',
        amount,
        vendorId,
        status: 'APPROVED',
        approvalId,
        description: `외주 기성 지급 (결재 승인)`,
        actualDate: new Date(),
      },
    })
  }
}
export async function deleteApproval(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  const approval = await prisma.approval.findUnique({ where: { id } })
  if (!approval) throw new Error('Not found')
  if (approval.submitterId !== session.user.id) throw new Error('Forbidden')
  if (approval.status !== 'DRAFT') throw new Error('Cannot delete after submission')
  await prisma.approval.delete({ where: { id } })
  revalidatePath('/approvals')
  return { success: true }
}
// 결재 유형 목록
export const APPROVAL_TYPES = [
  { value: 'INTERNAL_COST', label: '당월 현장/본사 비용 내부 품의' },
  { value: 'EXTERNAL_PAYMENT', label: '외주 협력사 기성 지급 품의' },
  { value: 'CUSTOMER_CLAIM', label: '고객사 대금 청구 품의' },
] as const
export const APPROVAL_STATUSES = [
  { value: 'DRAFT', label: '임시저장', color: 'secondary' },
  { value: 'SUBMITTED', label: '결재 상신', color: 'outline' },
  { value: 'REVIEWING', label: '검토중', color: 'warning' },
  { value: 'APPROVED', label: '최종 승인완료', color: 'success' },
  { value: 'REJECTED', label: '반려', color: 'destructive' },
] as const
