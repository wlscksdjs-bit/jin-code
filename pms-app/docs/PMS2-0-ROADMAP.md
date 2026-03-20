# PMS 2.0 구현 로드맵

**버전**: 2.0  
**작성일**: 2026-03-19  
**범위**: 수주영업 → 설계/시공 → 원가관리 → 손익관리 전체 워크플로우  

---

## 1. 개요

### 1.1 목적

모든 프로젝트는 **프로젝트 기준**으로 관리됩니다:
1. **입찰 검토** 때 프로젝트 개요부터 견적원가까지 등록
2. **수주 확정** 시 설계/스케줄링 일정 등록
3. **발주/입고** 일정 관리
4. **공사시공팀**이 제작일정에 맞춰 시공 스케줄링 (간트차트)
5. **실행원가**로 넘어가며 실제 실행
6. **월별 실적**과 사용 예정 비용 누적 관리
7. **자금수지 현황** 실시간 관리
8. **예산 대비 적정 사용률** 체크 → 절감/초과 판단
9. **손익관리** 실시간 예측

### 1.2 핵심 목표

```
수주영업 현황 ──▶ 계획 대비 현황 ──▶ 대시보드
     │                  │
     ▼                  ▼
프로젝트 ──▶ 설계/시공 ──▶ 원가관리 ──▶ 손익관리
```

### 1.3 현재 상태

| 영역 | 상태 | 우선순위 |
|------|------|----------|
| 손익 계산 유틸 | ✅ 구현 완료 | - |

---

## 2. 데이터 모델 확장

### 2.1 신규 모델

```prisma
// ============================================
// 프로젝트 라이프사이클 워크플로우
// ============================================

model ProjectWorkflow {
  id              String    @id @default(cuid())
  projectId       String    @unique
  
  // 현재 단계
  currentPhase    String    // BIDDING → CONTRACT → DESIGN → PROCUREMENT → CONSTRUCTION → COMPLETED
  
  // 연동된 엔티티
  salesId         String?   // 입찰 정보
  activeCostEstimateId    String?
  activeCostExecutionId   String?
  latestCostActualId      String?
  
  // 일정 추적
  currentPhaseStart DateTime?
  currentPhaseEnd   DateTime?
  
  // 상태
  status          String    // ACTIVE, ON_HOLD, COMPLETED, CANCELLED
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  project         Project   @relation(fields: [projectId], references: [id])
}

// ============================================
// 발주 관리 (구매)
// ============================================

model Vendor {
  id            String    @id @default(cuid())
  
  // 기본 정보
  name          String
  category      String    // MATERIAL, EQUIPMENT, SERVICE, LABOR
  businessNumber String?
  
  // 연락처
  contactPerson String?
  contactPhone  String?
  contactEmail  String?
  
  // 은행정보
  bankName      String?
  accountNumber String?
  accountHolder String?
  
  // 상태
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  orders        PurchaseOrder[]
}

model PurchaseOrder {
  id              String    @id @default(cuid())
  orderNumber     String    @unique // PO-2026-0001
  
  // 프로젝트/공정 연동
  projectId       String
  wbsItemId       String?
  
  // 거래처
  vendorId        String
  vendor          Vendor    @relation(fields: [vendorId], references: [id])
  
  // 발주 정보
  title           String    // 발주 제목
  description     String?
  
  // 일정
  orderDate       DateTime
  requiredDate    DateTime? // 요구 납기일
  deliveryDate    DateTime? // 실제 납기일
  
  // 금액
  subtotal        Float     @default(0)  // 소계
  tax             Float     @default(0)  // 부가세
  totalAmount     Float     @default(0)  // 총액
  paidAmount      Float     @default(0)  // 결제액
  
  // 상태
  status          String    @default("DRAFT") 
  // DRAFT → SENT → PARTIAL → RECEIVED → INSTALLED → CANCELLED
  
  notes           String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  project         Project   @relation(fields: [projectId], references: [id])
  items           PurchaseOrderItem[]
  
  @@index([projectId])
  @@index([vendorId])
  @@index([status])
}

model PurchaseOrderItem {
  id                  String    @id @default(cuid())
  purchaseOrderId     String
  purchaseOrder       PurchaseOrder @relation(fields: [purchaseOrderId], references: [id], onDelete: Cascade)
  
  // 품목 정보
  itemName            String    // 품목명
  specification       String?   // 규격
  unit                String    @default("EA") // 단위
  
  // 수량/단가
  quantity            Float     @default(1)
  unitPrice           Float     @default(0)
  amount              Float     // = quantity * unitPrice
  
  // 입고 현황
  orderedQuantity     Float     @default(0)
  receivedQuantity    Float     @default(0)
  rejectedQuantity    Float     @default(0)
  
  // 상태
  status              String    @default("PENDING")
  // PENDING → PARTIAL → RECEIVED → REJECTED
  
  remarks             String?
  
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  
  @@index([purchaseOrderId])
}

// ============================================
// 자금 흐름 (Cash Flow)
// ============================================

model CashFlow {
  id              String    @id @default(cuid())
  projectId       String
  
  // 구분
  type            String    // INFLOW(수입), OUTFLOW(지출)
  
  // 카테고리
  category        String    // 
  // 수입: CONTRACT, CHANGE_ORDER, MILESTONE
  // 지출: MATERIAL, LABOR, OUTSOURCE, EQUIPMENT, RENTAL, TRANSPORT, INSURANCE, TAX, OTHER
  
  // 금액
  plannedAmount   Float     // 계획 금액
  actualAmount    Float     @default(0) // 실제 금액
  
  // 일정
  plannedDate     DateTime  // 계획일
  actualDate     DateTime? // 실제 발생일
  
  // 상태
  status          String    @default("PLANNED")
  // PLANNED → COMMITTED → ACTUAL → CANCELLED
  
  // 참조
  referenceType   String?   // Finance, PurchaseOrder, CostExecution 등
  referenceId     String?
  
  // 설명
  description     String?
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  project         Project   @relation(fields: [projectId], references: [id])
  
  @@index([projectId])
  @@index([type])
  @@index([status])
  @@index([plannedDate])
}

// ============================================
// 월별 실적 집계 (보조 테이블)
// ============================================

model MonthlyCostSnapshot {
  id              String    @id @default(cuid())
  projectId       String
  
  // 월별 정보
  year            Int
  month           Int
  
  // 원가 누적
  contractAmount  Float     @default(0)
  materialCost    Float     @default(0)
  laborCost       Float     @default(0)
  outsourceCost   Float     @default(0)
  equipmentCost   Float     @default(0)
  otherCost       Float     @default(0)
  
  // 총 원가
  totalCost       Float     @default(0)
  indirectCost    Float     @default(0)
  
  // 손익
  sellingAdminCost Float   @default(0)
  grossProfit     Float     @default(0)
  operatingProfit Float     @default(0)
  profitRate      Float     @default(0)
  
  // 예약/실적 구분
  isActual        Boolean   @default(false) // true = 실적, false = 예정
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  
  project         Project   @relation(fields: [projectId], references: [id])
  
  @@unique([projectId, year, month, isActual])
  @@index([projectId])
}
```

