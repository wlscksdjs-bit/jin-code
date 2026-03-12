/**
 * Zod Validation Schemas for EPS (Environmental Plant Suite)
 * 
 * 이 파일은 데이터베이스 모델에 맞는 검증 스키마를 정의합니다.
 * 사용법:
 * import { ProjectSchema } from '@/lib/schemas'
 * 
 * const result = ProjectSchema.safeParse(data)
 */

import { z } from 'zod'

// ============================================
// Common Schemas
// ============================================

/** ID 검증 스키마 */
export const IdSchema = z.string().cuid('유효하지 않은 ID입니다')

/** 페이지네이션 파라미터 */
export const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
})

/** 정렬 파라미터 */
export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

/** 날짜 범위 필터 */
export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate
  }
  return true
}, {
  message: '시작일이 종료일보다 늦을 수 없습니다',
})

// ============================================
// 1. User & Auth Schemas
// ============================================

export const UserRoleSchema = z.enum(['ADMIN', 'PM', 'STAFF'])

export const CreateUserSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  name: z.string().min(1, '이름을 입력하세요').max(100),
  password: z.string().min(8, '비밀번호는 8자 이상').max(100),
  role: UserRoleSchema.default('PM'),
  department: z.string().optional(),
  position: z.string().optional(),
  phone: z.string().optional(),
})

export const UpdateUserSchema = CreateUserSchema.partial().extend({
  id: IdSchema,
  isActive: z.boolean().optional(),
}).omit({ password: true })

export const LoginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})

// ============================================
// 2. Customer Schemas
// ============================================

export const CreateCustomerSchema = z.object({
  name: z.string().min(1, '고객사명을 입력하세요').max(200),
  code: z.string()
    .min(1, '고객사 코드를 입력하세요')
    .max(50)
    .regex(/^[A-Z0-9-_]+$/, '대문자, 숫자, 하이픈, 언더스코만 가능'),
  industry: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('유효한 이메일을 입력하세요').optional().or(z.literal('')),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const UpdateCustomerSchema = CreateCustomerSchema.partial().extend({
  id: IdSchema,
  isActive: z.boolean().optional(),
})

// ============================================
// 3. Project Schemas
// ============================================

export const ProjectTypeSchema = z.enum([
  'ENVIRONMENT', 'FACILITY', 'PROCESS', 'CONSTRUCTION', 'OTHER'
])

export const ProjectStatusSchema = z.enum([
  'REGISTERED', 'CONTRACT', 'DESIGN', 'CONSTRUCTION', 'COMPLETED', 'CANCELLED', 'DELAYED'
])

export const ContractTypeSchema = z.enum(['수주', '용역', '시공'])

export const CreateProjectSchema = z.object({
  code: z.string()
    .min(1, '프로젝트 코드를 입력하세요')
    .max(50)
    .regex(/^[A-Z0-9-_]+$/, '대문자, 숫자, 하이픈, 언더스코만 가능'),
  name: z.string().min(1, '프로젝트명을 입력하세요').max(200),
  type: ProjectTypeSchema,
  status: ProjectStatusSchema.default('REGISTERED'),
  contractType: ContractTypeSchema.optional(),
  customerId: IdSchema.optional().nullable(),
  contractAmount: z.coerce.number().min(0).optional(),
  estimatedBudget: z.coerce.number().min(0).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  contractDate: z.coerce.date().optional(),
  location: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
})

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  id: IdSchema,
  isActive: z.boolean().optional(),
})

// ============================================
// 4. ProjectMember Schemas
// ============================================

export const ProjectMemberRoleSchema = z.enum(['PM', 'LEADER', 'MEMBER'])

export const CreateProjectMemberSchema = z.object({
  projectId: IdSchema,
  userId: IdSchema,
  role: ProjectMemberRoleSchema.default('MEMBER'),
  allocation: z.coerce.number().min(0.1).max(1).default(1.0),
  isActive: z.boolean().default(true),
})

export const UpdateProjectMemberSchema = CreateProjectMemberSchema.partial()

// ============================================
// 5. Sales Schemas
// ============================================

export const SalesTypeSchema = z.enum(['BIDDING', 'CONTRACT', 'CHANGE_ORDER'])
export const SalesStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'EVALUATING', 'WON', 'LOST', 'CANCELLED'])
export const BidResultSchema = z.enum(['PENDING', 'WON', 'LOST'])

