'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import * as XLSX from 'xlsx'
import { z } from 'zod'

const waitingProjectSchema = z.object({
  title: z.string().min(1),
  bidNumber: z.string().optional(),
  customerId: z.string().optional(),
  bidAmount: z.number().default(0),
  maxNegoAmount: z.number().default(0),
  progress: z.number().default(0),
  submissionDate: z.string().optional(),
  contractDate: z.string().optional(),
  laborCost: z.number().default(0),
  materialCost: z.number().default(0),
  outsourceCost: z.number().default(0),
  equipmentCost: z.number().default(0),
  otherCost: z.number().default(0),
  indirectCostRate: z.number().default(5.5),
  sellingAdminRate: z.number().default(12.3),
  notes: z.string().optional(),
})

export type WaitingProject = Awaited<ReturnType<typeof listWaitingProjects>>[number]

export async function listWaitingProjects() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.sales.findMany({
    where: {
      status: { in: ['WAITING', 'IN_PROGRESS', 'COMPLETED', 'DRAFT', 'SUBMITTED', 'EVALUATING'] },
    },
    include: { 
      customer: true, 
      project: true,
      costEstimates: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { submissionDate: 'asc' },
  })
}

export async function getWaitingProject(id: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  return prisma.sales.findUnique({
    where: { id },
    include: { 
      customer: true, 
      project: true,
      costEstimates: { orderBy: { createdAt: 'desc' } },
    },
  })
}

export async function createWaitingProject(data: z.infer<typeof waitingProjectSchema>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = waitingProjectSchema.parse(data)
  
  // Calculate manufacturing cost
  const directCost = parsed.laborCost + parsed.materialCost + parsed.outsourceCost + parsed.equipmentCost + parsed.otherCost
  const indirectCost = directCost * (parsed.indirectCostRate / 100)
  const manufacturingCost = directCost + indirectCost
  const sellingAdminCost = parsed.bidAmount * (parsed.sellingAdminRate / 100)
  const totalCost = manufacturingCost + sellingAdminCost

  const sales = await prisma.sales.create({
    data: {
      type: 'BIDDING',
      status: 'WAITING',
      title: parsed.title,
      bidNumber: parsed.bidNumber,
      customerId: parsed.customerId,
      bidAmount: parsed.bidAmount,
      winProbability: parsed.progress / 100,
      submissionDate: parsed.submissionDate ? new Date(parsed.submissionDate) : null,
      contractDate: parsed.contractDate ? new Date(parsed.contractDate) : null,
      laborCost: parsed.laborCost,
      materialCost: parsed.materialCost,
      outsourceCost: parsed.outsourceCost,
      equipmentCost: parsed.equipmentCost,
      otherCost: parsed.otherCost,
      executionCost: totalCost,
      notes: parsed.notes,
    },
    include: { customer: true },
  })

  revalidatePath('/sales/waiting')
  return sales
}

export async function updateWaitingProject(id: string, data: Partial<z.infer<typeof waitingProjectSchema>>) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const parsed = waitingProjectSchema.partial().parse(data)
  
  // Recalculate costs if amounts provided
  let directCost = 0
  let totalCost = 0
  let executionCost = 0
  
  if (parsed.bidAmount !== undefined || parsed.laborCost !== undefined) {
    const project = await prisma.sales.findUnique({ where: { id } })
    const bidAmount = parsed.bidAmount ?? project?.bidAmount ?? 0
    const laborCost = parsed.laborCost ?? project?.laborCost ?? 0
    const materialCost = parsed.materialCost ?? project?.materialCost ?? 0
    const outsourceCost = parsed.outsourceCost ?? project?.outsourceCost ?? 0
    const equipmentCost = parsed.equipmentCost ?? project?.equipmentCost ?? 0
    const otherCost = parsed.otherCost ?? project?.otherCost ?? 0
    const indirectCostRate = parsed.indirectCostRate ?? 5.5
    const sellingAdminRate = parsed.sellingAdminRate ?? 12.3

    directCost = laborCost + materialCost + outsourceCost + equipmentCost + otherCost
    const indirectCost = directCost * (indirectCostRate / 100)
    const manufacturingCost = directCost + indirectCost
    const sellingAdminCost = bidAmount * (sellingAdminRate / 100)
    totalCost = manufacturingCost + sellingAdminCost
    executionCost = totalCost
  }

  const sales = await prisma.sales.update({
    where: { id },
    data: {
      ...parsed,
      bidAmount: parsed.bidAmount,
      winProbability: parsed.progress !== undefined ? parsed.progress / 100 : undefined,
      submissionDate: parsed.submissionDate ? new Date(parsed.submissionDate) : undefined,
      contractDate: parsed.contractDate ? new Date(parsed.contractDate) : undefined,
      laborCost: parsed.laborCost,
      materialCost: parsed.materialCost,
      outsourceCost: parsed.outsourceCost,
      equipmentCost: parsed.equipmentCost,
      otherCost: parsed.otherCost,
      executionCost: executionCost || undefined,
    },
    include: { customer: true },
  })

  revalidatePath('/sales/waiting')
  return sales
}