### 2.2 기존 모델 확장

```prisma
// Project 모델 확장
model Project {
  // 기존 필드들...
  
  // PMS 2.0 추가 필드
  salesId           String?   // 연동된 입찰
  
  // 프로젝트 관리 설정
  projectManagerId  String?   // 프로젝트 매니저
  
  // 자금 관리
  totalContractAmount Float?  // 총 계약금액
  totalCashInflow   Float     @default(0)
  totalCashOutflow  Float     @default(0)
  currentCashBalance Float    @default(0)
  
  // 손익 관리
  budgetUsageRate   Float     @default(0)  // 예산 사용률
  costForecastRate  Float     @default(0)  // 원가 예측률
  
  //Relations
  workflow         ProjectWorkflow?
  purchaseOrders   PurchaseOrder[]
  cashFlows        CashFlow[]
  monthlySnapshots MonthlyCostSnapshot[]
}

// WbsItem 모델 확장
model WbsItem {
  // 기존 필드들...
  
  // PMS 2.0 추가
  isProcurement    Boolean   @default(false) // 구매 공정 여부
  assignedVendorId String?   // 배분된 거래처
  milestoneType    String?   // 마일스톤 유형 확장
  // PROJECT_START, CONTRACT, DESIGN_COMPLETE,
  // PROCUREMENT_COMPLETE, CONSTRUCTION_START,
  // CONSTRUCTION_COMPLETE, COMMISSIONING, HANDOVER
}
```

---

## 3. Server Actions 설계

### 3.1 워크플로우 Server Actions