export const CreateSalesSchema = z.object({
  type: SalesTypeSchema,
  status: SalesStatusSchema.default('DRAFT'),
  title: z.string().min(1, '제목을 입력하세요').max(200),
  bidNumber: z.string().optional(),
  bidAmount: z.coerce.number().min(0).optional(),
  winProbability: z.coerce.number().min(0).max(100).optional(),
  bidOpenDate: z.coerce.date().optional(),
  submissionDate: z.coerce.date().optional(),
  contractDate: z.coerce.date().optional(),
  contractAmount: z.coerce.number().min(0).optional(),
  customerBudget: z.coerce.number().min(0).optional(),
  competitorInfo: z.string().optional(),
  laborCost: z.coerce.number().min(0).optional(),
  materialCost: z.coerce.number().min(0).optional(),
  outsourceCost: z.coerce.number().min(0).optional(),
  equipmentCost: z.coerce.number().min(0).optional(),
  otherCost: z.coerce.number().min(0).optional(),
  executionCost: z.coerce.number().min(0).optional(),
  bidResult: BidResultSchema.optional(),
  resultDate: z.coerce.date().optional(),
  customerId: IdSchema.optional().nullable(),
  projectId: IdSchema.optional().nullable(),
  managerId: IdSchema.optional().nullable(),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export const UpdateSalesSchema = CreateSalesSchema.partial().extend({
  id: IdSchema,
})

// ============================================
// 6. Budget Schemas
// ============================================

export const BudgetTypeSchema = z.enum(['INITIAL', 'REVISED', 'FINAL'])
export const BudgetStatusSchema = z.enum(['DRAFT', 'APPROVED', 'IN_PROGRESS', 'CLOSED'])
export const BudgetSourceTypeSchema = z.enum(['QUOTE', 'CONTRACT', 'REVISION'])

export const CreateBudgetSchema = z.object({
  projectId: IdSchema,
  type: BudgetTypeSchema.default('INITIAL'),
  status: BudgetStatusSchema.default('DRAFT'),
  sourceType: BudgetSourceTypeSchema.optional(),
  sourceSalesId: IdSchema.optional(),
  totalBudget: z.coerce.number().min(0),
  laborCost: z.coerce.number().min(0).optional(),
  materialCost: z.coerce.number().min(0).optional(),
  outsourceCost: z.coerce.number().min(0).optional(),
  equipmentCost: z.coerce.number().min(0).optional(),
  otherCost: z.coerce.number().min(0).optional(),
  indirectCostRate: z.coerce.number().min(0).max(100).optional(),
  sellingAdminCostRate: z.coerce.number().min(0).max(100).optional(),
  profitMargin: z.coerce.number().min(0).max(100).optional(),
  targetProfit: z.coerce.number().min(0).optional(),
  estimatedProfit: z.coerce.number().optional(),
  currentProfit: z.coerce.number().optional(),
  effectiveDate: z.coerce.date().optional(),
  notes: z.string().optional(),
})

export const UpdateBudgetSchema = CreateBudgetSchema.partial().extend({
  id: IdSchema,
})

// ============================================
// 7. BudgetItem Schemas
// ============================================

export const BudgetItemCategorySchema = z.enum(['인건비', '자재비', '외주비', '장비비', '기타'])

export const CreateBudgetItemSchema = z.object({
  budgetId: IdSchema,
  wbsCode: z.string().optional(),
  name: z.string().min(1, '항목명을 입력하세요').max(200),
  category: BudgetItemCategorySchema.optional(),
  plannedAmount: z.coerce.number().min(0),
  previousAmount: z.coerce.number().min(0).default(0),
  currentAmount: z.coerce.number().min(0).default(0),
  sortOrder: z.coerce.number().default(0),
  description: z.string().optional(),
})

export const UpdateBudgetItemSchema = CreateBudgetItemSchema.partial().extend({
  id: IdSchema,
})

// ============================================
// 8. WBS Schemas
// ============================================

export const WbsStatusSchema = z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'])
export const PhaseTypeSchema = z.enum(['DESIGN', 'CONSTRUCTION', 'PROCUREMENT', 'COMMISSIONING', 'OTHER'])
export const MilestoneTypeSchema = z.enum(['CONTRACT', 'DESIGN_COMPLETE', 'CONSTRUCTION_START', 'CONSTRUCTION_COMPLETE', 'COMMISSIONING', 'HANDOVER'])

export const CreateWbsItemSchema = z.object({
  projectId: IdSchema,
  parentId: IdSchema.optional().nullable(),
  code: z.string().min(1, 'WBS 코드를 입력하세요').max(50),
  name: z.string().min(1, '공정명을 입력하세요').max(200),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  plannedDays: z.coerce.number().int().min(0).optional(),
  progress: z.coerce.number().min(0).max(100).default(0),
  plannedCost: z.coerce.number().min(0).optional(),
  actualCost: z.coerce.number().min(0).optional(),
  sortOrder: z.coerce.number().default(0),
  status: WbsStatusSchema.default('PENDING'),
  phaseType: PhaseTypeSchema.optional(),
  isMilestone: z.boolean().default(false),
  milestoneType: MilestoneTypeSchema.optional(),
})

export const UpdateWbsItemSchema = CreateWbsItemSchema.partial().extend({
  id: IdSchema,
})

// ============================================
// 9. Progress Schemas
// ============================================

export const ProgressStatusSchema = z.enum(['NORMAL', 'DELAYED', 'AHEAD'])

export const CreateProgressSchema = z.object({
  projectId: IdSchema,
  wbsItemId: IdSchema.optional().nullable(),
  date: z.coerce.date(),
  plannedProgress: z.coerce.number().min(0).max(100).default(0),
  actualProgress: z.coerce.number().min(0).max(100).default(0),
  status: ProgressStatusSchema.default('NORMAL'),
  description: z.string().optional(),
  issues: z.string().optional(),
})

export const UpdateProgressSchema = CreateProgressSchema.partial().extend({
  id: IdSchema,
})

// ============================================
// 10. Resource Schemas
// ============================================

export const AvailabilitySchema = z.enum(['AVAILABLE', 'ASSIGNED', 'UNAVAILABLE', 'ON_LEAVE'])

export const CreateResourceSchema = z.object({
  name: z.string().min(1, '이름을 입력하세요').max(100),
  employeeNumber: z.string()
    .min(1, '사번을 입력하세요')
    .max(50)
    .regex(/^[A-Z0-9-_]+$/, '대문자, 숫자, 하이픈, 언더스코만 가능'),
  department: z.string().optional(),
  position: z.string().optional(),
  grade: z.string().optional(),
  skills: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  hourlyRate: z.coerce.number().min(0).optional(),
  monthlyRate: z.coerce.number().min(0).optional(),
  availability: AvailabilitySchema.default('AVAILABLE'),
  phone: z.string().optional(),
  email: z.string().email('유효한 이메일을 입력하세요').optional().or(z.literal('')),
})

export const UpdateResourceSchema = CreateResourceSchema.partial().extend({
  id: IdSchema,
  isActive: z.boolean().optional(),
})

// ============================================
// 11. TimeSheet Schemas
// ============================================

export const WorkTypeSchema = z.enum(['DESIGN', 'CONSTRUCTION', 'MEETING', 'ADMIN', 'OTHER'])
export const TimeSheetStatusSchema = z.enum(['DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED'])

export const CreateTimeSheetSchema = z.object({
  userId: IdSchema,
  projectId: IdSchema,
  resourceId: IdSchema.optional().nullable(),
  date: z.coerce.date(),
  hours: z.coerce.number().min(0).max(24),
  workType: WorkTypeSchema,
  description: z.string().optional(),
  status: TimeSheetStatusSchema.default('DRAFT'),
  hourlyRate: z.coerce.number().min(0).optional(),
})

export const UpdateTimeSheetSchema = CreateTimeSheetSchema.partial().extend({
  id: IdSchema,
  approvedBy: IdSchema.optional(),
  approvedAt: z.coerce.date().optional(),
})

// ============================================
// 12. Finance Schemas
// ============================================

export const FinanceTypeSchema = z.enum(['REVENUE', 'COST'])
export const FinanceCategorySchema = z.enum([
  'SALES', 'CONSTRUCTION_COST', 'MATERIAL', 'LABOR', 'OUTSOURCE', 'EQUIPMENT', 'OTHER'
])
export const FinanceStatusSchema = z.enum(['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED'])

export const CreateFinanceSchema = z.object({
  projectId: IdSchema,
  type: FinanceTypeSchema,
  category: FinanceCategorySchema,
  amount: z.coerce.number(),
  occurDate: z.coerce.date(),
  billingDate: z.coerce.date().optional(),
  paymentDate: z.coerce.date().optional(),
  status: FinanceStatusSchema.default('PENDING'),
  description: z.string().optional(),
  referenceNumber: z.string().optional(),
})

export const UpdateFinanceSchema = CreateFinanceSchema.partial().extend({
  id: IdSchema,
})

// ============================================
// 13. Task Schemas
// ============================================

export const TaskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'])
export const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])

