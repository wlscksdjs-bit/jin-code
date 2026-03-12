import { hash } from 'bcryptjs'
import prisma from '../src/lib/prisma'

async function main() {
  console.log('Seeding database...')

  const hashedPassword = await hash('password', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@pms.com' },
    update: {},
    create: {
      email: 'admin@pms.com',
      name: '관리자',
      password: hashedPassword,
      role: 'ADMIN',
      department: '경영진',
      position: '대표',
    },
  })
  console.log('Created admin user:', admin.email)

  // Create PM user
  const pm = await prisma.user.upsert({
    where: { email: 'pm@pms.com' },
    update: {},
    create: {
      email: 'pm@pms.com',
      name: '박PM',
      password: hashedPassword,
      role: 'PM',
      department: '영업팀',
      position: 'PM',
    },
  })
  console.log('Created PM user:', pm.email)

  // Create resources
  const resources = await Promise.all([
    prisma.resource.upsert({
      where: { employeeNumber: 'EMP001' },
      update: {},
      create: {
        name: '김엔지니어',
        employeeNumber: 'EMP001',
        department: '설계팀',
        position: '선임엔지니어',
        grade: 'SE',
        hourlyRate: 50000,
        availability: 'AVAILABLE',
        phone: '010-1234-5678',
        email: 'kim@pms.com',
      },
    }),
    prisma.resource.upsert({
      where: { employeeNumber: 'EMP002' },
      update: {},
      create: {
        name: '이기술자',
        employeeNumber: 'EMP002',
        department: '시공팀',
        position: '기술자',
        grade: 'TE',
        hourlyRate: 40000,
        availability: 'ASSIGNED',
        phone: '010-2345-6789',
        email: 'lee@pms.com',
      },
    }),
    prisma.resource.upsert({
      where: { employeeNumber: 'EMP003' },
      update: {},
      create: {
        name: '박관리자',
        employeeNumber: 'EMP003',
        department: '안전팀',
        position: '안전관리자',
        grade: 'SM',
        hourlyRate: 45000,
        availability: 'AVAILABLE',
        phone: '010-3456-7890',
        email: 'park@pms.com',
      },
    }),
  ])
  console.log('Created resources:', resources.length)

  // Create customers
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { code: 'CUST001' },
      update: {},
      create: {
        name: '한국환경 Corp',
        code: 'CUST001',
        industry: '환경',
        contactPerson: '김대표',
        contactPhone: '02-1234-5678',
        contactEmail: 'kim@koreaenv.com',
        address: '서울시 강남구',
      },
    }),
    prisma.customer.upsert({
      where: { code: 'CUST002' },
      update: {},
      create: {
        name: '현대플랜트',
        code: 'CUST002',
        industry: '플랜트',
        contactPerson: '이이사',
        contactPhone: '02-2345-6789',
        contactEmail: 'lee@hyundaiplant.com',
        address: '서울시 영등포구',
      },
    }),
    prisma.customer.upsert({
      where: { code: 'CUST003' },
      update: {},
      create: {
        name: '삼우건设',
        code: 'CUST003',
        industry: '건설',
        contactPerson: '박사장',
        contactPhone: '02-3456-7890',
        contactEmail: 'park@samwoo.co.kr',
        address: '서울시 구로구',
      },
    }),
  ])
  console.log('Created customers:', customers.length)

  // Create projects
  const project1 = await prisma.project.upsert({
    where: { code: 'PJT001' },
    update: {},
    create: {
      code: 'PJT001',
      name: '하수처리장 현대화 사업',
      type: 'ENVIRONMENT',
      status: 'CONSTRUCTION',
      contractType: '수주',
      contractAmount: 1500000000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
      contractDate: new Date('2024-12-15'),
      location: '경기도',
      address: '경기도 화성시',
      customerId: customers[0].id,
    },
  })

  const project2 = await prisma.project.upsert({
    where: { code: 'PJT002' },
    update: {},
    create: {
      code: 'PJT002',
      name: '폐수처리 설비 증설',
      type: 'FACILITY',
      status: 'DESIGN',
      contractType: '용역',
      contractAmount: 800000000,
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-09-30'),
      contractDate: new Date('2025-02-01'),
      location: '충청남도',
      address: '충청남도 당진시',
      customerId: customers[1].id,
    },
  })

  const project3 = await prisma.project.upsert({
    where: { code: 'PJT003' },
    update: {},
    create: {
      code: 'PJT003',
      name: '재생에너지 시설 건설',
      type: 'PROCESS',
      status: 'REGISTERED',
      contractType: '수주',
      contractAmount: 2500000000,
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-05-31'),
      location: '전라남도',
      address: '전라남도 여수시',
      customerId: customers[2].id,
    },
  })
  console.log('Created projects: 3')

  // Create budgets
  await Promise.all([
    prisma.budget.upsert({
      where: { id: 'budget-001' },
      update: {},
      create: {
        id: 'budget-001',
        type: 'INITIAL',
        totalBudget: 1200000000,
        laborCost: 300000000,
        materialCost: 500000000,
        outsourceCost: 300000000,
        equipmentCost: 50000000,
        otherCost: 50000000,
        actualCost: 350000000,
        status: 'APPROVED',
        effectiveDate: new Date('2025-01-01'),
        projectId: project1.id,
      },
    }),
    prisma.budget.upsert({
      where: { id: 'budget-002' },
      update: {},
      create: {
        id: 'budget-002',
        type: 'INITIAL',
        totalBudget: 600000000,
        laborCost: 150000000,
        materialCost: 250000000,
        outsourceCost: 150000000,
        equipmentCost: 30000000,
        otherCost: 20000000,
        actualCost: 50000000,
        status: 'APPROVED',
        effectiveDate: new Date('2025-03-01'),
        projectId: project2.id,
      },
    }),
  ])
  console.log('Created budgets: 2')

  // Create WBS items
  const wbsItems = await Promise.all([
    prisma.wbsItem.create({
      data: {
        code: '1',
        name: '기초공사',
        description: '기초 공사 완료',
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-03-31'),
        plannedDays: 90,
        progress: 100,
        plannedCost: 200000000,
        actualCost: 180000000,
        status: 'COMPLETED',
        projectId: project1.id,
      },
    }),
    prisma.wbsItem.create({
      data: {
        code: '2',
        name: '본체 시공',
        description: '본체 시공 진행',
        startDate: new Date('2025-04-01'),
        endDate: new Date('2025-08-31'),
        plannedDays: 150,
        progress: 60,
        plannedCost: 600000000,
        actualCost: 350000000,
        status: 'IN_PROGRESS',
        projectId: project1.id,
      },
    }),
    prisma.wbsItem.create({
      data: {
        code: '3',
        name: '설비 설치',
        description: '설비 설치 예정',
        startDate: new Date('2025-09-01'),
        endDate: new Date('2025-11-30'),
        plannedDays: 90,
        progress: 0,
        plannedCost: 300000000,
        actualCost: 0,
        status: 'PENDING',
        projectId: project1.id,
      },
    }),
  ])
  console.log('Created WBS items:', wbsItems.length)

  // Create sales
  await Promise.all([
    prisma.sales.create({
      data: {
        type: 'CONTRACT',
        status: 'WON',
        title: '하수처리장 현대화 사업',
        bidAmount: 1500000000,
        contractAmount: 1500000000,
        winProbability: 80,
        bidOpenDate: new Date('2024-11-15'),
        contractDate: new Date('2024-12-15'),
        customerId: customers[0].id,
        projectId: project1.id,
        managerId: pm.id,
      },
    }),
    prisma.sales.create({
      data: {
        type: 'BIDDING',
        status: 'SUBMITTED',
        title: '폐수처리 설비 증설',
        bidAmount: 800000000,
        winProbability: 60,
        bidOpenDate: new Date('2025-02-01'),
        submissionDate: new Date('2025-01-25'),
        customerId: customers[1].id,
        projectId: project2.id,
        managerId: pm.id,
      },
    }),
    prisma.sales.create({
      data: {
        type: 'BIDDING',
        status: 'EVALUATING',
        title: '재생에너지 시설 건설',
        bidAmount: 2500000000,
        winProbability: 40,
        bidOpenDate: new Date('2025-03-15'),
        customerId: customers[2].id,
        projectId: project3.id,
        managerId: pm.id,
      },
    }),
  ])
  console.log('Created sales: 3')

  // Create finance records
  await Promise.all([
    prisma.finance.create({
      data: {
        type: 'REVENUE',
        category: 'SALES',
        amount: 1500000000,
        occurDate: new Date('2024-12-15'),
        billingDate: new Date('2024-12-20'),
        status: 'CONFIRMED',
        description: '계약금 수금',
        projectId: project1.id,
      },
    }),
    prisma.finance.create({
      data: {
        type: 'COST',
        category: 'LABOR',
        amount: 50000000,
        occurDate: new Date('2025-01-31'),
        status: 'PAID',
        description: '1월 인건비',
        projectId: project1.id,
      },
    }),
    prisma.finance.create({
      data: {
        type: 'COST',
        category: 'MATERIAL',
        amount: 150000000,
        occurDate: new Date('2025-02-15'),
        status: 'PAID',
        description: '자재 구매',
        projectId: project1.id,
      },
    }),
  ])
  console.log('Created finance: 3')

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