```typescript
// src/app/actions/workflow.ts

'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * 수주 확정 처리
 * 1. Sales 상태 WON으로 변경
 * 2. Project 생성/업데이트
 * 3. WBS 마일스톤 자동 생성
 * 4. ProjectWorkflow 레코드 생성
 * 5. CostEstimate 자동 생성 (선택)
 */
export async function confirmContract(salesId: string, options?: {
  createCostEstimate?: boolean
  createProject?: boolean
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  if (!['ADMIN', 'PM'].includes(session.user.role)) {
    throw new Error('Permission denied')
  }

  const sales = await prisma.sales.findUnique({
    where: { id: salesId },
    include: { customer: true }
  })

  if (!sales) throw new Error('Sales not found')
  if (sales.status !== 'DRAFT' && sales.status !== 'SUBMITTED') {
    throw new Error('Cannot confirm this sales')
  }

  // 1. Sales 상태 변경
  await prisma.sales.update({
    where: { id: salesId },
    data: {
      status: 'WON',
      bidResult: 'WON',
      resultDate: new Date()
    }
  })

  // 2. Project 처리
  let projectId = sales.projectId
  
  if (!projectId && options?.createProject) {
    const project = await prisma.project.create({
      data: {
        code: `PJT-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase()}`,
        name: sales.title,
        type: 'ENVIRONMENT',
        status: 'CONTRACT',
        contractAmount: sales.contractAmount,
        contractDate: sales.contractDate,
        customerId: sales.customerId,
        salesId: sales.id,
        startDate: sales.contractDate || new Date(),
        endDate: calculateEndDate(sales.contractDate, 365) // 기본 1년
      }
    })
    projectId = project.id
  }

  if (projectId) {
    // 3. WBS 마일스톤 자동 생성
    await createDefaultMilestones(projectId)
    
    // 4. ProjectWorkflow 생성
    await prisma.projectWorkflow.upsert({
      where: { projectId },
      create: {
        projectId,
        currentPhase: 'CONTRACT',
        status: 'ACTIVE',
        salesId,
        currentPhaseStart: new Date()
      },
      update: {
        salesId,
        currentPhase: 'CONTRACT'
      }
    })

    // 5. CostEstimate 생성 (선택)
    if (options?.createCostEstimate && sales.contractAmount) {
      const estimate = await createCostEstimateFromSales(projectId, sales)
      
      await prisma.projectWorkflow.update({
        where: { projectId },
        data: { activeCostEstimateId: estimate.id }
      })
    }
  }

  revalidatePath('/projects')
  revalidatePath('/sales')
  if (projectId) revalidatePath(`/projects/${projectId}`)
  
  return { success: true, projectId }
}

/**
 * 마일스톤 자동 생성
 */
async function createDefaultMilestones(projectId: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } })
  const startDate = project?.startDate || new Date()
  
  const milestones = [
    { code: 'M1', name: '프로젝트 시작', milestoneType: 'PROJECT_START', 
      endDate: startDate, phaseType: 'PLANNING' },
    { code: 'M2', name: '계약 체결', milestoneType: 'CONTRACT',
      endDate: addDays(startDate, 7), phaseType: 'PLANNING' },
    { code: 'M3', name: '설계 완료', milestoneType: 'DESIGN_COMPLETE',
      endDate: addDays(startDate, 90), phaseType: 'DESIGN' },
    { code: 'M4', name: '구매 완료', milestoneType: 'PROCUREMENT_COMPLETE',
      endDate: addDays(startDate, 150), phaseType: 'PROCUREMENT' },
    { code: 'M5', name: '시공 완료', milestoneType: 'CONSTRUCTION_COMPLETE',
      endDate: addDays(startDate, 280), phaseType: 'CONSTRUCTION' },
    { code: 'M6', name: '시운전', milestoneType: 'COMMISSIONING',
      endDate: addDays(startDate, 330), phaseType: 'COMMISSIONING' },
    { code: 'M7', name: '인수인계', milestoneType: 'HANDOVER',
      endDate: addDays(startDate, 365), phaseType: 'HANDOVER' }
  ]

  for (const m of milestones) {
    await prisma.wbsItem.create({
      data: {
        projectId,
        code: m.code,
        name: m.name,
        startDate: m.endDate,
        endDate: m.endDate,
        isMilestone: true,
        milestoneType: m.milestoneType,
        phaseType: m.phaseType,
        status: 'PENDING',
        progress: 0
      }
    })
  }
}

/**
 * 단계 전환 처리
 */
export async function transitionPhase(projectId: string, newPhase: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  if (!['ADMIN', 'PM'].includes(session.user.role)) {
    throw new Error('Permission denied')
  }

  const workflow = await prisma.projectWorkflow.findUnique({
    where: { projectId }
  })

  if (!workflow) throw new Error('Workflow not found')

  const validTransitions: Record<string, string[]> = {
    'BIDDING': ['CONTRACT'],
    'CONTRACT': ['DESIGN'],
    'DESIGN': ['PROCUREMENT'],
    'PROCUREMENT': ['CONSTRUCTION'],
    'CONSTRUCTION': ['COMPLETED'],
    'COMPLETED': []
  }

  if (!validTransitions[workflow.currentPhase]?.includes(newPhase)) {
    throw new Error(`Invalid transition: ${workflow.currentPhase} → ${newPhase}`)
  }

  // WBS 상태 업데이트
  const phaseStatusMap: Record<string, string> = {
    'CONTRACT': 'CONTRACT',
    'DESIGN': 'DESIGN',
    'PROCUREMENT': 'PROCUREMENT',
    'CONSTRUCTION': 'CONSTRUCTION',
    'COMPLETED': 'COMPLETED'
  }

  await prisma.$transaction([
    // Workflow 업데이트
    prisma.projectWorkflow.update({
      where: { projectId },
      data: {
        currentPhase: newPhase,
        currentPhaseStart: new Date(),
        status: newPhase === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE'
      }
    }),
    // Project 상태 업데이트
    prisma.project.update({
      where: { id: projectId },
      data: { status: phaseStatusMap[newPhase] || 'REGISTERED' }
    }),
    // 관련 마일스톤 완료 처리
    prisma.wbsItem.updateMany({
      where: {
        projectId,
        milestoneType: newPhase === 'CONSTRUCTION' ? 'CONSTRUCTION_START' :
                       newPhase === 'COMPLETED' ? 'CONSTRUCTION_COMPLETE' : undefined,
        isMilestone: true
      },
      data: { status: 'COMPLETED', progress: 100 }
    })
  ])

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/projects')
  
  return { success: true }
}
```