export async function confirmContract(salesId: string, projectData: { 
  code: string; 
  name: string; 
  contractAmount: number; 
  startDate: string; 
  endDate: string 
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const sales = await prisma.sales.findUnique({ where: { id: salesId } })
  if (!sales) throw new Error('Not found')

  // Create project with CONTRACT status
  const project = await prisma.project.create({
    data: {
      code: projectData.code,
      name: projectData.name,
      contractAmount: projectData.contractAmount,
      startDate: new Date(projectData.startDate),
      endDate: new Date(projectData.endDate),
      status: 'CONTRACT',
      customerId: sales.customerId ?? undefined,
    },
  })

  // Create project workflow
  await prisma.projectWorkflow.create({
    data: {
      projectId: project.id,
      currentPhase: 'CONTRACT',
      salesId,
    },
  })

  // Update sales status to WON
  await prisma.sales.update({
    where: { id: salesId },
    data: {
      status: 'WON',
      contractAmount: projectData.contractAmount,
      projectId: project.id,
    },
  })

  revalidatePath('/sales/waiting')
  revalidatePath('/sales')
  revalidatePath('/projects')
  return { project, salesId }
}

export async function importWaitingProjectsFromExcel(fileBuffer: Buffer) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][]

    // Find the row with project data (row 5 in Excel = index 4)
    // Column structure: 구분(1), 프로젝트명(2), 프로젝트명(3), ...
    const projects: Array<{
      title: string
      bidNumber: string
      bidAmount: number
      maxNegoAmount: number
      progress: number
      submissionDate: string
      laborCost: number
      materialCost: number
      outsourceCost: number
      equipmentCost: number
      otherCost: number
    }> = []

    // Parse Excel data - find projects from row 5
    // Row 4 (index 3): 프로젝트 코드
    // Row 5 (index 4): 프로젝트명  
    // Row 6 (index 5): 계약예정일
    // Row 7 (index 6): 계약예정금액
    // Row 8 (index 7): 최대 Nego 금액
    // Row 9 (index 8): 프로젝트 진행률
    
    const projectCodes = data[4] as string[] || []
    const projectNames = data[5] as string[] || []
    const contractDates = data[6] as string[] || []
    const contractAmounts = data[7] as number[] || []
    const maxNegoAmounts = data[8] as number[] || []
    const progresses = data[9] as number[] || []

    // Find mechanical costs (row 11)
    const mechanicalCosts = data[11] as number[] || []
    const electricalCosts = data[12] as number[] || []
    const instrumentationCosts = data[13] as number[] || []
    const pipingCosts = data[14] as number[] || []

    // Start from column 2 (index 2) - first project
    for (let col = 2; col < projectNames.length; col++) {
      const title = projectNames[col]
      if (!title || typeof title !== 'string') continue

      const bidNumber = projectCodes[col] || ''
      const bidAmount = Number(contractAmounts[col]) || 0
      const maxNegoAmount = Number(maxNegoAmounts[col]) || 0
      const progress = Number(progresses[col]) || 0
      const submissionDate = String(contractDates[col] || '')
      
      // Sum up direct costs from different rows
      const laborCost = 0
      const materialCost = Number(mechanicalCosts[col]) || 0
      const outsourceCost = Number(electricalCosts[col]) || 0
      const equipmentCost = Number(instrumentationCosts[col]) || 0
      const otherCost = (Number(pipingCosts[col]) || 0)

      projects.push({
        title,
        bidNumber,
        bidAmount,
        maxNegoAmount,
        progress,
        submissionDate,
        laborCost,
        materialCost,
        outsourceCost,
        equipmentCost,
        otherCost,
      })
    }

    // Create sales records
    const results = []
    for (const p of projects) {
      const sales = await prisma.sales.create({
        data: {
          type: 'BIDDING',
          status: 'WAITING',
          title: p.title,
          bidNumber: p.bidNumber,
          bidAmount: p.bidAmount,
          winProbability: p.progress / 100,
          submissionDate: p.submissionDate ? new Date(p.submissionDate) : null,
          laborCost: p.laborCost,
          materialCost: p.materialCost,
          outsourceCost: p.outsourceCost,
          equipmentCost: p.equipmentCost,
          otherCost: p.otherCost,
        },
      })
      results.push(sales)
    }

    revalidatePath('/sales/waiting')
    return { success: true, count: results.length }
  } catch (error) {
    console.error('Excel import error:', error)
    throw new Error('Failed to import Excel file')
  }
}

