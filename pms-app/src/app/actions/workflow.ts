'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { broadcast } from '@/lib/sse-broadcast'

// Phase 순서 정의
const PHASE_ORDER = ['BIDDING', 'CONTRACT', 'DESIGN', 'PROCUREMENT', 'CONSTRUCTION', 'COMPLETED']

// 유효한 단계 전환 매핑
const VALID_TRANSITIONS: Record<string, string[]> = {
  BIDDING: ['CONTRACT'],
  CONTRACT: ['DESIGN'],
  DESIGN: ['PROCUREMENT'],
  PROCUREMENT: ['CONSTRUCTION'],
  CONSTRUCTION: ['COMPLETED'],
  COMPLETED: [],
}

// 상태 코드 → Project 상태 매핑
const STATUS_MAP: Record<string, string> = {
  CONTRACT: 'CONTRACT',
  DESIGN: 'DESIGN',
  PROCUREMENT: 'CONSTRUCTION',
  CONSTRUCTION: 'CONSTRUCTION',
  COMPLETED: 'COMPLETED',
}

// 마일스톤 타입 → 마일스톤 유형 매핑
const MILESTONE_MAP: Record<string, string | undefined> = {
  CONTRACT: 'CONTRACT',
  DESIGN: 'DESIGN_COMPLETE',
  PROCUREMENT: 'PROCUREMENT_COMPLETE',
  CONSTRUCTION: 'CONSTRUCTION_START',
  COMPLETED: 'CONSTRUCTION_COMPLETE',
}

export interface ConfirmContractOptions {
  createProject?: boolean
  createCostEstimate?: boolean
  projectData?: {
    name?: string
    type?: string
    startDate?: Date
    endDate?: Date
  }
}

export interface ConfirmContractResult {
  success: boolean
  salesId: string
  projectId?: string
  workflowId?: string
  milestonesCreated?: number
  message?: string
}

export async function confirmContract(
  salesId: string,
  options: ConfirmContractOptions = {}
): Promise<ConfirmContractResult> {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다. 다시 로그인해주세요.')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    throw new Error('수주 확정은 ADMIN 또는 PM 역할만 가능합니다.')
  }

  const sales = await prisma.sales.findUnique({
    where: { id: salesId },
    include: { customer: true, project: true },
  })

  if (!sales) {
    throw new Error('해당 입찰/계약 정보를 찾을 수 없습니다.')
  }

  const confirmableStatuses = ['DRAFT', 'SUBMITTED', 'EVALUATING']
  if (!confirmableStatuses.includes(sales.status)) {
    throw new Error(`현재 상태(${sales.status})에서는 수주 확정이 불가능합니다.`)
  }

  if (sales.status === 'WON' || sales.bidResult === 'WON') {
    throw new Error('이미 수주된 건입니다.')
  }

  let projectId = sales.projectId

  if (projectId && options.projectData) {
    await prisma.project.update({
      where: { id: projectId },
      data: {
        name: options.projectData.name || sales.title,
        type: options.projectData.type || 'ENVIRONMENT',
        status: 'CONTRACT',
        contractDate: sales.contractDate || new Date(),
        contractAmount: sales.contractAmount,
        startDate: options.projectData.startDate,
        endDate: options.projectData.endDate,
      },
    })
  } else if (!projectId && options.createProject) {
    const projectCode = `PJT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`
    const project = await prisma.project.create({
      data: {
        code: projectCode,
        name: options.projectData?.name || sales.title,
        type: options.projectData?.type || 'ENVIRONMENT',
        status: 'CONTRACT',
        contractType: sales.type === 'CONTRACT' ? '수주' : '용역',
        contractAmount: sales.contractAmount,
        contractDate: sales.contractDate || new Date(),
        customerId: sales.customerId,
        startDate: options.projectData?.startDate || sales.contractDate || new Date(),
        endDate: options.projectData?.endDate,
        sales: { connect: { id: salesId } },
      },
    })
    projectId = project.id

    await prisma.sales.update({
      where: { id: salesId },
      data: { projectId: project.id },
    })
  }

  let milestonesCreated = 0
  if (projectId) {
    milestonesCreated = await createDefaultMilestones(projectId, sales.contractDate)
  }

  let workflowId: string | undefined
  if (projectId) {
    const startDate = options.projectData?.startDate || sales.contractDate || new Date()

    const workflow = await prisma.projectWorkflow.upsert({
      where: { projectId },
      create: {
        projectId,
        currentPhase: 'CONTRACT',
        status: 'ACTIVE',
        salesId,
        currentPhaseStart: startDate,
      },
      update: {
        salesId,
        currentPhase: 'CONTRACT',
        status: 'ACTIVE',
        currentPhaseStart: startDate,
      },
    })
    workflowId = workflow.id
  }

  await prisma.sales.update({
    where: { id: salesId },
    data: {
      status: 'WON',
      bidResult: 'WON',
      resultDate: new Date(),
      contractAmount: sales.contractAmount ?? undefined,
    },
  })

  await prisma.notification.create({
    data: {
      type: 'PROJECT_UPDATE',
      title: '수주 확정',
      message: `"${sales.title}" 프로젝트가 수주 확정되었습니다.`,
      userId: session.user.id,
      link: projectId ? `/projects/${projectId}` : `/sales/${salesId}`,
    },
  })

  revalidatePath('/sales')
  revalidatePath('/projects')
  if (projectId) {
    revalidatePath(`/projects/${projectId}`)
    broadcast('global', { type: 'PROJECT_UPDATED', projectId })
  }

  return {
    success: true,
    salesId,
    projectId: projectId ?? undefined,
    workflowId,
    milestonesCreated,
    message: `수주가 확정되었습니다.${milestonesCreated > 0 ? ` ${milestonesCreated}개의 마일스톤이 생성되었습니다.` : ''}`,
  }

  return {
    success: true,
    salesId,
    projectId: projectId ?? undefined,
    workflowId,
    milestonesCreated,
    message: `수주가 확정되었습니다.${milestonesCreated > 0 ? ` ${milestonesCreated}개의 마일스톤이 생성되었습니다.` : ''}`,
  }
}