### 3.2 PurchaseOrder Server Actions

```typescript
// src/app/actions/purchase-orders.ts

'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createPurchaseOrder(data: {
  projectId: string
  vendorId: string
  title: string
  items: Array<{
    itemName: string
    specification?: string
    unit?: string
    quantity: number
    unitPrice: number
  }>
  orderDate: Date
  requiredDate?: Date
  notes?: string
}) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  if (!['ADMIN', 'PM'].includes(session.user.role)) {
    throw new Error('Permission denied')
  }

  // 발주번호 생성
  const count = await prisma.purchaseOrder.count()
  const orderNumber = `PO-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const subtotal = data.items.reduce((sum, item) => 
    sum + (item.quantity * item.unitPrice), 0)
  const tax = subtotal * 0.1
  const totalAmount = subtotal + tax

  const order = await prisma.purchaseOrder.create({
    data: {
      orderNumber,
      projectId: data.projectId,
      vendorId: data.vendorId,
      title: data.title,
      orderDate: data.orderDate,
      requiredDate: data.requiredDate,
      subtotal,
      tax,
      totalAmount,
      status: 'DRAFT',
      notes: data.notes,
      items: {
        create: data.items.map(item => ({
          itemName: item.itemName,
          specification: item.specification,
          unit: item.unit || 'EA',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          orderedQuantity: item.quantity
        }))
      }
    },
    include: { items: true }
  })

  revalidatePath(`/projects/${data.projectId}`)
  revalidatePath('/projects')
  
  return order
}