export const CreateTaskSchema = z.object({
  projectId: IdSchema,
  wbsItemId: IdSchema.optional().nullable(),
  title: z.string().min(1, '제목을 입력하세요').max(200),
  description: z.string().optional(),
  status: TaskStatusSchema.default('TODO'),
  priority: TaskPrioritySchema.default('MEDIUM'),
  dueDate: z.coerce.date().optional(),
  assigneeId: IdSchema.optional().nullable(),
  sortOrder: z.coerce.number().default(0),
})

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: IdSchema,
  completedAt: z.coerce.date().optional(),
})

// ============================================
// 14. Document Schemas
// ============================================

export const DocumentTypeSchema = z.enum(['CONTRACT', 'DRAWING', 'REPORT', 'MANUAL', 'ETC'])

export const CreateDocumentSchema = z.object({
  projectId: IdSchema,
  title: z.string().min(1, '문서명을 입력하세요').max(200),
  type: DocumentTypeSchema,
  fileName: z.string().optional(),
  fileUrl: z.string().optional(),
  fileSize: z.coerce.number().int().min(0).optional(),
  mimeType: z.string().optional(),
  version: z.string().default('1.0'),
  description: z.string().optional(),
})

export const UpdateDocumentSchema = CreateDocumentSchema.partial().extend({
  id: IdSchema,
  isActive: z.boolean().optional(),
})