export async function exportWaitingProjectsToExcel() {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const projects = await listWaitingProjects()

  // Build Excel data matching the "대기" sheet format
  const rows: Record<string, unknown>[] = []

  // Header rows
  rows.push({ '구분': '', '대기방지': '' })
  rows.push({ '구분': '', '대기방지': "영업3팀 (대기)" })
  rows.push({ '구분': '', '대기방지': '' })
  rows.push({ '구분': '', '대기방지': "'25년 수주잔고 =>" })

  // Project column headers
  const headerRow: Record<string, unknown> = { '구분': '', '대기방지': '1. 프로젝트별 세부내역' }
  const codeRow: Record<string, unknown> = { '구분': '', '대기방지': '구분' }
  const nameRow: Record<string, unknown> = { '구분': '', '대기방지': '구분' }
  const dateRow: Record<string, unknown> = { '구분': '', '대기방지': '계약예정일' }
  const amountRow: Record<string, unknown> = { '구분': '', '대기방지': '계약예정금액' }
  const maxNegoRow: Record<string, unknown> = { '구분': '', '대기방지': '최대 Nego 금액' }
  const progressRow: Record<string, unknown> = { '구분': '', '대기방지': '프로젝트 진행률' }

  projects.forEach((p, idx) => {
    const col = idx + 2 // Start from column C (2)
    headerRow[`col${col}`] = p.id.substring(0, 8)
    codeRow[`col${col}`] = p.bidNumber || ''
    nameRow[`col${col}`] = p.title
    dateRow[`col${col}`] = p.submissionDate ? new Date(p.submissionDate).toLocaleDateString('ko-KR') : ''
    amountRow[`col${col}`] = p.bidAmount
    maxNegoRow[`col${col}`] = 0 // maxNegoAmount if available
    progressRow[`col${col}`] = p.winProbability || 0
  })

  rows.push(headerRow)
  rows.push(codeRow)
  rows.push(nameRow)
  rows.push(dateRow)
  rows.push(amountRow)
  rows.push(maxNegoRow)
  rows.push(progressRow)

  const ws = XLSX.utils.json_to_sheet(rows)
  
  // Set column widths
  const colCount = projects.length + 3
  const cols = [{ wch: 15 }, { wch: 20 }]
  for (let i = 0; i < projects.length; i++) {
    cols.push({ wch: 25 })
  }
  ws['!cols'] = cols

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '대기')

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as unknown as Buffer
}