export async function updatePurchaseOrderStatus(
  orderId: string,
  status: string,
  options?: {
    receivedItems?: Array<{ itemId: string; quantity: number }>
    deliveryDate?: Date
  }
) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const order = await prisma.purchaseOrder.findUnique({
    where: { id: orderId },
    include: { items: true }
  })

  if (!order) throw new Error('Order not found')

  // 상태 전이 검증
  const validTransitions: Record<string, string[]> = {
    'DRAFT': ['SENT'],
    'SENT': ['PARTIAL', 'RECEIVED'],
    'PARTIAL': ['PARTIAL', 'RECEIVED'],
    'RECEIVED': ['INSTALLED'],
    'INSTALLED': [],
    'CANCELLED': []
  }

  if (!validTransitions[order.status]?.includes(status)) {
    throw new Error(`Invalid status transition: ${order.status} → ${status}`)
  }

  const updateData: any = { status }
  
  if (options?.deliveryDate) {
    updateData.deliveryDate = options.deliveryDate
  }

  // 입고 처리
  if (options?.receivedItems && status !== 'CANCELLED') {
    for (const item of options.receivedItems) {
      await prisma.purchaseOrderItem.update({
        where: { id: item.itemId },
        data: {
          receivedQuantity: { increment: item.quantity },
          status: item.quantity < (order.items.find(i => i.id === item.itemId)?.orderedQuantity || 0) 
            ? 'PARTIAL' : 'RECEIVED'
        }
      })
    }

    // 전체 입고 완료 확인
    const allReceived = order.items.every(item => {
      const received = options.receivedItems.find(i => i.itemId === item.id)?.quantity || 0
      return item.orderedQuantity <= received
    })
    
    if (allReceived) {
      updateData.status = 'RECEIVED'
    } else {
      updateData.status = 'PARTIAL'
    }
  }

  const updated = await prisma.purchaseOrder.update({
    where: { id: orderId },
    data: updateData
  })

  // CashFlow 업데이트
  if (['RECEIVED', 'PARTIAL'].includes(status)) {
    const paidAmount = order.items.reduce((sum, item) => {
      const received = options?.receivedItems?.find(i => i.itemId === item.id)?.quantity || 0
      return sum + (received * item.unitPrice * 1.1) // tax 포함
    }, 0)
    
    await prisma.purchaseOrder.update({
      where: { id: orderId },
      data: { paidAmount }
    })

    // CashFlow 생성/업데이트
    await prisma.cashFlow.upsert({
      where: {
        id: `${orderId}-payment`
      },
      create: {
        projectId: order.projectId,
        type: 'OUTFLOW',
        category: 'MATERIAL',
        plannedAmount: order.totalAmount,
        actualAmount: paidAmount,
        plannedDate: order.requiredDate || order.orderDate,
        actualDate: new Date(),
        status: 'ACTUAL',
        referenceType: 'PurchaseOrder',
        referenceId: orderId
      },
      update: {
        actualAmount: paidAmount,
        status: paidAmount >= order.totalAmount ? 'ACTUAL' : 'COMMITTED'
      }
    })
  }

  revalidatePath(`/projects/${order.projectId}`)
  
  return updated
}
```

### 3.3 CashFlow Server Actions

```typescript
// src/app/actions/cash-flow.ts

'use server'

import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * 프로젝트별 자금수지 현황 조회
 */
export async function getProjectCashFlow(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')

  const cashFlows = await prisma.cashFlow.findMany({
    where: { projectId },
    orderBy: { plannedDate: 'asc' }
  })

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { contractAmount: true, totalCashInflow: true, totalCashOutflow: true }
  })

  // 누적 계산
  let cumulative = 0
  const flowsWithCumulative = cashFlows.map(flow => {
    const amount = flow.type === 'INFLOW' ? flow.actualAmount : -flow.actualAmount
    cumulative += amount
    return { ...flow, cumulativeBalance: cumulative }
  })

  // 요약 계산
  const inflow = cashFlows.filter(f => f.type === 'INFLOW').reduce((s, f) => s + f.actualAmount, 0)
  const outflow = cashFlows.filter(f => f.type === 'OUTFLOW').reduce((s, f) => s + f.actualAmount, 0)

  return {
    summary: {
      contractAmount: project?.contractAmount || 0,
      totalPlannedInflow: cashFlows.filter(f => f.type === 'INFLOW').reduce((s, f) => s + f.plannedAmount, 0),
      totalPlannedOutflow: cashFlows.filter(f => f.type === 'OUTFLOW').reduce((s, f) => s + f.plannedAmount, 0),
      totalActualInflow: inflow,
      totalActualOutflow: outflow,
      currentBalance: inflow - outflow,
      expectedBalance: (project?.contractAmount || 0) - outflow
    },
    flows: flowsWithCumulative
  }
}

/**
 * 월별 자금수지 예측 생성
 */