// ============================================
// 15. Notification Schemas
// ============================================

export const NotificationTypeSchema = z.enum([
  'PROJECT_UPDATE', 'TASK_ASSIGNED', 'BUDGET_ALERT', 'MILESTONE_DUE', 'SYSTEM'
])

export const CreateNotificationSchema = z.object({
  userId: IdSchema,
  type: NotificationTypeSchema,
  title: z.string().min(1, '제목을 입력하세요').max(200),
  message: z.string().min(1, '메시지를 입력하세요').max(1000),
  link: z.string().url().optional().or(z.literal('')),
})

export const UpdateNotificationSchema = z.object({
  id: IdSchema,
  isRead: z.boolean().optional(),
})

// ============================================
// Type Exports
// ============================================

export type CreateUserInput = z.infer<typeof CreateUserSchema>
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>
export type LoginInput = z.infer<typeof LoginSchema>

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>

export type CreateSalesInput = z.infer<typeof CreateSalesSchema>
export type UpdateSalesInput = z.infer<typeof UpdateSalesSchema>

export type CreateBudgetInput = z.infer<typeof CreateBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof UpdateBudgetSchema>

export type CreateWbsItemInput = z.infer<typeof CreateWbsItemSchema>
export type UpdateWbsItemInput = z.infer<typeof UpdateWbsItemSchema>

export type CreateProgressInput = z.infer<typeof CreateProgressSchema>
export type UpdateProgressInput = z.infer<typeof UpdateProgressSchema>

export type CreateResourceInput = z.infer<typeof CreateResourceSchema>
export type UpdateResourceInput = z.infer<typeof UpdateResourceSchema>

export type CreateFinanceInput = z.infer<typeof CreateFinanceSchema>
export type UpdateFinanceInput = z.infer<typeof UpdateFinanceSchema>

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>

export type CreateDocumentInput = z.infer<typeof CreateDocumentSchema>
export type UpdateDocumentInput = z.infer<typeof UpdateDocumentSchema>

export type CreateNotificationInput = z.infer<typeof CreateNotificationSchema>
export type UpdateNotificationInput = z.infer<typeof UpdateNotificationSchema>

export type PaginationInput = z.infer<typeof PaginationSchema>
export type SortInput = z.infer<typeof SortSchema>
export type DateRangeInput = z.infer<typeof DateRangeSchema>
