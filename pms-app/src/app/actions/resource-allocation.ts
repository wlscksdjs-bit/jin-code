'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addProjectMember(projectId: string, userId: string, role: string = 'MEMBER', allocation: number = 1.0) {
  const currentAllocation = await prisma.projectMember.aggregate({
    where: { userId },
    _sum: { allocation: true }
  })

  const newTotalAllocation = (currentAllocation._sum.allocation || 0) + allocation
  
  if (newTotalAllocation > 1.0) {
    const maxAvailable = Math.max(0, 1.0 - (currentAllocation._sum.allocation || 0))
    return { error: `총 투입 비율이 100%를 초과합니다. (현재: ${Math.round((currentAllocation._sum.allocation || 0) * 100)}%, 추가 가능: ${Math.round(maxAvailable * 100)}%)` }
  }

  try {
    await prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role,
        allocation
      }
    })
    revalidatePath(`/projects/${projectId}`)
    return { success: true }
  } catch (e) {
    return { error: '이미 프로젝트에 배정된 인원입니다.' }
  }
}

export async function updateMemberAllocation(projectId: string, memberId: string, allocation: number) {
  if (allocation < 0 || allocation > 1.0) {
    return { error: '투입 비율은 0%에서 100% 사이여야 합니다.' }
  }

  const member = await prisma.projectMember.findUnique({
    where: { id: memberId }
  })

  if (!member) {
    return { error: '멤버를 찾을 수 없습니다.' }
  }

  const currentAllocation = await prisma.projectMember.aggregate({
    where: { userId: member.userId },
    _sum: { allocation: true }
  })

  const newTotalAllocation = (currentAllocation._sum.allocation || 0) - member.allocation + allocation

  if (newTotalAllocation > 1.0) {
    return { error: `총 투입 비율이 100%를 초과합니다. (현재: ${Math.round((currentAllocation._sum.allocation || 0) * 100)}%)` }
  }

  await prisma.projectMember.update({
    where: { id: memberId },
    data: { allocation }
  })

  revalidatePath(`/projects/${projectId}`)
  return { success: true }
}

export async function removeProjectMember(projectId: string, memberId: string) {
  await prisma.projectMember.delete({
    where: { id: memberId }
  })

  revalidatePath(`/projects/${projectId}`)
}