export async function generateCashFlowForecast(projectId: string) {
  const session = await auth()
  if (!session) throw new Error('Unauthorized')
  if (!['ADMIN', 'PM'].includes(session.user.role)) {
    throw new Error('Permission denied')
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      purchaseOrders: { where: { status: { not: 'CANCELLED' } } },
      budgets: { include: { items: true } },
      costExecutions: { orderBy: { periodYear: 'asc', periodMonth: 'asc' } }
    }
  })

  if (!project) throw new Error('Project not found')

  const forecasts: Array<{
    year: number
    month: number
    plannedInflow: number
    plannedOutflow: number
    actualInflow: number
    actualOutflow: number
  }> = []

  // 계약금 (계약 시 30%)
  if (project.contractAmount) {
    forecasts.push({
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      plannedInflow: project.contractAmount * 0.3,
      plannedOutflow: 0,
      actualInflow: 0,
      actualOutflow: 0
    })
  }

  // 발주금 (구매 건별)
  for (const order of project.purchaseOrders) {
    if (order.requiredDate) {
      const date = new Date(order.requiredDate)
      const existing = forecasts.find(f => 
        f.year === date.getFullYear() && f.month === date.getMonth() + 1
      )
      if (existing) {
        existing.plannedOutflow += order.totalAmount
      } else {
        forecasts.push({
          year: date.getFullYear(),
          month: date.getMonth() + 1,
          plannedInflow: 0,
          plannedOutflow: order.totalAmount,
          actualInflow: 0,
          actualOutflow: order.status === 'RECEIVED' ? order.totalAmount : 0
        })
      }
    }
  }

  // 기존 CashFlow와 병합
  const existingFlows = await prisma.cashFlow.findMany({
    where: { projectId }
  })

  for (const flow of existingFlows) {
    const date = new Date(flow.plannedDate)
    const existing = forecasts.find(f =>
      f.year === date.getFullYear() && f.month === date.getMonth() + 1
    )
    if (existing) {
      if (flow.type === 'INFLOW') {
        existing.plannedInflow = flow.plannedAmount
        existing.actualInflow = flow.actualAmount
      } else {
        existing.plannedOutflow = flow.plannedAmount
        existing.actualOutflow = flow.actualAmount
      }
    }
  }

  // DB 저장
  for (const forecast of forecasts) {
    // INFLOW
    await prisma.cashFlow.upsert({
      where: {
        id: `${projectId}-forecast-${forecast.year}-${forecast.month}-inflow`
      },
      create: {
        id: `${projectId}-forecast-${forecast.year}-${forecast.month}-inflow`,
        projectId,
        type: 'INFLOW',
        category: 'CONTRACT',
        plannedAmount: forecast.plannedInflow,
        actualAmount: forecast.actualInflow,
        plannedDate: new Date(forecast.year, forecast.month - 1, 15),
        status: forecast.actualInflow > 0 ? 'ACTUAL' : 'PLANNED'
      },
      update: {
        plannedAmount: forecast.plannedInflow,
        actualAmount: forecast.actualInflow,
        status: forecast.actualInflow > 0 ? 'ACTUAL' : 'PLANNED'
      }
    })

    // OUTFLOW
    await prisma.cashFlow.upsert({
      where: {
        id: `${projectId}-forecast-${forecast.year}-${forecast.month}-outflow`
      },
      create: {
        id: `${projectId}-forecast-${forecast.year}-${forecast.month}-outflow`,
        projectId,
        type: 'OUTFLOW',
        category: 'MATERIAL',
        plannedAmount: forecast.plannedOutflow,
        actualAmount: forecast.actualOutflow,
        plannedDate: new Date(forecast.year, forecast.month - 1, 28),
        status: forecast.actualOutflow > 0 ? 'ACTUAL' : 'PLANNED'
      },
      update: {
        plannedAmount: forecast.plannedOutflow,
        actualAmount: forecast.actualOutflow,
        status: forecast.actualOutflow > 0 ? 'ACTUAL' : 'PLANNED'
      }
    })
  }

  revalidatePath(`/projects/${projectId}`)
  
  return { success: true, count: forecasts.length }
}
```

---

## 4. Dashboard 컴포넌트 설계

### 4.1 전체 Dashboard 레이아웃

```
┌─────────────────────────────────────────────────────────────────────────┐
│  [로고]  PMS 2.0           🔔  ⚙️  👤                               │
├──────────┬────────────────────────────────────────────────────────────┤
│          │                                                            │
│ 대시보드  │  ▸ 수주영업 현황                                            │
│ 프로젝트  │    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ 영업수주  │    │ 신규수주  │ │ 진행중   │ │ 수주예정  │ │ 낙찰률   │    │
│ 원가관리  │    │   12건   │ │   8건   │ │   5건   │ │  68%    │    │
│ 예산관리  │    └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│ 공사진행  │                                                            │
│ 손익관리  │  ▸ 프로젝트 현황                                            │
│ 인원      │    ┌────────────────────────────────────────────────┐     │
│ 알림      │    │         예산 대비 원가 사용률 (차트)              │     │
│          │    │                                                  │     │
│ ──────── │    └────────────────────────────────────────────────┘     │
│ 설정      │                                                            │
│ 로그아웃  │  ▸ 손익 현황                                               │
│          │    ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│          │    │ 계약금액  │ │ 실행원가  │ │ 영업이익  │ │ 이익률   │    │
│          │    │ 500,000 │ │ 320,000 │ │ +80,000 │ │  16%   │    │
│          │    └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
│          │                                                            │
│          │  ▸ 자금수지                                                │
│          │    ┌────────────────────────────────────────────────┐     │
│          │    │         월별 자금 흐름 (막대/선 차트)              │     │
│          │    └────────────────────────────────────────────────┘     │
│          │                                                            │
│          │  ▸ Alerts                                                 │
│          │    ⚠️ 프로젝트 A: 예산 사용률 90% 초과                      │
│          │    ⚠️ 프로젝트 B: 마일스톤 3일 이내                          │
│          │                                                            │
└──────────┴────────────────────────────────────────────────────────────┘
```

### 4.2 신규 Dashboard 컴포넌트

```typescript
// src/components/dashboard/sales-pipeline.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Clock, CheckCircle, XCircle } from 'lucide-react'