export interface TransitionPhaseOptions {
  notes?: string
}

export interface TransitionPhaseResult {
  success: boolean
  projectId: string
  previousPhase: string
  newPhase: string
  message: string
}

export async function transitionPhase(
  projectId: string,
  newPhase: string,
  options: TransitionPhaseOptions = {}
): Promise<TransitionPhaseResult> {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    throw new Error('단계 전환은 ADMIN 또는 PM 역할만 가능합니다.')
  }

  if (!PHASE_ORDER.includes(newPhase)) {
    throw new Error(`유효하지 않은 단계입니다: ${newPhase}`)
  }

  const workflow = await prisma.projectWorkflow.findUnique({
    where: { projectId },
    include: { project: true },
  })

  if (!workflow) {
    throw new Error('프로젝트 워크플로우가 존재하지 않습니다.')
  }

  const currentPhase = workflow.currentPhase
  const allowedNextPhases = VALID_TRANSITIONS[currentPhase] || []

  if (!allowedNextPhases.includes(newPhase)) {
    throw new Error(`${currentPhase} 단계에서 ${newPhase} 단계로 전환할 수 없습니다.`)
  }

  await prisma.$transaction(async (tx) => {
    await tx.projectWorkflow.update({
      where: { projectId },
      data: {
        currentPhase: newPhase,
        currentPhaseStart: new Date(),
        currentPhaseEnd: new Date(),
        status: newPhase === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
        notes: options.notes ?? undefined,
      },
    })

    await tx.project.update({
      where: { id: projectId },
      data: {
        status: STATUS_MAP[newPhase] || 'REGISTERED',
        endDate: newPhase === 'COMPLETED' ? new Date() : undefined,
      },
    })

    const targetMilestoneType = MILESTONE_MAP[newPhase]
    if (targetMilestoneType) {
      await tx.wbsItem.updateMany({
        where: {
          projectId,
          milestoneType: targetMilestoneType,
          isMilestone: true,
          status: { not: 'COMPLETED' },
        },
        data: {
          status: 'COMPLETED',
          progress: 100,
        },
      })
    }

    if (newPhase === 'COMPLETED') {
      await tx.wbsItem.updateMany({
        where: {
          projectId,
          status: { not: 'COMPLETED' },
        },
        data: {
          status: 'COMPLETED',
          progress: 100,
        },
      })
    }
  })

  await prisma.notification.create({
    data: {
      type: 'PROJECT_UPDATE',
      title: '프로젝트 단계 전환',
      message: `"${workflow.project.name}" 프로젝트가 ${currentPhase} → ${newPhase} 단계로 전환되었습니다.`,
      userId: session.user.id,
      link: `/projects/${projectId}`,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')

  broadcast('global', { type: 'PROJECT_PHASE_CHANGED', projectId, previousPhase: currentPhase, newPhase })

  return {
    success: true,
    projectId,
    previousPhase: currentPhase,
    newPhase,
    message: `프로젝트가 ${newPhase} 단계로 전환되었습니다.`,
  }
}

export async function getProjectWorkflow(projectId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  const workflow = await prisma.projectWorkflow.findUnique({
    where: { projectId },
    include: {
      project: {
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          contractAmount: true,
        },
      },
    },
  })

  if (!workflow) {
    return null
  }

  const currentIndex = PHASE_ORDER.indexOf(workflow.currentPhase)
  const progress = Math.round((currentIndex / (PHASE_ORDER.length - 1)) * 100)
  const nextPhases = VALID_TRANSITIONS[workflow.currentPhase] || []

  return {
    ...workflow,
    progress,
    nextPhases,
    phaseOrder: PHASE_ORDER,
  }
}

export async function setWorkflowStatus(
  projectId: string,
  status: 'ACTIVE' | 'ON_HOLD' | 'CANCELLED'
) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('인증되지 않았습니다.')
  }

  if (session.user.role !== 'ADMIN' && session.user.role !== 'PM') {
    throw new Error('권한이 없습니다.')
  }

  const workflow = await prisma.projectWorkflow.findUnique({
    where: { projectId },
    include: { project: true },
  })

  if (!workflow) {
    throw new Error('워크플로우가 존재하지 않습니다.')
  }

  await prisma.$transaction([
    prisma.projectWorkflow.update({
      where: { projectId },
      data: { status },
    }),
    prisma.project.update({
      where: { id: projectId },
      data: {
        status: status === 'CANCELLED' ? 'CANCELLED' : workflow.project.status,
      },
    }),
  ])

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')

  return {
    success: true,
    projectId,
    status,
  }
}

async function createDefaultMilestones(projectId: string, contractDate?: Date | null): Promise<number> {
  const startDate = contractDate ? new Date(contractDate) : new Date()

  const existingMilestones = await prisma.wbsItem.count({
    where: {
      projectId,
      isMilestone: true,
    },
  })

  if (existingMilestones > 0) {
    return 0
  }

  const milestoneTemplates = [
    { code: 'M0', name: '프로젝트 시작', milestoneType: 'PROJECT_START', phaseType: 'PLANNING', days: 0 },
    { code: 'M1', name: '계약 체결', milestoneType: 'CONTRACT', phaseType: 'PLANNING', days: 7 },
    { code: 'M2', name: '설계 완료', milestoneType: 'DESIGN_COMPLETE', phaseType: 'DESIGN', days: 90 },
    { code: 'M3', name: '구매 완료', milestoneType: 'PROCUREMENT_COMPLETE', phaseType: 'PROCUREMENT', days: 150 },
    { code: 'M4', name: '시공 시작', milestoneType: 'CONSTRUCTION_START', phaseType: 'CONSTRUCTION', days: 160 },
    { code: 'M5', name: '시공 완료', milestoneType: 'CONSTRUCTION_COMPLETE', phaseType: 'CONSTRUCTION', days: 280 },
    { code: 'M6', name: '시운전', milestoneType: 'COMMISSIONING', phaseType: 'COMMISSIONING', days: 330 },
    { code: 'M7', name: '인수인계', milestoneType: 'HANDOVER', phaseType: 'HANDOVER', days: 365 },
  ]

  const milestones = milestoneTemplates.map((m) => {
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + m.days)
    return {
      projectId,
      code: m.code,
      name: m.name,
      isMilestone: true,
      milestoneType: m.milestoneType,
      phaseType: m.phaseType,
      startDate: endDate,
      endDate,
      status: 'PENDING',
      progress: 0,
    }
  })

  await prisma.wbsItem.createMany({
    data: milestones,
  })

  return milestones.length
}