interface SalesPipelineProps {
  data: {
    new: number      // 신규
    submitted: number // 제출됨
    evaluating: number // 평가중
    won: number       // 수주
    lost: number      // 낙찰 실패
  }
}

export function SalesPipeline({ data }: SalesPipelineProps) {
  const total = data.new + data.submitted + data.evaluating + data.won + data.lost
  const winRate = data.won / (data.won + data.lost) * 100 || 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          수주영업 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-2">
          <PipelineStage 
            label="신규" 
            count={data.new} 
            color="blue" 
            icon={Clock}
          />
          <PipelineStage 
            label="제출" 
            count={data.submitted} 
            color="cyan"
            icon={Clock}
          />
          <PipelineStage 
            label="평가중" 
            count={data.evaluating} 
            color="yellow"
            icon={Clock}
          />
          <PipelineStage 
            label="수주" 
            count={data.won} 
            color="green"
            icon={CheckCircle}
          />
          <PipelineStage 
            label="실패" 
            count={data.lost} 
            color="red"
            icon={XCircle}
          />
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">전체 건수</span>
            <span className="font-medium">{total}건</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-slate-500">낙찰률</span>
            <span className="font-medium text-green-600">{winRate.toFixed(1)}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// src/components/dashboard/cash-flow-chart.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts'

interface CashFlowData {
  month: string
  inflow: number
  outflow: number
  balance: number
}

interface CashFlowChartProps {
  data: CashFlowData[]
}

export function CashFlowChart({ data }: CashFlowChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-green-500" />
          자금수지 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toLocaleString()}원`} />
              <Bar dataKey="inflow" fill="#22c55e" name="수입" />
              <Bar dataKey="outflow" fill="#ef4444" name="지출" />
              <Line type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} name="잔액" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded" />
            <span>수입</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span>지출</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span>잔액</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// src/components/dashboard/project-profitability.tsx

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ProjectProfitabilityProps {
  projects: Array<{
    id: string
    name: string
    contractAmount: number
    totalCost: number
    profit: number
    profitRate: number
  }>
}

export function ProjectProfitability({ projects }: ProjectProfitabilityProps) {
  const sorted = [...projects].sort((a, b) => b.profitRate - a.profitRate)

  return (
    <Card>
      <CardHeader>
        <CardTitle>프로젝트별 손익 현황</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sorted.map(project => (
            <div key={project.id} className="flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{project.name}</p>
                <p className="text-xs text-slate-500">
                  계약: {project.contractAmount.toLocaleString()}원
                </p>
              </div>
              <div className="text-right">
                <div className={`flex items-center gap-1 text-sm font-medium ${
                  project.profit >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {project.profit >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {project.profit.toLocaleString()}원
                </div>
                <p className={`text-xs ${
                  project.profitRate >= 10 ? 'text-green-600' :
                  project.profitRate >= 0 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {project.profitRate.toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 5. 구현 Phase

### Phase 1: 데이터 워크플로우 자동화 (2주)

| 작업 | 예상工期 | 비고 |
|------|----------|------|
| ProjectWorkflow 모델 추가 | 1일 | Prisma 스키마 |
| confirmContract Server Action | 2일 | 핵심 워크플로우 |
| transitionPhase Server Action | 1일 | 단계 전환 |
| Sales → Project 자동 연결 UI | 2일 | 버튼/모달 |
| 마일스톤 자동 생성 로직 | 1일 | 설계 완료 등 |
| **소계** | **7일** | |

### Phase 2: 구매/발주 관리 (2주)

| 작업 | 예상工期 | 비고 |
|------|----------|------|
| Vendor, PurchaseOrder 모델 | 1일 | Prisma |
| PurchaseOrder CRUD Server Actions | 3일 | CRUD + 상태 |
| PurchaseOrder 목록/상세 UI | 2일 | 테이블 + 상세 |
| 발주 → 입고 처리 UI | 2일 | 상태 전이 |
| CashFlow 기본 구조 | 2일 | 모델 + Server Action |
| **소계** | **10일** | |

### Phase 3: 간트차트 저장 + Dashboard 연동 (2주)

| 작업 | 예상工期 | 비고 |
|------|----------|------|
| WBS 저장 Server Action | 1일 | PUT endpoint |
| GanttChart → 저장 연동 | 2일 | onTaskUpdate |
| Dashboard Server Component 확장 | 2일 | 데이터 수집 |
| SalesPipeline 컴포넌트 | 2일 | 새 컴포넌트 |
| CashFlowChart 컴포넌트 | 2일 | Recharts |
| ProjectProfitability 컴포넌트 | 1일 | |
| **소계** | **10일** | |

### Phase 4: 원가/손익 실시간 추적 (2주)

| 작업 | 예상工期 | 비고 |
|------|----------|------|
| 월별 CostExecution 입력 UI | 3일 | 달력/테이블 |
| MonthlyCostSnapshot 집계 | 2일 | 자동 계산 |
| CashFlow 예측 생성 | 2일 | Server Action |
| 손익 실시간 Dashboard 카드 | 2일 | 기존 카드 확장 |
| 예산 사용률 계산/표시 | 1일 | |
| **소계** | **10일** | |

### Phase 5: 통합 및 고도화 (2주)

| 작업 | 예상工期 | 비고 |
|------|----------|------|
| Alerts 시스템 강화 | 2일 | 예산 초과 등 |
| 인쇄/Export 기능 | 2일 | PDF, Excel |
| 성능 최적화 | 2일 | Query 최적화 |
| 테스트 | 2일 | E2E |
| 문서화 | 2일 | README 갱신 |
| **소계** | **10일** | |

---

## 6. 예상工期 총계

| Phase | 작업 |工期 |
|-------|------|-----|
| Phase 1 | 데이터 워크플로우 자동화 | 7일 |
| Phase 2 | 구매/발주 관리 | 10일 |
| Phase 3 | 간트차트 + Dashboard | 10일 |
| Phase 4 | 원가/손익 실시간 | 10일 |
| Phase 5 | 통합 및 고도화 | 10일 |
| **총계** | | **47일** (≈ 10주) |

---

## 7. 마이그레이션 전략

### 7.1 기존 데이터

```sql
-- 기존 Project에 workflow 필드 추가 (nullable)
-- 기존 Sales → Project 연결은 수동 또는 배치 처리

-- 배치 마이그레이션 스크립트
UPDATE Project 
SET salesId = (
  SELECT id FROM Sales 
  WHERE Sales.projectId = Project.id 
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM Sales 
  WHERE Sales.projectId = Project.id
);

-- ProjectWorkflow 생성
INSERT INTO ProjectWorkflow (id, projectId, currentPhase, status, createdAt, updatedAt)
SELECT 
  'wf-' || id,
  id,
  CASE status 
    WHEN 'REGISTERED' THEN 'BIDDING'
    WHEN 'CONTRACT' THEN 'CONTRACT'
    WHEN 'DESIGN' THEN 'DESIGN'
    WHEN 'CONSTRUCTION' THEN 'CONSTRUCTION'
    WHEN 'COMPLETED' THEN 'COMPLETED'
    ELSE 'BIDDING'
  END,
  CASE WHEN status = 'COMPLETED' THEN 'COMPLETED' ELSE 'ACTIVE' END,
  createdAt,
  updatedAt
FROM Project
WHERE NOT EXISTS (SELECT 1 FROM ProjectWorkflow WHERE projectId = Project.id);
```

### 7.2 순차적 배포

```
Week 1-2:   Phase 1 배포 → 수주 확정 워크플로우
Week 3-4:   Phase 2 배포 → 구매 관리 (不影响 기존)
Week 5-6:   Phase 3 배포 → Dashboard 강화
Week 7-8:   Phase 4 배포 → 원가 추적
Week 9-10:  Phase 5 배포 → 통합 테스트
```

---

## 8. 참고 사항

### 8.1 의존성

- Next.js 16 App Router 사용
- Prisma ORM (기존 schema.prisma 확장)
- Tailwind CSS + Radix UI (기존 컴포넌트 재사용)
- Recharts (대시보드 차트)

### 8.2 외부 연동 고려

- Excel Import/Export: 기존 xlsx 라이브러리 활용
- PDF 인쇄: @react-pdf/renderer 또는 html2canvas + jspdf

### 8.3 확장 고려

- 알림 시스템: 기존 Notification 모델 활용
- 감사 로깅: 기존 AuditLog 모델 활용
- 모바일: 기존 Responsive 디자인 유지

---

*문서 생성일: 2026-03-19*
